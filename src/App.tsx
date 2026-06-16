import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, KeyRound, Database, PlusCircle, LayoutGrid, Sparkles,
  RefreshCw, Trash2, Edit3, Clipboard, HelpCircle, Users, Mail, BellRing
} from 'lucide-react';

// Contexts & Components
import { ToastProvider, useToast } from './components/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ConsentBanner from './components/ConsentBanner';
import FloatingBackToTop from './components/FloatingBackToTop';
import SEOHead from './components/SEOHead';

// Core Widgets (Section 5, 6, 7 specs)
import RatingTicker from './components/Ticker';
import BreakingNews from './components/BreakingNews';
import CommandCenterHero from './components/CommandCenterHero';
import NEPSEWidget from './components/NEPSEWidget';
import InteractiveChart from './components/InteractiveChart';

// Modals / Editors (Section 3 & 8 specs)
import ArticleEditor from './components/ArticleEditor';
import QuickPostWizard from './components/QuickPostWizard';

// Article Viewer (Section 12 specs)
import ArticleDetail from './components/ArticleDetail';

// Pages
import CategoryPage from './pages/CategoryPage';
import ReportsPage from './pages/ReportsPage';
import DownloadsPage from './pages/DownloadsPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';

import { Article } from './types';
import { INITIAL_METRICS } from './mockData';

