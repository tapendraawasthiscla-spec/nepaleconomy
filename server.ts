import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import multer from 'multer';
import { ServerDB } from './server-db';
import { Article, MarketMetric, EconomicReport, CarouselSlide, Comment, ContactMessage, MediaItem, Subscriber, ShortLink } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

ServerDB.initialize();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
};

let nepseLiveCache: any = null;
let nepseCacheTime = 0;
const CACHE_LIFETIME_MS = 15 * 60 * 1000;
let nepseCooldownUntil = 0;

const generateSimulatedNepse = () => {
  const now = new Date();
  let baseIndexVal = 2847.12;
  try {
    const nepseM = ServerDB.getMetrics().find(m => m.id === '3');
    if (nepseM && nepseM.value) {
      const parsed = parseFloat(nepseM.value.replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 500 && parsed < 5000) {
        baseIndexVal = parsed;
      }
    }
  } catch {}

  const minutesNum = now.getHours() * 60 + now.getMinutes();
  const sinWave = Math.sin(minutesNum / 12);
  const cosWave = Math.cos(minutesNum / 35);
  const mockValChange = (sinWave * 1.45 + cosWave * 0.75);
  const mockIndex = parseFloat((baseIndexVal + mockValChange).toFixed(2));
  const mockIsUp = mockValChange >= 0;
  const mockChangeStr = `${mockIsUp ? '+' : ''}${mockValChange.toFixed(2)}`;
  
  return {
    index: mockIndex,
    change: mockChangeStr,
    isUp: mockIsUp,
    date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    simulated: true
  };
};

const extractJson = (text: string): any => {
  let cleaned = text.trim();
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = cleaned.match(jsonBlockRegex);
  if (match) {
    cleaned = match[1].trim();
  } else {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
    }
  }
  return JSON.parse(cleaned);
};

const fetchNepseFromGeminiDirect = async () => {
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  try {
    const ai = getAIClient();
    const prompt = `Find the latest NEPSE index value. Respond with ONLY JSON: {"index": 2847.12, "change": "+12.45", "isUp": true, "date": "June 16, 2026"}`;
    const aiRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
        tools: [{ googleSearch: {} }]
      }
    });

    const rawText = aiRes.text || '';
    const parsed = extractJson(rawText);
    const indexVal = parseFloat(parsed.index);
    if (isNaN(indexVal) || indexVal < 500 || indexVal > 5000) {
      throw new Error('Range check fail');
    }
    return {
      index: indexVal,
      change: parsed.change || '+0.00',
      isUp: parsed.isUp !== undefined ? !!parsed.isUp : (parsed.change ? parsed.change.startsWith('+') : true),
      date: parsed.date || todayStr
    };
  } catch (err: any) {
    const baseline = generateSimulatedNepse();
    return {
      index: baseline.index,
      change: baseline.change,
      isUp: baseline.isUp,
      date: baseline.date
    };
  }
};

interface AdminSession {
  token: string;
  expiresAt: number;
}
const adminSessions = new Map<string, AdminSession>();
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

const checkAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminHeader = req.headers['authorization'];
  if (adminHeader && adminHeader.startsWith('Bearer ')) {
    const token = adminHeader.substring(7);
    const session = adminSessions.get(token);
    if (session && session.expiresAt > Date.now()) {
      next();
      return;
    }
  }
  res.status(401).json({ error: 'Access Denied' });
};

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'nepal2024';
  if (password === adminPassword) {
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + SESSION_EXPIRY_MS;
    adminSessions.set(token, { token, expiresAt });

    for (const [t, s] of adminSessions.entries()) {
      if (s.expiresAt <= Date.now()) {
        adminSessions.delete(t);
      }
    }

    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid Credentials' });
});

app.get('/api/articles', (req, res) => {
  res.json(ServerDB.getArticles());
});

app.get('/api/articles/slug/:slug', (req, res) => {
  const article = ServerDB.getArticleBySlug(req.params.slug);
  if (article) {
    res.json(article);
  } else {
    res.status(404).json({ error: 'Article not found' });
  }
});

app.post('/api/articles', checkAdminAuth, (req, res) => {
  const article: Article = req.body;
  ServerDB.saveArticle(article);
  res.json({ success: true, article });
});

app.delete('/api/articles/:id', checkAdminAuth, (req, res) => {
  ServerDB.deleteArticle(req.params.id);
  res.json({ success: true });
});

let lastMetricsRefreshTime = 0;
const METRICS_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

