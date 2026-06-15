import React, { useState, useEffect } from 'react';
import { Search, Menu, X, ShieldCheck, Sun, Moon, Database } from 'lucide-react';
import { Article } from '../types';

interface HeaderProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  articles: Article[];
  setSelectedArticle: (article: Article) => void;
}

// Custom editorial verification using standard SHA-256 for secure logins
async function verifyPassword(input: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const hashConstant = '62ec8f2f1d70ff70c719c797c8610392bd1be98559a15147a211c4386aae95dd'; // SHA-256 for "nepal2024"
  return hashHex === hashConstant;
}

export default function Header({
  activePage,
  setActivePage,
  isAdminMode,
  setIsAdminMode,
  darkMode,
  toggleDarkMode,
  articles,
  setSelectedArticle,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Administrative password modal validation states
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // State to track reactive localStorage tagline
  const [siteTagline, setSiteTagline] = useState(() => localStorage.getItem('ne_site_tagline') || "NEPAL'S BUSINESS INTELLIGENCE HUB");

  useEffect(() => {
    const checkTagline = () => {
      const current = localStorage.getItem('ne_site_tagline') || "NEPAL'S BUSINESS INTELLIGENCE HUB";
      if (current !== siteTagline) {
        setSiteTagline(current);
      }
    };
    checkTagline();
    const interval = setInterval(checkTagline, 1000);
    return () => clearInterval(interval);
  }, [siteTagline]);

  const menuItems = [
    { id: 'home', label: 'Home' },
    { id: 'economy', label: 'Economy' },
    { id: 'business', label: 'Business' },
    { id: 'reports', label: 'Reports & Data' },
    { id: 'policy', label: 'Policy & Gov' },
    { id: 'startups', label: 'Startups & Tech' },
    { id: 'global', label: 'Global Nepal' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  // Esc key listener to close modals
  useEffect(() => {
    if (!passwordModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPasswordModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [passwordModalOpen]);

  const handleAdminGate = () => {
    if (isAdminMode) {
      // Toggle off directly if already open
      setIsAdminMode(false);
    } else {
      setPasswordModalOpen(true);
      setPasswordInput('');
      setPasswordError('');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isSuccess = await verifyPassword(passwordInput);
    if (isSuccess) {
      setIsAdminMode(true);
      setPasswordModalOpen(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect credentials (password: nepal2024)');
    }
  };

  // Real-time article matching on Search input
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredResults = normalizedQuery
    ? articles.filter((art) => {
        return (
          (art.title?.toLowerCase() || '').includes(normalizedQuery) ||
          (art.excerpt?.toLowerCase() || '').includes(normalizedQuery) ||
          (art.content?.toLowerCase() || '').includes(normalizedQuery) ||
          (art.author?.toLowerCase() || '').includes(normalizedQuery) ||
          (art.category?.toLowerCase() || '').includes(normalizedQuery)
        );
      }).slice(0, 6)
    : [];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-secondary-navy text-secondary-navy dark:text-white shadow-premium border-b-4 border-primary-crimson select-none transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center h-[80px]">
            
            {/* Left Brand Area */}
            <div 
              className="flex flex-col justify-center cursor-pointer" 
              onClick={() => { setActivePage('home'); setIsAdminMode(false); }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl font-serif font-black tracking-tight text-secondary-navy dark:text-white hover:text-primary-crimson transition-colors duration-150">
                  NepalEconomy<span className="text-primary-crimson">.com</span>
                </span>
                <span className="text-xl shrink-0" title="Nepalese National Pride">🇳🇵</span>
                
                {/* Fact checked badge */}
                <div className="hidden lg:flex items-center gap-1 bg-primary-crimson/10 dark:bg-primary-crimson/25 border border-primary-crimson/20 dark:border-primary-crimson/40 text-[10px] text-primary-crimson dark:text-accent-gold px-2.5 py-0.5 rounded-full font-mono font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>FACT-CHECKED INDEPENDENT</span>
                </div>
              </div>
              <div className="h-[1px] bg-primary-crimson/10 dark:bg-accent-gold/30 w-full my-1"></div>
              <span className="text-[10px] md:text-[11px] font-mono tracking-wider uppercase text-primary-crimson dark:text-accent-gold font-bold">
                {siteTagline}
              </span>
            </div>

            {/* Center Navigation links - Desktop */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-4">
              {menuItems.map((item) => {
                const isActive = activePage === item.id && !isAdminMode;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id);
                      setIsAdminMode(false);
                    }}
                    className={`text-[12px] xl:text-[13px] font-mono tracking-wider uppercase px-2.5 xl:px-3 py-2 transition-colors duration-200 cursor-pointer font-bold ${
                      isActive
                        ? 'text-primary-crimson dark:text-accent-gold border-b-2 border-primary-crimson dark:border-accent-gold'
                        : 'text-secondary-navy/80 dark:text-gray-300 hover:text-primary-crimson dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Right Action Widgets */}
            <div className="flex items-center space-x-3">
              {/* Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-secondary-navy/80 dark:text-gray-300 hover:text-primary-crimson dark:hover:text-white transition-colors cursor-pointer"
                title="Search Articles"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-secondary-navy/80 dark:text-gray-300 hover:text-primary-crimson dark:hover:text-white transition-colors duration-250 cursor-pointer"
                title={darkMode ? "Switch to Editorial Paper Theme" : "Switch to Midnight Dark Theme"}
              >
                {darkMode ? <Sun className="w-5 h-5 text-accent-gold" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Admin Portal Button */}
              <button
                onClick={handleAdminGate}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-tight rounded-md border transition-all duration-200 cursor-pointer ${
                  isAdminMode
                    ? 'bg-primary-crimson text-white border-primary-crimson font-extrabold shadow-sm'
                    : 'bg-transparent text-primary-crimson dark:text-accent-gold border-primary-crimson/40 dark:border-accent-gold/40 hover:bg-primary-crimson/5 dark:hover:bg-accent-gold/10 font-bold'
                }`}
                title="Open NepalEconomy Press Studio"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Press Studio</span>
              </button>

              {/* Subscribe button */}
              <button
                onClick={() => {
                  const section = document.getElementById('newsletter-subscription');
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    setActivePage('contact');
                  }
                }}
                className="hidden sm:block bg-primary-crimson hover:bg-primary-crimson/95 hover:scale-[1.02] text-white text-[12px] font-mono font-bold tracking-wider uppercase py-2.5 px-4 rounded-md transition-all duration-150 cursor-pointer shadow-md"
              >
                SUBSCRIBE
              </button>

              {/* Mobile Hamburger toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-secondary-navy/80 dark:text-gray-300 hover:text-primary-crimson dark:hover:text-white transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Floating Search Container */}
        {searchOpen && (
          <div className="bg-secondary-navy px-4 py-3 border-b border-accent-gold/20 animate-fade-in relative z-50">
            <div className="max-w-3xl mx-auto flex gap-2">
              <input
                type="text"
                placeholder="Search inflation, hydropower, FDI, tourism stats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-accent-gold placeholder-gray-400 font-sans text-xs bg-dark-navy border-gray-650 text-white placeholder-gray-450"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="bg-accent-gold text-dark-navy px-4 py-2 rounded-md font-mono font-bold text-xs hover:bg-accent-gold/90 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Dropdown for search results */}
            {normalizedQuery && (
              <div className="max-w-3xl mx-auto mt-2 bg-white dark:bg-dark-navy border border-border-warm dark:border-gray-700 rounded-md shadow-premium overflow-hidden z-50 relative">
                {filteredResults.length > 0 ? (
                  <div className="divide-y divide-border-warm dark:divide-gray-800">
                    {filteredResults.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => {
                          setSelectedArticle(art);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="p-3 hover:bg-bg-ivory dark:hover:bg-secondary-navy cursor-pointer text-left transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-mono font-bold text-primary-crimson uppercase bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                            {art.category}
                          </span>
                          <span className="text-[10px] text-text-secondary dark:text-gray-400 font-mono">
                            by {art.author}
                          </span>
                        </div>
                        <h5 className="font-serif font-bold text-secondary-navy dark:text-white text-xs sm:text-sm line-clamp-1">
                          {art.title}
                        </h5>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-2.5 font-sans max-w-sm mx-auto">
                    <h5 className="font-serif font-black text-secondary-navy dark:text-accent-gold text-sm">
                      No Results Found
                    </h5>
                    <p className="text-[11px] text-text-secondary dark:text-gray-400 leading-relaxed font-light">
                      No articles matched your search for "{searchQuery}". Try different keywords or browse a category.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden bg-dark-navy/95 backdrop-blur-sm flex flex-col pt-24 px-6 gap-6">
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-mono text-accent-gold tracking-widest border-b border-accent-gold/20 pb-2">
              NAVIGATION CHANNELS
            </p>
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
                  className={`text-left text-lg font-serif py-1 tracking-wide ${
                    isActive ? 'text-accent-gold font-bold' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 mt-8 border-t border-accent-gold/20 pt-6">
            <p className="text-[11px] font-mono text-accent-gold tracking-wider">
              FACT-CHECKED & SECURED
            </p>
            <button
              onClick={() => {
                handleAdminGate();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-transparent border border-accent-gold text-accent-gold py-2.5 rounded-md font-mono text-xs uppercase cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>Admin Press Studio</span>
            </button>
            
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const section = document.getElementById('newsletter-subscription');
                if (section) section.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-primary-crimson text-white py-2.5 rounded-md font-mono text-xs uppercase tracking-wider font-bold cursor-pointer"
            >
              SUBSCRIBE TO NEWSLETTER
            </button>
          </div>
        </div>
      )}

      {/* Administrative Password Modal */}
      {passwordModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setPasswordModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-dark-navy border border-accent-gold/45 rounded-xl p-6 md:p-8 w-full max-w-md shadow-premium relative text-center mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPasswordModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-serif font-bold tracking-tight text-secondary-navy dark:text-white mb-1">
                NepalEconomy<span className="text-primary-crimson font-sans">.com</span>
              </span>
              <span className="text-[10px] font-mono tracking-wider uppercase text-accent-gold mb-6">
                SECURE PRESS STUDIO ACCESS
              </span>
              <h3 className="text-xs sm:text-sm font-serif font-bold text-gray-950 dark:text-gray-100 mb-4">
                Enter Administrative Password (nepal2024)
              </h3>
              <form onSubmit={handlePasswordSubmit} className="w-full space-y-4 text-xs font-sans">
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••••••••••••"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  className="w-full px-3 py-2 bg-bg-ivory dark:bg-secondary-navy border border-border-warm dark:border-gray-750 rounded text-center font-mono focus:outline-none focus:border-accent-gold text-gray-950 dark:text-white"
                />
                
                {passwordError && (
                  <p className="text-primary-crimson font-mono text-[10px] font-bold">
                    ⚠️ {passwordError}
                  </p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-primary-crimson hover:bg-primary-crimson/95 text-white font-mono font-bold py-2 rounded text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-md text-center"
                  >
                    Verify Access
                  </button>
                </div>
              </form>
              <div className="mt-4 text-[10px] text-text-secondary dark:text-gray-405 font-mono">
                DEFAULT CAPABILITIES RESTRICTED
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
