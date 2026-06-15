import React from 'react';
import { Article } from '../types';
import { Landmark, Snowflake, Droplets, Landmark as Bank, Heart, Sprout, ArrowRight } from 'lucide-react';

interface BusinessPageProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export default function BusinessPage({ articles, onSelectArticle }: BusinessPageProps) {
  const businessArticles = articles.filter(a => a.category === 'Business');

  const sectorMetrics = [
    {
      id: 'hydro',
      title: 'Hydropower Export Revenues',
      value: 'Rs. 16.2B',
      delta: '+24.5%',
      isPositive: true,
      desc: 'Electricity exports to Indian grid system (Quarterly Index)',
      icon: <Droplets className="w-5 h-5 text-blue-500 animate-pulse" />
    },
    {
      id: 'banking',
      title: 'Commercial Banking CAR',
      value: '13.12%',
      delta: 'Stable',
      isPositive: true,
      desc: 'Average Capital Adequacy Ratio across Grade-A banks',
      icon: <Bank className="w-5 h-5 text-emerald-500" />
    },
    {
      id: 'agriculture',
      title: 'Terai Agrarian Corridors',
      value: '84 Cold Hubs',
      delta: '+12.1%',
      isPositive: true,
      desc: 'Pioneering thermal cold-storage setups securing yields',
      icon: <Sprout className="w-5 h-5 text-amber-600" />
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 font-sans text-left">
      
      {/* Page Title Header */}
      <div className="border-b border-border-warm dark:border-gray-800 pb-5 mb-8 text-left select-none">
        <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-[#5A6475] uppercase dark:text-gray-400 font-black">
          PILLAR 02: COMMERCE & SECTORAL GROWTH
        </span>
        <h1 className="text-2.5xl sm:text-4.5xl font-serif font-black text-secondary-navy dark:text-white leading-tight tracking-tight mt-1 text-left">
          Business & Industry Hub
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6475] dark:text-gray-305 max-w-2xl leading-relaxed mt-2 font-light text-left">
          Inside Nepal's primary corporate clusters, energy exports, agricultural cold grids, and commercial banking channels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Left Side: Industrial Indicators & Sectors (Span 8) */}
        <div className="lg:col-span-8 space-y-8 text-left animate-fade-in">
          
          {/* Main Sector Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left select-none">
            {sectorMetrics.map((met) => (
              <div 
                key={met.id} 
                className="bg-white dark:bg-secondary-navy p-5 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium flex flex-col justify-between min-h-[175px] text-left"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-mono tracking-widest text-[#5A6475] dark:text-gray-400 font-black uppercase">
                      {met.title}
                    </span>
                    <span className="p-1.5 bg-neutral-100 dark:bg-dark-navy rounded border border-gray-150 dark:border-gray-850">
                      {met.icon}
                    </span>
                  </div>
                  
                  <span className="text-2.5xl sm:text-3.5xl font-mono text-primary-crimson dark:text-accent-gold font-extrabold tracking-tight mt-3 block leading-tight">
                    {met.value}
                  </span>
                  
                  <p className="text-[10.5px] leading-snug text-gray-500 dark:text-gray-400 mt-2 font-medium">
                    {met.desc}
                  </p>
                </div>

                <div className="border-t border-border-warm dark:border-gray-800 pt-3.5 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-green-600 dark:text-green-400 font-bold">{met.delta} vs PREV</span>
                  <span id={`indicator-${met.id}`} className="text-gray-400 uppercase font-black tracking-tighter">SECURED INDEX</span>
                </div>
              </div>
            ))}
          </div>

          {/* Business Pillar briefings feed */}
          <div className="space-y-5 text-left pt-2">
            <h3 className="font-serif font-black text-lg text-secondary-navy dark:text-accent-gold uppercase tracking-tight text-left border-b pb-2 select-none">
              Corporate Intelligence Briefings
            </h3>

            {businessArticles.length === 0 ? (
              <div className="p-8 bg-bg-ivory dark:bg-secondary-navy rounded-xl text-center border text-xs text-gray-405 italic">
                No corporate brief documents listed in index currently.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {businessArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => onSelectArticle(art)}
                    className="group cursor-pointer bg-white dark:bg-secondary-navy rounded-xl border border-border-warm dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 text-left flex flex-col justify-between text-left"
                  >
                    <div>
                      {/* Cover Illustration */}
                      <div className="w-full h-44 overflow-hidden relative select-none">
                        <img 
                          src={art.imageUrl} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 duration-500 transition-transform" 
                          referrerPolicy="no-referrer"
                        />
                        {art.isBreaking && (
                          <span className="absolute top-3 left-3 bg-primary-crimson text-white text-[9.5px] font-mono font-black py-0.5 px-2.5 rounded tracking-wide border border-accent-gold/25">
                            {art.breakingLabel || 'BREAKING'}
                          </span>
                        )}
                      </div>

                      {/* Summary blocks */}
                      <div className="p-5 text-left space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 select-none">
                          <span className="font-bold">{art.author.toUpperCase()}</span>
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
            )}
          </div>

        </div>

        {/* Right Side Column: Explanations of Corporate Focus (Span 4) */}
        <div className="lg:col-span-4 space-y-8 text-left select-none font-sans">
          
          <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium">
            <h4 className="font-serif font-black text-sm uppercase text-secondary-navy dark:text-accent-gold tracking-tight mb-3 text-left border-b border-border-warm dark:border-gray-850 pb-2">
              Corporate Spotlight Directory
            </h4>
            <div className="space-y-4 text-xs font-sans">
              <div className="p-3 bg-bg-ivory dark:bg-dark-navy text-left rounded border border-gray-100 space-y-1">
                <span className="text-[10px] font-mono font-bold text-primary-crimson uppercase">ENERGY INDEPENDENCE</span>
                <p className="text-[11.5px] leading-relaxed text-gray-600 dark:text-gray-300 font-light font-sans text-left">
                  National projects like Upper Tamakoshi (456 MW) are facilitating clean transit lanes into regional grids. Hydro-bonds remain protected from debt ceiling rules.
                </p>
              </div>

              <div className="p-3 bg-bg-ivory dark:bg-dark-navy text-left rounded border border-gray-100 space-y-1">
                <span className="text-[10px] font-mono font-bold text-primary-crimson uppercase">FINANCIAL STABILITY</span>
                <p className="text-[11.5px] leading-relaxed text-gray-600 dark:text-gray-300 font-light font-sans text-left">
                  Grade-A financial institutions operate under strict regulatory reserves, holding capital adequacy well above safe baselines.
                </p>
              </div>

              <div className="p-3 bg-bg-ivory dark:bg-dark-navy text-left rounded border border-gray-100 space-y-1">
                <span className="text-[10px] font-mono font-bold text-primary-crimson uppercase">TERAI LOGISTICS COOPERATIVES</span>
                <p className="text-[11.5px] leading-relaxed text-gray-600 dark:text-gray-300 font-light font-sans text-left">
                  Agrarian thermal grids enable secure transit pipelines for horticulture, eliminating post-harvest spoiling across Terai plains.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-navy text-white p-6 rounded-xl border border-accent-gold/25 relative overflow-hidden text-left shadow-premium select-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none"></div>

            <span className="inline-block bg-primary-crimson text-white font-mono text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded border border-white/10 mb-3 leading-none">
              EXPORT REGISTRY
            </span>
            <h5 className="font-serif font-black text-base text-gray-100 leading-tight">Tea & Cash Crop Commodities</h5>
            <p className="text-xs text-gray-300 leading-relaxed font-sans font-light mt-2">
              Examine the historical output profiles, regional tariff bounds, and international certification standards for Himalayan tea and organic coffee crops.
            </p>
            
            <a 
              href="#" 
              className="mt-4 flex items-center gap-1.5 font-mono text-[10px] text-accent-gold font-bold uppercase tracking-wider group border-t border-accent-gold/15 pt-3 w-full text-left"
            >
              <span>Explore export codes</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}
