import React, { useState, useEffect } from 'react';
import { BellRing } from 'lucide-react';
import { Article } from '../types';

interface BreakingNewsProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export default function BreakingNews({ articles, onSelectArticle }: BreakingNewsProps) {
  const [overrideText, setOverrideText] = useState(() => localStorage.getItem('ne_breaking_news_override') || '');

  useEffect(() => {
    // Monitor localStorage for breaking news overrides reactively
    const handleStorageChange = () => {
      setOverrideText(localStorage.getItem('ne_breaking_news_override') || '');
    };
    handleStorageChange();
    const interval = setInterval(handleStorageChange, 1000);
    return () => clearInterval(interval);
  }, []);

  const breakingArticles = articles.filter(a => a.isBreaking === true);
  const activeArticles = breakingArticles.length > 0 
    ? breakingArticles 
    : [...articles]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 2);

  if (activeArticles.length === 0 && !overrideText) {
    return null;
  }

  // Calculate dynamic duration based on lengths
  let textLength = 0;
  if (overrideText) {
    textLength = overrideText.length * 2 + 50;
  } else {
    activeArticles.forEach(art => {
      const label = art.breakingLabel || "BREAKING";
      textLength += label.length + art.title.length + 30;
    });
    // Double it since we render it twice for loop
    textLength = textLength * 2;
  }

  // Roughly 1 second per 10 characters, minimum 15 seconds
  const duration = Math.max(15, Math.ceil(textLength / 18));

  return (
    <div className="w-full bg-gradient-to-r from-primary-crimson to-[#8B0000] text-gray-100 py-2.5 px-4 shadow-sm select-none border-b border-accent-gold/20 flex items-center relative overflow-hidden h-[42px]" id="ne-breaking-bar">
      {/* Light glow lines in BG */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none"></div>

      <style>{`
        @keyframes neMarquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .ne-marquee-container {
          display: flex;
          width: max-content;
          animation: neMarquee ${duration}s linear infinite;
        }
        .ne-marquee-container:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-xs sm:text-xs z-10 gap-3 relative h-full">
        {/* Center scrolling ticker */}
        <div className="flex-grow overflow-hidden relative flex items-center h-full mx-2">
          {overrideText ? (
            <div className="ne-marquee-container font-sans font-semibold tracking-wide text-gray-100 flex items-center">
              <div className="flex items-center gap-4 pr-12 shrink-0">
                <span className="text-accent-gold font-mono uppercase text-[9px] bg-black/35 px-1.5 py-0.5 rounded tracking-wide font-bold shrink-0">
                  ALERT
                </span>
                <span>{overrideText}</span>
              </div>
              <div className="flex items-center gap-4 pr-12 shrink-0" aria-hidden="true">
                <span className="text-accent-gold font-mono uppercase text-[9px] bg-black/35 px-1.5 py-0.5 rounded tracking-wide font-bold shrink-0">
                  ALERT
                </span>
                <span>{overrideText}</span>
              </div>
            </div>
          ) : (
            <div className="ne-marquee-container font-sans text-gray-100 flex items-center">
              {/* First block */}
              <div className="flex items-center gap-12 pr-12 shrink-0">
                {activeArticles.map((art) => {
                  const label = art.breakingLabel || "BREAKING";
                  return (
                    <div 
                      key={`first-${art.id}`}
                      onClick={() => onSelectArticle(art)}
                      className="cursor-pointer hover:text-accent-gold hover:underline flex items-center gap-2.5 shrink-0"
                    >
                      <span className="text-accent-gold font-mono uppercase text-[9px] bg-black/35 px-1.5 py-0.5 rounded tracking-widest font-extrabold border border-accent-gold/20 shrink-0">
                        {label}
                      </span>
                      <span className="font-semibold tracking-wide">{art.title}</span>
                    </div>
                  );
                })}
              </div>
              {/* Second duplicated block for seamless scroll looping */}
              <div className="flex items-center gap-12 pr-12 shrink-0" aria-hidden="true">
                {activeArticles.map((art) => {
                  const label = art.breakingLabel || "BREAKING";
                  return (
                    <div 
                      key={`dup-${art.id}`}
                      onClick={() => onSelectArticle(art)}
                      className="cursor-pointer hover:text-accent-gold hover:underline flex items-center gap-2.5 shrink-0"
                    >
                      <span className="text-accent-gold font-mono uppercase text-[9px] bg-black/35 px-1.5 py-0.5 rounded tracking-widest font-extrabold border border-accent-gold/20 shrink-0">
                        {label}
                      </span>
                      <span className="font-semibold tracking-wide">{art.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Side Indicator (Large screens only) */}
        <div className="hidden md:flex items-center gap-1.5 text-[9.5px] text-accent-gold font-mono font-bold select-none shrink-0 border-l border-white/20 pl-3">
          <BellRing className="w-3 h-3 text-accent-gold" />
          <span className="tracking-widest">BRIEFINGS</span>
        </div>
      </div>
    </div>
  );
}
