import React, { useState } from 'react';
import { EconomicReport } from '../types';
import { FileDown, Search, ArrowRight, Download, CheckCircle, RefreshCw } from 'lucide-react';

interface ReportsPageProps {
  reports: EconomicReport[];
  setReports: (reports: EconomicReport[]) => void;
}

export default function ReportsPage({ reports, setReports }: ReportsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const logDownload = (id: string) => {
    const list = reports.map(r => {
      if (r.id === id) {
        return {
          ...r,
          downloads: r.downloads + 1
        };
      }
      return r;
    });
    setReports(list);
    localStorage.setItem('ne_reports', JSON.stringify(list));
  };

  const filteredReports = reports.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 font-sans text-left">
      
      {/* Page Title Header */}
      <div className="border-b border-border-warm dark:border-gray-800 pb-5 mb-8 text-left select-none">
        <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#5A6475] uppercase dark:text-gray-400 font-extrabold block">
          INSTITUTIONAL INVESTMENTS LIBRARIES
        </span>
        <h1 className="text-3xl sm:text-4.5xl font-serif font-black text-secondary-navy dark:text-white leading-tight tracking-tight mt-1 text-left">
          Research Reports & Surveys
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6475] dark:text-gray-305 mt-2 max-w-2xl font-light text-left">
          Download certified analytical records compiled by multilateral advisors, corporate grids, and ministry desks.
        </p>
      </div>

      <div className="space-y-8 text-left animate-fade-in">
        
        {/* Search Bar section */}
        <div className="flex bg-white dark:bg-secondary-navy border border-border-warm dark:border-gray-800 p-2 rounded-xl text-xs select-none gap-2 items-center w-full">
          <Search className="w-4.5 h-4.5 text-gray-400 shrink-0 ml-2" />
          <input
            type="text"
            placeholder="Search report titles or corporate authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-xs text-gray-850 dark:text-white focus:outline-none py-1.5 focus:ring-0 font-sans"
          />
        </div>

        {/* List of current reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {filteredReports.length === 0 ? (
            <div className="md:col-span-2 p-12 bg-bg-ivory dark:bg-secondary-navy border border-dashed border-border-warm dark:border-gray-800 text-center rounded-xl text-xs text-gray-405 italic select-none">
              No institutional publications found matching query.
            </div>
          ) : (
            filteredReports.map((rep) => (
              <div 
                key={rep.id} 
                className="bg-white dark:bg-secondary-navy p-5 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium flex flex-col justify-between min-h-[190px] text-left hover:border-accent-gold duration-200"
              >
                <div>
                  <div className="flex justify-between items-start select-none">
                    <span className="text-[10px] font-mono tracking-widest text-primary-crimson dark:text-accent-gold font-extrabold uppercase">
                      {rep.author}
                    </span>
                    <span className="p-1.5 bg-neutral-100 dark:bg-dark-navy rounded border border-gray-150 dark:border-gray-850 text-gray-405">
                      <FileDown className="w-5 h-5 text-teal-800" />
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-secondary-navy dark:text-white leading-snug text-sm sm:text-base mt-3 border-none pb-0 text-left line-clamp-2" title={rep.title}>
                    {rep.title}
                  </h3>
                  
                  <div className="flex items-center gap-2.5 text-[10px] text-gray-400 font-mono select-none pt-1">
                    <span>Published: {rep.date}</span>
                    <span>•</span>
                    <span>{rep.size}</span>
                  </div>
                </div>

                <div className="border-t border-border-warm dark:border-gray-800 pt-3.5 mt-4 flex justify-between items-center text-[10.5px] font-mono font-bold select-none text-left">
                  <span className="text-[#5A6475]">{rep.downloads} downloads logged</span>
                  
                  <a
                    href={rep.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => logDownload(rep.id)}
                    className="inline-flex items-center gap-1.5 bg-primary-crimson hover:bg-black text-white px-3.5 py-1.5 rounded text-[11px] uppercase font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shadow-sm text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Global certification guidelines block */}
        <div className="bg-bg-ivory dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 space-y-3 text-left">
          <h4 className="font-serif font-bold text-[#8B0000] text-sm uppercase tracking-wider text-left select-none">
            Corporate Document Integrity Warning
          </h4>
          <p className="text-xs sm:text-[13px] leading-relaxed text-gray-600 dark:text-gray-300 font-light font-sans text-left">
            Institutional surveys represent sensitive macro-capital forecasts. All index catalogs downloaded undergo cryptographic packet audits under state guidelines. Retraction schedules remain monitored by external auditors.
          </p>
          <div className="text-[10.5px] text-[#5A6475] font-mono select-none pt-1">
            VERIFIED REGISTRY CHANNELS: media-auditor@nepaleconomy.com
          </div>
        </div>

      </div>

    </div>
  );
}
