import React, { useState, useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import { Article } from '../types';

interface BreakingNewsProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export default function BreakingNews({ articles, onSelectArticle }: BreakingNewsProps) {
  const [overrideText, setOverrideText] = useState(() => localStorage.getItem('ne_breaking_news_override') || '');

  useEffect(() => {
    const handleStorageChange = () => {
      setOverrideText(localStorage.getItem('ne_breaking_news_override') || '');
    };
    handleStorageChange();
    const interval = setInterval(handleStorageChange, 1000);
    return () => clearInterval(interval);
  }, []);

  const breakingArticles = articles.filter(a => a.isBreaking === true && a.status === 'published');
  const activeArticles = breakingArticles.length > 0 
    ? breakingArticles 
    : [...articles]
        .filter(a => a.status === 'published')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

  if (activeArticles.length === 0 && !overrideText) {
    return null;
  }

  return (
    <div className="w-full bg-[#0D1526] text-white py-2 px-4 shadow-sm border-b border-nexus-border flex items-center relative overflow-hidden h-[38px] select-none text-left" id="ne-breaking-alert-bar">
      <style>{`
        @keyframes customBreakingMarquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .breaking-marquee-wrap {
          display: flex;
          width: max-content;
          animation: customBreakingMarquee 25s linear infinite;
        }
        .breaking-marquee-wrap:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-xs z-10 gap-3 relative h-full">
        {/* Flashing Breaking Badge */}
        <div className="flex items-center gap-1.5 text-danger-red font-serif font-black tracking-widest text-[10px] sm:text-[11px] uppercase bg-danger-red/10 border border-danger-red/35 px-2.5 py-0.5 rounded-lg shrink-0 leading-none select-none animate-pulse">
          <Newspaper className="w-3.5 h-3.5" />
          <span>BREAKING</span>
        </div>

        <div className="flex-grow overflow-hidden relative flex items-center h-full mx-2 font-sans font-light text-gray-250">
          {overrideText ? (
            <div className="breaking-marquee-wrap flex items-center">
              <div className="flex items-center gap-4 pr-16 shrink-0">
                <span>{overrideText}</span>
              </div>
              <div className="flex items-center gap-4 pr-16 shrink-0" aria-hidden="true">
                <span>{overrideText}</span>
              </div>
            </div>
          ) : (
            <div className="breaking-marquee-wrap flex items-center text-left">
              <div className="flex items-center gap-16 pr-16 shrink-0 text-left">
                {activeArticles.map((art) => {
                  const label = art.breakingLabel || "BULLETIN";
                  return (
                    <div 
                      key={`first-break-${art.id}`}
                      onClick={() => onSelectArticle(art)}
                      className="cursor-pointer hover:text-nexus-cyan hover:underline hover:scale-[1.01] transition-all flex items-center gap-2.5 shrink-0 text-left"
                    >
                      <span className="text-nexus-gold text-[9px] font-mono uppercase bg-nexus-gold/10 px-1.5 py-0.2 rounded border border-nexus-gold/30 tracking-wider font-extrabold shrink-0">
                        {label}
                      </span>
                      <span className="font-semibold tracking-wide text-xs">{art.title}</span>
                    </div>
                  );
                })}
              </div>
              {/* Duplicate loops for continuous scrolling */}
              <div className="flex items-center gap-16 pr-16 shrink-0 text-left" aria-hidden="true">
                {activeArticles.map((art) => {
                  const label = art.breakingLabel || "BULLETIN";
                  return (
                    <div 
                      key={`dup-break-${art.id}`}
                      onClick={() => onSelectArticle(art)}
                      className="cursor-pointer hover:text-nexus-cyan hover:underline hover:scale-[1.01] transition-all flex items-center gap-2.5 shrink-0 text-left"
                    >
                      <span className="text-nexus-gold text-[9px] font-mono uppercase bg-nexus-gold/10 px-1.5 py-0.2 rounded border border-nexus-gold/30 tracking-wider font-extrabold shrink-0">
                        {label}
                      </span>
                      <span className="font-semibold tracking-wide text-xs">{art.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