function MainLayout() {
  const { addToast } = useToast();

  // Basic Routing state
  const [activePage, setActivePage] = useState<string>('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Administrative Authority (conforms strictly with passkey #nepal2024 rules)
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return !!localStorage.getItem('ne_admin_token');
  });

  // Database Arrays
  const [articles, setArticles] = useState<Article[]>([]);
  const [dbLoading, setDbLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<any[]>(INITIAL_METRICS);
  
  // Editorial Stats Counts
  const [stats, setStats] = useState({
    articlesCount: 0,
    tipsCount: 0,
    subscribersCount: 0
  });

  // Editor states (Slide Overs)
  const [artEditorOpen, setArtEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  
  // Custom Post Wizard state (Section 8 specs)
  const [quickPostOpen, setQuickPostOpen] = useState(false);

  // Client-side search filters for home list
  const [homeFeedQuery, setHomeFeedQuery] = useState('');
  const [customTaglineInput, setCustomTaglineInput] = useState(() => localStorage.getItem('ne_site_tagline') || "NEPAL'S BUSINESS INTELLIGENCE HUB");

  // Fetch full records indices from backend
  const fetchArticles = async () => {
    try {
      setDbLoading(true);
      const res = await fetch('/api/articles');
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      } else {
        addToast(`Failed to load intelligence ledger indexes. Server status: ${res.status}`, 'error');
      }
    } catch (err: any) {
      addToast('Express financial data indices unreachable. Check network status.', 'error');
      console.warn("Express data indices unreachable. Falling back into mock data assemblies:", err.message);
    } finally {
      setDbLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': localStorage.getItem('ne_admin_token') || '' }
      });
      if (res.ok) {
        const payload = await res.json();
        setStats(payload.stats);
      }
    } catch {
      // Swollow silently
    }
  };

  // Fetch dynamic macroeconomic tickers and indexes
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
      console.warn("Express economic key-metrics unreachable.");
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Poll updates every 5 minutes to keep tickers live
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchArticles();
    if (isAdminMode) {
      fetchStats();
    }
  }, [isAdminMode]);

  // Handle Tagline modifications
  const handleSaveTagline = () => {
    const val = customTaglineInput.trim().toUpperCase();
    if (val) {
      localStorage.setItem('ne_site_tagline', val);
      addToast('✓ Corporate tagline index customized successfully!', 'success');
    }
  };

  // Administrative Delete operation (sends command to back-end JSON compiler)
  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Retrieve and delete this dispatch permanently from corporate archives?')) return;
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': localStorage.getItem('ne_admin_token') || ''
        }
      });
      if (res.ok) {
        setArticles(prev => prev.filter(item => item.id !== id));
        addToast('✓ Dispatch wiped from database archives successfully.', 'success');
        if (selectedArticle?.id === id) {
          setActivePage('home');
        }
      }
    } catch {
      addToast('Wipe command rejected.', 'error');
    }
  };

  // Duplicate Articles trigger (Section 3 instructions: copy slug and append Copy suffix)
  const handleDuplicateArticle = async (sourceArt: Article) => {
    addToast('Duplicating dispatch records...', 'info');
    const duplicated: Article = {
      ...sourceArt,
      id: `art-dup-${Date.now()}`,
      title: `${sourceArt.title} (Copy)`,
      slug: `${sourceArt.slug}-copy`,
      views: 0,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      status: 'draft' // defaults copies to draft safety
    };

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('ne_admin_token') || ''
        },
        body: JSON.stringify(duplicated)
      });
      if (res.ok) {
        setArticles(prev => [duplicated, ...prev]);
        addToast('✓ Dispatch cloned as Draft copies success!', 'success');
      }
    } catch {
      addToast('Cloning error.', 'error');
    }
  };

  // Open Editor Overlay helper
  const triggerEdit = (art: Article) => {
    setEditingArticle(art);
    setArtEditorOpen(true);
  };

  const triggerCreateNew = () => {
    setEditingArticle(null);
    setArtEditorOpen(true);
  };

  // Filter public articles (hides drafts & schedules unless isAdminMode is active)
  const activeArticlesPool = articles.filter(art => {
    if (isAdminMode) return true;
    return art.status === 'published' || !art.status;
  });

  // Recent feed search sorting
  const recentArticlesList = activeArticlesPool.filter(art => {
    const q = homeFeedQuery.toLowerCase().trim();
    if (!q) return true;
    return art.title.toLowerCase().includes(q) || art.category.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex flex-col justify-between font-sans selection:bg-nexus-cyan selection:text-nexus-void relative overflow-hidden transition-colors">
      
      {/* Background radial lines and grid */}
      <div className="absolute inset-0 bg-[#0A0F1E] bg-[linear-gradient(to_right,#1f29370f_1px,transparent_1px),linear-gradient(to_bottom,#1f29370f_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none select-none z-0" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-nexus-cyan/5 via-transparent to-transparent pointer-events-none z-0" />

      {/* Dynamic SEO Tag injections based on active page / reading article */}
      <SEOHead 
        title={activePage === 'article-detail' && selectedArticle ? selectedArticle.title : undefined}
        description={activePage === 'article-detail' && selectedArticle ? selectedArticle.excerpt : undefined}
      />

      {/* Scrolling index strip representing live metrics */}
      <RatingTicker metrics={metrics} />

      {/* Header Sticky nav */}
      <Header 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isAdminMode={isAdminMode} 
        setIsAdminMode={setIsAdminMode}
        articles={activeArticlesPool}
        setSelectedArticle={setSelectedArticle}
      />

      {/* Breaking Flash Alert Ticker */}
      <BreakingNews articles={activeArticlesPool} onSelectArticle={(art) => { setSelectedArticle(art); setActivePage('article-detail'); }} />

      {/* Administrative Control Strip Dashboard */}
      {isAdminMode && (
        <div className="bg-[#0C1222] border-b border-nexus-cyan/45 px-4 md:px-6 py-4 relative z-10 animate-fade-in select-none">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
            
            <div className="flex flex-wrap items-center gap-4 text-left font-sans">
              <span className="flex items-center gap-1.5 text-[10.5px] font-mono uppercase bg-nexus-cyan/15 text-nexus-cyan px-2.5 py-1 rounded-md border border-nexus-cyan/30">
                <ShieldCheck className="w-4 h-4 text-nexus-cyan" />
                <span>NEPALECONOMY PORTAL ADMIN ACTIVE</span>
              </span>

              {/* Quick stats totals */}
              <div className="flex gap-4 text-[10.5px] font-mono text-gray-400 font-bold items-center leading-none">
                <span>DATABASE: <strong className="text-white">{stats.articlesCount || articles.length}</strong> dispatches</span>
                <span>•</span>
                <span>TIPS RECEIVED: <strong className="text-danger-red">{stats.tipsCount || 0} Swiss tips</strong></span>
                <span>•</span>
                <span>SUBSCRIBERS: <strong className="text-nexus-gold">{stats.subscribersCount || 0} roster</strong></span>
              </div>
            </div>

            {/* Admin actions triggers */}
            <div className="flex flex-wrap items-center gap-2 select-none shrink-0 h-9">
              
              {/* Tagline customizer inline input */}
              <div className="hidden xl:flex items-center gap-1 opacity-90">
                <input 
                  type="text" 
                  value={customTaglineInput}
                  onChange={e => setCustomTaglineInput(e.target.value)}
                  placeholder="Tagline override..."
                  className="px-2 h-7 rounded border border-nexus-border bg-nexus-void text-[10px] text-nexus-cyan uppercase font-mono max-w-[170px]"
                />
                <button 
                  onClick={handleSaveTagline}
                  className="px-2 h-7 bg-nexus-cyan hover:bg-cyan-400 text-nexus-void rounded font-mono text-[9px] uppercase font-bold cursor-pointer"
                >
                  Save
                </button>
              </div>

              <button
                onClick={triggerCreateNew}
                className="px-3 py-1.5 bg-[#121A28] hover:bg-nexus-cyan/15 border border-nexus-cyan/35 text-nexus-cyan rounded-lg font-mono text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1"
                title="Surgical Article Creator"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Create Article</span>
              </button>

              <button
                onClick={() => setQuickPostOpen(true)}
                className="px-3 py-1.5 bg-nexus-cyan hover:bg-cyan-400 text-nexus-void rounded-lg font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1"
                title="Rapid prompt-to-publish wizard"
              >
                <Sparkles className="w-4 h-4 animate-spin text-nexus-void" />
                <span>+ Rapid Post Wizard</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MAIN BODY CONTENTS CORE ROUTER */}
      <main className="flex-1 relative z-10 w-full">
        
        {dbLoading ? (
          <div className="py-24 text-center select-none font-sans">
            <RefreshCw className="w-9 h-9 animate-spin text-nexus-cyan mx-auto mb-3" />
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest leading-none">Accessing central banking server indices...</span>
          </div>
        ) : (
          <>
            {/* ── 1. PORTAL HOMEPAGE ────────────────────────────────────────── */}
            {activePage === 'home' && (
              <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8 text-left animate-fade-in relative z-10">
                
                {/* Featured CommandCenterHero (Section 7 specs, 65% / 35% hero list grid) */}
                <CommandCenterHero 
                  articles={activeArticlesPool} 
                  onSelectArticle={(art) => { setSelectedArticle(art); setActivePage('article-detail'); }} 
                  onSelectCategory={(cat) => {
                    const id = cat.toLowerCase();
                    if (['economy', 'business', 'policy', 'startups', 'global'].includes(id)) {
                      setActivePage(id);
                    } else {
                      setActivePage('home');
                    }
                  }}
                  isAdminMode={isAdminMode}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 text-left items-start">
                  
                  {/* Left Column Feed Lists (8 cols) */}
                  <div className="lg:col-span-8 space-y-6 text-left">
                    
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-nexus-border pb-3.5 select-none text-left leading-none">
                      <div className="text-left font-sans">
                        <span className="text-[9.5px] font-mono tracking-widest text-nexus-cyan uppercase font-black block">RECENT RESEARCH DIARY</span>
                        <h2 className="text-sm sm:text-base font-serif font-black text-white uppercase mt-0.5 leading-none font-serif text-left">
                          Verified News briefs Feed
                        </h2>
                      </div>

                      <div className="relative max-w-xs flex-1">
                        <input 
                          type="text"
                          value={homeFeedQuery}
                          onChange={e => setHomeFeedQuery(e.target.value)}
                          placeholder="Filter feed headlines..."
                          className="w-full px-3 py-1.5 bg-nexus-void border border-[#1b263b] rounded-lg text-xs text-white focus:outline-none placeholder-gray-650"
                        />
                      </div>
                    </div>

                    {/* Feed lists */}
                    {recentArticlesList.length === 0 ? (
                      <p className="text-xs text-gray-500 italic select-none">No active research dispatches in current logs indices.</p>
                    ) : (
                      <div className="space-y-4 text-left font-sans text-xs">
                        {recentArticlesList.map((art) => {
                          const isDraft = art.status === 'draft';
                          const isScheduled = art.status === 'scheduled';

                          return (
                            <div 
                              key={art.id}
                              className={`bg-nexus-card border border-nexus-border/60 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-stretch justify-between hover:border-nexus-cyan/35 transition-colors text-left relative ${
                                isDraft ? 'border-dashed border-gray-600' : ''
                              }`}
                            >
                              <div
                                onClick={() => { setSelectedArticle(art); setActivePage('article-detail'); }}
                                className="flex gap-4 items-start cursor-pointer text-left flex-1 min-w-0"
                              >
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-nexus-void rounded-lg overflow-hidden shrink-0 border border-nexus-border/50 relative select-none">
                                  <img 
                                    src={art.thumbnailUrl || art.imageUrl} 
                                    alt="" 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>

                                <div className="space-y-1.5 min-w-0 flex-1 text-left leading-none">
                                  <div className="flex items-center gap-2 select-none leading-none text-left">
                                    <span className="text-[8.5px] font-mono font-black text-nexus-cyan bg-nexus-cyan/10 px-1.5 py-0.2 rounded uppercase">
                                      {art.category}
                                    </span>
                                    
                                    {isDraft && <span className="bg-gray-700 text-gray-300 text-[8px] font-mono px-1 py-0.2 rounded font-bold uppercase select-none">DRAFT</span>}
                                    {isScheduled && <span className="bg-nexus-gold/15 text-nexus-gold border border-nexus-gold/30 text-[8px] font-mono px-1 py-0.2 rounded font-bold uppercase select-none">SCHED</span>}

                                    <span className="text-[9px] font-mono text-gray-550 block select-none leading-none pt-0.5">{art.date}</span>
                                  </div>

                                  <h4 className="font-serif font-black text-white text-xs sm:text-sm line-clamp-2 leading-snug text-left hover:text-nexus-cyan hover:underline font-serif">
                                    {art.title}
                                  </h4>

                                  <p className="text-[11px] leading-relaxed text-gray-450 font-light font-sans line-clamp-1 max-w-xl text-left">
                                    {art.excerpt}
                                  </p>
                                </div>
                              </div>

                              {/* Admin quick triggers on Home lists */}
                              {isAdminMode && (
                                <div className="sm:border-l sm:border-nexus-border/60 sm:pl-3.5 flex sm:flex-col justify-end gap-1.5 shrink-0 select-none items-center h-full pt-2 sm:pt-0">
                                  <button
                                    onClick={() => triggerEdit(art)}
                                    className="p-1 px-[7px] bg-white/5 border border-nexus-border text-gray-400 hover:text-white rounded text-[10px] cursor-pointer font-mono font-bold"
                                    title="Edit dispatch override parameters"
                                  >
                                    EDIT
                                  </button>
                                  
                                  <button
                                    onClick={() => handleDuplicateArticle(art)}
                                    className="p-1 px-[7px] bg-white/5 border border-nexus-border text-gray-400 hover:text-nexus-cyan rounded text-[10px] cursor-pointer font-mono font-bold"
                                    title="Duplicate copies as Draft safety"
                                  >
                                    CLONE
                                  </button>

                                  <button
                                    onClick={() => handleDeleteArticle(art.id)}
                                    className="p-1 px-[7px] bg-red-500/10 border border-red-500/20 text-danger-red hover:bg-red-500 hover:text-white rounded text-[10px] cursor-pointer font-mono font-bold"
                                    title="Archive delete"
                                  >
                                    DEL
                                  </button>
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>

                  {/* Right Column Bento Widgets container (4 cols, Section 5 & 6 specs) */}
                  <div className="lg:col-span-4 space-y-6 text-left select-none">
                    
                    {/* Live NEPSE Index sparkline */}
                    <NEPSEWidget />

                    {/* Interactive macroeconomic indicators chart */}
                    <InteractiveChart />

                    {/* Non blocking secure notification newsletter bento card */}
                    <div id="newsletter-subscription" className="bg-[#0E1527] border border-nexus-border p-5 rounded-2xl text-left relative overflow-hidden shadow-premium">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-nexus-cyan/5 to-transparent pointer-events-none" />
                      
                      <span className="bg-nexus-cyan/15 text-nexus-cyan font-mono text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded border border-nexus-cyan/35 select-none mb-3 inline-block leading-none">
                        CIRCULAR INDEX LISTS
                      </span>
                      
                      <h4 className="font-serif font-black text-sm text-white uppercase leading-tight tracking-tight text-left font-serif select-none mt-1">
                        Sovereign circular circulars
                      </h4>
                      <p className="text-[11.5px] leading-relaxed text-gray-400 font-sans font-light mt-2 mb-3.5 text-left">
                        Receive daily summaries regarding central bank discount rates circulars, FDI permits updates, and newly parsed tax guidelines directly to your inbox.
                      </p>

                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const mail = (e.currentTarget.elements.namedItem('mail-input') as HTMLInputElement).value;
                          if (mail && mail.includes('@')) {
                            const res = await fetch('/api/subscribe', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: mail.trim() })
                            });
                            if (res.ok) {
                              addToast('✓ Added circular email successfully!', 'success');
                              e.currentTarget.reset();
                            }
                          }
                        }}
                        className="flex gap-1.5 select-none w-full"
                      >
                        <input 
                          type="email"
                          name="mail-input"
                          required
                          placeholder="director@nrb.gov.np"
                          className="flex-1 px-3 h-8 bg-nexus-void border border-[#1b263b] rounded-lg text-xs text-white focus:outline-none placeholder-gray-650"
                        />
                        <button
                          type="submit"
                          className="bg-[#121A28] border border-nexus-border text-nexus-cyan hover:border-nexus-cyan font-mono text-[9.5px] font-black uppercase tracking-wider px-3 h-8 rounded-lg transition-all shrink-0 cursor-pointer text-center"
                        >
                          Join
                        </button>
                      </form>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ── 2. CATEGORICAL ROUTER VIEWS ───────────────────────────────── */}
            {activePage === 'economy' && (
              <CategoryPage categoryName="Economy" articles={activeArticlesPool} onSelectArticle={(art) => { setSelectedArticle(art); setActivePage('article-detail'); }} />
            )}

            {activePage === 'business' && (
              <CategoryPage categoryName="Business" articles={activeArticlesPool} onSelectArticle={(art) => { setSelectedArticle(art); setActivePage('article-detail'); }} />
            )}

            {activePage === 'policy' && (
              <CategoryPage categoryName="Policy" articles={activeArticlesPool} onSelectArticle={(art) => { setSelectedArticle(art); setActivePage('article-detail'); }} />
            )}

            {activePage === 'startups' && (
              <CategoryPage categoryName="Startups" articles={activeArticlesPool} onSelectArticle={(art) => { setSelectedArticle(art); setActivePage('article-detail'); }} />
            )}

            {activePage === 'global' && (
              <CategoryPage categoryName="Global" articles={activeArticlesPool} onSelectArticle={(art) => { setSelectedArticle(art); setActivePage('article-detail'); }} />
            )}

            {/* ── 3. ADVISORY REPORTS VIEW ──────────────────────────────────── */}
            {activePage === 'reports' && (
              <ReportsPage isAdminMode={isAdminMode} />
            )}

            {/* ── 4. LEGISLATIVE DOWNLOADS VIEW ─────────────────────────────── */}
            {activePage === 'downloads' && (
              <DownloadsPage isAdminMode={isAdminMode} />
            )}

            {/* ── 5. DECOUPLED WHISTLEBLOWING CONTACT VIEW ──────────────────── */}
            {activePage === 'contact' && (
              <ContactPage />
            )}

            {/* ── 6. MISSION ABOUT VIEW ─────────────────────────────────────── */}
            {activePage === 'about' && (
              <AboutPage />
            )}

            {/* ── 7. DETAILED DISPATCH VIEWER ────────────────────────────────── */}
            {activePage === 'article-detail' && selectedArticle && (
              <ArticleDetail 
                article={selectedArticle} 
                onBack={() => setActivePage('home')}
                onSelectCategory={(cat) => {
                  const id = cat.toLowerCase();
                  if (['economy', 'business', 'policy', 'startups', 'global'].includes(id)) {
                    setActivePage(id);
                  } else {
                    setActivePage('home');
                  }
                }}
                relatedArticles={activeArticlesPool.filter(art => art.id !== selectedArticle.id && art.category === selectedArticle.category)}
                onSelectArticle={(art) => setSelectedArticle(art)}
              />
            )}
          </>
        )}

      </main>

      {/* Slide-over full form compiler editor overlay */}
      {artEditorOpen && (
        <ArticleEditor 
          article={editingArticle}
          onClose={() => { setArtEditorOpen(false); setEditingArticle(null); }}
          onSaveSuccess={() => { fetchArticles(); }}
          articlesPool={articles}
        />
      )}

      {/* 3-step rapid publishing wizard overlay */}
      {quickPostOpen && (
        <QuickPostWizard 
          onClose={() => setQuickPostOpen(false)}
          onSaveSuccess={() => { fetchArticles(); }}
        />
      )}

      {/* Footer desks links */}
      <Footer setActivePage={setActivePage} setIsAdminMode={setIsAdminMode} />

      {/* Cookies verification drawers consent */}
      <ConsentBanner />

      {/* Return to peak scrolling anchor */}
      <FloatingBackToTop />

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainLayout />
    </ToastProvider>
  );
}
