import React from 'react';
import { Article } from '../types';
import { Landmark, FileText, ChevronRight, Gavel, Scale, Fingerprint, Map } from 'lucide-react';

interface PolicyPageProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export default function PolicyPage({ articles, onSelectArticle }: PolicyPageProps) {
  const policyArticles = articles.filter(a => a.category === 'Policy');

  const budgetAllocations = [
    { id: '1', program: 'Clean Energy & Hydro Grids Development', allocation: 'Rs. 84.5B', target: 'FY 2081/82 Sovereign Index allocation status' },
    { id: '2', program: 'Terai Agrarian Thermal Corridors', allocation: 'Rs. 24.1B', target: 'Establishing 84 agricultural cold hubs' },
    { id: '3', program: 'Kathmandu Software Export Parks', allocation: 'Rs. 12.8B', target: 'Dedicated cellular tracking fiber lines' },
    { id: '4', program: 'Sovereign Debt Remittance Integration', allocation: 'Rs. 8.2B', target: 'Stabilizing central capital reserve portfolios' }
  ];

  const executiveDecisions = [
    { title: 'NRB Circular 081-082/04', type: 'Monetary Directive', desc: 'Mandates minimum 12.5% CAR benchmarks across Commercial Banks.' },
    { title: 'Tariff Act Sec 14', type: 'Fiscal Statute', desc: 'Allows full tax exemptions for clean hydropower projects exporting to regional grids.' },
    { title: 'DIA-NPL Joint Accord', type: 'Bilateral Agreement', desc: 'Coordinates remittance capital guarantees for Non-Resident Nepalis (NRN).' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 font-sans text-left">
      
      {/* Page Header */}
      <div className="border-b border-border-warm dark:border-gray-800 pb-5 mb-8 text-left select-none">
        <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-[#5A6475] uppercase dark:text-gray-400 font-black">
          PILLAR 03: GOVERNANCE & REGULATORY DIRECTIVES
        </span>
        <h1 className="text-2.5xl sm:text-4.5xl font-serif font-black text-secondary-navy dark:text-white leading-tight tracking-tight mt-1 text-left">
          Policy & Governance Chamber
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6475] dark:text-gray-305 max-w-2xl leading-relaxed mt-2 font-light text-left">
          Tracking national budget codes (FY 2081/82), central bank macro circulars, and the legal constraints governing FDI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Left Column: Directives and Budget Allocation Indices (Span 8) */}
        <div className="lg:col-span-8 space-y-8 text-left animate-fade-in">
          
          {/* Budget Registry Table */}
          <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium">
            <h3 className="text-base sm:text-lg font-serif font-bold text-secondary-navy dark:text-white mb-4 flex items-center gap-2 select-none">
              <Landmark className="w-5 h-5 text-primary-crimson" />
              <span>National Budget Registry (FY 2081/82)</span>
            </h3>
            
            <div className="overflow-x-auto text-left">
              <table className="w-full text-[11.5px] font-sans border-collapse text-left">
                <thead>
                  <tr className="border-b border-border-warm/50 dark:border-gray-800 text-[10.5px] font-mono text-gray-400 uppercase tracking-wider select-none">
                    <th className="pb-2.5 font-bold text-left">Strategic Program</th>
                    <th className="pb-2.5 font-bold text-right pr-4">Fund Allocated</th>
                    <th className="pb-2.5 font-bold text-left hidden sm:table-cell">Policy Objective Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                  {budgetAllocations.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-dark-navy/20 duration-150">
                      <td className="py-3 font-medium text-secondary-navy dark:text-gray-200 text-left">{item.program}</td>
                      <td className="py-3 text-right pr-4 font-mono font-black text-primary-crimson dark:text-accent-gold text-xs">{item.allocation}</td>
                      <td className="py-3 text-[#5A6475] dark:text-gray-450 hidden sm:table-cell text-left font-light">{item.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legislative articles list */}
          <div className="space-y-5 text-left pt-2">
            <h3 className="font-serif font-black text-lg text-secondary-navy dark:text-accent-gold uppercase tracking-tight text-left border-b pb-2 select-none">
              Legislative Briefings Catalog
            </h3>

            {policyArticles.length === 0 ? (
              <div className="p-8 bg-bg-ivory dark:bg-secondary-navy rounded-xl text-center border text-xs text-gray-405 italic">
                No policy-focused publications indexed in feed currently.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {policyArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => onSelectArticle(art)}
                    className="group cursor-pointer bg-white dark:bg-secondary-navy rounded-xl border border-border-warm dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 text-left flex flex-col justify-between"
                  >
                    <div>
                      {/* Image block */}
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

                      {/* Content details */}
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

                    <div className="px-5 pb-5 pt-3 border-t border-gray-105 dark:border-gray-855 flex justify-between items-center text-[10.5px] font-mono font-bold select-none text-left">
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

        {/* Right Column: Regulations updates lists (Span 4) */}
        <div className="lg:col-span-4 space-y-8 text-left select-none font-sans">
          
          <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium">
            <h4 className="font-serif font-black text-sm uppercase text-secondary-navy dark:text-accent-gold tracking-tight mb-4 text-left border-b border-border-warm dark:border-gray-850 pb-2 flex items-center gap-1.5">
              <Gavel className="w-4.5 h-4.5 text-secondary-navy" />
              <span>NRB Regulatory Decisions</span>
            </h4>
            
            <div className="space-y-4 text-left">
              {executiveDecisions.map((dec, idx) => (
                <div key={idx} className="p-3.5 bg-bg-ivory dark:bg-dark-navy text-left rounded border border-gray-100 flex flex-col justify-between text-left gap-1 transition-colors hover:border-accent-gold">
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                    <span className="text-primary-crimson">{dec.title}</span>
                    <span className="text-gray-400 uppercase">{dec.type}</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-slate-700 dark:text-gray-300 font-light mt-1">
                    {dec.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-dark-navy text-white p-6 rounded-xl border border-accent-gold/25 relative overflow-hidden text-left shadow-premium select-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none"></div>

            <span className="inline-block bg-primary-crimson text-white font-mono text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded border border-white/10 mb-3 leading-none">
              COMPLIANCE AUDITING
            </span>
            <h5 className="font-serif font-black text-base text-gray-100 leading-tight">Foreign Investment approvals</h5>
            <p className="text-xs text-gray-300 leading-relaxed font-sans font-light mt-2">
              All international ventures deploying seed-capital inside digital export programs must file secure quarterly liquidity registry books under NRB code mandates.
            </p>
            
            <a 
              href="#" 
              className="mt-4 flex items-center gap-1.5 font-mono text-[10px] text-accent-gold font-bold uppercase tracking-wider group border-t border-accent-gold/15 pt-3 w-full text-left"
            >
              <span>Verify FDI clearances</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}
