import React from 'react';
import { Article, EconomicReport } from '../types';
import NEPSEWidget from '../components/NEPSEWidget';
import InteractiveChart from '../components/InteractiveChart';
import { TrendingUp, FileText, Download, Landmark, ArrowUpRight, ArrowRight } from 'lucide-react';

interface EconomyPageProps {
  articles: Article[];
  reports: EconomicReport[];
  onSelectArticle: (article: Article) => void;
  setActivePage: (page: string) => void;
}

export default function EconomyPage({
  articles,
  reports,
  onSelectArticle,
  setActivePage
}: EconomyPageProps) {
  const economyArticles = articles.filter(a => a.category === 'Economy');

  // Increment report download counter locally in persistent state
  const logDownload = (id: string) => {
    const list = [...reports];
    const report = list.find(r => r.id === id);
    if (report) {
      report.downloads += 1;
      localStorage.setItem('ne_reports', JSON.stringify(list));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 font-sans text-left">
      
      {styleTag}

      {/* Hero Header */}
      <div className="border-b border-border-warm dark:border-gray-800 pb-5 mb-8 text-left select-none">
        <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-[#5A6475] uppercase dark:text-gray-400 font-black">
          PILLAR 01: MACROECONOMY & CENTRAL RESERVES
        </span>
        <h1 className="text-2.5xl sm:text-4.5xl font-serif font-black text-secondary-navy dark:text-white leading-tight tracking-tight mt-1 text-left">
          Macro Economy Monitor
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6475] dark:text-gray-305 max-w-2xl leading-relaxed mt-2 font-light text-left">
          Authorized monitoring indices of Nepal's sovereign debt bounds, CPI, GDP trends, and central reserves configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Left Side: Long and detailed dashboard grid (Span 8) */}
        <div className="lg:col-span-8 space-y-8 text-left">
          
          {/* Quick Indices Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <NEPSEWidget variant="card" />
            
            <div className="bg-white dark:bg-secondary-navy p-5 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium flex flex-col justify-between h-full min-h-[190px]">
              <div>
                <span className="text-[9.5px] font-mono tracking-widest text-[#5A6475] dark:text-gray-400 font-extrabold block uppercase mb-1.5">
                  🛡️ DEBT-TO-GDP LIMIT
                </span>
                <span className="text-3xl sm:text-4.5xl font-mono text-primary-crimson dark:text-white font-extrabold tracking-tight">
                  42.8%
                </span>
                <p className="text-[10.5px] leading-relaxed text-gray-500 dark:text-gray-400 font-semibold mt-1">
                  FY 2081/82 Sovereign Liabilities Benchmark limit
                </p>
              </div>
              <div className="border-t border-border-warm dark:border-gray-800 pt-3 flex justify-between items-center text-[10px] font-mono select-none">
                <span className="text-green-600 dark:text-green-400 font-extrabold">● STABLE RATING</span>
                <span className="text-gray-400">IMF ASSESSED</span>
              </div>
            </div>

            <div className="bg-white dark:bg-secondary-navy p-5 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium flex flex-col justify-between h-full min-h-[190px]">
              <div>
                <span className="text-[9.5px] font-mono tracking-widest text-[#5A6475] dark:text-gray-400 font-extrabold block uppercase mb-1.5">
                  🏦 FOREX RESERVES
                </span>
                <span className="text-3xl sm:text-4.5xl font-mono text-primary-crimson dark:text-white font-extrabold tracking-tight">
                  $14.8B
                </span>
                <p className="text-[10.5px] leading-relaxed text-gray-500 dark:text-gray-400 font-semibold mt-1">
                  Covering 12.4 months of absolute national imports
                </p>
              </div>
              <div className="border-t border-border-warm dark:border-gray-800 pt-3 flex justify-between items-center text-[10px] font-mono select-none">
                <span className="text-[#a16207] font-extrabold">▲ HISTORIC HIGH</span>
                <span className="text-gray-400">NRB LED</span>
              </div>
            </div>
          </div>

          {/* Interactive Chart Component Insertion */}
          <div className="w-full">
            <InteractiveChart />
          </div>

          {/* Feed list sector articles */}
          <div className="space-y-5 text-left pt-3">
            <h3 className="font-serif font-black text-lg text-secondary-navy dark:text-accent-gold uppercase tracking-tight text-left border-b pb-2 select-none">
              Pillar Directives Briefs
            </h3>

            {economyArticles.length === 0 ? (
              <p className="text-xs text-text-secondary italic">No Economy Category articles available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {economyArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => onSelectArticle(art)}
                    className="group cursor-pointer bg-white dark:bg-secondary-navy rounded-xl border border-border-warm dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 text-left flex flex-col justify-between animate-fade-in"
                  >
                    <div>
                      {/* Image cover photo */}
                      <div className="w-full h-44 overflow-hidden relative select-none">
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 duration-500 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        {art.isBreaking && (
                          <span className="absolute top-3 left-3 bg-primary-crimson text-white text-[9.5px] font-mono font-black py-0.5 px-2.5 rounded tracking-wide border border-accent-gold/25 block">
                            {art.breakingLabel || 'BREAKING'}
                          </span>
                        )}
                      </div>

                      {/* Content block */}
                      <div className="p-5 text-left space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 select-none">
                          <span className="font-bold">{art.author.toUpperCase()}</span>
                          <span>{art.date}</span>
                        </div>
                        <h4 className="font-serif font-bold text-[#111] dark:text-gray-100 text-base sm:text-[17px] line-clamp-2 leading-snug group-hover:text-primary-crimson dark:group-hover:text-accent-gold group-hover:underline transition-colors text-left">
                          {art.title}
                        </h4>
                        <p className="text-xs text-text-secondary dark:text-gray-400 font-light line-clamp-2 leading-relaxed text-left">
                          {art.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-3 border-t border-gray-100 dark:border-gray-850 flex justify-between items-center text-[10.5px] font-mono font-bold select-none text-left">
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

        {/* Right Side Column: Policy Publications & Download reports (Span 4) */}
        <div className="lg:col-span-4 space-y-8 text-left select-none">
          
          <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium text-left">
            <h4 className="font-serif font-black text-sm uppercase text-secondary-navy dark:text-accent-gold tracking-tight mb-3 text-left border-b border-border-warm dark:border-gray-850 pb-2 select-none">
              Institutional Reports Bureau
            </h4>
            <p className="text-xs text-text-secondary dark:text-gray-305 leading-relaxed font-sans font-light mb-5 text-left">
              Secure official economic surveys, central bank bulletins, and debt-management reports compiled by authorized agencies:
            </p>

            <div className="space-y-4 text-left">
              {reports.map((rep) => (
                <div key={rep.id} className="p-3.5 bg-bg-ivory dark:bg-dark-navy rounded-lg border border-border-warm dark:border-gray-800 text-left shadow-sm space-y-2">
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] font-mono text-gray-400 font-black block uppercase">{rep.author}</span>
                    <h5 className="font-serif font-bold text-secondary-navy dark:text-white leading-snug text-xs sm:text-[13px] text-left line-clamp-2" title={rep.title}>
                      {rep.title}
                    </h5>
                  </div>

                  <div className="flex justify-between items-center font-mono text-[9px] text-[#5A6475] pt-0.5 text-left select-none border-t border-gray-200/50 dark:border-gray-800 pt-2 shrink-0">
                    <span>{rep.size} • PDF Doc</span>
                    <a
                      href={rep.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logDownload(rep.id)}
                      className="inline-flex items-center gap-1 bg-primary-crimson hover:bg-black text-white px-2 py-1 rounded text-[9.5px] uppercase font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shadow-sm text-center font-mono shrink-0"
                    >
                      <Download className="w-3 h-3" />
                      <span>{rep.downloads > 0 ? `Download (${rep.downloads})` : 'Download'}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setActivePage('reports')}
              className="mt-5 w-full bg-secondary-navy hover:bg-black text-white font-mono text-[10.5px] font-bold uppercase tracking-wider py-2 rounded text-center border border-accent-gold/15 cursor-pointer block"
            >
              Browse Full Reports Catalog
            </button>
          </div>

          <div className="bg-dark-navy text-white p-6 rounded-xl border border-accent-gold/25 relative overflow-hidden text-left shadow-premium select-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none"></div>

            <span className="inline-block bg-primary-crimson text-white font-mono text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded border border-white/10 mb-3 leading-none">
              FISCAL ALICNDMENT
            </span>
            <h5 className="font-serif font-black text-base text-gray-10s leading-tight">National Budget Registry (FY 2081/82)</h5>
            <p className="text-xs text-gray-300 leading-relaxed font-sans font-light mt-2">
              Review and examine state infrastructure alignments, hydropower corporate tax-deductibility benchmarks, and the Terai Cold-Storage allocation parameters under the active fiscal budget index.
            </p>

            <button
              onClick={() => setActivePage('policy')}
              className="mt-4 flex items-center gap-1.5 font-mono text-[10px] text-accent-gold font-black uppercase tracking-wider group cursor-pointer border-t border-accent-gold/15 pt-3 w-full text-left"
            >
              <span>Inspect fiscal policies</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

// Inline Style blocks for component
const styleTag = (
  <style>{`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);
