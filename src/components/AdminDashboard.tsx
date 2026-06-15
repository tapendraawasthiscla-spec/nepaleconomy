import React, { useState, useEffect } from 'react';
import { Database, PlusCircle, Check, Share2, TrendingUp, TrendingDown, Sparkles, FileText, Trash2, Edit, AlertCircle, RefreshCw, LogOut, ChevronDown, ChevronUp, CheckCircle, FileUp, Zap, Settings, MessageCircle } from 'lucide-react';
import { Article, MarketMetric, EconomicReport, ArticleCategory } from '../types';

interface AdminDashboardProps {
  articles: Article[];
  setArticles: (articles: Article[]) => void;
  metrics: MarketMetric[];
  setMetrics: (metrics: MarketMetric[]) => void;
  reports: EconomicReport[];
  setReports: (reports: EconomicReport[]) => void;
  tips: any[];
  onLogout: () => void;
  onViewArticle?: (article: Article) => void;
  isSyncing: boolean;
  lastSyncedTime: string;
  onForceSync: () => Promise<void>;
  activeAdminTab?: 'quick' | 'full' | 'settings' | 'comments';
  setActiveAdminTab?: (tab: 'quick' | 'full' | 'settings' | 'comments') => void;
}

export default function AdminDashboard({
  articles,
  setArticles,
  metrics,
  setMetrics,
  reports,
  setReports,
  tips,
  onLogout,
  onViewArticle,
  isSyncing,
  lastSyncedTime,
  onForceSync,
  activeAdminTab: propActiveAdminTab,
  setActiveAdminTab: propSetActiveAdminTab
}: AdminDashboardProps) {

  // Form tab selector for live markdown editing preview (Feature 4)
  const [formTab, setFormTab] = useState<'write' | 'preview'>('write');

  // Tab Navigation State
  const [localActiveAdminTab, setLocalActiveAdminTab] = useState<'quick' | 'full' | 'settings' | 'comments'>('quick');
  const activeAdminTab = propActiveAdminTab !== undefined ? propActiveAdminTab : localActiveAdminTab;
  const setActiveAdminTab = propSetActiveAdminTab !== undefined ? propSetActiveAdminTab : setLocalActiveAdminTab;

  // Newsletter Admin Reference states
  const [adminNewsletterEmail, setAdminNewsletterEmail] = useState('');
  const [adminNewsletterSuccess, setAdminNewsletterSuccess] = useState(false);
  const [adminNewsletterSubmitting, setAdminNewsletterSubmitting] = useState(false);

  interface AdminComment {
    commentId: string;
    articleId: string;
    articleTitle: string;
    author: string;
    content: string;
    date: string;
  }

  // Comments Moderation State
  const [allComments, setAllComments] = useState<AdminComment[]>([]);

  useEffect(() => {
    const all: AdminComment[] = [];
    articles.forEach(art => {
      const stor = localStorage.getItem(`ne_comments_${art.id}`);
      if (stor) {
        try {
          const commentsList = JSON.parse(stor);
          if (Array.isArray(commentsList)) {
            commentsList.forEach((c: any) => {
              all.push({
                commentId: c.id,
                articleId: art.id,
                articleTitle: art.title,
                author: c.author,
                content: c.content,
                date: c.date
              });
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
    setAllComments(all);

    if (activeAdminTab === 'comments' && all.length > 0) {
      const ids = all.map(c => c.commentId);
      localStorage.setItem('ne_read_comment_ids', JSON.stringify(ids));
      window.dispatchEvent(new Event('ne_comments_read_updated'));
    }
  }, [articles, activeAdminTab]);

  const handleDeleteComment = (articleId: string, commentId: string) => {
    const stor = localStorage.getItem(`ne_comments_${articleId}`);
    if (stor) {
      try {
        const commentsList = JSON.parse(stor);
        if (Array.isArray(commentsList)) {
          const filtered = commentsList.filter((c: any) => c.id !== commentId);
          localStorage.setItem(`ne_comments_${articleId}`, JSON.stringify(filtered));
          
          setAllComments(prev => prev.filter(c => !(c.articleId === articleId && c.commentId === commentId)));
          triggerAlert('Comment deleted successfully.');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Quick Post Form States
  const [quickTitle, setQuickTitle] = useState('');
  const [quickSummary, setQuickSummary] = useState('');
  const [quickCategory, setQuickCategory] = useState<ArticleCategory>('Economy');
  const [quickIsAdvancedOpen, setQuickIsAdvancedOpen] = useState(false);
  const [quickIsBreaking, setQuickIsBreaking] = useState(false);
  const [quickBreakingLabel, setQuickBreakingLabel] = useState('');

  // AI Generation Status States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatedArticleResult, setGeneratedArticleResult] = useState<Article | null>(null);

  // Settings local state (sync with localStorage)
  const [settingsDisplayName, setSettingsDisplayName] = useState(() => localStorage.getItem('ne_admin_author_name') || 'NepalEconomy Editorial Desk');
  const [settingsAuthorTitle, setSettingsAuthorTitle] = useState(() => localStorage.getItem('ne_admin_author_title') || 'Senior Economic Analyst');
  const [settingsSiteTagline, setSettingsSiteTagline] = useState(() => localStorage.getItem('ne_site_tagline') || "NEPAL'S BUSINESS INTELLIGENCE HUB");
  const [settingsBreakingOverride, setSettingsBreakingOverride] = useState(() => localStorage.getItem('ne_breaking_news_override') || '');

  // Form State
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ArticleCategory>('Economy');
  const [author, setAuthor] = useState(() => localStorage.getItem('ne_admin_author_name') || 'Ankit Ghimire');
  const [authorTitle, setAuthorTitle] = useState(() => localStorage.getItem('ne_admin_author_title') || 'Senior Economic Analyst');
  const [readTime, setReadTime] = useState('5 min read');
  const [imagePreset, setImagePreset] = useState('mountain');
  const [customImage, setCustomImage] = useState('');
  const [isBreaking, setIsBreaking] = useState(false);
  const [breakingLabel, setBreakingLabel] = useState('');

  // Editing article state
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  // Form Validation flag
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Report management form states
  const [reportTitle, setReportTitle] = useState('');
  const [reportAuthor, setReportAuthor] = useState('');
  const [reportSize, setReportSize] = useState('');
  const [reportPdfUrl, setReportPdfUrl] = useState('');
  const [reportUrlError, setReportUrlError] = useState('');

  // Preset images of Nepal and related economic topics
  const imagePresets: Record<string, string> = {
    mountain: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
    kathmandu: 'https://images.unsplash.com/photo-1542222024-c39e2281f121?w=600&auto=format&fit=crop&q=80',
    finance: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80',
    energy: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    technology: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80',
    agriculture: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
  };

  const [notification, setNotification] = useState<string | null>(null);
  const [socialPayload, setSocialPayload] = useState<{ facebook: string; twitter: string; linkedin: string } | null>(null);

  // Quick Ticker States
  const [tempMetrics, setTempMetrics] = useState<MarketMetric[]>(() => [...metrics]);

  // Sync temp metrics if core metrics update externally
  useEffect(() => {
    setTempMetrics([...metrics]);
  }, [metrics]);

  // Auto-calculate read time during typewriter session
  useEffect(() => {
    const textWords = content.trim().split(/\s+/).filter(Boolean).length;
    if (textWords <= 0) {
      setReadTime('1 min read');
    } else {
      const minutes = Math.max(1, Math.ceil(textWords / 200));
      setReadTime(`${minutes} min read`);
    }
  }, [content]);

  // Alert notifier helper
  const triggerAlert = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleMetricSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mark manual adjustment updates with today's timestamp
    const updatedMetrics = tempMetrics.map(m => ({
      ...m,
      lastUpdated: m.id === '3' ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : m.lastUpdated || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      lastUpdatedMs: Date.now()
    }));
    setMetrics(updatedMetrics);
    triggerAlert('Live market indicators and indices updated successfully!');
  };

  const handleMetricValueChange = (index: number, val: string) => {
    const updated = [...tempMetrics];
    updated[index].value = val;
    setTempMetrics(updated);
  };

  const handleMetricChangeDirection = (index: number, isUp: boolean) => {
    const updated = [...tempMetrics];
    updated[index].isUp = isUp;
    updated[index].change = (isUp ? '+' : '-') + updated[index].change.replace(/[+-]/g, '');
    setTempMetrics(updated);
  };

  const handleMetricDeltaChange = (index: number, delta: string) => {
    const updated = [...tempMetrics];
    updated[index].change = (updated[index].isUp ? '+' : '-') + delta.replace(/[+-]/g, '');
    setTempMetrics(updated);
  };

  // Structured long form fallback content builders
  const getCategoryFallbackContent = (catName: string, titleStr: string) => {
    const intro = `### ${titleStr}\n\nNepal represents an untapped reservoir of macroeconomic transformation. Under recent regional alignment guidelines, foreign capital inflows can expect legal assurances. The editorial panel of NepalEconomy will monitor developments regarding this topic.`;
    
    if (catName === 'Economy') {
      return `${intro}\n\n#### 1. Macro-Structural Context\nOur editorial desk indicates that the domestic assembly metrics are tracking towards targeted recovery targets. Private capital formation in Kathmandu expansion blocks has risen by 4.8% on a rolling quarter basis, fueled by high-liquidity capital accounts.\n\n#### 2. Fiscal and Monetarist Stabilization\nTreasury clearance channels report steady trade deficits, balanced by record high-wage remittance buffers from Diaspora blocks. IMF advisors have advised a strict reserves threshold of 5.5% to maintain long-term solvency certificates.`;
    }
    if (catName === 'Business') {
      return `${intro}\n\n#### 1. Commercial Banking & Capital Growth\nCommercial banking partners across Nepal's trade centers have received clear directives from our editorial desk's reports to prioritize real energy assets and local industrial development. Traditional retail credit caps are being replaced with structured agritech lending incentives.\n\n#### 2. Sectoral Liquidity\nLocal banks report stable deposit growth, which is easing previous liquidity concerns. Analysts anticipate increased private equity allocations in hospitality and beverage manufacturing corridors over the next fiscal cycle.`;
    }
    if (catName === 'Policy') {
      return `${intro}\n\n#### 1. Central Bank Circular Enforcement\nUnder the latest regulatory directives issued by the advisory board, national tariff alignments are configured to facilitate cross-border clean-energy corridors. The Ministry has certified tax-free bond formats for state-level infrastructure deployments.\n\n#### 2. Regulatory Compliance\nJoint venture startups must register digital capital reserves within Kathmandu treasury files to secure long-term capital repatriation permits. Peer-review compliance checks are performed on a bi-annual schedule.`;
    }
    if (catName === 'Startups') {
      return `${intro}\n\n#### 1. Software Export Corridors\nLalitpur software clusters and Jhamsikhel tech cooperatives represent major hard-currency pipelines. These silent SaaS engines contribute significant intellectual capital to international enterprise architectures, bypassing traditional trade friction.\n\n#### 2. Seed-stage Funding Frameworks\nLocal accelerators are designing decentralized venture models. Early-stage agritech cold links across Terai agrarian zones are pioneering the integration of cellular tracking to minimize post-harvest cold corridor losses by up to 24%.`;
    }
    if (catName === 'Global') {
      return `${intro}\n\n#### 1. Diaspora Sovereign Bonds\nWith over 4 million Nepalese working globally, remittance channels are the backbone of central banking liquidity pools. Foreign currency programs are drafting Diaspora-specific infrastructure bonds containing tax exemptions and secure returns of up to 9.5%.\n\n#### 2. Cross-Border Capital Repatriation\nSovereign ratings briefs from international credit agencies indicate positive trajectories assuming structural regulatory friction continues to decline. Non-Resident Nepali (NRN) networks are leading hydro-generation equity consortia in high-mountain river basins.`;
    }
    return intro;
  };

  // Article Publishing & Editing Logic
  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim() || !author.trim()) {
      setShowValidationErrors(true);
      return;
    }

    const finalImage = customImage.trim() || imagePresets[imagePreset];
    const rawContent = content.trim();
    // Sophisticated deep fallback text if content text left dry
    const finalContent = rawContent || getCategoryFallbackContent(category, title);

    const activeBreakingCount = articles.filter(art => art.isBreaking && art.id !== editingArticleId).length;
    if (isBreaking && activeBreakingCount >= 3) {
      triggerAlert("Maximum 3 breaking stories allowed. Remove one first.");
      return;
    }

    if (editingArticleId) {
      // Edit existing publication
      const updatedArticles = articles.map(art => {
        if (art.id === editingArticleId) {
          return {
            ...art,
            title: title.trim(),
            excerpt: excerpt.trim(),
            content: finalContent,
            category,
            author: author.trim(),
            authorTitle: authorTitle.trim(),
            readTime,
            imageUrl: finalImage,
            isBreaking: isBreaking,
            breakingLabel: isBreaking ? breakingLabel.trim() : undefined
          };
        }
        return art;
      });

      setArticles(updatedArticles);
      triggerAlert('Your article modifications have been compiled and published safely!');
      
      // Clear Edit Mode resets
      setEditingArticleId(null);
      setIsBreaking(false);
      setBreakingLabel('');
    } else {
      // Publish new brief
      const newArticle: Article = {
        id: `art-${Date.now()}`,
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: finalContent,
        category,
        author: author.trim(),
        authorTitle: authorTitle.trim(),
        authorImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        readTime,
        imageUrl: finalImage,
        views: 120,
        sources: ['Nepal Central Statistics Agency Registry', 'Trade Port Clearances Hub'],
        isBreaking: isBreaking,
        breakingLabel: isBreaking ? breakingLabel.trim() : undefined
      };

      const updatedArticles = [newArticle, ...articles];
      setArticles(updatedArticles);
      setIsBreaking(false);
      setBreakingLabel('');
      triggerAlert('Congratulations! Your new economic article has been compiled and is now live!');
    }

    // Auto generate Social Copys
    const relativeUrl = `https://nepaleconomy.com/articles/art-view`;
    setSocialPayload({
      twitter: `🚨 NEW BRIEFING on #NepalEconomy: "${title}". Deep exploration on policy impact. Read here: ${relativeUrl} #NepalBusiness #Investment`,
      facebook: `📊 ANALYSIS | NepalEconomy.com | "${title}"\n"${excerpt}"\nRead our authoritative guide on Nepal's business climate: ${relativeUrl}`,
      linkedin: `📈 NEPAL ECONOMIC RESEARCH | We have released our latest strategic briefing on "${title}". Written by Ramesh Dahal's advisory desk. Read the full insights here: ${relativeUrl} \n\n#Macroeconomics #Hydropower #FDI #Nepal`
    });

    // Reset Form fields
    setTitle('');
    setExcerpt('');
    setContent('');
    setImagePreset('mountain');
    setCustomImage('');
    setShowValidationErrors(false);
    setFormTab('write');
  };

  // Quick Post AI-Generation & Publication Handler
  const handleQuickPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickSummary.trim()) {
      setShowValidationErrors(true);
      return;
    }

    const activeBreakingCount = articles.filter(art => art.isBreaking).length;
    if (quickIsBreaking && activeBreakingCount >= 3) {
      triggerAlert("Maximum 3 breaking stories allowed. Remove one first.");
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratedArticleResult(null);

      let generatedContent = '';
      let generatedExcerpt = '';

      if (quickIsAdvancedOpen && content.trim() && excerpt.trim()) {
        // If collapsible section is open & they already typed full overrides, use those
        generatedContent = content.trim();
        generatedExcerpt = excerpt.trim();
        setGenerationStep("Using manual override body and excerpt text...");
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // AI generate both body and excerpt
        setGenerationStep("Step 1: AI writing complete 400-600 word economic article body...");
        const response = await fetch('/api/generate-article', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: quickTitle.trim(), category: quickCategory }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${response.status}`);
        }

        const data = await response.json();
        generatedContent = data.content || '';
        generatedExcerpt = data.excerpt || '';

        setGenerationStep("Step 2: AI synthesizing 30-word compelling summary excerpt...");
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Step 3: Calculate read time
      setGenerationStep("Step 3: Calculating read length and word count density...");
      const wordCount = generatedContent.trim().split(/\s+/).filter(Boolean).length;
      const calcReadTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
      await new Promise(resolve => setTimeout(resolve, 600));

      // Step 4: Map Unsplash Image URL
      setGenerationStep("Step 4: Auto-selecting relevant category cover illustration...");
      const unsplashMap: Record<ArticleCategory, string> = {
        Economy: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80",
        Business: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80",
        Policy: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
        Startups: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80",
        Global: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600&auto=format&fit=crop&q=80"
      };
      
      const mappedImage = unsplashMap[quickCategory] || unsplashMap.Economy;
      await new Promise(resolve => setTimeout(resolve, 600));

      // Step 5: Author settings
      setGenerationStep("Step 5: Verifying author credentials and applying signature...");
      const finalAuthorName = localStorage.getItem('ne_admin_author_name') || "NepalEconomy Editorial Desk";
      const finalAuthorTitle = localStorage.getItem('ne_admin_author_title') || "Senior Economic Analyst";
      await new Promise(resolve => setTimeout(resolve, 600));

      // Step 6: Create article and prepend to list
      setGenerationStep("Step 6: Recording article to database registers and releasing...");
      const finalImagePresetUrls: Record<string, string> = {
        mountain: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
        kathmandu: 'https://images.unsplash.com/photo-1542222024-c39e2281f121?w=600&auto=format&fit=crop&q=80',
        finance: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80',
        energy: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
        technology: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80',
        agriculture: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
      };

      const newArticleObj: Article = {
        id: `art-${Date.now()}`,
        title: (quickIsAdvancedOpen && title.trim()) ? title.trim() : quickTitle.trim(),
        excerpt: (quickIsAdvancedOpen && excerpt.trim()) ? excerpt.trim() : (generatedExcerpt || quickSummary),
        content: generatedContent,
        category: (quickIsAdvancedOpen && category) ? category : quickCategory,
        author: (quickIsAdvancedOpen && author.trim()) ? author.trim() : finalAuthorName,
        authorTitle: (quickIsAdvancedOpen && authorTitle.trim()) ? authorTitle.trim() : finalAuthorTitle,
        authorImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        readTime: (quickIsAdvancedOpen && readTime && readTime !== '5 min read') ? readTime : calcReadTime,
        imageUrl: (quickIsAdvancedOpen && customImage.trim()) ? customImage.trim() : (quickIsAdvancedOpen && finalImagePresetUrls[imagePreset]) ? finalImagePresetUrls[imagePreset] : mappedImage,
        views: 121,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        sources: ['Nepal Central Statistics Agency Registry', 'Trade Port Clearances Hub', 'Sovereign Advisory Press'],
        isBreaking: quickIsBreaking,
        breakingLabel: quickIsBreaking ? quickBreakingLabel.trim() : undefined
      };

      const updatedArticles = [newArticleObj, ...articles];
      setArticles(updatedArticles);
      localStorage.setItem('ne_articles', JSON.stringify(updatedArticles));

      // Trigger automatic social copies
      setSocialPayload({
        twitter: `🚨 NEW BRIEFING on #NepalEconomy: "${newArticleObj.title}". Deep exploration on policy impact. Read here: https://nepaleconomy.com/articles/art-view #NepalBusiness #Investment`,
        facebook: `📊 ANALYSIS | NepalEconomy.com | "${newArticleObj.title}"\n"${newArticleObj.excerpt}"\nRead our authoritative guide: https://nepaleconomy.com/articles/art-view`,
        linkedin: `📈 NEPAL ECONOMIC RESEARCH | We have released our latest strategic briefing on "${newArticleObj.title}". Written by Ramesh Dahal's advisory desk. \n\n#Macroeconomics #Hydropower #FDI #Nepal`
      });

      // Done status
      setIsGenerating(false);
      setGenerationStep("Success");
      setGeneratedArticleResult(newArticleObj);
      triggerAlert('Article Published Successfully');

      // Clear Quick form
      setQuickTitle('');
      setQuickSummary('');
      setQuickIsBreaking(false);
      setQuickBreakingLabel('');
      // Also reset full editor states to prevent side effects
      setTitle('');
      setExcerpt('');
      setContent('');
      setCustomImage('');
    } catch (err: any) {
      console.error(err);
      setIsGenerating(false);
      setGenerationStep("Error: " + err.message);
      triggerAlert(`AI Generation Failed: ${err.message}`);
    }
  };

  // Settings tab form submits
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ne_admin_author_name', settingsDisplayName);
    localStorage.setItem('ne_admin_author_title', settingsAuthorTitle);
    localStorage.setItem('ne_site_tagline', settingsSiteTagline);
    localStorage.setItem('ne_breaking_news_override', settingsBreakingOverride);

    // Sync current editor authors
    setAuthor(settingsDisplayName);
    setAuthorTitle(settingsAuthorTitle);

    triggerAlert("System settings saved successfully");
  };

  const handleForceSync = async () => {
    try {
      await onForceSync();
      triggerAlert("Database forced sync to Gemini Files API completed successfully!");
    } catch (err: any) {
      triggerAlert(`Sync failed: ${err.message || err}`);
    }
  };

  const handleClearBreakingOverride = () => {
    setSettingsBreakingOverride('');
    localStorage.removeItem('ne_breaking_news_override');
    triggerAlert("Emergency alert override removed");
  };

  // Pre-fill full editing dataset
  const handleEditClick = (art: Article) => {
    setEditingArticleId(art.id);
    setTitle(art.title);
    setExcerpt(art.excerpt);
    setContent(art.content || '');
    setCategory(art.category);
    setAuthor(art.author);
    setAuthorTitle(art.authorTitle || '');
    setReadTime(art.readTime);
    setIsBreaking(!!art.isBreaking);
    setBreakingLabel(art.breakingLabel || '');
    
    // Attempt match with image preset or set custom link
    const foundPreset = Object.keys(imagePresets).find(key => imagePresets[key] === art.imageUrl);
    if (foundPreset) {
      setImagePreset(foundPreset);
      setCustomImage('');
    } else {
      setCustomImage(art.imageUrl);
    }

    // Scroll to the write panel top
    setActiveAdminTab('full');
    const formElement = document.getElementById('publish-briefing-pane');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const cancelEditMode = () => {
    setEditingArticleId(null);
    setTitle('');
    setExcerpt('');
    setContent('');
    setImagePreset('mountain');
    setCustomImage('');
    setShowValidationErrors(false);
    setIsBreaking(false);
    setBreakingLabel('');
  };

  // Change Featured Headline on page Spotlight
  const setHeroArticle = (id: string) => {
    const updated = articles.map(a => ({
      ...a,
      isHero: a.id === id
    }));
    setArticles(updated);
    triggerAlert('Homepage Cover Headline updated instantly!');
  };

  const deleteArticle = (id: string) => {
    if (confirm('Are you sure you want to retract/delete this publication?')) {
      const updated = articles.filter(a => a.id !== id);
      setArticles(updated);
      triggerAlert('Article deleted from index.');
    }
  };

  const toggleInlineBreaking = (art: Article) => {
    const isNowBreaking = !art.isBreaking;
    if (isNowBreaking) {
      const activeBreakingCount = articles.filter(a => a.isBreaking).length;
      if (activeBreakingCount >= 3) {
        triggerAlert("Maximum 3 breaking stories allowed. Remove one first.");
        return;
      }
    }

    const updated = articles.map(a => {
      if (a.id === art.id) {
        return {
          ...a,
          isBreaking: isNowBreaking
        };
      }
      return a;
    });
    setArticles(updated);
    triggerAlert(isNowBreaking ? 'Story flagged as Breaking News!' : 'Story removed from Breaking list.');
  };

  // Add report validation
  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportUrlError('');

    if (!reportTitle.trim() || !reportAuthor.trim() || !reportSize.trim() || !reportPdfUrl.trim()) {
      setReportUrlError('Please fill out all report properties.');
      return;
    }

    // URL validation check
    const isUrlValid = reportPdfUrl.trim().startsWith('http://') || reportPdfUrl.trim().startsWith('https://');
    if (!isUrlValid) {
      setReportUrlError('Please enter a valid PDF URL (starting with http:// or https://)');
      return;
    }

    const newReport: EconomicReport = {
      id: `rep-${Date.now()}`,
      title: reportTitle.trim(),
      author: reportAuthor.trim(),
      size: reportSize.trim(),
      downloads: 0,
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      pdfUrl: reportPdfUrl.trim()
    };

    setReports([...reports, newReport]);
    triggerAlert(`Institutional Report: "${newReport.title}" loaded successfully!`);

    // Reset fields
    setReportTitle('');
    setReportAuthor('');
    setReportSize('');
    setReportPdfUrl('');
    setReportUrlError('');
  };

  const handleDeleteReport = (id: string) => {
    if (confirm('Retruct this document from public indicators library?')) {
      setReports(reports.filter(r => r.id !== id));
      triggerAlert('Institutional document deleted.');
    }
  };

  // Tally statistics to show Category Badges
  const tallyAll = articles.length;
  const tallyEconomy = articles.filter(a => a.category === 'Economy').length;
  const tallyBusiness = articles.filter(a => a.category === 'Business').length;
  const tallyPolicy = articles.filter(a => a.category === 'Policy').length;
  const tallyStartups = articles.filter(a => a.category === 'Startups').length;
  const tallyGlobal = articles.filter(a => a.category === 'Global').length;

  // Render raw markdown parser for rich editorial look
  const parseMarkdownToHtml = (mdText: string): string => {
    if (!mdText) return '';
    let parsed = mdText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Header ## -> h4
    parsed = parsed.replace(/^##\s+(.+)$/gm, '<h4 class="font-serif font-bold text-[#8B0000] text-sm sm:text-base mt-4 mb-1.5">$1</h4>');
    // Header ### -> h3
    parsed = parsed.replace(/^###\s+(.+)$/gm, '<h3 class="font-serif font-bold text-secondary-navy text-base sm:text-lg mt-5 mb-2 border-b border-gray-100 pb-1">$1</h3>');
    // Bold **text** -> strong
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-950">$1</strong>');
    // Quotes / Blockquotes -> quoteblock
    parsed = parsed.replace(/^["“](.*?)["”]$/gm, '<blockquote class="border-l-4 border-accent-gold bg-slate-50 pl-4 py-2 text-gray-700 italic">$1</blockquote>');
    // Bullet tags -> listitems
    parsed = parsed.replace(/^\s*-\s+(.+)$/gm, '<li class="list-disc ml-5 text-gray-750 text-xs sm:text-sm my-1">$1</li>');

    // Split paragraphs
    return parsed.split('\n\n').map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<blockquote') || p.trim().startsWith('<li')) {
        return p;
      }
      return `<p class="text-xs sm:text-sm text-gray-800 leading-relaxed mb-3">${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      
      {/* Alert banner */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-900 border-2 border-accent-gold text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 font-sans text-sm animate-bounce-short">
          <Check className="w-5 h-5 text-accent-gold" />
          <span>{notification}</span>
        </div>
      )}

      {/* Intro branding header */}
      <div className="bg-dark-navy text-gray-100 p-6 sm:p-8 rounded-xl border border-accent-gold/25 shadow-lg mb-8 select-none">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-left font-sans">
            <div className="flex flex-wrap items-center gap-2 text-accent-gold font-mono text-[10.5px] uppercase tracking-widest mb-1.5 font-bold">
              <Database className="w-4 h-4 text-accent-gold shrink-0 animate-ping-slow" />
              <span>NEPALECONOMY.COM CORRESPONDENT DESK</span>
              <span className="text-gray-500">|</span>
              <span className="text-[#A2B1C6] tracking-tight normal-case font-mono font-normal">Last synced: <b className="text-accent-gold font-semibold">{lastSyncedTime}</b></span>
            </div>
            <h1 className="text-2xl sm:text-3.5xl font-serif font-bold tracking-tight text-white">
              Sovereign Newsroom
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl leading-relaxed font-light">
              Maintain dynamic indicators, deploy authenticated monetary research, adjust homepage hero focuses, and audit anonymous contact signals.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {isSyncing && (
              <div className="flex items-center gap-1.5 bg-[#5A6475]/35 border border-gray-600 text-accent-gold text-[10px] font-mono py-1 px-3 rounded-full font-bold animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 text-accent-gold animate-spin" />
                <span>Syncing...</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-primary-crimson/20 border border-primary-crimson/50 text-accent-gold text-[10px] font-mono py-1 px-3 rounded-full font-bold">
              <span>ADMIN PRIVILEGES SECURED</span>
            </div>
            <button
              onClick={onLogout}
              className="bg-primary-crimson hover:bg-primary-crimson/90 text-white font-mono text-[11px] py-1 px-4.5 rounded-md uppercase tracking-wider font-semibold cursor-pointer border border-transparent hover:border-accent-gold/20 transition-all flex items-center gap-1.5 shadow"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category badged summaries counters */}
      <div className="bg-white dark:bg-secondary-navy border border-border-warm dark:border-gray-800 rounded-xl p-4 mb-8 text-left select-none shadow-sm">
        <span className="block text-[10px] tracking-widest font-mono font-bold text-[#5A6475] uppercase mb-2.5">
          Editorial Coverage Metrics:
        </span>
        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs font-mono font-bold select-none cursor-default">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary-navy text-white rounded">
            ALL BRIEFINGS: <span className="bg-white text-secondary-navy px-1.5 rounded">{tallyAll}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/35 rounded">
            ECONOMY: <span className="bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-1.5 rounded">{tallyEconomy}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/35 rounded">
            BUSINESS: <span className="bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100 px-1.5 rounded">{tallyBusiness}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900/35 rounded">
            POLICY: <span className="bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-1.5 rounded">{tallyPolicy}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-800 border border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-900/35 rounded">
            STARTUPS: <span className="bg-orange-200 dark:bg-orange-900 text-orange-900 dark:text-orange-100 px-1.5 rounded">{tallyStartups}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/20 dark:text-teal-300 dark:border-teal-900/35 rounded">
            GLOBAL: <span className="bg-teal-200 dark:bg-teal-900 text-teal-950 dark:text-teal-100 px-1.5 rounded">{tallyGlobal}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        
        {/* Left Column: Metrics, Alerts & Tips */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Live Metric Controller */}
          <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium">
            <div className="flex items-center justify-between mb-1.5 select-none font-sans">
              <h3 className="text-lg font-serif font-bold text-secondary-navy dark:text-white flex items-center gap-2 font-bold">
                <TrendingUp className="w-5 h-5 text-primary-crimson" />
                <span>Live Indicator Feeds</span>
              </h3>
              <RefreshCw className="w-4 h-4 text-gray-400 rotate-180" />
            </div>
            
            <form onSubmit={handleMetricSubmit} className="space-y-4 font-sans text-xs">
              {tempMetrics.map((m, idx) => (
                <div key={m.id} className="p-3 bg-bg-ivory dark:bg-dark-navy rounded border border-border-warm dark:border-gray-850 space-y-2">
                  <div className="flex justify-between items-center select-none font-sans">
                    <span className="font-mono font-bold text-secondary-navy dark:text-accent-gold uppercase flex items-center gap-1.5 font-bold">
                      <TrendingUp className="w-3.5 h-3.5 text-accent-gold shrink-0" />
                      <span>{m.name}</span>
                    </span>
                    <div className="flex gap-1 animate-fade-in items-center">
                      <button
                        type="button"
                        onClick={() => handleMetricChangeDirection(idx, true)}
                        className={`px-1.5 py-1 rounded text-[9.5px] uppercase font-mono font-bold border cursor-pointer flex items-center gap-1 ${m.isUp ? 'bg-green-150 text-green-900 border-green-300' : 'bg-white dark:bg-secondary-navy text-gray-500 border-gray-200 dark:border-gray-700'}`}
                      >
                        <TrendingUp className="w-3 h-3" />
                        <span>Up</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMetricChangeDirection(idx, false)}
                        className={`px-1.5 py-1 rounded text-[9.5px] uppercase font-mono font-bold border cursor-pointer flex items-center gap-1 ${!m.isUp ? 'bg-red-105 text-primary-crimson border-red-200' : 'bg-white dark:bg-secondary-navy text-gray-500 border-gray-200 dark:border-gray-700'}`}
                      >
                        <TrendingDown className="w-3 h-3" />
                        <span>Down</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9.5px] text-text-secondary dark:text-gray-400 uppercase tracking-tight block">Current Index / Stat</span>
                      <input
                        type="text"
                        value={m.value}
                        onChange={(e) => handleMetricValueChange(idx, e.target.value)}
                        className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-secondary-navy border border-border-warm dark:border-gray-750 rounded font-mono font-bold text-gray-850 dark:text-white text-xs focus:outline-none focus:border-accent-gold"
                      />
                    </div>
                    <div>
                      <span className="text-[9.5px] text-text-secondary dark:text-gray-400 uppercase tracking-tight block">Change delta</span>
                      <input
                        type="text"
                        value={m.change.replace(/[+-]/g, '')}
                        onChange={(e) => handleMetricDeltaChange(idx, e.target.value)}
                        className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-secondary-navy border border-border-warm dark:border-gray-750 rounded font-mono text-gray-800 dark:text-gray-105 text-xs focus:outline-none focus:border-accent-gold"
                      />
                    </div>
                  </div>

                  {m.id === '3' && (
                    <div className="text-[9px] text-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-300 p-2.5 rounded font-mono mt-2 leading-normal">
                      ⚠️ <strong>NEPSE Index Notice:</strong> Fully powered by background AI synchronization. To overwrite manually, update above.
                    </div>
                  )}
                </div>
              ))}

              <button
                type="submit"
                className="w-full bg-secondary-navy hover:bg-secondary-navy/95 text-white font-mono font-bold py-2 rounded text-xs uppercase tracking-wider transition-colors duration-150 cursor-pointer border border-accent-gold/20 shadow-md text-center"
              >
                Apply Live Indicators
              </button>
            </form>
          </div>

          {/* Secure Tip submissions */}
          <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium animate-fade-in-premium">
            <h3 className="text-lg font-serif font-bold text-secondary-navy dark:text-white mb-1.5 flex items-center gap-2 select-none font-bold">
              <AlertCircle className="w-5 h-5 text-accent-gold" />
              <span>Reader Submission Tips</span>
            </h3>
            <p className="text-xs text-text-secondary dark:text-gray-305 font-sans mb-4 leading-relaxed font-light">
              News tips submitted securely via our anonymous reader forms:
            </p>

            {tips.length === 0 ? (
              <div className="p-4 bg-bg-ivory dark:bg-dark-navy border border-dashed border-border-warm dark:border-gray-750 text-center rounded text-xs text-text-secondary italic">
                No active reader tips.
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar font-sans text-xs">
                {tips.map((tip, index) => (
                  <div key={index} className="p-3 bg-bg-ivory dark:bg-dark-navy rounded border border-border-warm dark:border-gray-750 text-left space-y-1">
                    <div className="flex justify-between items-center text-[9.5px] text-text-secondary">
                      <span className="font-mono font-semibold uppercase">{tip.name || 'Anonymous Source'}</span>
                      <span>{tip.date || 'Today'}</span>
                    </div>
                    <div className="text-secondary-navy dark:text-gray-200 font-serif font-bold text-[12px]">{tip.subject}</div>
                    <p className="text-[11px] text-gray-700 dark:text-gray-300 italic leading-relaxed font-sans mt-1">
                      "{tip.message}"
                    </p>
                    <div className="text-[10px] text-accent-gold/90 font-mono text-right font-bold select-all pt-1">
                      {tip.email}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center/Right Columns: Publish Form & Hero Selector & Report Management */}
        <div className="lg:col-span-2 space-y-8 text-left">
          
          {/* Studio Navigation Tabs */}
          <div className="flex bg-neutral-100 dark:bg-dark-navy p-1.5 rounded-xl border border-border-warm dark:border-gray-800 shadow-sm select-none gap-2 font-sans text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveAdminTab('quick');
                setGeneratedArticleResult(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-mono font-bold uppercase transition-all tracking-wider cursor-pointer ${
                activeAdminTab === 'quick'
                  ? 'bg-primary-crimson text-white shadow-md font-extrabold'
                  : 'text-gray-500 hover:text-gray-955 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-secondary-navy font-bold'
              }`}
            >
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span>Quick Post</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab('full')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-mono font-bold uppercase transition-all tracking-wider cursor-pointer ${
                activeAdminTab === 'full'
                  ? 'bg-primary-crimson text-white shadow-md font-extrabold'
                  : 'text-gray-500 hover:text-gray-955 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-secondary-navy font-bold'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab('settings')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-mono font-bold uppercase transition-all tracking-wider cursor-pointer ${
                activeAdminTab === 'settings'
                  ? 'bg-primary-crimson text-white shadow-md font-extrabold'
                  : 'text-gray-500 hover:text-gray-955 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-secondary-navy'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab('comments')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-mono font-bold uppercase transition-all tracking-wider cursor-pointer ${
                activeAdminTab === 'comments'
                  ? 'bg-primary-crimson text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-955 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-secondary-navy'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 font-bold animate-pulse" />
              <span className="hidden xl:inline">Comments: [{allComments.length}]</span>
              <span className="inline xl:hidden">Comments [{allComments.length}]</span>
            </button>
          </div>

          {/* New Article Box */}
          <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium relative text-left">
            
            {/* Header info reflecting active tab */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-warm dark:border-gray-750 pb-5 mb-6 text-left">
              {activeAdminTab === 'quick' && (
                <div className="text-left">
                  <h3 className="text-xl font-serif font-bold text-secondary-navy dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary-crimson animate-pulse" />
                    <span>Quick-Post Assistant</span>
                  </h3>
                  <p className="text-xs text-text-secondary dark:text-gray-305 font-sans mt-0.5 font-light leading-snug text-left">
                    Generate complete, publication-ready research reports using Gemini AI in just 3 straightforward inputs.
                  </p>
                </div>
              )}
              {activeAdminTab === 'full' && (
                <>
                  <div className="text-left">
                    <h3 className="text-xl font-serif font-bold text-secondary-navy dark:text-white flex items-center gap-2 font-bold select-none">
                      <PlusCircle className="w-5 h-5 text-primary-crimson" />
                      <span>{editingArticleId ? 'Modify Strategic Brief' : 'Compile Advisory Briefing'}</span>
                    </h3>
                    <p className="text-xs text-text-secondary dark:text-gray-305 font-sans mt-0.5 font-light select-none text-left">
                      Design, preview, and output live news. Fields marked with <span className="text-primary-crimson font-bold">*</span> are required.
                    </p>
                  </div>

                  {/* Tabs selector */}
                  <div className="flex self-end bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 p-1 rounded-md text-xs select-none">
                    <button
                      type="button"
                      onClick={() => setFormTab('write')}
                      className={`px-3 py-1 font-mono font-bold rounded cursor-pointer transition-all ${formTab === 'write' ? 'bg-primary-crimson text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'}`}
                    >
                      Write Content
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormTab('preview')}
                      className={`px-3 py-1 font-mono font-bold rounded cursor-pointer transition-all ${formTab === 'preview' ? 'bg-primary-crimson text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'}`}
                    >
                      Live Preview
                    </button>
                  </div>
                </>
              )}
              {activeAdminTab === 'settings' && (
                <div className="text-left">
                  <h3 className="text-xl font-serif font-bold text-secondary-navy dark:text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-crimson" />
                    <span>Correspondent Settings</span>
                  </h3>
                  <p className="text-xs text-text-secondary dark:text-gray-305 font-sans mt-0.5 font-light text-left leading-relaxed">
                    Customize default signatures and taglines, and trigger critical alert overrides.
                  </p>
                </div>
              )}
            </div>

            {/* TAB CONTENTS */}
            {activeAdminTab === 'quick' && (
              <div className="space-y-6 text-left">
                {generatedArticleResult ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 p-6 rounded-xl text-center space-y-4 animate-fade-in my-2">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                      ✓
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif font-black text-emerald-900 dark:text-emerald-400 text-lg font-bold">
                        Article Published Successfully
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-305 max-w-sm mx-auto leading-relaxed font-light">
                        "{generatedArticleResult.title}" is now recorded in the pressing registers under {generatedArticleResult.category}!
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 select-none">
                      {onViewArticle && (
                        <button
                          onClick={() => onViewArticle(generatedArticleResult)}
                          className="bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.01] text-white font-mono font-bold px-5 py-2.5 rounded-md text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                        >
                          View Live
                        </button>
                      )}
                      <button
                        onClick={() => setGeneratedArticleResult(null)}
                        className="bg-neutral-200 hover:bg-neutral-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-205 font-mono font-bold px-5 py-2.5 rounded-md text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Write Another
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleQuickPublish} className="space-y-5 font-sans text-xs leading-relaxed text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                      <div className="md:col-span-2 text-left">
                        <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-bold tracking-tight text-[10px] mb-1">
                          Article Title <span className="text-primary-crimson font-serif font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={quickTitle}
                          onChange={(e) => setQuickTitle(e.target.value)}
                          placeholder="e.g., Hydropower Export Revenues Set New Record"
                          className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold font-serif font-bold text-secondary-navy dark:text-white"
                        />
                      </div>
                      <div className="text-left font-sans">
                        <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-bold tracking-tight text-[10px] mb-1">
                          Category Sector <span className="text-primary-crimson font-serif font-bold">*</span>
                        </label>
                        <select
                          value={quickCategory}
                          onChange={(e) => setQuickCategory(e.target.value as ArticleCategory)}
                          className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded font-bold focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                        >
                          <option value="Economy">Economy</option>
                          <option value="Business">Business</option>
                          <option value="Policy">Policy</option>
                          <option value="Startups">Startups</option>
                          <option value="Global">Global</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-left">
                      <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-bold tracking-tight text-[10px] mb-1">
                        1-2 Sentence Summary Outline <span className="text-primary-crimson font-serif font-bold">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        maxLength={180}
                        value={quickSummary}
                        onChange={(e) => setQuickSummary(e.target.value)}
                        placeholder="Enter a brief 1-2 sentence summary. AI will use this + Title to write the full analytical report."
                        className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Breaking News Toggle */}
                    <div className="bg-red-50/40 dark:bg-red-950/10 border border-red-100 dark:border-red-950/40 p-3.5 rounded-lg space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <label htmlFor="quickIsBreaking" className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-bold tracking-tight text-[10px] select-none cursor-pointer">
                            Mark as Breaking News
                          </label>
                          <span className="text-[9.5px] text-gray-500 font-sans block font-light">
                            Enables high priority badge and routes article to the system ticker banner.
                          </span>
                        </div>
                        <input
                          id="quickIsBreaking"
                          type="checkbox"
                          checked={quickIsBreaking}
                          onChange={(e) => setQuickIsBreaking(e.target.checked)}
                          className="w-4 h-4 text-primary-crimson focus:ring-primary-crimson border-gray-300 rounded cursor-pointer"
                        />
                      </div>

                      {quickIsBreaking && (
                        <div className="animate-fade-in text-left">
                          <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-bold tracking-tight text-[10px] mb-1">
                            Label Override (optional, default: BREAKING)
                          </label>
                          <input
                            type="text"
                            value={quickBreakingLabel}
                            onChange={(e) => setQuickBreakingLabel(e.target.value)}
                            placeholder="EXCLUSIVE | URGENT | MARKET ALERT | POLICY UPDATE"
                            className="w-full px-3 py-2 bg-white dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Collapsible Advanced section */}
                    <div className="pt-2 text-left select-none">
                      <button
                        type="button"
                        onClick={() => setQuickIsAdvancedOpen(!quickIsAdvancedOpen)}
                        className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-primary-crimson hover:text-red-500 cursor-pointer"
                      >
                        {quickIsAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>Advanced overrides ({quickIsAdvancedOpen ? 'Hide' : 'Show'})</span>
                      </button>

                      {quickIsAdvancedOpen && (
                        <div className="mt-3 p-4 border border-dashed border-border-warm dark:border-gray-750 rounded-lg bg-bg-ivory/50 dark:bg-dark-navy/20 animate-fade-in space-y-4 text-left">
                          <p className="text-[9.5px] font-mono tracking-widest text-[#5A6475] uppercase border-b pb-1">
                            Override settings & manual parameters
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <div className="text-left font-sans">
                              <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[9px] mb-1">
                                Author Name
                              </label>
                              <input
                                type="text"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                                placeholder={settingsDisplayName}
                              />
                            </div>
                            <div className="text-left font-sans">
                              <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[9px] mb-1">
                                Designation Title
                              </label>
                              <input
                                type="text"
                                value={authorTitle}
                                onChange={(e) => setAuthorTitle(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                                placeholder={settingsAuthorTitle}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <div className="text-left font-sans">
                              <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[9px] mb-1">
                                Image Preset Cover
                              </label>
                              <select
                                value={imagePreset}
                                onChange={(e) => setImagePreset(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded text-gray-800 dark:text-white"
                              >
                                <option value="mountain">Peak / Himalayas Backdrop</option>
                                <option value="kathmandu">Kathmandu streetscapes</option>
                                <option value="finance">Stock charts indices</option>
                                <option value="energy">Hydropower dam structures</option>
                                <option value="technology">Tech cluster workstation</option>
                                <option value="agriculture">Terai farming plains</option>
                              </select>
                            </div>
                            <div className="text-left font-sans">
                              <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[9px] mb-1">
                                Or Custom Cover image link
                              </label>
                              <input
                                type="text"
                                value={customImage}
                                onChange={(e) => setCustomImage(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                                placeholder="https://images.unsplash.com/photo-..."
                              />
                            </div>
                          </div>

                          <div className="text-left">
                            <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[9px] mb-1">
                              Manual Article Body (Avoids AI Generation)
                            </label>
                            <textarea
                              value={content}
                              onChange={(e) => setContent(e.target.value)}
                              rows={4}
                              className="w-full px-2.5 py-1.5 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold font-mono text-gray-800 dark:text-white"
                              placeholder="If typed, we bypass calling Gemini and publish this text completely!"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress Indicator */}
                    {isGenerating && (
                      <div className="p-4 bg-primary-crimson/5 border border-primary-crimson/20 rounded-lg space-y-3 animate-pulse text-left font-sans">
                        <div className="flex items-center justify-between font-mono text-[9px] font-bold text-accent-gold">
                          <span>EMERGENCY PRESS BROADCAST ACTIVE</span>
                          <span>AI COMPILER BUSY</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 border-2 border-primary-crimson border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-secondary-navy dark:text-gray-100 font-medium font-sans">
                            {generationStep}
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-primary-crimson h-full rounded-full transition-all duration-300" style={{
                            width: generationStep.includes('Step 1') ? '20%' :
                                   generationStep.includes('Step 2') ? '40%' :
                                   generationStep.includes('Step 3') ? '60%' :
                                   generationStep.includes('Step 4') ? '80%' :
                                   generationStep.includes('Step 5') ? '90%' :
                                   generationStep.includes('Step 6') ? '95%' : '100%'
                          }} />
                        </div>
                      </div>
                    )}

                    <div className="pt-2 text-left">
                      <button
                        type="submit"
                        disabled={isGenerating}
                        className="w-full bg-primary-crimson hover:bg-primary-crimson/95 disabled:bg-primary-crimson/40 text-white font-mono font-bold py-2.5 rounded text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md text-center flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4 text-accent-gold animate-bounce" />
                        <span>{isGenerating ? 'AI GENERATION RUNNING...' : 'AI-Generate & Publish'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* ADMIN REFERENCE NEWSLETTER WIDGET */}
                <div className="mt-8 pt-6 border-t border-dashed border-border-warm dark:border-gray-800">
                  <div className="max-w-md mx-auto bg-white dark:bg-secondary-navy p-5 rounded-xl border-2 border-accent-gold shadow-premium text-left animate-fade-in relative z-20">
                    <div className="flex items-center justify-between mb-2 select-none">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-accent-gold bg-bg-ivory dark:bg-dark-navy px-2 py-0.5 rounded border border-accent-gold/25 uppercase">
                        Newsletter Preview
                      </span>
                    </div>
                    <h4 className="font-serif font-black text-secondary-navy dark:text-white text-sm mb-1 text-left">
                      Subscribe to NepalEconomy
                    </h4>
                    <p className="text-xs text-text-secondary dark:text-gray-305 leading-snug mb-4 text-left font-light">
                      Get the latest Nepal business and economic news delivered to your inbox.
                    </p>

                    {adminNewsletterSuccess ? (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 text-emerald-605 dark:text-emerald-400 rounded font-mono text-[10px] flex items-center gap-1.5 animate-fade-in uppercase font-bold">
                        Subscribed successfully.
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!adminNewsletterEmail.trim()) return;
                          setAdminNewsletterSubmitting(true);
                          setTimeout(() => {
                            setAdminNewsletterSuccess(true);
                            setAdminNewsletterEmail('');
                            setAdminNewsletterSubmitting(false);
                            setTimeout(() => setAdminNewsletterSuccess(false), 3500);
                          }, 1000);
                        }}
                        className="space-y-2 text-left"
                      >
                        <input
                          type="email"
                          required
                          placeholder="admin-test@nepalegrowth.org"
                          value={adminNewsletterEmail}
                          onChange={(e) => setAdminNewsletterEmail(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-bg-ivory dark:bg-dark-navy text-gray-850 dark:text-white border border-border-warm dark:border-gray-750 rounded focus:outline-none focus:border-accent-gold font-sans"
                        />
                        <button
                          type="submit"
                          disabled={adminNewsletterSubmitting}
                          className="w-full bg-primary-crimson hover:bg-primary-crimson/95 disabled:bg-primary-crimson/50 text-white font-mono uppercase tracking-wider font-bold text-[11px] py-2 rounded transition-colors cursor-pointer text-center flex items-center justify-center font-bold"
                        >
                          {adminNewsletterSubmitting ? 'Syncing...' : 'Subscribe Free'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

              </div>
            )}

            {activeAdminTab === 'full' && (
              <form onSubmit={handlePublish} className="space-y-4 font-sans text-xs leading-relaxed text-left">
                {formTab === 'write' ? (
                  <div className="space-y-4 animate-fade-in text-left">
                    
                    {editingArticleId && (
                      <div className="p-3 bg-accent-gold/10 border border-accent-gold text-secondary-navy dark:text-white rounded flex items-center justify-between font-mono font-bold text-[11px] mb-2 select-none">
                        <span>⚠️ EDITING TARGET ACTIVE: {editingArticleId}</span>
                        <button 
                          type="button" 
                          onClick={cancelEditMode}
                          className="bg-black hover:bg-neutral-800 text-white px-2 py-0.5 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div className="text-left font-sans">
                        <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[10px] mb-1">
                          Author Name <span className="text-primary-crimson font-serif font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                          placeholder="e.g., Professor Ramesh Dahal"
                        />
                        {showValidationErrors && !author.trim() && (
                          <p className="text-red-500 font-mono text-[9px] mt-0.5">Author's physical signature is required.</p>
                        )}
                      </div>
                      <div className="text-left font-sans">
                        <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[10px] mb-1">
                          Designation Title
                        </label>
                        <input
                          type="text"
                          value={authorTitle}
                          onChange={(e) => setAuthorTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                          placeholder="e.g., Senior Energy Advisor, Editorial Board"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left font-sans">
                      <div className="text-left font-sans">
                        <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[10px] mb-1">
                          Category Pillar
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as ArticleCategory)}
                          className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded font-bold focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                        >
                          <option value="Economy">Economy</option>
                          <option value="Business">Business</option>
                          <option value="Policy">Policy</option>
                          <option value="Startups">Startups</option>
                          <option value="Global">Global</option>
                        </select>
                      </div>
                      <div className="text-left font-sans">
                        <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[10px] mb-1 select-none">
                          Est. Read length
                        </label>
                        <input
                          type="text"
                          value={readTime}
                          readOnly
                          title="Auto-calculated from typing words depth"
                          className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-border-warm dark:border-gray-700 text-xs rounded font-mono font-bold text-gray-500 cursor-not-allowed text-center select-none"
                        />
                        <span className="text-[9px] text-[#5A6475] italic mt-0.5 block select-none">Auto-calculated from body words.</span>
                      </div>
                      <div className="text-left font-sans">
                        <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[10px] mb-1 select-none">
                          Image presets
                        </label>
                        <select
                          value={imagePreset}
                          onChange={(e) => setImagePreset(e.target.value)}
                          className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                        >
                          <option value="mountain">Peak / Himalayas Backdrop</option>
                          <option value="kathmandu">Kathmandu streetscapes</option>
                          <option value="finance">Stock charts indices</option>
                          <option value="energy">Hydropower dam structures</option>
                          <option value="technology">Tech cluster workstation</option>
                          <option value="agriculture">Terai farming plains</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-left">
                      <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[10px] mb-1">
                        Or Custom Backdrop Image Link
                      </label>
                      <input
                        type="text"
                        value={customImage}
                        onChange={(e) => setCustomImage(e.target.value)}
                        className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white font-mono"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </div>

                    <div className="text-left">
                      <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[10px] mb-1">
                        Article Title *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="e.g., Remittance Milestones and Macroeconomic Stability Ratios"
                        className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold font-serif font-bold text-secondary-navy dark:text-white"
                      />
                      {showValidationErrors && !title.trim() && (
                        <p className="text-red-500 font-mono text-[9px] mt-0.5">Title is required.</p>
                      )}
                    </div>

                    <div className="text-left">
                      <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[10px] mb-1">
                        Brief Excerpt Lead Summary <span className="text-primary-crimson font-serif font-bold">*</span>
                      </label>
                      <textarea
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        required
                        rows={2}
                        maxLength={240}
                        placeholder="Compose a succinct 2-sentence intro summary for homepage cover layouts..."
                        className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-755 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white font-sans"
                      />
                      {showValidationErrors && !excerpt.trim() && (
                        <p className="text-red-500 font-mono text-[9px] mt-0.5">Excerpt lead description is required.</p>
                      )}
                    </div>

                    <div className="text-left">
                      <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[10px] mb-1 select-none font-bold">
                        Full Article Body text (Markdown tags supported)
                      </label>
                      <span className="text-[10px] text-[#5A6475] italic leading-normal block mb-2 select-none">
                        Leave empty to automatically compile a comprehensive economic analytical report with subheadings, financial ratios, and peer validation footnotes!
                      </span>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={8}
                        placeholder="Use markdown tags for formatting. Subtitle blocks ## can segment components. Quote quotes to generate quotes panels."
                        className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-755 text-xs rounded focus:outline-none focus:border-accent-gold font-mono text-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Breaking News Toggle */}
                    <div className="bg-red-50/40 dark:bg-red-950/10 border border-red-100 dark:border-red-950/40 p-3.5 rounded-lg space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <label htmlFor="isBreaking" className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-bold tracking-tight text-[10px] select-none cursor-pointer">
                            Mark as Breaking News
                          </label>
                          <span className="text-[9.5px] text-gray-500 font-sans block font-light leading-snug">
                            Enables high priority badge and routes article to the system ticker banner.
                          </span>
                        </div>
                        <input
                          id="isBreaking"
                          type="checkbox"
                          checked={isBreaking}
                          onChange={(e) => setIsBreaking(e.target.checked)}
                          className="w-4 h-4 text-primary-crimson focus:ring-primary-crimson border-gray-300 rounded cursor-pointer"
                        />
                      </div>

                      {isBreaking && (
                        <div className="animate-fade-in text-left">
                          <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[10px] mb-1 font-bold">
                            Label Override (optional, default: BREAKING)
                          </label>
                          <input
                            type="text"
                            value={breakingLabel}
                            onChange={(e) => setBreakingLabel(e.target.value)}
                            placeholder="EXCLUSIVE | URGENT | MARKET ALERT | POLICY UPDATE"
                            className="w-full px-3 py-2 bg-white dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary-crimson hover:bg-primary-crimson/95 text-white font-mono font-bold py-2.5 rounded text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-md text-center"
                    >
                      {editingArticleId ? 'Save Briefing Updates' : 'Compile and Publish Briefing'}
                    </button>

                  </div>
                ) : (
                  // Live custom-themed Markdown Preview pane
                  <div className="space-y-6 md:p-4 bg-bg-ivory dark:bg-dark-navy border border-dashed border-border-warm dark:border-gray-750 p-3 rounded-lg animate-fade-in select-none text-left">
                    <div className="border-b pb-3 mb-4 flex items-center justify-between text-[11px] font-mono font-bold">
                      <span className="text-[#5A6475] uppercase">Active Look Preview (Editorial Style)</span>
                      <span className="text-accent-gold">{category.toUpperCase()} CATEGORY</span>
                    </div>

                    <div className="space-y-2 text-left">
                      <span className="inline-block px-2.5 py-0.5 text-[9px] uppercase font-mono bg-primary-crimson text-white rounded font-bold">
                        {category} ADVISORY PREVIEW
                      </span>
                      <h2 className="text-lg sm:text-2xl font-serif font-bold text-secondary-navy dark:text-white leading-snug">
                        {title || 'Untreated Project Title'}
                      </h2>
                      <p className="text-xs text-text-secondary italic dark:text-gray-300 font-light border-l-2 border-accent-gold pb-1.5 pl-3">
                        {excerpt || 'Lead summary excerpt placeholder...'}
                      </p>
                      <div className="text-[10px] text-gray-400 font-mono pt-1">
                        BY {author.toUpperCase()} • {readTime.toUpperCase()} • {new Date().toLocaleDateString()}
                      </div>
                    </div>

                    <div className="border-t border-gray-100/50 pt-5 text-sm text-left leading-relaxed">
                      <div 
                        className="font-sans text-xs sm:text-sm text-gray-800 dark:text-gray-205 space-y-4 text-left"
                        dangerouslySetInnerHTML={{
                          __html: parseMarkdownToHtml(content.trim() || getCategoryFallbackContent(category, title || 'Briefing Outline'))
                        }}
                      />
                    </div>
                  </div>
                )}
              </form>
            )}

            {activeAdminTab === 'settings' && (
              <div className="space-y-6 text-left">
                <form onSubmit={handleSaveSettings} className="space-y-5 font-sans text-xs leading-relaxed animate-fade-in text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="text-left font-sans">
                      <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[10px] mb-1">
                        Admin Display Name (Author)
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDisplayName}
                        onChange={(e) => setSettingsDisplayName(e.target.value)}
                        className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-755 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                        placeholder="e.g., NepalEconomy Editorial Desk"
                      />
                      <span className="text-[9px] text-[#5A6475] italic mt-1 block">Persisted locally in "ne_admin_author_name" register.</span>
                    </div>
                    <div className="text-left font-sans">
                      <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[10px] mb-1">
                        Author Title Designation
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsAuthorTitle}
                        onChange={(e) => setSettingsAuthorTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-755 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                        placeholder="e.g., Senior Economic Analyst, Press Room"
                      />
                      <span className="text-[9px] text-[#5A6475] italic mt-1 block">Persisted locally in "ne_admin_author_title" register.</span>
                    </div>
                  </div>

                  <div className="text-left">
                    <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[10px] mb-1">
                      System Hub Tagline
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsSiteTagline}
                      onChange={(e) => setSettingsSiteTagline(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-755 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white font-mono"
                      placeholder="e.g., NEPAL'S BUSINESS INTELLIGENCE HUB"
                    />
                    <span className="text-[9px] text-[#5A6475] italic mt-1 block select-none">Persisted locally in "ne_site_tagline" register (re-renders header tagline).</span>
                  </div>

                  <div className="text-left">
                    <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-semibold tracking-tight text-[10px] mb-1 font-bold">
                      Breaking News override alert headline text
                    </label>
                    <textarea
                      value={settingsBreakingOverride}
                      onChange={(e) => setSettingsBreakingOverride(e.target.value)}
                      rows={3}
                      placeholder="Type an emergency news broadcast headline here to freeze the home page's red Breaking news slider to permanently show this warning override."
                      className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-850 dark:text-white leading-relaxed font-sans"
                    />
                    <span className="text-[9px] text-[#5A6475] italic mt-1 block">If configured, locks the banner exclusively with this text override. Clear text to restore ordinary feed.</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2 text-left">
                    <button
                      type="submit"
                      className="bg-primary-crimson hover:bg-primary-crimson/95 text-white font-mono font-bold py-2.5 px-6 rounded text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md text-center flex-1"
                    >
                      Save settings parameters
                    </button>
                    {settingsBreakingOverride && (
                      <button
                        type="button"
                        onClick={handleClearBreakingOverride}
                        className="bg-neutral-200 hover:bg-neutral-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-mono font-bold py-2.5 px-6 rounded text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Clear alert override
                      </button>
                    )}
                  </div>
                </form>

                <div className="bg-bg-ivory dark:bg-dark-navy p-5 rounded-lg border border-accent-gold/20 space-y-4 animate-fade-in text-left">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-accent-gold animate-pulse" />
                    <span className="font-serif font-bold text-gray-800 dark:text-white text-sm">
                      Makeshift Cloud Database Sync (Gemini Files API)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5A6475] leading-relaxed font-light">
                    This application utilizes the Gemini Files API as a makeshift cloud document store/blob database to persist mock data, custom briefings, metrics, and report items across different user sessions.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-secondary-navy p-3.5 rounded border border-border-warm dark:border-gray-850 font-mono text-[10.5px] text-left select-none">
                    <div>
                      <span className="text-gray-400 block uppercase tracking-wider text-[9px] font-bold">Last Cloud Sync Time:</span>
                      <span className="text-gray-750 dark:text-gray-200 mt-0.5 block font-bold">{lastSyncedTime}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block uppercase tracking-wider text-[9px] font-bold">Cloud Storage URI:</span>
                      <span className="text-gray-750 dark:text-gray-200 mt-0.5 block font-bold truncate select-all" title={localStorage.getItem('ne_cloud_file_uri') || 'No Cloud File URI yet'}>
                        {localStorage.getItem('ne_cloud_file_uri') || 'Not Created Yet'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1 text-left">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono select-none">
                      {isSyncing ? (
                        <div className="flex items-center gap-1.5 text-accent-gold">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Synchronization in progress...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Database synchronized</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={handleForceSync}
                      className="bg-accent-gold hover:bg-accent-gold/90 text-dark-navy disabled:bg-gray-300 disabled:text-gray-500 font-mono font-bold py-2.5 px-4 rounded text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing...' : 'Force Sync Cloud'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeAdminTab === 'comments' && (
              <div className="space-y-6 animate-fade-in text-left">
                <div className="text-left select-none">
                  <h3 className="text-xl font-serif font-bold text-secondary-navy dark:text-white flex items-center gap-2 font-bold">
                    <MessageCircle className="w-5 h-5 text-primary-crimson" />
                    <span>Comments Moderation Desk</span>
                  </h3>
                  <p className="text-xs text-text-secondary dark:text-gray-305 font-sans mt-0.5 mb-4 font-light leading-snug">
                    Review and moderate comments submitted across all publication brief channels below.
                  </p>
                </div>

                {allComments.length === 0 ? (
                  <div className="p-8 bg-bg-ivory dark:bg-dark-navy border border-dashed border-border-warm dark:border-gray-750 text-center rounded-xl text-xs text-text-secondary italic">
                    No comments found across NepalEconomy.com publications.
                  </div>
                ) : (
                  <div className="space-y-6 text-left">
                    {(() => {
                      const grouped: { [articleTitle: string]: typeof allComments } = {};
                      allComments.forEach(c => {
                        if (!grouped[c.articleTitle]) {
                          grouped[c.articleTitle] = [];
                        }
                        grouped[c.articleTitle].push(c);
                      });

                      return Object.entries(grouped).map(([title, commentsList]) => (
                        <div 
                          key={title} 
                          className="bg-bg-ivory dark:bg-dark-navy p-5 rounded-xl border border-border-warm dark:border-gray-800 space-y-4 shadow-sm text-left"
                        >
                          <div className="border-b border-gray-200 dark:border-gray-800 pb-2.5 text-left">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono block uppercase tracking-wider">
                              ARTICLE RECEPTACLE
                            </span>
                            <h4 className="font-serif font-bold text-secondary-navy dark:text-accent-gold text-sm leading-snug text-left">
                              {title}
                            </h4>
                          </div>

                          <div className="space-y-4 divide-y divide-gray-150 dark:divide-gray-800 text-left">
                            {commentsList.map((cmt) => (
                              <div key={cmt.commentId} className="flex justify-between items-start gap-4 pt-4 first:pt-0 text-left">
                                <div className="space-y-1 flex-1 text-left">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-primary-crimson text-xs uppercase tracking-wide" style={{ fontVariant: 'small-caps' }}>
                                      {cmt.author}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">
                                      {cmt.date}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-450 font-mono">
                                    Article: {cmt.articleTitle}
                                  </div>
                                  <p className="text-xs text-text-primary dark:text-gray-200 font-sans leading-relaxed whitespace-pre-wrap mt-1">
                                    {cmt.content}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(cmt.articleId, cmt.commentId)}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-primary-crimson border border-red-100 dark:border-red-900/40 rounded transition-colors cursor-pointer"
                                  title="Delete Comment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Social Share Payload */}
            {socialPayload && (
              <div className="mt-6 p-4 bg-accent-gold/5 border border-accent-gold/30 rounded-lg space-y-3 font-sans text-xs animate-fade-in text-left select-none">
                <div className="flex items-center gap-1.5 text-accent-gold uppercase font-mono font-bold text-[10px]">
                  <Share2 className="w-3.5 h-3.5 text-accent-gold" />
                  <span>Auto social syndication presets</span>
                </div>
                <p className="text-[11px] text-[#5A6475] leading-normal font-sans">
                  Your briefing is live! Below represents templates prepared for social syndication pipelines:
                </p>

                <div className="space-y-4 border-t pt-3 border-gray-100/10 font-sans">
                  <div>
                    <span className="font-bold text-gray-750 dark:text-gray-305 block text-[10px] uppercase font-bold">Twitter/X Briefing Feed:</span>
                    <div className="bg-bg-ivory dark:bg-dark-navy p-2.5 rounded border border-border-warm dark:border-gray-750 select-all text-[10.5px] font-mono whitespace-pre-wrap leading-relaxed dark:text-gray-200">
                      {socialPayload.twitter}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-gray-750 dark:text-gray-305 block text-[10px] uppercase font-bold">LinkedIn Corporate Advisory:</span>
                    <div className="bg-bg-ivory dark:bg-dark-navy p-2.5 rounded border border-border-warm dark:border-gray-755 select-all text-[10.5px] font-mono whitespace-pre-wrap leading-relaxed dark:text-gray-200">
                      {socialPayload.linkedin}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans text-left">
            
            {/* Cover selector & existing publications details */}
            <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium text-left">
              <h3 className="text-lg font-serif font-bold text-secondary-navy dark:text-white mb-1.5 flex items-center gap-2 select-none font-bold text-left">
                <FileText className="w-5 h-5 text-secondary-navy" />
                <span>Editorial Cover Selector</span>
              </h3>
              <p className="text-xs text-text-secondary dark:text-gray-305 font-sans mb-5 leading-normal text-left font-light">
                Command story importance levels. Choose a Cover Spot, pre-fill variables via <strong>Modify</strong>, or delete stale briefings:
              </p>

              <div className="space-y-3 max-h-[460px] overflow-y-auto no-scrollbar font-sans text-xs text-left">
                {articles.map((art) => (
                  <div 
                    key={art.id} 
                    className={`p-3 rounded border flex flex-col justify-between gap-3 text-left transition-colors ${
                      art.isHero 
                        ? 'bg-accent-gold/5 border-accent-gold/80' 
                        : 'bg-bg-ivory dark:bg-dark-navy border-border-warm dark:border-gray-750 hover:bg-neutral-50 dark:hover:bg-slate-805'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 text-[8px] uppercase font-mono bg-secondary-navy/15 text-secondary-navy dark:text-accent-gold rounded font-bold">
                          {art.category}
                        </span>
                        {art.isHero && (
                          <span className="inline-flex items-center gap-0.5 text-[8.5px] uppercase font-mono font-bold text-accent-gold bg-dark-navy px-1.5 py-0.5 rounded">
                            <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                            <span>Spotlight Cover</span>
                          </span>
                        )}
                      </div>
                      <h5 className={`font-serif font-bold text-secondary-navy dark:text-white leading-tight ${art.isBreaking ? 'border-2 border-primary-crimson rounded px-2 py-1 bg-red-50/20' : ''}`}>{art.title}</h5>
                      <p className="text-[10px] text-text-secondary dark:text-gray-400 line-clamp-1 leading-snug">{art.excerpt}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-105 dark:border-gray-800 pt-2 shrink-0 select-none">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[9.5px] font-mono text-gray-400 font-bold">{art.readTime}</span>
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!art.isBreaking}
                            onChange={() => toggleInlineBreaking(art)}
                            className="w-3 h-3 text-primary-crimson focus:ring-primary-crimson border-gray-300 rounded cursor-pointer"
                          />
                          <span className={`font-mono text-[9px] uppercase tracking-wider ${art.isBreaking ? 'text-primary-crimson font-black' : 'text-gray-500 font-bold'}`}>
                            {art.isBreaking ? 'Breaking 🔥' : 'Breaking'}
                          </span>
                        </label>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <button
                          onClick={() => handleEditClick(art)}
                          className="px-2 py-1 bg-blue-105 hover:bg-blue-200 text-blue-900 font-mono text-[9.5px] rounded border border-blue-200 uppercase tracking-tight flex items-center justify-center gap-0.5 font-bold cursor-pointer transition-colors"
                          title="Modify briefing form variables"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Modify</span>
                        </button>
                        {!art.isHero && (
                          <button
                            onClick={() => setHeroArticle(art.id)}
                            className="px-2 py-1 bg-dark-navy hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-mono uppercase tracking-tight text-[9.5px] rounded transition-all cursor-pointer whitespace-nowrap"
                          >
                            Set Cover
                          </button>
                        )}
                        <button
                          onClick={() => deleteArticle(art.id)}
                          className="p-1 text-primary-crimson hover:bg-red-50 dark:hover:bg-red-950/20 rounded border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                          title="Retract publication"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manage reports list manager */}
            <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium flex flex-col justify-between text-left">
              <div className="text-left">
                <h3 className="text-lg font-serif font-bold text-secondary-navy dark:text-white mb-1.5 flex items-center gap-2 select-none font-bold text-left">
                  <FileUp className="w-5 h-5 text-teal-800" />
                  <span>Institutional Reports Catalog</span>
                </h3>
                <p className="text-xs text-text-secondary dark:text-gray-305 font-sans mb-5 leading-normal text-left font-light">
                  Incorporate macroeconomic surveys and Monetary Policy catalogs. Fully validates secure PDF links.
                </p>

                {/* Form to submit a report */}
                <form onSubmit={handleAddReport} className="space-y-3 font-sans text-xs text-left mb-6 p-4 bg-bg-ivory dark:bg-dark-navy rounded border border-border-warm dark:border-gray-755 border-dashed">
                  <span className="block text-[10px] tracking-wider uppercase font-mono font-bold text-teal-800 mb-1.5 select-none text-left">
                    Add PDF document
                  </span>

                  <div>
                    <label className="block text-secondary-navy dark:text-gray-200 font-mono uppercase text-[9px] mb-0.5 text-left">Report Title</label>
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      required
                      placeholder="e.g., Fiscal Budget Allocation Index 2082"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-secondary-navy border border-border-warm dark:border-gray-750 font-serif text-slate-850 dark:text-white text-xs rounded focus:outline-none focus:border-accent-gold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="text-left">
                      <label className="block text-secondary-navy dark:text-gray-200 font-mono uppercase text-[9px] mb-0.5 text-left">Corporate Author</label>
                      <input
                        type="text"
                        value={reportAuthor}
                        onChange={(e) => setReportAuthor(e.target.value)}
                        required
                        placeholder="e.g., Ministry of Finance"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-secondary-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold text-slate-805 dark:text-white"
                      />
                    </div>
                    <div className="text-left">
                      <label className="block text-secondary-navy dark:text-gray-200 font-mono uppercase text-[9px] mb-0.5 text-left">Document File Size</label>
                      <input
                        type="text"
                        value={reportSize}
                        onChange={(e) => setReportSize(e.target.value)}
                        required
                        placeholder="e.g., 4.5 MB"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-secondary-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold text-slate-805 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <label className="block text-secondary-navy dark:text-gray-200 font-mono uppercase text-[9px] mb-0.5 text-left">Secure PDF URL Link (validated)</label>
                    <input
                      type="text"
                      value={reportPdfUrl}
                      onChange={(e) => {
                        setReportPdfUrl(e.target.value);
                        setReportUrlError('');
                      }}
                      required
                      placeholder="https://example.com/reports/financial.pdf"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-secondary-navy border border-border-warm dark:border-gray-750 text-xs rounded font-mono focus:outline-none focus:border-accent-gold text-slate-805 dark:text-white"
                    />
                  </div>

                  {reportUrlError && (
                    <p className="text-primary-crimson font-mono text-[9px] font-bold text-left">
                      ⚠️ {reportUrlError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-teal-800 hover:bg-teal-900 text-white font-mono uppercase font-bold py-2 rounded text-[10px] tracking-wide cursor-pointer flex items-center justify-center gap-1 shadow"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Upload Report Info</span>
                  </button>
                </form>
              </div>

              {/* List of current reports */}
              <div className="space-y-2 mt-auto text-left select-none text-xs">
                <span className="block text-[10px] tracking-widest font-mono font-bold text-[#5A6475] uppercase border-b pb-1">
                  Active Document Catalogs :
                </span>
                <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-1.5 text-xs text-left">
                  {reports.map((rep) => (
                    <div key={rep.id} className="p-2.5 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 rounded flex justify-between items-center text-left">
                      <div className="max-w-[75%] pr-1 text-left">
                        <h6 className="font-serif font-bold text-secondary-navy dark:text-white truncate text-left" title={rep.title}>
                          {rep.title}
                        </h6>
                        <span className="text-[10px] text-gray-400 font-mono block mt-0.5 text-left">
                          {rep.author} • {rep.size}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteReport(rep.id)}
                        className="p-1 px-1.5 hover:bg-red-50 text-primary-crimson border border-transparent rounded hover:border-red-200 cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