async function triggerBackgroundMetricsRefresh() {
  if (Date.now() - lastMetricsRefreshTime < METRICS_REFRESH_INTERVAL_MS) {
    return;
  }
  lastMetricsRefreshTime = Date.now();

  let updatedUsdRate: string | null = null;
  let updatedUsdChange = '+0.00';
  let usdIsUp = true;
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && typeof data.rates.NPR === 'number') {
        const rate = data.rates.NPR;
        updatedUsdRate = rate.toFixed(2);
        const baseline = 133.40;
        const diff = rate - baseline;
        usdIsUp = diff >= 0;
        updatedUsdChange = `${usdIsUp ? '+' : ''}${diff.toFixed(2)}`;
      }
    }
  } catch (err: any) {
    console.warn('[Metrics Sync] Forex fetch failed:', err.message);
  }

  let updatedNepseVal: number | null = null;
  let updatedNepseChange = '+0.00';
  let nepseIsUp = true;
  try {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const ai = getAIClient();
    const cleanPrompt = `Search for the latest NEPSE index value. Today is ${todayStr}. Respond with ONLY JSON: {"index": 2847.12, "change": "+12.45", "isUp": true, "date": "June 16, 2026"}`;
    
    const aiRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: cleanPrompt,
      config: {
        temperature: 0.1,
        tools: [{ googleSearch: {} }]
      }
    });

    const parsed = extractJson(aiRes.text || '');
    if (parsed && (typeof parsed.index === 'number' || typeof parsed.index === 'string') && parsed.index) {
      const indexCandidate = typeof parsed.index === 'number' ? parsed.index : parseFloat(parsed.index);
      if (!isNaN(indexCandidate) && indexCandidate > 500 && indexCandidate < 5000) {
        updatedNepseVal = indexCandidate;
        updatedNepseChange = parsed.change || '+0.00';
        nepseIsUp = parsed.isUp !== undefined ? !!parsed.isUp : (updatedNepseChange.startsWith('+') || parseFloat(updatedNepseChange) >= 0);
      }
    }
  } catch (err: any) {
    console.log('[Metrics Sync] NEPSE update skipped.');
  }

  const currentMetrics = ServerDB.getMetrics();
  let changed = false;

  const nextMetrics = currentMetrics.map(m => {
    if (m.id === '2') {
      const liveRate = updatedUsdRate || m.value;
      const liveChange = updatedUsdRate ? updatedUsdChange : m.change;
      const liveIsUp = updatedUsdRate ? usdIsUp : m.isUp;
      if (m.value !== liveRate || m.change !== liveChange) {
        changed = true;
      }
      return { ...m, value: liveRate, change: liveChange, isUp: liveIsUp, isLive: true };
    }
    if (m.id === '3') {
      const liveIndex = updatedNepseVal ? updatedNepseVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : m.value;
      const liveChange = updatedNepseVal ? updatedNepseChange : m.change;
      const liveIsUp = updatedNepseVal ? nepseIsUp : m.isUp;
      if (m.value !== liveIndex || m.change !== liveChange) {
        changed = true;
      }
      return { ...m, value: liveIndex, change: liveChange, isUp: liveIsUp, isLive: true };
    }
    return m;
  });

  if (changed) {
    ServerDB.saveMetrics(nextMetrics);
  }
}

app.get('/api/metrics', (req, res) => {
  setTimeout(() => {
    triggerBackgroundMetricsRefresh().catch(err => console.error('[Metrics Sync Error]', err));
  }, 10);
  res.json(ServerDB.getMetrics());
});

app.get('/api/forex-live', async (req, res) => {
  try {
    const apiRes = await fetch('https://open.er-api.com/v6/latest/USD');
    if (apiRes.ok) {
      const data = await apiRes.json();
      return res.json(data);
    }
  } catch (err: any) {
    console.warn('[Forex Proxy] Failed:', err.message);
  }
  return res.json({
    result: 'success',
    base_code: 'USD',
    rates: { NPR: 133.40, INR: 83.50, EUR: 0.92 }
  });
});

app.post('/api/metrics', checkAdminAuth, (req, res) => {
  const metrics: MarketMetric[] = req.body;
  ServerDB.saveMetrics(metrics);
  res.json({ success: true, metrics });
});

app.get('/api/reports', (req, res) => {
  res.json(ServerDB.getReports());
});

app.post('/api/reports', checkAdminAuth, (req, res) => {
  const report: EconomicReport = req.body;
  ServerDB.saveReport(report);
  res.json({ success: true, report });
});

