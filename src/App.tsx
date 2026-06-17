import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, KeyRound, Database, PlusCircle, LayoutGrid, Sparkles,
  RefreshCw, Trash2, Edit3, Clipboard, HelpCircle, Users, Mail, BellRing,
  FileText, Newspaper, Image as ImageIcon, X, Save
} from 'lucide-react';

import { ToastProvider, useToast } from './components/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ConsentBanner from './components/ConsentBanner';
import FloatingBackToTop from './components/FloatingBackToTop';
import SEOHead from './components/SEOHead';

import Ticker from './components/Ticker';
import BreakingNews from './components/BreakingNews';
import CommandCenterHero from './components/CommandCenterHero';
import NEPSEWidget from './components/NEPSEWidget';
import InteractiveChart from './components/InteractiveChart';
import HomeCarousel from './components/HomeCarousel';

import ArticleEditor from './components/ArticleEditor';
import QuickPostWizard from './components/QuickPostWizard';
import ArticleDetail from './components/ArticleDetail';

import CategoryPage from './pages/CategoryPage';
import ReportsPage from './pages/ReportsPage';
import DownloadsPage from './pages/DownloadsPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';

import { Article, MarketMetric, ArticleCategory } from './types';
import { INITIAL_ARTICLES, INITIAL_METRICS } from './mockData';

