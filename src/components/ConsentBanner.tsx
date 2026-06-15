import React, { useState, useEffect } from 'react';
import { Cookie, Check } from 'lucide-react';

export default function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const accepted = localStorage.getItem('ne_cookies_accepted');
    if (!accepted) {
      // Small delayed appearance for smooth UX
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
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-md md:right-4 z-50 bg-secondary-navy text-white p-5 rounded-lg border border-accent-gold/20 shadow-2xl animate-fade-in text-left">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary-crimson/10 border border-primary-crimson/30 rounded text-accent-gold mt-1">
          <Cookie className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-serif font-bold text-gray-100 flex items-center gap-1.5 leading-snug">
            Regulatory Consent & Cookies
          </h4>
          <p className="text-[12px] leading-relaxed text-gray-300 font-sans mt-1">
            NepalEconomy.com utilizes session logs, site indices, and basic trackers to fulfill global institutional standards while securing transmission lines. No personal data is marketed.
          </p>
          <div className="flex gap-2.5 mt-3 justify-end">
            <button
              onClick={() => setIsVisible(false)}
              className="px-3 py-1.5 hover:bg-white/10 text-gray-200 text-[11px] uppercase tracking-wider font-mono rounded"
            >
              Configure
            </button>
            <button
              onClick={handleAccept}
              className="flex items-center gap-1.5 bg-accent-gold hover:bg-accent-gold/90 text-dark-navy px-4 py-1.5 text-[11px] uppercase tracking-wide font-mono font-bold rounded shadow transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
              <span>Accept Cookies</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
