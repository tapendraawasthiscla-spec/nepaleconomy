import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Calendar, BookOpen, Clock, Heart, Edit3, Play, Pause } from 'lucide-react';
import { Article } from '../types';

interface CommandCenterHeroProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onSelectCategory: (category: string) => void;
  isAdminMode: boolean;
  fallbackArticle?: Article | null;
}

const ROTATION_INTERVAL_MS = 8000;

export default function CommandCenterHero({
  articles,
  onSelectArticle,
  onSelectCategory,
  isAdminMode,
  fallbackArticle,
}: CommandCenterHeroProps) {
  // Filter for potential hero/featured dispatches
  const publishedArticles = articles.filter(a => a.status === 'published');
  
  // Primary hero pool
  const heroCandidates = publishedArticles.filter(a => a.featuredPosition === 1 || a.isHero === true);
  const secondaryCandidates = publishedArticles.filter(a => a.featuredPosition === 2 || (a.isFeatured === true && !a.isHero));

  // Determine active datasets
  const heroesList = heroCandidates.length > 0 ? heroCandidates : (fallbackArticle ? [fallbackArticle] : publishedArticles.slice(0, 3));
  const sideList = secondaryCandidates.length > 0 ? secondaryCandidates.slice(0, 3) : publishedArticles.filter(a => !heroesList.some(h => h.id === a.id)).slice(0, 3);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(heroesList.length > 1);
  const [isHovered, setIsHovered] = useState(false);

  const activeHero = heroesList[activeIdx % Math.max(heroesList.length, 1)];
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (heroesList.length <= 1) {
      setIsPlaying(false);
      return;
    }

    const TICK_MS = 100;
    const TOTAL_MS = 8000;

    const intervalId = setInterval(() => {
      if (isPlaying && !isHovered) {
        elapsedRef.current += TICK_MS;
        if (elapsedRef.current >= TOTAL_MS) {
          elapsedRef.current = 0;
          setActiveIdx(prev => (prev + 1) % heroesList.length);
        }
      }
    }, TICK_MS);

    return () => clearInterval(intervalId);
  }, [isPlaying, isHovered, heroesList.length]);

  const selectHero = (idx: number) => {
    elapsedRef.current = 0;
    setActiveIdx(idx);
  };

  if (!activeHero) {
    return (
      <div className="w-full h-[350px] bg-nexus-card border border-nexus-border rounded-xl flex flex-col justify-center items-center gap-3 select-none text-left">
        <BookOpen className="w-10 h-10 text-gray-650 animate-pulse" />
        <h4 className="font-serif font-black text-white text-base">Preparing CommandCenter Desks...</h4>
        <p className="text-xs text-gray-500 font-sans">No published dispatches available inside the newsroom index.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch text-left">
      
      {/* Left 65%: Large Featured Interactive Cover Story */}
      <div className="lg:col-span-8 flex flex-col">
        <div 
          onClick={() => onSelectArticle(activeHero)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative flex-1 h-[280px] sm:h-[440px] rounded-xl overflow-hidden border border-nexus-border hover:border-nexus-cyan/45 hover:shadow-2xl hover:shadow-nexus-cyan/5 transition-all duration-300 cursor-pointer flex flex-col justify-end bg-nexus-void select-none"
        >
          {/* Cover full-bleed image background */}
          <div className="absolute inset-0">
            <img 
              src={activeHero.imageUrl} 
              alt={activeHero.title}
              className="w-full h-full object-cover group-hover:scale-[1.015] duration-500 transition-transform pointer-events-none"
              referrerPolicy="no-referrer"
            />
            {/* Multi-layered dense graphic grids and shadows */}
            <div className="absolute inset-0 bg-gradient-to-t from-nexus-void via-nexus-void/40 to-black/10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-nexus-void/25 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="absolute top-4 left-4 z-10 flex gap-2 select-none items-center">
            <span className="bg-nexus-cyan/10 border border-nexus-cyan text-nexus-cyan text-[10px] sm:text-[10px] font-mono font-black uppercase tracking-widest py-1 px-3.5 rounded-lg shadow-md leading-none select-none">
              NEXUS SPECIAL COVER
            </span>
            {activeHero.isBreaking && (
              <span className="bg-danger-red select-none text-nexus-void text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded shadow leading-none font-bold">
                CRITICAL
              </span>
            )}
          </div>

          {/* Inline Admin Indicator */}
          {isAdminMode && (
            <div 
              style={{ background: 'rgba(10, 15, 30, 0.75)' }}
              className="absolute top-4 right-4 z-10 border border-nexus-gold text-nexus-gold text-[9px] font-mono px-3 py-1.5 rounded-lg flex items-center gap-1 shadow select-none"
              title="Carousel Slot Control active under metadata presets"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>CAROUSEL ENTAIL</span>
            </div>
          )}

          {/* Details abstract at bottom card */}
          <div className="p-6 md:p-8 space-y-3 z-10 cursor-pointer select-text text-left">
            <div className="flex items-center gap-2.5 select-none text-left">
              <button
                onClick={(e) => { e.stopPropagation(); onSelectCategory(activeHero.category); }}
                className="px-2.5 py-0.5 text-[9.5px] font-mono font-black uppercase bg-nexus-cyan text-nexus-void rounded-md tracking-wider leading-none"
              >
                {activeHero.category}
              </button>
              <div className="text-[10.5px] text-gray-400 font-mono tracking-tight flex items-center gap-1 font-bold">
                <Clock className="w-3.5 h-3.5 text-nexus-cyan shrink-0" />
                <span>By {activeHero.author} • {activeHero.readTime}</span>
              </div>
            </div>

            <h2 className="font-serif font-black text-xl sm:text-3.5xl text-white leading-tight tracking-tight mt-1 text-left select-none font-serif hover:text-nexus-cyan hover:underline transition-colors duration-200">
              {activeHero.title}
            </h2>

            <p className="text-xs sm:text-[13.5px] text-gray-300 max-w-2xl leading-relaxed text-left font-light font-sans line-clamp-2 select-none">
              {activeHero.excerpt}
            </p>

            <div className="pt-2 select-none text-left flex items-center gap-2 text-xs font-mono font-bold text-nexus-cyan group-hover:underline">
              <span>Read Full Analysis</span>
              <span className="group-hover:translate-x-1 duration-150 transition-transform">→</span>
            </div>
          </div>

          {/* Dot controllers indicators */}
          {heroesList.length > 1 && (
            <div className="absolute bottom-4 right-6 z-25 flex gap-3.5 items-center select-none bg-nexus-void/50 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-white/5 shadow-md">
              <button
                id="hero-autoplay-toggle"
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setIsPlaying(prev => {
                    if (!prev) {
                      elapsedRef.current = 0;
                    }
                    return !prev;
                  });
                }}
                className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center mr-0.5"
                title={isPlaying ? "Pause rotation" : "Play rotation"}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 text-nexus-cyan animate-pulse" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
              
              <div className="flex gap-1.5 items-center">
                {heroesList.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={e => { e.stopPropagation(); selectHero(i); }}
                    className={`w-2 h-2 rounded-full transition-all duration-150 cursor-pointer ${i === activeIdx ? 'bg-nexus-cyan scale-125' : 'bg-white/35 hover:bg-white/75'}`}
                    title={`Show featured slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right 35%: Stack of 3 mini featured articles */}
      <div className="lg:col-span-4 flex flex-col justify-between gap-4">
        
        <div className="flex items-center gap-1.5 border-b border-nexus-border pb-1.5 select-none text-left leading-none uppercase text-xs font-bold text-gray-400">
          <BookOpen className="w-4.5 h-4.5 text-nexus-cyan shrink-0" />
          <span className="font-mono tracking-widest">SECONDARY DESPATCHES</span>
        </div>

        {sideList.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-nexus-card border rounded-xl select-none">
            <p className="text-xs text-gray-500 italic">No alternative briefs categorized.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between gap-3 text-left">
            {sideList.map((art) => (
              <div
                key={art.id}
                onClick={() => onSelectArticle(art)}
                className="nexus-card-glow cursor-pointer bg-nexus-card border border-nexus-border p-4 rounded-xl flex gap-4 text-left group hover:scale-[1.005]"
              >
                {/* 80x80 Thumbnail */}
                <div className="w-[80px] h-[80px] rounded-lg overflow-hidden shrink-0 bg-[#0A0F1E] select-none relative">
                  <img 
                    src={art.thumbnailUrl || art.imageUrl} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-105 duration-300 transition-transform pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                  {art.isBreaking && (
                    <span className="absolute top-1 left-1 bg-danger-red select-none text-nexus-void text-[7.5px] font-mono font-extrabold px-1.5 py-0.5 rounded leading-none">
                      HOT
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between text-left">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2 select-none leading-none text-left">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectCategory(art.category); }}
                        className="text-[8px] font-mono font-extrabold tracking-wider bg-nexus-cyan/10 border border-nexus-cyan/35 text-nexus-cyan px-1.5 py-0.5 rounded leading-none uppercase"
                      >
                        {art.category}
                      </button>
                      <span className="text-[10px] text-gray-500 font-mono font-medium truncate shrink-0-0">
                        {art.date}
                      </span>
                    </div>
                    
                    <h4 className="font-serif font-bold text-white text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-nexus-cyan group-hover:underline transition-colors text-left font-serif">
                      {art.title}
                    </h4>
                  </div>

                  <div className="text-[10px] font-mono text-gray-500 flex items-center gap-1 select-none text-left">
                    <span>Views: {art.views}</span>
                    <span>•</span>
                    <span>{art.readTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
