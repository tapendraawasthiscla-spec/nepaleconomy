import React, { useState } from 'react';
import { Article, ArticleCategory } from '../types';
import {
  TrendingUp, Activity, Briefcase, Landmark, Rocket, Globe,
  Search, Eye, Clock, Calendar, ArrowRight, CornerDownRight
} from 'lucide-react';

interface CategoryPageProps {
  categoryName: ArticleCategory;
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

const CATEGORY_METRICS: Record<ArticleCategory, {
  label: string;
  ticker: string;
  tagline: string;
  icon: any;
  color: string;
  bgGlow: string;
  stats: { label: string; val: string }[];
}> = {
  Economy: {
    label: 'Macro Economy Desk',
    ticker: 'NEPSE / FDI INFLOWS / INF',
    tagline: 'Analyzing central bank discount indicators, currency valuations, and foreign aid registries.',
    icon: Landmark,
    color: 'text-nexus-cyan',
    bgGlow: 'from-nexus-cyan/10',
    stats: [
      { label: 'FDI Net inflow', val: '+4.2% YoY' },
      { label: 'Forex Reserv.', val: '$15.8B USD' },
      { label: 'Inflation Base', val: '5.1% Target' }
    ]
  },
  Business: {
    label: 'Commerce & Corporate Ratios',
    ticker: 'HYDROPOWER / MERCH exports',
    tagline: 'Tracking hydropower capital investment ratios, tea export corridors, and banking sector circular logs.',
    icon: Briefcase,
    color: 'text-nexus-gold',
    bgGlow: 'from-nexus-gold/10',
    stats: [
      { label: 'Tea gross export', val: 'रु 1.5B Q1' },
      { label: 'Hydro Wire limits', val: '1200 MW export' },
      { label: 'CAR Ratio', val: '11.8% average' }
    ]
  },
  Policy: {
    label: 'Policy Decisions & Government',
    ticker: 'MINISTRY OF FINANCE / NRB ACTIONS',
    tagline: 'Official circular gazette registries, income tax adjustments, excise audits, and public procurement boards.',
    icon: Activity,
    color: 'text-purple-500',
    bgGlow: 'from-purple-500/10',
    stats: [
      { label: 'VAT compliance', val: 'Threshold 5M' },
      { label: 'Corporate Tax', val: '25% Flat rate' },
      { label: 'Excise code #88', val: 'Audited' }
    ]
  },
  Startups: {
    label: 'Kathmandu SaaS & Tech exports',
    ticker: 'VENTURE INFLOWS / TECH COMPLIANCE',
    tagline: 'Venture scale capital registries, IT outsourcing indicators, and local software incubators.',
    icon: Rocket,
    color: 'text-nexus-green',
    bgGlow: 'from-nexus-green/10',
    stats: [
      { label: 'SaaS export val.', val: '$150M Projected' },
      { label: 'Venture seed funds', val: '15 Active desks' },
      { label: 'SaaS tax holiday', val: '5 Year grace' }
    ]
  },
  Global: {
    label: 'Global NRN Capital Network',
    ticker: 'REMITTANCE FLOWS / INTERNATIONAL FDI',
    tagline: 'Tracking Non-Resident Nepali sovereign bonds, remittance index flows, and bilateral investment treaties.',
    icon: Globe,
    color: 'text-blue-500',
    bgGlow: 'from-blue-500/10',
    stats: [
      { label: 'Remittance Gross', val: '+8.4% growth' },
      { label: 'NRN S-Bond Yield', val: '9.5% per annum' },
      { label: 'Double Tax Treat.', val: '11 Countries' }
    ]
  }
};

export default function CategoryPage({ categoryName, articles, onSelectArticle }: CategoryPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const meta = CATEGORY_METRICS[categoryName];
  const Icon = meta.icon;

  const filtered = articles.filter(art => {
    const belongs = art.category === categoryName;
    if (!belongs) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return art.title.toLowerCase().includes(q) || art.excerpt.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 font-sans text-left relative z-10 select-none">
      
      {/* Category banner (Section 1 specs) */}
      <div className={`bg-[#0E1527] border border-nexus-border rounded-2xl p-6 md:p-8 mb-8 text-left relative overflow-hidden shadow-2xl`}>
        
        {/* Glow backdrop mesh */}
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${meta.bgGlow} to-transparent pointer-events-none`} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 text-left">
          
          <div className="text-left space-y-3.5 max-w-2xl font-sans">
            <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-nexus-cyan uppercase font-black block leading-none">
              NEPALECONOMY CHANNEL DESK: {meta.ticker}
            </span>
            
            <div className="flex items-center gap-2.5 text-left leading-none font-serif">
              <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${meta.color} shrink-0 animate-pulse`} />
              <h1 className="text-2.5xl sm:text-3.5xl font-serif font-black text-white leading-tight tracking-tight mt-0.5 text-left font-serif">
                {meta.label}
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 font-sans font-light mt-1.5 leading-relaxed text-left">
              {meta.tagline}
            </p>
          </div>

          {/* Quick indicators sparkline ratios */}
          <div className="w-full md:w-auto shrink-0 space-y-2.5">
            <span className="text-[9px] font-mono text-gray-500 uppercase block font-black border-b border-nexus-border pb-1 text-left">
              DESK METRICS INDEX RATIOS
            </span>

            <div className="grid grid-cols-3 md:grid-cols-1 gap-2 text-left font-mono text-[10px] uppercase font-bold text-center md:text-left">
              {meta.stats.map((st, i) => (
                <div key={i} className="bg-nexus-void border border-nexus-border p-2 rounded flex flex-col md:flex-row md:justify-between items-start md:items-center gap-1 min-w-[150px]">
                  <span className="text-gray-500 leading-none">{st.label}:</span>
                  <span className={`${meta.color} font-black text-[10.5px] leading-none`}>{st.val}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Real-time filters and search index */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3.5 mb-6 select-none text-left">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-nexus-cyan absolute left-3 top-3" />
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Filter investigative reports in ${categoryName} channel...`}
            className="w-full pl-10 pr-4 py-2 bg-nexus-card border border-nexus-border rounded-xl text-xs text-white focus:outline-none placeholder-gray-650 focus:border-nexus-cyan"
          />
        </div>

        <span className="text-[10px] font-mono text-gray-500 uppercase font-black bg-nexus-panel border border-nexus-border py-2 px-3.5 rounded-xl shrink-0 block leading-none select-none">
          MAPPED ENTIRES: <span className="text-white font-black">{filtered.length} Dispatches</span>
        </span>
      </div>

      {/* GRID DISPLAY */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-nexus-border rounded-2xl select-none space-y-2.5">
          <Landmark className="w-10 h-10 text-gray-700 mx-auto animate-bounce-short" />
          <h4 className="font-serif font-black text-white text-sm text-center">Desk Logs Mapped Clear</h4>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            No matching dispatches registered under {categoryName} using keyword query "{searchQuery}".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left animate-fade-in">
          {filtered.map((art) => {
            const hasThumbnailRatio = art.thumbnailUrl;
            return (
              <div 
                key={art.id}
                onClick={() => onSelectArticle(art)}
                className="bg-nexus-card border border-nexus-border hover:border-nexus-cyan/40 rounded-xl p-4.5 flex flex-col justify-between h-[350px] cursor-pointer group transition-all text-left shadow-sm"
              >
                <div className="text-left space-y-3 shrink-0 flex-grow">
                  
                  {/* Aspect Ratio Cropped Photo Cover/Thumbnail */}
                  <div className="w-full h-36 bg-nexus-void rounded-lg overflow-hidden border border-nexus-border/60 relative select-none shrink-0">
                    <img 
                      src={hasThumbnailRatio || art.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-102 duration-300 pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                    {art.isBreaking && (
                      <span className="absolute top-2 left-2 bg-danger-red text-white text-[7px] font-mono font-black py-0.5 px-1.5 rounded uppercase leading-none select-none">
                        🔥 HOT TIP
                      </span>
                    )}
                  </div>

                  <div className="text-left space-y-1.5 min-w-0 leading-none font-sans">
                    <div className="flex justify-between items-center text-[8.5px] font-mono text-gray-550 select-none">
                      <span>{art.date}</span>
                      <span className="uppercase text-nexus-cyan font-bold">{art.readTime}</span>
                    </div>

                    <h4 className="font-serif font-black text-white text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-nexus-cyan group-hover:underline text-left font-serif">
                      {art.title}
                    </h4>

                    <p className="text-[11px] leading-relaxed text-gray-400 font-sans font-light line-clamp-3 text-left">
                      {art.excerpt}
                    </p>
                  </div>

                </div>

                <div className="border-t border-nexus-border/65 pt-2.5 mt-2.5 flex items-center justify-between text-[8px] font-mono select-none">
                  <span className="text-gray-500 font-bold shrink-0">BY {art.author?.toUpperCase() || 'NEWSROOM DESK'}</span>
                  <button className="text-nexus-cyan hover:underline hover:scale-[1.01] flex items-center gap-1 font-bold">
                    <span>ANALYZE</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
