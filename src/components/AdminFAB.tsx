import React, { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, TrendingUp, TrendingDown, AlertTriangle, Settings, RefreshCw, Sparkles, Check } from 'lucide-react';
import { Article, MarketMetric, ArticleCategory } from '../types';

interface AdminFABProps {
  articles: Article[];
  setArticles: (articles: Article[]) => void;
  metrics: MarketMetric[];
  setMetrics: (metrics: MarketMetric[]) => void;
  onNavigateToTab: (tab: 'quick' | 'full' | 'settings' | 'comments') => void;
}

export default function AdminFAB({
  articles,
  setArticles,
  metrics,
  setMetrics,
  onNavigateToTab
}: AdminFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDrawer, setOpenDrawer] = useState<'quick' | 'metrics' | 'breaking' | null>(null);

  // Unread comments count state
  const [unreadCount, setUnreadCount] = useState(0);

  // Quick Post Form States
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<ArticleCategory>('Economy');
  const [quickSummary, setQuickSummary] = useState('');
  const [quickIsBreaking, setQuickIsBreaking] = useState(false);
  const [quickBreakingLabel, setQuickBreakingLabel] = useState('');
  
  // Quick Post Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local Metrics State (for Drawer 2)
  const [localMetrics, setLocalMetrics] = useState<MarketMetric[]>([]);

  // Newsletter Admin Reference local states
  const [adminNewsletterEmail, setAdminNewsletterEmail] = useState('');
  const [adminNewsletterSuccess, setAdminNewsletterSuccess] = useState(false);
  const [adminNewsletterSubmitting, setAdminNewsletterSubmitting] = useState(false);

  // Calculate unread count automatically
  const calculateUnreadComments = () => {
    let count = 0;
    try {
      const readIds: string[] = JSON.parse(localStorage.getItem('ne_read_comment_ids') || '[]');
      articles.forEach(art => {
        const stor = localStorage.getItem(`ne_comments_${art.id}`);
        if (stor) {
          const commentsList = JSON.parse(stor);
          if (Array.isArray(commentsList)) {
            commentsList.forEach((c: any) => {
              if (c.id && !readIds.includes(c.id)) {
                count++;
              }
            });
          }
        }
      });
    } catch (e) {
      console.error(e);
    }
    setUnreadCount(count);
  };

  useEffect(() => {
    calculateUnreadComments();

    window.addEventListener('ne_comments_read_updated', calculateUnreadComments);
    window.addEventListener('storage', calculateUnreadComments);

    return () => {
      window.removeEventListener('ne_comments_read_updated', calculateUnreadComments);
      window.removeEventListener('storage', calculateUnreadComments);
    };
  }, [articles]);

  // Load metrics to local state whenever metrics drawer opens
  useEffect(() => {
    if (openDrawer === 'metrics') {
      setLocalMetrics(metrics.map(m => ({ ...m })));
    }
  }, [openDrawer, metrics]);

  // Collapse menu on outside click
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Submit Handler for Mobile Quick Post
  const handleFABPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickSummary.trim()) {
      setError("Please enter both a title and a summary.");
      return;
    }

    const activeBreakingCount = articles.filter(art => art.isBreaking).length;
    if (quickIsBreaking && activeBreakingCount >= 3) {
      setError("Maximum 3 breaking stories allowed. Remove one first.");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setGenerationStep("Drafting report summary...");

      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: quickTitle.trim(), category: quickCategory }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error ${response.status}`);
      }

      const data = await response.json();
      const generatedContent = data.content || '';
      const generatedExcerpt = data.excerpt || '';

      setGenerationStep("Analyzing and indexing read metrics...");
      const wordCount = generatedContent.trim().split(/\s+/).filter(Boolean).length;
      const calcReadTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

      const unsplashMap: Record<ArticleCategory, string> = {
        Economy: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80",
        Business: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80",
        Policy: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
        Startups: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80",
        Global: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600&auto=format&fit=crop&q=80"
      };
      const mappedImage = unsplashMap[quickCategory] || unsplashMap.Economy;

      const finalAuthorName = localStorage.getItem('ne_admin_author_name') || "NepalEconomy Editorial Desk";
      const finalAuthorTitle = localStorage.getItem('ne_admin_author_title') || "Senior Economic Analyst";

      const newArticleObj: Article = {
        id: `art-${Date.now()}`,
        title: quickTitle.trim(),
        excerpt: generatedExcerpt || quickSummary.trim(),
        content: generatedContent,
        category: quickCategory,
        author: finalAuthorName,
        authorTitle: finalAuthorTitle,
        authorImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        readTime: calcReadTime,
        imageUrl: mappedImage,
        views: 121,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        sources: ['Nepal Central Statistics Agency Registry', 'Trade Port Clearances Hub', 'Sovereign Advisory Press'],
        isBreaking: quickIsBreaking,
        breakingLabel: quickIsBreaking ? (quickBreakingLabel.trim() || "BREAKING") : undefined
      };

      const updatedArticles = [newArticleObj, ...articles];
      setArticles(updatedArticles);
      localStorage.setItem('ne_articles', JSON.stringify(updatedArticles));

      setIsGenerating(false);
      setSuccess(true);
      setQuickTitle('');
      setQuickSummary('');
      setQuickIsBreaking(false);
      setQuickBreakingLabel('');

      setTimeout(() => {
        setSuccess(false);
        setOpenDrawer(null);
      }, 1500);

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate quick article copy.");
      setIsGenerating(false);
    }
  };

  // Save Metrics updates in drawer 2
  const handleSaveMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedMetrics = localMetrics.map(m => ({
      ...m,
      lastUpdated: m.id === '3' ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : m.lastUpdated || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      lastUpdatedMs: Date.now()
    }));
    setMetrics(updatedMetrics);
    
    // Quick success animation
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setOpenDrawer(null);
    }, 1200);
  };

  // Toggle Breaking state directly (Drawer 3)
  const handleToggleBreaking = (id: string, currentlyBreaking: boolean) => {
    const activeBreakingCount = articles.filter(a => a.isBreaking).length;
    if (!currentlyBreaking && activeBreakingCount >= 3) {
      alert("Maximum 3 breaking stories allowed. Turn off another story first.");
      return;
    }

    const updated = articles.map(art => {
      if (art.id === id) {
        const state = !art.isBreaking;
        return {
          ...art,
          isBreaking: state,
          breakingLabel: state ? (art.breakingLabel || 'BREAKING') : undefined
        };
      }
      return art;
    });

    setArticles(updated);
    localStorage.setItem('ne_articles', JSON.stringify(updated));
  };

  return (
    <div className="font-sans text-left" ref={containerRef}>
      <style>{`
        @keyframes fab-pulse {
          0%, 90%, 100% {
            transform: scale(1);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15);
          }
          93% {
            transform: scale(1.12);
            box-shadow: 0 0 20px rgba(192, 0, 26, 0.8);
          }
          96% {
            transform: scale(0.95);
          }
          98% {
            transform: scale(1.05);
          }
        }
        .animate-fab-pulse {
          animation: fab-pulse 30s infinite;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Floating Backdrop covering content when cluster is expanded */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-transparent z-[990]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div className="fixed z-[1000] bottom-6 right-6 flex flex-col items-end gap-3.5">
        
        {/* Expanded Upward Mini Cluster */}
        {isOpen && (
          <div className="flex flex-col items-end gap-3 mb-2">
            
            {/* Button 4: Settings */}
            <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0ms' }}>
              <span className="bg-secondary-navy dark:bg-dark-navy text-white text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded shadow-md border border-gray-800">
                Settings
              </span>
              <button
                type="button"
                onClick={() => {
                  onNavigateToTab('settings');
                  setIsOpen(false);
                }}
                className="w-10 h-10 bg-neutral-550 dark:bg-gray-750 hover:bg-neutral-600 border border-gray-400/20 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                title="Settings"
                style={{ backgroundColor: '#6B7280' }}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Button 3: Breaking News */}
            <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '50ms' }}>
              <span className="bg-secondary-navy dark:bg-dark-navy text-white text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded shadow-md border border-gray-800">
                Set Breaking
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpenDrawer('breaking');
                  setIsOpen(false);
                }}
                className="w-10 h-10 bg-red-650 hover:bg-red-700 border border-red-500/20 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                style={{ backgroundColor: '#dc2626' }}
                title="Set Breaking News"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            </div>

            {/* Button 2: Update Metrics */}
            <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <span className="bg-secondary-navy dark:bg-dark-navy text-white text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded shadow-md border border-gray-800">
                Update Metrics
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpenDrawer('metrics');
                  setIsOpen(false);
                }}
                className="w-10 h-10 bg-blue-650 hover:bg-blue-700 border border-blue-500/20 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                style={{ backgroundColor: '#2563eb' }}
                title="Update Metrics"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>

            {/* Button 1: Quick Post */}
            <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '150ms' }}>
              <span className="bg-secondary-navy dark:bg-dark-navy text-white text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded shadow-md border border-gray-800">
                Quick Post
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpenDrawer('quick');
                  setIsOpen(false);
                }}
                className="w-10 h-10 hover:opacity-90 border border-amber-500/20 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                style={{ backgroundColor: '#D4AF37' }}
                title="Quick Post"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* Primary Circular Interactive Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 bg-primary-crimson hover:bg-primary-crimson/95 text-white rounded-full flex items-center justify-center relative focus:outline-none cursor-pointer transform hover:scale-105 active:scale-95 transition-all shadow-xl z-[1001] ${!isOpen ? 'animate-fab-pulse' : ''}`}
        >
          <Plus className={`w-6 h-6 font-bold duration-300 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
          
          {/* Unread feedback badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent-gold text-secondary-navy font-mono font-black text-[10px] w-5.5 h-5.5 rounded-full flex items-center justify-center shadow border border-white animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* BOTTOM DRAWERS SYSTEM */}
      {openDrawer && (
        <div className="font-sans text-left">
          {/* Drawer Dimmer Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1050] transition-opacity"
            onClick={() => setOpenDrawer(null)}
          />

          {/* Core Sliding Container Sheet */}
          <div 
            className="fixed inset-x-0 bottom-0 bg-bg-ivory dark:bg-dark-navy rounded-t-2xl z-[1060] flex flex-col max-h-[85vh] shadow-[0_-15px_30px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-out translate-y-0 animate-slide-up border-t-4 border-primary-crimson"
          >
            {/* Drawer Header Toolbar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-warm dark:border-gray-800 bg-white dark:bg-secondary-navy rounded-t-xl text-left">
              <div className="text-left">
                <h4 className="font-serif font-black text-sm text-secondary-navy dark:text-accent-gold uppercase tracking-tight text-left">
                  {openDrawer === 'quick' && "New Article"}
                  {openDrawer === 'metrics' && "Update Market Data"}
                  {openDrawer === 'breaking' && "Breaking News"}
                </h4>
                <p className="text-[10px] text-gray-500 font-mono tracking-wider uppercase mt-0.5 text-left">
                  {openDrawer === 'quick' && "AI-Powered Article Generator"}
                  {openDrawer === 'metrics' && "Edit live economic indicators"}
                  {openDrawer === 'breaking' && "Toggle which stories appear in the breaking news bar"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenDrawer(null)}
                className="p-1 px-2 hover:bg-neutral-100 dark:hover:bg-dark-navy duration-200 text-gray-500 hover:text-red-500 rounded font-bold cursor-pointer text-xs"
              >
                ✕ Close
              </button>
            </div>

            {/* Scrollable Document area */}
            <div className="p-5 overflow-y-auto flex-1 font-sans text-xs text-left">
              
              {/* DRAWER 1: QUICK POST FORM */}
              {openDrawer === 'quick' && (
                <div className="space-y-4 text-left">
                  {success ? (
                    <div className="p-8 text-center space-y-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                        ✓
                      </div>
                      <h5 className="font-serif font-bold text-emerald-900 dark:text-emerald-400 text-sm">
                        Article Published
                      </h5>
                      <p className="text-xs text-emerald-700 dark:text-emerald-305 leading-relaxed">
                        Your article is now live on the homepage.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleFABPublish} className="space-y-4 text-left">
                      {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-950/35 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-lg">
                          {error}
                        </div>
                      )}

                      <div>
                        <label className="block text-secondary-navy dark:text-gray-300 font-bold uppercase font-mono text-[9px] mb-1">
                          Article Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={quickTitle}
                          onChange={(e) => setQuickTitle(e.target.value)}
                          placeholder="e.g., Hydropower Export Revenues Set New Record"
                          className="w-full px-3 py-2 bg-white dark:bg-secondary-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold text-secondary-navy dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-secondary-navy dark:text-gray-300 font-bold uppercase font-mono text-[9px] mb-1">
                          Category / Sector *
                        </label>
                        <select
                          value={quickCategory}
                          onChange={(e) => setQuickCategory(e.target.value as ArticleCategory)}
                          className="w-full px-3 py-2 bg-white dark:bg-secondary-navy border border-border-warm dark:border-gray-755 text-xs rounded font-bold focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                        >
                          <option value="Economy">Economy</option>
                          <option value="Business">Business</option>
                          <option value="Policy">Policy</option>
                          <option value="Startups">Startups</option>
                          <option value="Global">Global</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-secondary-navy dark:text-gray-300 font-bold uppercase font-mono text-[9px] mb-1 font-bold">
                          Summary *
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={quickSummary}
                          onChange={(e) => setQuickSummary(e.target.value)}
                          placeholder="Summarize the key facts. Gemini will expand this into a full article."
                          className="w-full px-3 py-2 bg-white dark:bg-secondary-navy border border-border-warm dark:border-gray-755 text-xs rounded focus:outline-none focus:border-accent-gold text-gray-800 dark:text-white"
                        />
                      </div>

                      {/* Breaking toggle */}
                      <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-950/30 p-3.5 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-bold text-[9px] select-none text-left">
                              Mark as Breaking News
                            </span>
                            <span className="text-[9.5px] text-gray-500 font-sans block mt-0.5 text-left">
                              Displays this story in the breaking news bar at the top of the page.
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={quickIsBreaking}
                            onChange={(e) => setQuickIsBreaking(e.target.checked)}
                            className="w-4 h-4 text-primary-crimson focus:ring-primary-crimson border-gray-300 rounded cursor-pointer"
                          />
                        </div>

                        {quickIsBreaking && (
                          <div className="pt-2 animate-fade-in text-left">
                            <label className="block text-primary-crimson dark:text-red-405 font-mono text-[8.5px] uppercase font-bold tracking-wider mb-1 text-left">
                              Custom alert label (optional, e.g. TARIFF ALERT)
                            </label>
                            <input
                              type="text"
                              value={quickBreakingLabel}
                              onChange={(e) => setQuickBreakingLabel(e.target.value)}
                              placeholder="e.g., TARIFF ALERT"
                              className="w-full px-2 py-1.5 bg-white dark:bg-secondary-navy border border-red-200 dark:border-red-900/30 text-[11px] rounded focus:outline-none focus:border-primary-crimson text-gray-800 dark:text-white font-mono uppercase tracking-wider font-bold"
                            />
                          </div>
                        )}
                      </div>

                      {isGenerating ? (
                        <div className="p-4 bg-accent-gold/10 border border-accent-gold/40 text-center rounded-lg space-y-2">
                          <RefreshCw className="w-5 h-5 text-primary-crimson animate-spin mx-auto" />
                          <span className="text-[10px] font-mono uppercase text-secondary-navy dark:text-gray-200 block font-bold tracking-wider animate-pulse">
                            {generationStep}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="submit"
                          className="w-full bg-primary-crimson hover:bg-primary-crimson/90 text-white font-mono uppercase font-bold tracking-wider py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs font-semibold"
                        >
                          <Sparkles className="w-4 h-4 text-accent-gold" />
                          <span>Generate & Publish Article</span>
                        </button>
                      )}
                    </form>
                  )}

                  {/* ADMIN REFERENCE NEWSLETTER WIDGET */}
                  <div className="mt-8 pt-6 border-t border-dashed border-border-warm dark:border-gray-800 text-left">
                    <div className="bg-white dark:bg-secondary-navy p-5 rounded-xl border-2 border-accent-gold shadow-premium text-left">
                      <div className="flex items-center justify-between mb-2 select-none">
                        <span className="text-[9px] font-mono font-bold tracking-widest text-accent-gold bg-secondary-navy dark:bg-dark-navy px-2 py-0.5 rounded border border-accent-gold/20 uppercase">
                          Newsletter Preview
                        </span>
                      </div>
                      <h4 className="font-serif font-black text-secondary-navy dark:text-white text-sm mb-1 text-left">
                        Subscribe to NepalEconomy
                      </h4>
                      <p className="text-xs text-text-secondary dark:text-gray-305 leading-snug mb-4 text-left">
                        Get the latest Nepal business and economic news delivered to your inbox.
                      </p>

                      {adminNewsletterSuccess ? (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded font-mono text-[10px] flex items-center gap-1.5 animate-fade-in uppercase font-bold">
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
                            className="w-full px-3 py-2 text-xs bg-bg-ivory dark:bg-dark-navy text-gray-850 dark:text-white border border-border-warm dark:border-gray-755 rounded focus:outline-none focus:border-accent-gold font-sans"
                          />
                          <button
                            type="submit"
                            disabled={adminNewsletterSubmitting}
                            className="w-full bg-primary-crimson hover:bg-primary-crimson/95 disabled:bg-primary-crimson/50 text-white font-mono uppercase tracking-wider font-extrabold text-[11px] py-3 rounded transition-colors cursor-pointer text-center flex items-center justify-center font-bold"
                          >
                            {adminNewsletterSubmitting ? 'Syncing...' : 'Subscribe Free'}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* DRAWER 2: UPDATE METRICS */}
              {openDrawer === 'metrics' && (
                <form onSubmit={handleSaveMetrics} className="space-y-4">
                  {success ? (
                    <div className="p-8 text-center space-y-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                        ✓
                      </div>
                      <h5 className="font-serif font-bold text-emerald-900 dark:text-emerald-400 text-sm">
                        Market Data Updated
                      </h5>
                      <p className="text-xs text-emerald-700 dark:text-emerald-305 leading-relaxed font-sans">
                        All changes have been saved and are now visible on the site.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-left">
                      <div className="space-y-3 bg-white dark:bg-secondary-navy p-3 rounded-xl border border-gray-150 dark:border-gray-800 text-left">
                        {localMetrics.map((m, idx) => (
                          <div 
                            key={m.id} 
                            className="grid grid-cols-12 gap-3 items-center border-b border-gray-100 dark:border-gray-800 pb-3 last:border-none last:pb-0 font-sans text-left"
                          >
                            <div className="col-span-12 xs:col-span-5 sm:col-span-12 md:col-span-5 flex items-center gap-1.5 text-left">
                              <TrendingUp className="w-4 h-4 text-accent-gold" />
                              <span className="font-bold text-xs text-secondary-navy dark:text-white leading-tight">
                                {m.name}
                              </span>
                            </div>

                            <div className="col-span-5 xs:col-span-3 sm:col-span-5 md:col-span-3">
                              <span className="text-[8.5px] text-gray-400 uppercase font-mono block mb-0.5 text-left">Value</span>
                              <input
                                type="text"
                                value={m.value}
                                onChange={(e) => {
                                  const updated = [...localMetrics];
                                  updated[idx].value = e.target.value;
                                  setLocalMetrics(updated);
                                }}
                                className="w-full px-2 py-1 border border-border-warm dark:border-gray-750 bg-white dark:bg-dark-navy text-xs rounded text-gray-800 dark:text-white font-mono"
                              />
                            </div>

                            <div className="col-span-4 xs:col-span-2 sm:col-span-4 md:col-span-2">
                              <span className="text-[8.5px] text-gray-400 uppercase font-mono block mb-0.5 text-left">Change</span>
                              <input
                                type="text"
                                value={m.change}
                                onChange={(e) => {
                                  const updated = [...localMetrics];
                                  updated[idx].change = e.target.value;
                                  setLocalMetrics(updated);
                                }}
                                className="w-full px-2 py-1 border border-border-warm dark:border-gray-750 bg-white dark:bg-dark-navy text-xs rounded text-gray-800 dark:text-white font-mono"
                              />
                            </div>

                            <div className="col-span-3 xs:col-span-2 sm:col-span-3 md:col-span-2 flex items-end justify-end self-end">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...localMetrics];
                                    updated[idx].isUp = true;
                                    if (!updated[idx].change.startsWith('+')) {
                                      updated[idx].change = '+' + updated[idx].change.replace(/[+-]/g, '');
                                    }
                                    setLocalMetrics(updated);
                                  }}
                                  className={`p-1.5 rounded border cursor-pointer hover:scale-105 duration-150 ${m.isUp ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'}`}
                                  title="Up Direction"
                                >
                                  <TrendingUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...localMetrics];
                                    updated[idx].isUp = false;
                                    if (!updated[idx].change.startsWith('-')) {
                                      updated[idx].change = '-' + updated[idx].change.replace(/[+-]/g, '');
                                    }
                                    setLocalMetrics(updated);
                                  }}
                                  className={`p-1.5 rounded border cursor-pointer hover:scale-105 duration-150 ${!m.isUp ? 'bg-red-500 text-white border-red-600 shadow-sm' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'}`}
                                  title="Down Direction"
                                >
                                  <TrendingDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-primary-crimson hover:bg-primary-crimson/90 text-white font-mono uppercase font-bold tracking-wider py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs font-bold"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save All Changes</span>
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* DRAWER 3: SET BREAKING NEWS */}
              {openDrawer === 'breaking' && (
                <div className="space-y-4 text-left">
                  <div className="border border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10 rounded-lg p-3 text-left">
                    <p className="text-[10px] text-primary-crimson dark:text-red-405 font-sans font-extrabold uppercase text-left">
                      Active Breaking Stories: {articles.filter(a => a.isBreaking).length} / 3 maximum
                    </p>
                    <p className="text-[9.5px] text-gray-500 font-sans mt-0.5 text-left font-light leading-snug">
                      Up to 3 stories can be marked breaking at one time. Toggle stories on or off below.
                    </p>
                  </div>

                  <div className="space-y-2 bg-white dark:bg-secondary-navy rounded-xl p-3 border border-gray-150 dark:border-gray-850">
                    {articles.slice(0, 10).map((art) => {
                      const isBreaking = art.isBreaking === true;
                      return (
                        <div 
                          key={art.id}
                          className="flex items-center justify-between gap-4 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800/60 hover:bg-neutral-50 dark:hover:bg-dark-navy duration-200 text-left"
                        >
                          <div className="flex-1 truncate">
                            <div className="flex items-center gap-1.5 mb-0.5 text-[9px]">
                              <span className="bg-neutral-205 dark:bg-gray-700 text-neutral-700 dark:text-gray-300 px-1 py-0.5 rounded font-mono uppercase tracking-wider font-extrabold">
                                {art.category}
                              </span>
                              <span className="text-gray-400 font-mono">
                                {art.date}
                              </span>
                            </div>
                            <h5 className="font-serif font-bold text-secondary-navy dark:text-white text-xs truncate leading-relaxed">
                              {art.title}
                            </h5>
                          </div>

                          {/* Toggle block */}
                          <button
                            type="button"
                            onClick={() => handleToggleBreaking(art.id, isBreaking)}
                            className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer uppercase ${
                              isBreaking 
                                ? 'bg-primary-crimson border-primary-crimson text-white shadow-sm font-extrabold'
                                : 'bg-gray-50 dark:bg-dark-navy hover:bg-gray-100 border-gray-200 dark:border-gray-700 text-gray-500'
                            }`}
                          >
                            {isBreaking ? "Active" : "Set"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
