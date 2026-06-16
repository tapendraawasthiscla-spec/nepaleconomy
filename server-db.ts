import fs from 'fs';
import path from 'path';
import {
  Article, MarketMetric, EconomicReport, CarouselSlide,
  Comment, ContactMessage, MediaItem, Subscriber, ShortLink
} from './src/types';
import { INITIAL_ARTICLES, INITIAL_METRICS, INITIAL_REPORTS, INITIAL_SLIDES } from './src/mockData';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export interface DatabaseState {
  articles: Article[];
  metrics: MarketMetric[];
  reports: EconomicReport[];
  slides: CarouselSlide[];
  comments: Record<string, Comment[]>;
  tips: ContactMessage[];
  subscribers: Subscriber[];
  media: MediaItem[];
  shortLinks: ShortLink[];
}

export class ServerDB {
  private static state: DatabaseState | null = null;

  public static initialize(): DatabaseState {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const state: DatabaseState = {
        articles: INITIAL_ARTICLES,
        metrics: INITIAL_METRICS,
        reports: INITIAL_REPORTS,
        slides: INITIAL_SLIDES,
        comments: {
          'art-hero': [
            {
              id: 'cmt-1-art-hero',
              author: 'Rajan Bhandari',
              content: 'Excellent analysis of our regional energy trade dynamics. The integration of public grids with India represents an actual financial gamechanger.',
              date: 'Jun 14, 2026'
            },
            {
              id: 'cmt-2-art-hero',
              author: 'Sita Pyakurel',
              content: 'Terai region storage projects are very crucial. Glad to see serious economic analysis on these capital channels.',
              date: 'Jun 15, 2026'
            }
          ]
        },
        tips: [
          {
            id: 'tip-initial-1',
            name: 'Encrypted Leak',
            email: 'secure-proxy@nepaleconomy.net',
            subject: 'ANONYMOUS REVENUE SIGNAL',
            message: 'Ministry auditing teams are reviewing customs tariff files for cash crops along central borders next week.',
            date: 'Jun 15, 2026',
            read: false
          }
        ],
        subscribers: [
          { id: 'sub-init-1', email: 'director-general@nrb.gov', subscribedAt: new Date().toISOString() }
        ],
        media: [
          {
            id: 'media-init-f1',
            name: 'nepalyields.pdf',
            url: '/uploads/nepalyields.pdf',
            type: 'application/pdf',
            size: '1.2 MB',
            uploadedAt: new Date().toISOString(),
            category: 'income-tax'
          }
        ],
        shortLinks: []
      };
      this.writeState(state);
      this.state = state;
      return state;
    }

    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      this.state = JSON.parse(raw);
      // Migration check for mock upgrades
      if (!this.state!.shortLinks) {
        this.state!.shortLinks = [];
        this.writeState(this.state!);
      }
      if (!this.state!.articles[0].status) {
        this.state!.articles = this.state!.articles.map(art => ({
          ...art,
          status: art.status || 'published',
          slug: art.slug || art.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          tags: art.tags || ['Economy']
        }));
        this.writeState(this.state!);
      }
    } catch (err) {
      console.error('Failed to parse database state, creating fallback', err);
      this.state = {
        articles: INITIAL_ARTICLES,
        metrics: INITIAL_METRICS,
        reports: INITIAL_REPORTS,
        slides: INITIAL_SLIDES,
        comments: {},
        tips: [],
        subscribers: [],
        media: [],
        shortLinks: []
      };
    }
    return this.state!;
  }

  public static getState(): DatabaseState {
    if (!this.state) {
      return this.initialize();
    }
    return this.state;
  }

  public static writeState(state: DatabaseState) {
    this.state = state;
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  // Articles Methods
  public static getArticles(): Article[] {
    return this.getState().articles;
  }

  public static saveArticle(article: Article): void {
    const state = this.getState();
    const idx = state.articles.findIndex(a => a.id === article.id);
    // ensure slug is clean
    if (!article.slug) {
      article.slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (idx !== -1) {
      state.articles[idx] = article;
    } else {
      state.articles.unshift(article);
    }
    this.writeState(state);
  }

  public static deleteArticle(id: string): void {
    const state = this.getState();
    state.articles = state.articles.filter(a => a.id !== id);
    this.writeState(state);
  }

  public static getArticleBySlug(slug: string): Article | undefined {
    return this.getArticles().find(a => a.slug === slug);
  }

  // Metrics Methods
  public static getMetrics(): MarketMetric[] {
    return this.getState().metrics;
  }

  public static saveMetrics(metrics: MarketMetric[]): void {
    const state = this.getState();
    state.metrics = metrics;
    this.writeState(state);
  }

  // Reports Methods
  public static getReports(): EconomicReport[] {
    return this.getState().reports;
  }

  public static saveReport(report: EconomicReport): void {
    const state = this.getState();
    const idx = state.reports.findIndex(r => r.id === report.id);
    if (idx !== -1) {
      state.reports[idx] = report;
    } else {
      state.reports.push(report);
    }
    this.writeState(state);
  }

  public static deleteReport(id: string): void {
    const state = this.getState();
    state.reports = state.reports.filter(r => r.id !== id);
    this.writeState(state);
  }

  public static incrementReportDownload(id: string): void {
    const state = this.getState();
    const rep = state.reports.find(r => r.id === id);
    if (rep) {
      rep.downloads = (rep.downloads || 0) + 1;
      this.writeState(state);
    }
  }

  // Comments Methods
  public static getComments(articleId: string): Comment[] {
    return this.getState().comments[articleId] || [];
  }

  public static saveComment(articleId: string, comment: Comment): void {
    const state = this.getState();
    if (!state.comments[articleId]) {
      state.comments[articleId] = [];
    }
    state.comments[articleId].unshift(comment);
    this.writeState(state);
  }

  public static deleteComment(articleId: string, commentId: string): void {
    const state = this.getState();
    if (state.comments[articleId]) {
      state.comments[articleId] = state.comments[articleId].filter(c => c.id !== commentId);
      this.writeState(state);
    }
  }

  // Slides Methods
  public static getSlides(): CarouselSlide[] {
    const state = this.getState();
    return state.slides.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  public static saveSlides(slides: CarouselSlide[]): void {
    const state = this.getState();
    state.slides = slides;
    this.writeState(state);
  }

  // Whistleblower Tips Methods
  public static getTips(): ContactMessage[] {
    return this.getState().tips;
  }

  public static saveTip(tip: ContactMessage): void {
    const state = this.getState();
    state.tips.unshift(tip);
    this.writeState(state);
  }

  public static deleteTip(id: string): void {
    const state = this.getState();
    state.tips = state.tips.filter(t => t.id !== id);
    this.writeState(state);
  }

  public static toggleTipRead(id: string): void {
    const state = this.getState();
    const tip = state.tips.find(t => t.id === id);
    if (tip) {
      tip.read = !tip.read;
      this.writeState(state);
    }
  }

  // Newsletter Subscribers Methods
  public static getSubscribers(): Subscriber[] {
    return this.getState().subscribers;
  }

  public static saveSubscriber(sub: Subscriber): void {
    const state = this.getState();
    if (!state.subscribers.some(s => s.email.toLowerCase() === sub.email.toLowerCase())) {
      state.subscribers.unshift(sub);
      this.writeState(state);
    }
  }

  public static deleteSubscriber(id: string): void {
    const state = this.getState();
    state.subscribers = state.subscribers.filter(s => s.id !== id);
    this.writeState(state);
  }

  // Media Methods
  public static getMediaItems(): MediaItem[] {
    return this.getState().media || [];
  }

  public static saveMediaItem(item: MediaItem): void {
    const state = this.getState();
    const idx = state.media.findIndex(m => m.id === item.id);
    if (idx !== -1) {
      state.media[idx] = item;
    } else {
      state.media.unshift(item);
    }
    this.writeState(state);
  }

  public static deleteMediaItem(id: string): string | null {
    const state = this.getState();
    const media = state.media || [];
    const item = media.find(m => m.id === id);
    if (item) {
      state.media = media.filter(m => m.id !== id);
      this.writeState(state);
      return item.url;
    }
    return null;
  }

  // Short Links Methods
  public static getShortLinks(): ShortLink[] {
    return this.getState().shortLinks || [];
  }

  public static getShortLink(code: string): ShortLink | undefined {
    return this.getShortLinks().find(sl => sl.code === code);
  }

  public static saveShortLink(sl: ShortLink): void {
    const state = this.getState();
    if (!state.shortLinks) {
      state.shortLinks = [];
    }
    state.shortLinks.unshift(sl);
    this.writeState(state);
  }

  public static deleteShortLink(code: string): void {
    const state = this.getState();
    state.shortLinks = (state.shortLinks || []).filter(sl => sl.code !== code);
    this.writeState(state);
  }

  public static incrementShortLinkHit(code: string): void {
    const state = this.getState();
    const sl = (state.shortLinks || []).find(s => s.code === code);
    if (sl) {
      sl.hitCount = (sl.hitCount || 0) + 1;
      this.writeState(state);
    }
  }

  // Aggregate tags from published articles
  public static getAllTags(): { tag: string; count: number }[] {
    const articles = this.getArticles().filter(a => a.status === 'published');
    const catalog: Record<string, number> = {};
    articles.forEach(art => {
      if (art.tags) {
        art.tags.forEach(t => {
          const clean = t.trim();
          if (clean) {
            catalog[clean] = (catalog[clean] || 0) + 1;
          }
        });
      }
    });
    return Object.keys(catalog).map(tag => ({ tag, count: catalog[tag] })).sort((a,b) => b.count - a.count);
  }

  // Search logic across all entities
  public static searchAll(query: string) {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return { articles: [], reports: [], media: [] };

    const articles = this.getArticles().filter(art => {
      return (
        art.title.toLowerCase().includes(normalized) ||
        art.excerpt.toLowerCase().includes(normalized) ||
        (art.content || '').toLowerCase().includes(normalized) ||
        art.author.toLowerCase().includes(normalized) ||
        art.category.toLowerCase().includes(normalized) ||
        (art.tags || []).some(t => t.toLowerCase().includes(normalized))
      );
    });

    const reports = this.getReports().filter(rep => {
      return (
        rep.title.toLowerCase().includes(normalized) ||
        (rep.description || '').toLowerCase().includes(normalized) ||
        (rep.author || '').toLowerCase().includes(normalized) ||
        (rep.category || '').toLowerCase().includes(normalized)
      );
    });

    const media = this.getMediaItems().filter(m => {
      return (
        m.name.toLowerCase().includes(normalized) ||
        (m.category || '').toLowerCase().includes(normalized)
      );
    });

    return { articles, reports, media };
  }
}
