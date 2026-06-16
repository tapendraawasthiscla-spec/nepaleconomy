import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check } from 'lucide-react';

export default function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('ne_cookies_accepted');
    if (!accepted) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('ne_cookies_accepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-md md:right-4 z-50 bg-nexus-panel text-white p-5 rounded-xl border border-nexus-border shadow-2xl animate-fade-in text-left pointer-events-auto">
      <div className="flex items-start gap-3 text-left">
        <div className="p-2 bg-nexus-cyan/15 border border-nexus-cyan/35 rounded-lg text-nexus-cyan mt-1 select-none">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        </div>
        <div className="text-left font-sans text-xs">
          <h4 className="text-sm font-serif font-black text-white flex items-center gap-1.5 leading-snug">
            Sovereign Consent & Cookies
          </h4>
          <p className="text-[12px] leading-relaxed text-gray-300 font-sans mt-2.5 text-left font-light">
            NepalEconomy.com utilizes standard local preferences, security sessions, and administrative tokens to deliver secure press features.
          </p>
          <div className="flex gap-2.5 mt-4 justify-end select-none">
            <button
              onClick={() => setIsVisible(false)}
              className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 text-[11px] uppercase tracking-wider font-mono rounded-md cursor-pointer"
            >
              Exempt
            </button>
            <button
              onClick={handleAccept}
              className="flex items-center gap-1.5 bg-nexus-cyan text-nexus-void px-4 py-1.5 text-[11px] uppercase tracking-wide font-mono font-bold rounded-lg shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Consent</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