function AppInner() {
  const { addToast } = useToast();

  const [activePage, setActivePage] = useState('home');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [metrics, setMetrics] = useState<MarketMetric[]>(INITIAL_METRICS);
  const [loading, setLoading] = useState(true);

  // Admin editor states
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Site settings (header tagline + breaking override)
  const [taglineDraft, setTaglineDraft] = useState(
    () => localStorage.getItem('ne_site_tagline') || "NEPAL'S BUSINESS INTELLIGENCE HUB"
  );
  const [breakingDraft, setBreakingDraft] = useState(
    () => localStorage.getItem('ne_breaking_news_override') || ''
  );

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setArticles(data);
        }
      }
    } catch {
      // keep fallback mock data
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMetrics(data);
        }
      }
    } catch {
      // keep fallback
    }
  };

  useEffect(() => {
    Promise.all([fetchArticles(), fetchMetrics()]).finally(() => setLoading(false));
  }, []);

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
    setActivePage('article-detail');
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  };

  const handleSelectCategory = (category: string) => {
    setActivePage(category.toLowerCase());
    setIsAdminMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Permanently delete this article?')) return;
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': localStorage.getItem('ne_admin_token') || '' }
      });
      if (res.ok) {
        setArticles(prev => prev.filter(a => a.id !== id));
        addToast('Article deleted.', 'success');
      } else {
        addToast('Authentication expired.', 'error');
      }
    } catch {
      addToast('Server error during deletion.', 'error');
    }
  };

  const saveSiteSettings = () => {
    localStorage.setItem('ne_site_tagline', taglineDraft);
    localStorage.setItem('ne_breaking_news_override', breakingDraft);
    addToast('Site settings saved.', 'success');
  };

  const publishedArticles = articles.filter(a => a.status === 'published');
  const heroFallback = publishedArticles[0] || articles[0] || null;

  // Articles for the secondary feed grid (exclude hero featured ones)
  const feedArticles = publishedArticles.slice(0, 9);

  const getRelated = (article: Article) => {
    return publishedArticles
      .filter(a => a.id !== article.id && a.category === article.category)
      .slice(0, 4);
  };

  const categoryPages: ArticleCategory[] = ['Economy', 'Business', 'Policy', 'Startups', 'Global'];

  const renderMainContent = () => {
    // Article detail view
    if (activePage === 'article-detail' && selectedArticle) {
      return (
        <ArticleDetail
          article={selectedArticle}
          onBack={() => { setActivePage('home'); setSelectedArticle(null); }}
          onSelectCategory={handleSelectCategory}
          relatedArticles={getRelated(selectedArticle)}
          onSelectArticle={handleSelectArticle}
        />
      );
    }

    // Category pages
    const matchedCategory = categoryPages.find(c => c.toLowerCase() === activePage);
    if (matchedCategory) {
      return (
        <CategoryPage
          categoryName={matchedCategory}
          articles={articles.filter(a => a.status === 'published')}
          onSelectArticle={handleSelectArticle}
        />
      );
    }

    if (activePage === 'reports') return <ReportsPage isAdminMode={isAdminMode} />;
    if (activePage === 'downloads') return <DownloadsPage isAdminMode={isAdminMode} />;
    if (activePage === 'contact') return <ContactPage />;
    if (activePage === 'about') return <AboutPage />;

    // HOME PAGE
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8 text-left">

        {/* Auto-rotating carousel of images / PDFs */}
        <HomeCarousel isAdminMode={isAdminMode} />

        {/* Command Center Hero */}
        <CommandCenterHero
          articles={articles}
          onSelectArticle={handleSelectArticle}
          onSelectCategory={handleSelectCategory}
          isAdminMode={isAdminMode}
          fallbackArticle={heroFallback}
        />

        {/* Live data widgets row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NEPSEWidget variant="card" />
          <InteractiveChart />
        </div>

        {/* Latest dispatches feed */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-nexus-border pb-2 select-none">
            <Newspaper className="w-5 h-5 text-nexus-cyan" />
            <h2 className="font-serif font-black text-white text-lg uppercase tracking-tight">
              Latest Dispatches
            </h2>
          </div>

          {feedArticles.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-8 text-center">No published articles yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {feedArticles.map(art => (
                <div
                  key={art.id}
                  onClick={() => handleSelectArticle(art)}
                  className="bg-nexus-card border border-nexus-border hover:border-nexus-cyan/40 rounded-xl p-4 flex flex-col h-[340px] cursor-pointer group transition-all"
                >
                  <div className="w-full h-36 bg-nexus-void rounded-lg overflow-hidden border border-nexus-border/60 relative shrink-0">
                    <img
                      src={art.thumbnailUrl || art.imageUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 duration-300 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    {art.isBreaking && (
                      <span className="absolute top-2 left-2 bg-danger-red text-white text-[7px] font-mono font-black py-0.5 px-1.5 rounded uppercase">
                        BREAKING
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 mt-3 flex-grow">
                    <div className="flex justify-between text-[8.5px] font-mono text-gray-500">
                      <span className="text-nexus-cyan uppercase font-bold">{art.category}</span>
                      <span>{art.date}</span>
                    </div>
                    <h4 className="font-serif font-black text-white text-sm line-clamp-2 leading-tight group-hover:text-nexus-cyan group-hover:underline">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-light line-clamp-3">{art.excerpt}</p>
                  </div>
                  <div className="border-t border-nexus-border/60 pt-2 mt-2 flex justify-between text-[8px] font-mono text-gray-500">
                    <span>BY {art.author?.toUpperCase()}</span>
                    <span>{art.readTime}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  };

  const renderAdminStudio = () => {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8 text-left">

        <div className="border-b border-nexus-border pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-nexus-cyan uppercase font-black block">
              EDITORIAL CONTROL ROOM
            </span>
            <h1 className="text-2.5xl sm:text-3.5xl font-serif font-black text-white tracking-tight mt-1">
              Press Studio
            </h1>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-nexus-cyan to-[#0099CC] text-nexus-void font-mono text-[10px] uppercase tracking-widest font-black rounded-lg cursor-pointer shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Quick AI Post</span>
            </button>
            <button
              onClick={() => { setEditingArticle(null); setEditorOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-nexus-cyan text-nexus-cyan hover:bg-nexus-cyan/10 font-mono text-[10px] uppercase tracking-widest font-bold rounded-lg cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Article</span>
            </button>
          </div>
        </div>

        {/* Site Settings */}
        <div className="bg-nexus-panel border border-nexus-border rounded-xl p-5 space-y-4">
          <h3 className="font-serif font-black text-white text-sm uppercase border-b border-nexus-border pb-2 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-nexus-cyan" />
            Site Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 uppercase font-mono font-bold text-[9px] mb-1.5">
                Header Tagline
              </label>
              <input
                type="text"
                value={taglineDraft}
                onChange={e => setTaglineDraft(e.target.value)}
                className="w-full px-3 py-2 bg-nexus-void border border-nexus-border rounded-lg text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 uppercase font-mono font-bold text-[9px] mb-1.5">
                Breaking News Override (leave blank to use article bulletins)
              </label>
              <input
                type="text"
                value={breakingDraft}
                onChange={e => setBreakingDraft(e.target.value)}
                placeholder="Custom scrolling breaking message..."
                className="w-full px-3 py-2 bg-nexus-void border border-nexus-border rounded-lg text-xs text-white focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={saveSiteSettings}
            className="flex items-center gap-1.5 px-4 py-2 bg-nexus-cyan text-nexus-void font-mono text-[10px] uppercase font-black rounded-lg cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>

        {/* Articles management table */}
        <div className="bg-nexus-panel border border-nexus-border rounded-xl p-5 space-y-4">
          <h3 className="font-serif font-black text-white text-sm uppercase border-b border-nexus-border pb-2 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-nexus-cyan" />
            Manage Articles ({articles.length})
          </h3>

          <div className="space-y-2">
            {articles.map(art => (
              <div
                key={art.id}
                className="bg-nexus-card border border-nexus-border rounded-lg p-3 flex items-center gap-3"
              >
                <img
                  src={art.thumbnailUrl || art.imageUrl}
                  alt=""
                  className="w-12 h-12 object-cover rounded border border-nexus-border shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-nexus-cyan uppercase font-bold">{art.category}</span>
                    <span className={`text-[8px] font-mono uppercase font-bold px-1.5 rounded ${
                      art.status === 'published' ? 'text-nexus-green bg-nexus-green/10'
                      : art.status === 'draft' ? 'text-gray-400 bg-gray-700/30'
                      : 'text-nexus-gold bg-nexus-gold/10'
                    }`}>{art.status}</span>
                  </div>
                  <h5 className="text-xs font-serif font-bold text-white truncate">{art.title}</h5>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => { setEditingArticle(art); setEditorOpen(true); }}
                    className="p-1.5 hover:bg-white/10 text-gray-300 rounded cursor-pointer"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(art.id)}
                    className="p-1.5 hover:bg-red-500/10 text-danger-red rounded cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links to admin-enabled resource pages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActivePage('reports')}
            className="bg-nexus-card border border-nexus-border hover:border-nexus-cyan/40 rounded-xl p-5 text-left cursor-pointer flex items-center gap-3"
          >
            <FileText className="w-6 h-6 text-nexus-cyan" />
            <div>
              <h4 className="font-serif font-black text-white text-sm">Manage Reports</h4>
              <p className="text-[11px] text-gray-400 font-light">Add/edit advisory PDF briefings.</p>
            </div>
          </button>
          <button
            onClick={() => setActivePage('downloads')}
            className="bg-nexus-card border border-nexus-border hover:border-nexus-cyan/40 rounded-xl p-5 text-left cursor-pointer flex items-center gap-3"
          >
            <ImageIcon className="w-6 h-6 text-nexus-cyan" />
            <div>
              <h4 className="font-serif font-black text-white text-sm">Manage Downloads</h4>
              <p className="text-[11px] text-gray-400 font-light">Upload or link PDF documents & laws.</p>
            </div>
          </button>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-nexus-void text-white flex flex-col">
      <SEOHead
        title={selectedArticle && activePage === 'article-detail' ? selectedArticle.title : undefined}
        description={selectedArticle && activePage === 'article-detail' ? selectedArticle.metaDescription : undefined}
        imageUrl={selectedArticle && activePage === 'article-detail' ? selectedArticle.imageUrl : undefined}
      />

      <Ticker metrics={metrics} />
      <BreakingNews articles={articles} onSelectArticle={handleSelectArticle} />

      <Header
        activePage={activePage}
        setActivePage={setActivePage}
        isAdminMode={isAdminMode}
        setIsAdminMode={setIsAdminMode}
        articles={articles}
        setSelectedArticle={handleSelectArticle}
      />

      <main className="flex-1">
        {loading ? (
          <div className="py-32 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-nexus-cyan mx-auto mb-2" />
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Loading newsroom...</span>
          </div>
        ) : isAdminMode ? (
          renderAdminStudio()
        ) : (
          renderMainContent()
        )}
      </main>

      <div id="newsletter-subscription">
        <Footer setActivePage={setActivePage} setIsAdminMode={setIsAdminMode} />
      </div>

      <ConsentBanner />
      <FloatingBackToTop />

      {editorOpen && (
        <ArticleEditor
          article={editingArticle}
          onClose={() => setEditorOpen(false)}
          onSaveSuccess={fetchArticles}
          articlesPool={articles}
        />
      )}

      {wizardOpen && (
        <QuickPostWizard
          onClose={() => setWizardOpen(false)}
          onSaveSuccess={fetchArticles}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
