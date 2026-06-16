import React, { useState, useEffect } from 'react';
import { Search, Menu, X, ShieldCheck, Database, KeyRound, Clock, Activity, FileText, RefreshCw } from 'lucide-react';
import { Article } from '../types';
import { useToast } from './ToastContext';

interface HeaderProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;
  articles: Article[];
  setSelectedArticle: (article: Article) => void;
}

export default function Header({
  activePage,
  setActivePage,
  isAdminMode,
  setIsAdminMode,
  articles,
  setSelectedArticle,
}: HeaderProps) {
  const { addToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Search state (Section 9 specs: searches across articles, reports, downloads)
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ articles: any[]; reports: any[]; media: any[] }>({
    articles: [],
    reports: [],
    media: []
  });
  const [searchLoading, setSearchLoading] = useState(false);

  // Administrative Passkey Gate States (Section 1 specifications)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [siteTagline, setSiteTagline] = useState(() => localStorage.getItem('ne_site_tagline') || "NEPAL'S BUSINESS INTELLIGENCE HUB");

  useEffect(() => {
    const checkTagline = () => {
      const current = localStorage.getItem('ne_site_tagline') || "NEPAL'S BUSINESS INTELLIGENCE HUB";
      if (current !== siteTagline) {
        setSiteTagline(current);
      }
    };
    const interval = setInterval(checkTagline, 1000);
    return () => clearInterval(interval);
  }, [siteTagline]);

  // Handle Search Input in real-time GET /api/search?q=[query]
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults({ articles: [], reports: [], media: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const payload = await res.json();
          setSearchResults(payload);
        }
      } catch (err) {
        console.warn('Combined search failed', err);
      } finally {
        setSearchLoading(false);
      }
    }, 150);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const menuItems = [
    { id: 'home', label: 'Home' },
    { id: 'economy', label: 'Economy' },
    { id: 'business', label: 'Business' },
    { id: 'reports', label: 'Reports & Data' },
    { id: 'downloads', label: 'Downloads' },
    { id: 'policy', label: 'Policy & Gov' },
    { id: 'startups', label: 'Startups & Tech' },
    { id: 'global', label: 'Global Nepal' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleAdminGateClick = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      localStorage.removeItem('ne_admin_token');
      addToast('✓ Logged out from Press Studio.', 'info');
      setActivePage('home');
    } else {
      setPasswordModalOpen(true);
      setPasswordInput('');
      setPasswordError('');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('ne_admin_token', `Bearer ${data.token}`);
        setIsAdminMode(true);
        setPasswordModalOpen(false);
        setPasswordInput('');
        addToast('✓ Secure Administrative access verified!', 'success');
      } else {
        setPasswordError(data.error || 'Direct credentials verification failed.');
        addToast('Access denied. Incorrect key.', 'error');
      }
    } catch {
      setPasswordError('Sovereign authentication portal unreachable.');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-nexus-panel text-white shadow-xl border-b-2 border-nexus-cyan select-none pointer-events-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center h-[80px]">
            
            {/* Left: Branding Logo (Geometrical Space Grotesk per Section 1) */}
            <div 
              className="flex flex-col justify-center cursor-pointer text-left bg-transparent" 
              onClick={() => { setActivePage('home'); setIsAdminMode(false); }}
            >
              <div className="flex items-center gap-2">
                <div className="w-[18px] h-[18px] bg-nexus-cyan rounded flex items-center justify-center text-[10px] text-nexus-void font-bold animate-pulse text-center">
                  NE
                </div>
                <span className="text-lg md:text-xl font-serif font-black tracking-tight hover:text-nexus-cyan transition-colors">
                  Nepal<span className="text-nexus-cyan">Economy</span>
                </span>
              </div>
              <div className="h-[1px] bg-nexus-border w-full my-1"></div>
              <span className="text-[9.5px] font-mono tracking-widest uppercase text-nexus-cyan font-black block">
                {siteTagline}
              </span>
            </div>

            {/* Centre: Desktop Menu */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-3.5 select-none">
              {menuItems.map((item) => {
                const isActive = activePage === item.id && !isAdminMode;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id);
                      setIsAdminMode(false);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-[11px] xl:text-[11.5px] font-mono tracking-widest uppercase px-2 xl:px-2.5 py-2 transition-all cursor-pointer font-bold ${
                      isActive
                        ? 'text-nexus-cyan border-b-2 border-nexus-cyan text-cyan-glow'
                        : 'text-gray-400 hover:text-white hover:border-b hover:border-gray-500'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Right toolbar controls */}
            <div className="flex items-center space-x-2.5 select-none shrink-0">
              
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-nexus-cyan transition-colors cursor-pointer"
                title="Full-Text Search"
              >
                <Search className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={handleAdminGateClick}
                className={`flex items-center gap-1.5 px-3 py-1.5 h-8 text-[10px] font-mono uppercase tracking-widest rounded-lg border transition-all cursor-pointer select-none ${
                  isAdminMode
                    ? 'bg-nexus-cyan text-nexus-void border-nexus-cyan font-black shadow-md shadow-cyan-500/10'
                    : 'bg-transparent text-nexus-cyan border-nexus-cyan/40 hover:bg-nexus-cyan/10 font-bold'
                }`}
                title="Press Suite Administration Controller"
              >
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Studio</span>
              </button>

              <button
                onClick={() => {
                  const scrollSection = document.getElementById('newsletter-subscription');
                  if (scrollSection) {
                    scrollSection.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    setActivePage('contact');
                  }
                }}
                className="hidden sm:block bg-gradient-to-r from-nexus-cyan to-[#0099CC] hover:scale-[1.02] text-nexus-void text-[11px] font-mono font-black tracking-widest uppercase h-8 px-4 rounded-lg transition-all cursor-pointer shadow-md select-none"
              >
                SUBSCRIBE
              </button>

              {/* Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Real-time search overlay panel dropdown (Section 9 Specs) */}
        {searchOpen && (
          <div className="bg-[#070B15] border-b border-nexus-cyan/20 px-4 py-3 animate-fade-in relative z-50 overflow-hidden w-full select-none text-left">
            <div className="max-w-3xl mx-auto flex gap-2 w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search indices, hydropower exports, VAT directories, budget deficits..."
                autoFocus
                className="flex-1 px-4 py-2.5 bg-nexus-panel border border-nexus-border focus:border-nexus-cyan rounded-lg text-xs sm:text-xs text-white placeholder-gray-600 focus:outline-none"
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                className="px-4 bg-nexus-cyan text-nexus-void hover:bg-cyan-400 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer shrink-0"
              >
                Close
              </button>
            </div>

            {searchQuery.trim() && (
              <div className="max-w-3xl mx-auto mt-3.5 bg-nexus-card border border-nexus-border rounded-xl shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto no-scrollbar z-50 relative text-left">
                {searchLoading ? (
                  <div className="p-10 text-center select-none">
                    <RefreshCw className="w-6 h-6 animate-spin text-nexus-cyan mx-auto mb-2" />
                    <span className="text-[10.5px] font-mono text-gray-500 uppercase tracking-widest">Searching the logs...</span>
                  </div>
                ) : (
                  <>
                    {/* Articles list response */}
                    {searchResults.articles.length > 0 && (
                      <div className="p-4 border-b border-nexus-border text-left">
                        <span className="text-[9px] font-mono text-nexus-cyan uppercase tracking-widest font-black block select-none mb-2 text-left">Published Dispatches</span>
                        <div className="space-y-2 text-left">
                          {searchResults.articles.map(art => (
                            <div 
                              key={art.id}
                              onClick={() => {
                                setSelectedArticle(art);
                                setActivePage('article-detail');
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="p-2.5 hover:bg-nexus-void rounded-lg cursor-pointer text-left transition-colors flex items-center justify-between"
                            >
                              <div className="min-w-0 text-left">
                                <span className="text-[8px] font-mono text-nexus-gold uppercase bg-nexus-gold/5 px-1 rounded block w-fit mb-0.5">{art.category}</span>
                                <h5 className="font-serif font-black text-white text-xs sm:text-xs truncate">{art.title}</h5>
                              </div>
                              <span className="text-[9px] font-mono text-gray-550 shrink-0 select-none ml-2">{art.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reports list response */}
                    {searchResults.reports.length > 0 && (
                      <div className="p-4 border-b border-nexus-border text-left">
                        <span className="text-[9px] font-mono text-nexus-gold uppercase tracking-widest font-black block select-none mb-2 text-left">Advisory pdf Briefs</span>
                        <div className="space-y-2 text-left">
                          {searchResults.reports.map(rep => (
                            <a 
                              key={rep.id}
                              href={rep.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 hover:bg-nexus-void rounded-lg cursor-pointer text-left transition-colors flex items-center justify-between block"
                            >
                              <div className="min-w-0 text-left flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-danger-red shrink-0" />
                                <h5 className="font-serif font-black text-white text-xs sm:text-xs truncate">{rep.title}</h5>
                              </div>
                              <span className="text-[9px] font-mono text-nexus-gold font-bold shrink-0 block ml-2 uppercase leading-none">{rep.size}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Downloads repository list response */}
                    {searchResults.media.length > 0 && (
                      <div className="p-4 text-left">
                        <span className="text-[9px] font-mono text-gray-550 uppercase tracking-widest font-black block select-none mb-2 text-left">Repository Documents</span>
                        <div className="space-y-2 text-left">
                          {searchResults.media.map(m => (
                            <a 
                              key={m.id}
                              href={m.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 hover:bg-nexus-void rounded-lg cursor-pointer text-left transition-colors flex items-center justify-between block"
                            >
                              <div className="min-w-0 text-left">
                                <span className="text-[8px] font-mono text-nexus-cyan bg-nexus-cyan/5 px-1.5 py-0.2 rounded w-fit block mb-0.5">{m.category?.toUpperCase() || 'GENERAL'}</span>
                                <h5 className="font-sans font-bold text-gray-300 text-xs sm:text-xs truncate">{m.name}</h5>
                              </div>
                              <span className="text-[9px] font-mono text-gray-500 block ml-2 select-none shrink-0">{m.size}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty results state */}
                    {searchResults.articles.length === 0 && searchResults.reports.length === 0 && searchResults.media.length === 0 && (
                      <div className="p-8 text-center max-w-sm mx-auto select-none space-y-2 text-left">
                        <h5 className="font-serif font-black text-white text-sm text-center">No Ratios Registered</h5>
                        <p className="text-[11.5px] leading-relaxed text-gray-400 font-light font-sans text-center">
                          No newsroom reports, statutory PDFs, or assets matched your query "{searchQuery}".
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile drawer header panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden bg-[#0A0F1E]/95 backdrop-blur-sm flex flex-col pt-24 px-6 gap-6 text-left select-none pointer-events-auto">
          <div className="flex flex-col gap-3.5 text-left">
            <span className="text-[9px] font-mono text-nexus-cyan tracking-widest border-b border-nexus-cyan/15 pb-2 text-left block font-black">
              NAVIGATION DESKS
            </span>
            {menuItems.map((item) => {
              const isActive = activePage === item.id && !isAdminMode;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setIsAdminMode(false);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left text-lg font-serif py-1 tracking-wide uppercase transition-colors ${
                    isActive ? 'text-nexus-cyan font-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 mt-4 border-t border-nexus-border/60 pt-5 text-left">
            <button
              onClick={() => {
                handleAdminGateClick();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-transparent border border-nexus-cyan text-nexus-cyan py-2.5 rounded-xl font-mono text-xs uppercase cursor-pointer"
            >
              <Database className="w-4 h-4 shrink-0" />
              <span>Studio Portal</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Verification passkey Gate Modal (NEXUS styled Section 1 specs) */}
      {passwordModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs select-none pointer-events-auto animate-fade-in text-left"
          onClick={() => setPasswordModalOpen(false)}
        >
          <div 
            className="bg-nexus-panel border border-nexus-cyan/35 rounded-xl p-6 md:p-8 w-full max-w-sm shadow-2xl relative text-center mx-4"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPasswordModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center justify-center space-y-1">
              <span className="text-lg md:text-xl font-serif font-black tracking-tight text-white mb-0.5">
                NEPAL<span className="text-nexus-cyan">ECONOMY</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-nexus-cyan uppercase font-black block border-b border-nexus-border pb-3.5 w-full">
                SECURED PUBLISHING GATEWAY
              </span>

              <h4 className="text-[11.5px] leading-snug text-gray-300 font-sans mt-5 select-none font-light">
                This area requires key certificates to change economic surveys or dispatches.
              </h4>

              <form onSubmit={handlePasswordSubmit} className="w-full pt-4 space-y-4 text-xs font-sans">
                <div className="relative text-center">
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="••••••••••••"
                    value={passwordInput}
                    onChange={e => { setPasswordInput(e.target.value); setPasswordError(''); }}
                    className="w-full px-4 py-2.5 bg-nexus-void border border-nexus-border rounded-lg text-center font-mono text-white text-base focus:outline-none"
                  />
                  <KeyRound className="w-4 h-4 text-nexus-cyan opacity-40 absolute right-3 top-3.5" />
                </div>

                {passwordError && (
                  <p className="text-danger-red font-mono text-[9.5px] font-bold">
                    ⚠️ {passwordError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-nexus-cyan hover:bg-cyan-400 text-nexus-void font-mono font-black py-2.5 rounded-lg text-[10px] uppercase tracking-widest transition-all shadow-md select-none cursor-pointer"
                >
                  Verify Certificate
                </button>
              </form>

              <div className="pt-4 text-[9px] text-gray-550 font-mono tracking-wider text-center uppercase select-none w-full border-t border-nexus-border/60">
                SSL AUTHENTICATION LAYER
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
