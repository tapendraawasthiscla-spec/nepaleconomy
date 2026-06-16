import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube, Instagram, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  setActivePage: (page: string) => void;
  setIsAdminMode: (mode: boolean) => void;
}

export default function Footer({ setActivePage, setIsAdminMode }: FooterProps) {
  const triggerPage = (pageName: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActivePage(pageName);
    setIsAdminMode(false);
  };

  return (
    <footer className="bg-dark-navy text-white text-sans border-t-2 border-accent-gold/40 mt-12 relative z-10 select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        
        {/* Core Quad Grid turned to 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-left">
          
          {/* Column 1: About us links & Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => triggerPage('home')}>
              <span className="text-xl font-serif font-bold text-white hover:text-accent-gold transition-colors duration-150">
                NepalEconomy<span className="text-primary-crimson font-sans">.com</span>
              </span>
              <span className="text-lg">🇳🇵</span>
            </div>
            
            <p className="text-[13px] leading-relaxed text-gray-300 font-sans font-light">
              Nepal's Most Trusted Voice in Business and Economy. Delivering economic index details, hydropower transaction charts, and regulatory review models since 2024.
            </p>

            <ul className="space-y-2 text-[13px] text-gray-300 pt-2 font-mono">
              <li>
                <button onClick={() => triggerPage('home')} className="hover:text-accent-gold hover:underline transition-colors cursor-pointer text-left font-bold">
                  Home Portal
                </button>
              </li>
              <li>
                <button onClick={() => triggerPage('economy')} className="hover:text-accent-gold hover:underline transition-colors cursor-pointer text-left font-bold">
                  Macro Economy
                </button>
              </li>
              <li>
                <button onClick={() => triggerPage('reports')} className="hover:text-accent-gold hover:underline transition-colors cursor-pointer text-left font-bold">
                  Downloadable Reports
                </button>
              </li>
              <li>
                <button onClick={() => triggerPage('downloads')} className="hover:text-accent-gold hover:underline transition-colors cursor-pointer text-left font-bold">
                  Downloads &amp; Legal Docs
                </button>
              </li>
              <li>
                <button onClick={() => triggerPage('about')} className="hover:text-accent-gold hover:underline transition-colors cursor-pointer text-left font-bold">
                  About Our Desk
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Category links */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase font-mono tracking-wider text-accent-gold border-b border-accent-gold/20 pb-2 font-bold">
              Category Links
            </h4>
            <ul className="space-y-2 text-[13px] text-gray-300 font-sans font-light">
              <li><button onClick={() => triggerPage('business')} className="hover:text-accent-gold transition-colors text-left cursor-pointer">Hydropower Exports</button></li>
              <li><button onClick={() => triggerPage('business')} className="hover:text-accent-gold transition-colors text-left cursor-pointer">Commercial Banking Stability</button></li>
              <li><button onClick={() => triggerPage('business')} className="hover:text-accent-gold transition-colors text-left cursor-pointer">Terai Cold-Storage Grid</button></li>
              <li><button onClick={() => triggerPage('global')} className="hover:text-accent-gold transition-colors text-left cursor-pointer">Diaspora NRN Capital</button></li>
              <li><button onClick={() => triggerPage('startups')} className="hover:text-accent-gold transition-colors text-left cursor-pointer">Kathmandu Venture Pipelines</button></li>
              <li><button onClick={() => triggerPage('economy')} className="hover:text-accent-gold transition-colors text-left cursor-pointer">Trade Balance Index</button></li>
            </ul>
          </div>

          {/* Column 3: Contact & Social */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase font-mono tracking-wider text-accent-gold border-b border-accent-gold/20 pb-2 font-bold">
              Contact & Social
            </h4>
            <div className="space-y-2.5 text-[13px] text-gray-300 font-sans font-light">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-accent-gold shrink-0 mt-0.5" />
                <span>Level-4 National Stock House, Kathmandu, Nepal</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent-gold shrink-0" />
                <span>intelligence@nepaleconomy.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent-gold shrink-0" />
                <span>+977 (1) 420-1928</span>
              </div>
            </div>

            {/* Social Icons Stacked inside column */}
            <div className="flex items-center gap-3 pt-1">
              <a href="#" className="p-1.5 bg-secondary-navy hover:bg-accent-gold rounded text-white hover:text-dark-navy transition-colors duration-200" title="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-1.5 bg-secondary-navy hover:bg-accent-gold rounded text-white hover:text-dark-navy transition-colors duration-200" title="Twitter/X">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-1.5 bg-secondary-navy hover:bg-accent-gold rounded text-white hover:text-dark-navy transition-colors duration-200" title="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="p-1.5 bg-secondary-navy hover:bg-accent-gold rounded text-white hover:text-dark-navy transition-colors duration-200" title="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#" className="p-1.5 bg-secondary-navy hover:bg-accent-gold rounded text-white hover:text-dark-navy transition-colors duration-200" title="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button 
                onClick={() => triggerPage('contact')} 
                className="inline-flex items-center gap-1.5 bg-primary-crimson hover:bg-primary-crimson/95 text-xs text-white px-3 py-2 rounded-md font-mono uppercase tracking-wider font-bold transition-all w-fit cursor-pointer"
              >
                <span>Send a News Tip</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <div className="inline-flex items-center gap-1.5 text-gray-400 text-[10px] font-mono select-none">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                <span>SSL SECURE ENCRYPTED PROXY</span>
              </div>
            </div>
          </div>

        </div>

        {/* Middle Press Mentions Section: As seen in */}
        <div className="mt-12 pt-6 border-t border-accent-gold/10 text-center space-y-4 select-none">
          <p className="text-[11px] font-mono text-accent-gold tracking-widest uppercase font-bold">
            REGULARLY CITED BY PRESTIGIOUS PUBLICATIONS
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-14 text-sm font-serif font-semibold tracking-wide opacity-50 text-gray-300">
            <span className="hover:text-accent-gold transition-colors">THE HIMALAYAN TIMES</span>
            <span className="hover:text-accent-gold transition-colors">KANTIPUR INTELLIGENCE</span>
            <span className="hover:text-accent-gold transition-colors">REPUBLICA MONETARY</span>
            <span className="font-sans hover:text-accent-gold transition-colors text-xs tracking-widest uppercase text-gray-250">ECONOMIST NEPAL</span>
          </div>
        </div>

        {/* Bottom copyright strip */}
        <div className="mt-12 pt-6 border-t border-accent-gold/15 flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] text-gray-400 font-sans">
          
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <span>© 2026 NepalEconomy.com. All Rights Reserved.</span>
            <span className="text-accent-gold/60">|</span>
            <button onClick={() => triggerPage('about')} className="hover:text-accent-gold transition-colors cursor-pointer bg-transparent border-none p-0 text-gray-400 text-[12px]">Corrections Policy</button>
            <span className="text-accent-gold/60">|</span>
            <button onClick={() => triggerPage('about')} className="hover:text-accent-gold transition-colors cursor-pointer bg-transparent border-none p-0 text-gray-400 text-[12px]">Privacy Policy</button>
            <span className="text-accent-gold/60">|</span>
            <button onClick={() => triggerPage('about')} className="hover:text-accent-gold transition-colors cursor-pointer bg-transparent border-none p-0 text-gray-400 text-[12px]">Editorial Code</button>
          </div>

          <div className="text-accent-gold text-center font-mono text-[10px] sm:text-[11px] tracking-wide font-bold">
            Dedicated to Nepal's Economic Growth.
          </div>
        </div>

      </div>
    </footer>
  );
}