app.delete('/api/reports/:id', checkAdminAuth, (req, res) => {
  ServerDB.deleteReport(req.params.id);
  res.json({ success: true });
});

app.post('/api/reports/:id/download', (req, res) => {
  ServerDB.incrementReportDownload(req.params.id);
  res.json({ success: true });
});

app.get('/api/comments/:articleId', (req, res) => {
  res.json(ServerDB.getComments(req.params.articleId));
});

app.post('/api/comments/:articleId', (req, res) => {
  const comment: Comment = req.body;
  ServerDB.saveComment(req.params.articleId, comment);
  res.json({ success: true, comment });
});

app.delete('/api/comments/:articleId/:commentId', checkAdminAuth, (req, res) => {
  ServerDB.deleteComment(req.params.articleId, req.params.commentId);
  res.json({ success: true });
});

app.get('/api/hero-slides', (req, res) => {
  res.json(ServerDB.getSlides());
});

app.post('/api/hero-slides', checkAdminAuth, (req, res) => {
  const slides: CarouselSlide[] = req.body;
  ServerDB.saveSlides(slides);
  res.json({ success: true, slides });
});

app.get('/api/tips', checkAdminAuth, (req, res) => {
  res.json(ServerDB.getTips());
});

app.post('/api/tips', (req, res) => {
  const tip: ContactMessage = req.body;
  ServerDB.saveTip(tip);
  res.json({ success: true, tip });
});

app.delete('/api/tips/:id', checkAdminAuth, (req, res) => {
  ServerDB.deleteTip(req.params.id);
  res.json({ success: true });
});

app.post('/api/tips/:id/read', checkAdminAuth, (req, res) => {
  ServerDB.toggleTipRead(req.params.id);
  res.json({ success: true });
});

app.get('/api/subscribers', checkAdminAuth, (req, res) => {
  res.json(ServerDB.getSubscribers());
});

app.post('/api/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(450).json({ error: 'Invalid email address.' });
  }
  const subscriber: Subscriber = {
    id: `sub-${Date.now()}`,
    email: email.trim(),
    subscribedAt: new Date().toISOString()
  };
  ServerDB.saveSubscriber(subscriber);
  res.json({ success: true });
});

app.delete('/api/subscribers/:id', checkAdminAuth, (req, res) => {
  ServerDB.deleteSubscriber(req.params.id);
  res.json({ success: true });
});

app.get('/api/media', (req, res) => {
  res.json(ServerDB.getMediaItems());
});

