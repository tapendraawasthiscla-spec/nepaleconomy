import React, { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Building2, Globe, Zap, Leaf, Monitor, ArrowRightLeft } from 'lucide-react';
import SEOHead from './components/SEOHead';
import Header from './components/Header';
import BreakingNews from './components/BreakingNews';
import Footer from './components/Footer';
import ConsentBanner from './components/ConsentBanner';
import FloatingBackToTop from './components/FloatingBackToTop';
import AdminFAB from './components/AdminFAB';
import AdminDashboard from './components/AdminDashboard';
import HeroCarousel from './components/HeroCarousel';

// Modular category view pages
import EconomyPage from './pages/EconomyPage';
import BusinessPage from './pages/BusinessPage';
import PolicyPage from './pages/PolicyPage';
import StartupsPage from './pages/StartupsPage';
import GlobalPage from './pages/GlobalPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ReportsPage from './pages/ReportsPage';
import DownloadsPage from './pages/DownloadsPage';

// Article Detail page
import ArticleDetail from './components/ArticleDetail';

// Core imports & persistence helper scripts
import { Article, MarketMetric, EconomicReport } from './types';
import { 
  getStoredArticles, 
  saveArticles, 
  getStoredMetrics, 
  saveMetrics, 
  getStoredReports, 
  saveReports, 
  INITIAL_RECOMMENDED_SECTORS 
} from './mockData';
import { checkAndAutoPublish } from './utils/autoPublisher';
import { pushDatabaseToCloud } from './utils/persistence';

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [metrics, setMetrics] = useState<MarketMetric[]>([]);
  const [reports, setReports] = useState<EconomicReport[]>([]);
  
  // Navigation Routing States ('home', 'economy', 'business', 'policy', 'startups', 'global', 'about', 'contact', 'reports', 'detail')
  const [activePage, setActivePage] = useState<string>('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Search filter terms
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Admin Mode & sync states (Pioneer custom security alignments)
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'quick' | 'full' | 'settings' | 'comments'>('quick');
  const [tips, setTips] = useState<any[]>([]);
  const [tipsCount, setTipsCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState(() => localStorage.getItem('ne_db_last_saved') ? new Date(localStorage.getItem('ne_db_last_saved')!).toLocaleTimeString('en-US') : 'Never');

  // Load state upon mount
  useEffect(() => {
    const loadedArticles = getStoredArticles();
    const loadedMetrics = getStoredMetrics();
    const loadedReports = getStoredReports();

    setArticles(loadedArticles);
    setMetrics(loadedMetrics);
    setReports(loadedReports);

    // Sync theme
    const storedTheme = localStorage.getItem('ne_theme') || 'light';
    setTheme(storedTheme as 'light' | 'dark');
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Initialize tips counter and local files List
    try {
      const tipsStr = localStorage.getItem('ne_tips') || '[]';
      const parsedTips = JSON.parse(tipsStr);
      if (Array.isArray(parsedTips)) {
        setTips(parsedTips);
        setTipsCount(parsedTips.length);
      }
    } catch {
      setTipsCount(0);
    }

    // Trigger central background publisher daily schedule
    setTimeout(() => {
      checkAndAutoPublish(loadedArticles, setArticles);
    }, 1500);
  }, []);

  // Update theme helper
  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('ne_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Handles adding anonymous tips
  const handleAddTip = (tip: any) => {
    try {
      const currentStr = localStorage.getItem('ne_tips') || '[]';
      const current = JSON.parse(currentStr);
      if (Array.isArray(current)) {
        setTips(current);
        setTipsCount(current.length);
      }
    } catch {
      // Ignore
    }
  };

  // Dedicated force sync engine for sovereignty compliance
  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const timestamp = new Date().toISOString();
      await pushDatabaseToCloud({
        articles,
        reports,
        metrics,
        lastSaved: timestamp
      });
      const localTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setLastSyncedTime(localTime);
      localStorage.setItem('ne_db_last_saved', timestamp);
    } catch (err: any) {
      console.error("Force sync failed:", err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Switch pages or details
  const handleSelectArticle = (art: Article) => {
    setSelectedArticle(art);
    setActivePage('detail');
  };

  const handleSelectCategory = (category: string) => {
    setSelectedArticle(null);
    setSearchQuery('');
    setActivePage(category.toLowerCase());
  };

  const handleBackToNewsroom = () => {
    setSelectedArticle(null);
    setActivePage('home');
  };

  const handleSearchTrigger = (query: string) => {
    setSearchQuery(query);
    setSelectedArticle(null);
    setActivePage('home');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // Filter articles based on category view, and live search box
  const filteredArticles = articles.filter(a => {
    const matchesSearch = !searchQuery.trim() || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Split featured grid list for homepage
  const heroArticle = filteredArticles.find(a => a.isHero) || filteredArticles[0];
  const featuresList = filteredArticles.filter(a => a.id !== (heroArticle ? heroArticle.id : '')).slice(0, 4);

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-bg-ivory dark:bg-dark-navy text-secondary-navy dark:text-gray-150 transition-colors duration-300 flex flex-col font-sans selection:bg-accent-gold/40">
        
        {/* Dynamic SEO Tagging Module */}
        <SEOHead 
          title={
            selectedArticle 
              ? `${selectedArticle.title} | NepalEconomy.com` 
              : activePage === 'home' 
                ? "NepalEconomy.com | Bloomberg-grade business intelligence" 
                : `${activePage.toUpperCase()} | Economic intelligence`
          } 
          description={selectedArticle ? selectedArticle.excerpt : "Authorized macroeconomic tracking, debt monitoring and central reserves indices."} 
        />

        {/* Global responsive brand header */}
        <Header 
          activePage={activePage} 
          setActivePage={(page) => {
            setSelectedArticle(null);
            setSearchQuery('');
            setActivePage(page);
          }} 
          isAdminMode={isAdminMode}
          setIsAdminMode={setIsAdminMode}
          darkMode={theme === 'dark'}
          toggleDarkMode={handleToggleTheme}
          articles={articles}
          setSelectedArticle={handleSelectArticle}
        />

        {/* Breaking News Flash Bar */}
        <BreakingNews articles={articles} onSelectArticle={handleSelectArticle} />

        {/* Main Content Router and Layout */}
        <main className="flex-grow">
          {activePage === 'home' && (
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 font-sans">
              
              {/* Home Main column grid (Span 12) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                
                {/* Left Side: Long-form content, Hero blocks, analysis (Span 8) */}
                <div className="lg:col-span-8 space-y-8 text-left">
                  
                  {/* Search query highlight indicator */}
                  {searchQuery && (
                    <div className="bg-bg-ivory dark:bg-secondary-navy border border-border-warm dark:border-gray-800 p-4 rounded-xl flex items-center justify-between text-xs select-none">
                      <span className="text-gray-500 font-sans">
                        Filtered matches for 💻 <strong className="text-primary-crimson font-serif text-[13px]">"{searchQuery}"</strong> ({filteredArticles.length} results)
                      </span>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-primary-crimson dark:text-accent-gold font-mono uppercase bg-neutral-100 hover:bg-black hover:text-white px-2.5 py-1 rounded border cursor-pointer leading-none font-bold"
                      >
                        Reset Filter
                      </button>
                    </div>
                  )}

                  {/* Primetime Main Hero Carousel */}
                  {!searchQuery && (
                    <HeroCarousel
                      articles={articles}
                      onSelectArticle={handleSelectArticle}
                      onSelectCategory={handleSelectCategory}
                      isAdminMode={isAdminMode}
                      fallbackArticle={heroArticle}
                    />
                  )}

                  {/* Standard featured grid stream */}
                  <div className="space-y-5 text-left pt-2">
                    <h3 className="font-serif font-black text-lg text-secondary-navy dark:text-accent-gold uppercase tracking-tight text-left border-b pb-2 select-none">
                      Latest Articles
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      {featuresList.map((art) => (
                        <div
                          key={art.id}
                          onClick={() => handleSelectArticle(art)}
                          className="group cursor-pointer bg-white dark:bg-secondary-navy rounded-xl border border-border-warm dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-350 text-left flex flex-col justify-between"
                        >
                          <div>
                            {/* Image cover photo */}
                            <div className="w-full h-44 overflow-hidden relative select-none">
                              <img 
                                src={art.imageUrl} 
                                alt="" 
                                className="w-full h-full object-cover group-hover:scale-105 duration-500 transition-transform" 
                                referrerPolicy="no-referrer"
                              />
                              {art.isBreaking && (
                                <span className="absolute top-3 left-3 bg-primary-crimson text-white text-[9.5px] font-mono font-black py-0.5 px-2.5 rounded tracking-wide border border-accent-gold/25 block">
                                  {art.breakingLabel || 'BREAKING'}
                                </span>
                              )}
                            </div>

                            {/* Content descriptions */}
                            <div className="p-5 text-left space-y-2">
                              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 select-none">
                                <span className="font-bold flex items-center gap-1.5 uppercase">
                                  <span>{art.author}</span>
                                </span>
                                <span>{art.date}</span>
                              </div>
                              <h4 className="font-serif font-bold text-[#111] dark:text-gray-100 text-base sm:text-[17px] line-clamp-2 leading-snug group-hover:text-primary-crimson dark:group-hover:text-accent-gold group-hover:underline transition-colors text-left">
                                {art.title}
                              </h4>
                              <p className="text-xs text-text-secondary dark:text-gray-405 font-light line-clamp-2 leading-relaxed text-left">
                                {art.excerpt}
                              </p>
                            </div>
                          </div>

                          <div className="px-5 pb-5 pt-3 border-t border-gray-100 dark:border-gray-855 flex justify-between items-center text-[10.5px] font-mono font-bold select-none text-left">
                            <span className="text-[#5A6475]">{art.readTime}</span>
                            <span className="text-primary-crimson dark:text-accent-gold inline-flex items-center gap-0.5 group-hover:underline">
                              <span>Read Advisory</span>
                              <span className="text-xs transition-transform group-hover:translate-x-0.5">→</span>
                            </span>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Side Column: Trends widgets, sectors, reports (Span 4) */}
                <div className="lg:col-span-4 space-y-8 text-left select-none font-sans">
                  
                  {/* Sector trackers card listing */}
                  <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium animate-fade-in-premium">
                    <h4 className="font-serif font-black text-sm uppercase text-secondary-navy dark:text-accent-gold tracking-tight mb-4 text-left border-b border-border-warm dark:border-gray-850 pb-2">
                      Macro Growth Sectors
                    </h4>

                    <div className="space-y-4 text-left">
                      {INITIAL_RECOMMENDED_SECTORS.map((sec) => (
                        <div key={sec.id} className="flex gap-3 text-left items-start border-none pb-0 text-left font-sans text-xs">
                          <span className="text-lg bg-neutral-150 dark:bg-dark-navy border border-gray-150 p-2.5 rounded-lg shrink-0 select-none flex items-center justify-center text-primary-crimson dark:text-accent-gold">
                            {sec.name === "Banking & Finance" && <Building2 className="w-4 h-4" />}
                            {sec.name === "Tourism & Travel" && <Globe className="w-4 h-4" />}
                            {sec.name === "Hydropower & Grid" && <Zap className="w-4 h-4" />}
                            {sec.name === "Agriculture & Food" && <Leaf className="w-4 h-4" />}
                            {sec.name === "IT Services & SaaS" && <Monitor className="w-4 h-4" />}
                            {sec.name === "Remittance & Flows" && <ArrowRightLeft className="w-4 h-4" />}
                          </span>
                          <div className="space-y-0.5">
                            <h5 className="font-serif font-bold text-secondary-navy dark:text-white leading-none">
                              {sec.name}
                            </h5>
                            <p className="text-[10.5px] leading-relaxed text-gray-500 dark:text-gray-400 font-light font-sans text-left">
                              {sec.stat}
                            </p>
                            <span className="text-[9px] font-mono font-bold text-green-750 bg-green-500/10 px-1.5 py-0.5 rounded inline-block leading-none mt-1 uppercase">
                              {sec.trend}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Publications reports short list */}
                  <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium">
                    <h4 className="font-serif font-black text-sm uppercase text-secondary-navy dark:text-accent-gold tracking-tight mb-4 text-left border-b border-border-warm dark:border-gray-850 pb-2">
                      Recent Reports
                    </h4>

                    <div className="space-y-4 text-left">
                      {reports.slice(0, 2).map((rep) => (
                        <div key={rep.id} className="p-3 bg-bg-ivory dark:bg-dark-navy rounded border border-gray-100 dark:border-gray-855 space-y-1 text-left">
                          <span className="text-[8.5px] font-mono text-gray-400 font-bold block uppercase">{rep.author}</span>
                          <h5 className="font-serif font-bold text-secondary-navy dark:text-white text-xs leading-snug line-clamp-2">
                            {rep.title}
                          </h5>
                          <div className="flex justify-between items-center text-[8.5px] font-mono text-gray-400 mt-1.5 select-none pt-1 border-t border-gray-100/50">
                            <span>{rep.size}</span>
                            <button 
                              onClick={() => setActivePage('reports')}
                              className="text-primary-crimson underline cursor-pointer hover:text-accent-gold font-bold"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => setActivePage('reports')}
                      className="mt-4 w-full bg-secondary-navy hover:bg-black text-white font-mono text-[9.5px] font-bold uppercase tracking-wider py-2 rounded text-center border border-accent-gold/25 cursor-pointer block select-none"
                    >
                      View All Reports
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* Page routers switch map */}
          {activePage === 'economy' && (
            <EconomyPage 
              articles={articles} 
              reports={reports} 
              onSelectArticle={handleSelectArticle} 
              setActivePage={setActivePage}
            />
          )}

          {activePage === 'business' && (
            <BusinessPage 
              articles={articles} 
              onSelectArticle={handleSelectArticle} 
            />
          )}

          {activePage === 'policy' && (
            <PolicyPage 
              articles={articles} 
              onSelectArticle={handleSelectArticle} 
            />
          )}

          {activePage === 'startups' && (
            <StartupsPage 
              articles={articles} 
              onSelectArticle={handleSelectArticle} 
            />
          )}

          {activePage === 'global' && (
            <GlobalPage 
              articles={articles} 
              onSelectArticle={handleSelectArticle} 
            />
          )}

          {activePage === 'about' && (
            <AboutPage />
          )}

          {activePage === 'contact' && (
            <ContactPage onAddTip={handleAddTip} />
          )}

          {activePage === 'reports' && (
            <ReportsPage reports={reports} setReports={setReports} />
          )}

          {activePage === 'downloads' && (
            <DownloadsPage isAdminMode={isAdminMode} />
          )}

          {activePage === 'detail' && selectedArticle && (
            <ArticleDetail 
              article={selectedArticle} 
              onBack={handleBackToNewsroom} 
              onSelectCategory={handleSelectCategory}
              relatedArticles={articles.filter(a => a.category === selectedArticle.category && a.id !== selectedArticle.id)}
              onSelectArticle={handleSelectArticle}
            />
          )}
        </main>

        {/* Global Footer */}
        <Footer 
          setActivePage={(page) => {
            setSelectedArticle(null);
            setSearchQuery('');
            setActivePage(page);
          }}
          setIsAdminMode={setIsAdminMode}
        />

        {/* Regulatory Cookie Consent Banner */}
        <ConsentBanner />

        {/* Float core run to top trigger */}
        <FloatingBackToTop />

        {/* Administrative FAB trigger controls */}
        {isAdminMode && (
          <AdminFAB 
            articles={articles}
            setArticles={setArticles}
            metrics={metrics}
            setMetrics={setMetrics}
            onNavigateToTab={(tab) => {
              setActiveAdminTab(tab);
              const container = document.getElementById('admin-dashboard-container');
              if (container) {
                container.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />
        )}

        {/* Full Admin Center Manager Dashboard */}
        {isAdminMode && (
          <div id="admin-dashboard-container">
            <AdminDashboard 
              articles={articles} 
              setArticles={setArticles}
              metrics={metrics}
              setMetrics={setMetrics}
              reports={reports}
              setReports={setReports}
              tips={tips}
              onLogout={() => setIsAdminMode(false)}
              isSyncing={isSyncing}
              lastSyncedTime={lastSyncedTime}
              onForceSync={handleForceSync}
              activeAdminTab={activeAdminTab}
              setActiveAdminTab={setActiveAdminTab}
            />
          </div>
        )}

      </div>
    </HelmetProvider>
  );
}