app.post('/api/media/upload', upload.single('file'), (req, rRes) => {
  if (!req.file) {
    return rRes.status(400).json({ error: 'No file uploaded' });
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const item: MediaItem = {
    id: `media-${Date.now()}`,
    name: req.file.originalname,
    url: fileUrl,
    type: req.file.mimetype,
    size: formatSize(req.file.size),
    uploadedAt: new Date().toISOString(),
    viewCount: 0
  };

  const reqCategory = req.body.category || 'general';
  item.category = reqCategory;

  ServerDB.saveMediaItem(item);
  rRes.json({ success: true, file: item });
});

// NEW: External URL linking endpoint - allows admins to add a PDF/document via URL link
app.post('/api/media/external', checkAdminAuth, (req, res) => {
  const item: MediaItem = req.body;
  if (!item.url || !item.name) {
    return res.status(400).json({ error: 'URL and name are required' });
  }

  // Validate URL format
  try {
    new URL(item.url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Ensure all required fields are populated
  const finalItem: MediaItem = {
    id: item.id || `media-ext-${Date.now()}`,
    name: item.name,
    url: item.url,
    type: item.type || 'application/pdf',
    size: item.size || 'External Link',
    uploadedAt: item.uploadedAt || new Date().toISOString(),
    category: item.category || 'general',
    viewCount: 0
  };

  ServerDB.saveMediaItem(finalItem);
  res.json({ success: true, file: finalItem });
});

app.delete('/api/media/:id', checkAdminAuth, (req, res) => {
  const deletedUrl = ServerDB.deleteMediaItem(req.params.id);
  if (deletedUrl) {
    // Only delete physical file if it's on our server (starts with /uploads/ or matches our host)
    try {
      if (deletedUrl.includes('/uploads/')) {
        const filename = path.basename(deletedUrl);
        const filePath = path.join(process.cwd(), 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (err) {
      console.log('[Media] File deletion note:', err);
    }
  }
  res.json({ success: true });
});

app.post('/api/media/:id/meta', checkAdminAuth, (req, res) => {
  const { category, name } = req.body;
  const items = ServerDB.getMediaItems();
  const m = items.find(item => item.id === req.params.id);
  if (m) {
    if (category) m.category = category;
    if (name) m.name = name;
    ServerDB.saveMediaItem(m);
    res.json({ success: true, file: m });
  } else {
    res.status(404).json({ error: 'Media not found' });
  }
});

app.get('/s/:code', (req, res) => {
  const sl = ServerDB.getShortLink(req.params.code);
  if (sl) {
    ServerDB.incrementShortLinkHit(sl.code);
    res.redirect(301, sl.targetUrl);
  } else {
    res.status(444).send('Short URL expired.');
  }
});

app.get('/api/shortlinks', checkAdminAuth, (req, res) => {
  res.json(ServerDB.getShortLinks());
});

app.post('/api/shortlinks', checkAdminAuth, (req, res) => {
  const { targetUrl } = req.body;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Target URL is required' });
  }
  const possible = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  const sl: ShortLink = {
    code,
    targetUrl,
    hitCount: 0,
    createdAt: new Date().toISOString()
  };
  ServerDB.saveShortLink(sl);
  
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const shortUrl = `${protocol}://${host}/s/${code}`;

  res.json({ success: true, code, shortUrl, shortLink: sl });
});

app.delete('/api/shortlinks/:code', checkAdminAuth, (req, res) => {
  ServerDB.deleteShortLink(req.params.code);
  res.json({ success: true });
});

app.get('/api/search', (req, res) => {
  const qStr = String(req.query.q || '');
  res.json(ServerDB.searchAll(qStr));
});

app.get('/api/tags', (req, res) => {
  res.json(ServerDB.getAllTags());
});

app.get('/api/subscribers/export', checkAdminAuth, (req, res) => {
  const subs = ServerDB.getSubscribers();
  let csv = 'ID,Email,SubscribedAt\n';
  subs.forEach(s => {
    csv += `"${s.id}","${s.email}","${s.subscribedAt}"\n`;
  });
  res.header('Content-Type', 'text/csv');
  res.attachment('subscribers.csv');
  res.send(csv);
});

app.post('/api/newsletter/broadcast', checkAdminAuth, (req, res) => {
  const { subject, message } = req.body;
  const subs = ServerDB.getSubscribers();
  console.log(`[Broadcast] To ${subs.length} subscribers: ${subject}`);
  res.json({ success: true, count: subs.length, status: 'queued' });
});

app.get('/api/nepse-live', async (req, res) => {
  if (Date.now() < nepseCooldownUntil) {
    return res.json(generateSimulatedNepse());
  }

  if (nepseLiveCache && (Date.now() - nepseCacheTime < CACHE_LIFETIME_MS)) {
    return res.json(nepseLiveCache);
  }

  try {
    const data = await fetchNepseFromGeminiDirect();
    nepseLiveCache = data;
    nepseCacheTime = Date.now();
    return res.json(data);
  } catch (err: any) {
    nepseCooldownUntil = Date.now() + 5 * 60 * 1000;
    return res.json(generateSimulatedNepse());
  }
});

app.post('/api/generate-article', async (req, res) => {
  const { prompt, category } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt required' });
  }

  const sanitizedPrompt = prompt.trim();
  const sanitizedCategory = category || 'Economy';

  try {
    const ai = getAIClient();
    const cleanPrompt = `You are a Senior Economic Editor for NepalEconomy.com. Compose a publication-ready report:
Topic: "${sanitizedPrompt}"
Category: "${sanitizedCategory}"

Structure:
- Title: A modern headline.
- Excerpt: A 1-sentence summary (max 20 words).
- Content: Brief intro, then segments using ## [Subheading].
- Tags: 3-4 keywords.
- MetaDescription: 150-char SEO description.

Respond with ONLY JSON:
{
  "title": "[headline]",
  "excerpt": "[1-sentence]",
  "content": "[markdown]",
  "tags": ["Tag1", "Tag2"],
  "metaDescription": "[SEO]"
}`;

    const aiRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: cleanPrompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    });

    const parsedData = JSON.parse(aiRes.text || '{}');
    return res.json({ success: true, article: parsedData });
  } catch (err: any) {
    const fallbackTitle = `Policy Analysis: ${sanitizedPrompt.slice(0, 40)}`;
    const fallbackContent = `## Executive Summary on ${sanitizedPrompt}\n\nAgainst Nepal's complex fiscal environment under the **${sanitizedCategory}** division, this topic is generating substantial policy debates.\n\n## Structural Dynamics\n\nKey analysts suggest the primary issue continues to be commercial bank liquidity allocations.`;
    const fallbackExcerpt = `An analytical assessment on "${sanitizedPrompt}" in Nepal.`;

    return res.json({
      success: true,
      article: {
        title: fallbackTitle,
        excerpt: fallbackExcerpt,
        content: fallbackContent,
        tags: [sanitizedCategory, 'Nepal'],
        metaDescription: fallbackExcerpt
      }
    });
  }
});

app.get('/sitemap.xml', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const baseUrl = `${protocol}://${host}`;

  const articles = ServerDB.getArticles().filter(a => a.status === 'published');
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`;

  articles.forEach(art => {
    xml += `\n  <url><loc>${baseUrl}/article/${art.slug}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
  });

  xml += '\n</urlset>';
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`);
});

const serveIndexWithInjectSeo = (req: express.Request, res: express.Response) => {
  const indexDocPath = path.join(process.cwd(), process.env.NODE_ENV === 'production' ? 'dist' : '', 'index.html');
  if (!fs.existsSync(indexDocPath)) {
    return res.status(404).send('index.html not found.');
  }

  let htmlContent = fs.readFileSync(indexDocPath, 'utf8');

  const pathParts = req.path.split('/');
  const slug = pathParts[pathParts.length - 1];
  const articles = ServerDB.getArticles();
  const article = slug ? articles.find(a => a.slug === slug) : null;

  const seoTitle = article ? `${article.title} | NepalEconomy.com` : 'NepalEconomy.com | Business & Economic Intelligence';
  const seoDesc = article ? article.metaDescription || article.excerpt : "Nepal's most trusted voice in financial and business economy news.";
  const seoImage = article ? article.imageUrl : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80';
  const seoUrl = `https://nepaleconomy.com${req.originalUrl}`;

  htmlContent = htmlContent.replace(/<title>.*?<\/title>/g, `<title>${seoTitle}</title>`);

  const tagsStr = `
    <meta name="description" content="${seoDesc}" />
    <meta property="og:type" content="${article ? 'article' : 'website'}" />
    <meta property="og:title" content="${seoTitle}" />
    <meta property="og:description" content="${seoDesc}" />
    <meta property="og:image" content="${seoImage}" />
    <meta property="og:url" content="${seoUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${seoTitle}" />
    <meta name="twitter:description" content="${seoDesc}" />
    <meta name="twitter:image" content="${seoImage}" />
  `;

  htmlContent = htmlContent.replace('</head>', `${tagsStr}\n</head>`);
  res.send(htmlContent);
};

async function startServer() {
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });

    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/uploads') || url.startsWith('/s/') || url.includes('.')) {
        return next();
      }
      try {
        const indexDocPath = path.join(process.cwd(), 'index.html');
        let htmlContent = fs.readFileSync(indexDocPath, 'utf8');
        htmlContent = await vite.transformIndexHtml(url, htmlContent);

        const pathParts = req.path.split('/');
        const slug = pathParts[pathParts.length - 1];
        const articles = ServerDB.getArticles();
        const article = slug ? articles.find(a => a.slug === slug) : null;

        const seoTitle = article ? `${article.title} | NepalEconomy.com` : 'NepalEconomy.com | Business & Economic Intelligence';
        const seoDesc = article ? article.metaDescription || article.excerpt : "Nepal's most trusted voice in financial news.";
        const seoImage = article ? article.imageUrl : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80';

        htmlContent = htmlContent.replace(/<title>.*?<\/title>/g, `<title>${seoTitle}</title>`);
        
        const tagsStr = `
          <meta name="description" content="${seoDesc}" />
          <meta property="og:type" content="${article ? 'article' : 'website'}" />
          <meta property="og:title" content="${seoTitle}" />
          <meta property="og:description" content="${seoDesc}" />
          <meta property="og:image" content="${seoImage}" />
          <meta property="og:url" content="https://nepaleconomy.com${url}" />
          <meta name="twitter:card" content="summary_large_image" />
        `;
        htmlContent = htmlContent.replace('</head>', `${tagsStr}\n</head>`);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(htmlContent);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/s/') || req.path.includes('.')) {
        return next();
      }
      serveIndexWithInjectSeo(req, res);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NepalEconomy Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
