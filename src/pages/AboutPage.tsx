import React from 'react';
import { ShieldCheck, UserCheck, Scale, Globe, Target, Terminal } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 font-sans text-left relative z-10 select-none">
      
      <div className="border-b border-nexus-border pb-5 mb-8 text-left leading-none">
        <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#00D4FF] uppercase font-black block">
          SOVEREIGN RATING TRANSPARENCY GUIDELINES
        </span>
        <h1 className="text-2.5xl sm:text-3.5xl font-serif font-black text-white leading-tight tracking-tight mt-1 text-left font-serif">
          About NepalEconomy Portal
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 font-sans font-light mt-1.5 leading-relaxed text-left">
          Explore our editorial policies, sovereign rating credentials, and code specifications driving Nepal's business intelligence hub.
        </p>
      </div>

      <div className="space-y-8 text-left text-xs font-sans">
        
        {/* Core Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-left">
          <div className="text-left space-y-3.5">
            <span className="text-[9.5px] font-mono tracking-widest text-nexus-gold uppercase font-black block">
              1. Our Sovereign Creed
            </span>
            <h3 className="text-base sm:text-lg font-serif font-black text-white uppercase text-left font-serif leading-none">
              Fact-Verified Business Intelligence
            </h3>
            <p className="text-[12px] sm:text-xs text-gray-300 font-light leading-relaxed text-left font-sans">
              Founded under regulatory protocols, NepalEconomy.com operates as an independent sovereign rating brief, translating central banking datasets, FDI movements, and tax guidelines into polished intelligence indicators. 
            </p>
            <p className="text-[12px] sm:text-xs text-gray-300 font-light leading-relaxed text-left font-sans">
              Our investigative dispatches strictly conform under the Swiss media privacy guidelines, ensuring that our anonymous whistleblowing channels provide zero security telemetry back-tracing.
            </p>
          </div>

          <div className="p-5 bg-nexus-panel border border-nexus-border rounded-xl space-y-3 text-left">
            <div className="flex items-center gap-2 select-none text-left">
              <ShieldCheck className="w-5.5 h-5.5 text-nexus-cyan shrink-0 animate-pulse" />
              <span className="font-mono text-[9px] font-black uppercase text-nexus-cyan tracking-wider leading-none">
                VERIFICATION METRICS ACCORDS
              </span>
            </div>

            <ol className="space-y-2 text-[10.5px] text-gray-405 font-mono list-decimal list-inside text-left">
              <li>NRB Monetary Guidelines Alignment</li>
              <li>Ministry of Finance tax statutory audit</li>
              <li>Sovereign export corridors trace</li>
              <li>Decoupled file scrubbing protocol</li>
            </ol>
          </div>
        </div>

        {/* Editorial Desk Segment */}
        <div className="space-y-4 text-left border-t border-nexus-border/60 pt-8">
          <span className="text-[9.5px] font-mono tracking-widest text-nexus-cyan uppercase font-black block text-left">
            2. Editorial Desk Officers
          </span>
          <h2 className="text-base sm:text-lg font-serif font-black text-white uppercase text-left font-serif leading-none mb-4">
            Investigative Correspondents Team
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
            {[
              {
                name: 'Dr. Niranjan Shah',
                role: 'Chief Macroeconomic Analyst',
                desc: 'Former central bank director mapping regional FDI trade rates circulars.',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
              },
              {
                name: 'Sushil Gyawali',
                role: 'Senior Regulatory Correspondent',
                desc: 'Specialist overseeing tax audits, legal circular statutes, and excise compliance.',
                image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
              },
              {
                name: 'Elena Basnet',
                role: 'SaaS & Kathmandu Corridor Editor',
                desc: 'Parsing startup metrics, IT exports growth, and venture seed capital inflows.',
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
              }
            ].map((member, i) => (
              <div 
                key={i}
                className="bg-nexus-card border border-nexus-border hover:border-nexus-cyan/40 p-4 rounded-xl flex items-start gap-3.5 text-left transition-colors"
              >
                <img 
                  src={member.image} 
                  alt="" 
                  className="w-12 h-12 rounded-full object-cover border border-[#1b263b] shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 text-left space-y-0.5 leading-none">
                  <h4 className="font-serif font-black text-white text-[12.5px] sm:text-xs truncate font-serif" style={{ fontVariant: 'small-caps' }}>
                    {member.name}
                  </h4>
                  <span className="text-[8.5px] font-mono text-nexus-gold uppercase font-bold block leading-none">{member.role}</span>
                  <p className="text-[10.5px] leading-relaxed text-gray-500 font-sans font-light pt-1.5 text-left leading-snug">{member.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory Disclaimers and Logs */}
        <div className="border-t border-nexus-border/60 pt-8 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch text-left">
          
          <div className="md:col-span-8 bg-nexus-panel border border-nexus-border p-5 rounded-xl space-y-3.5 text-left">
            <span className="text-[9.5px] font-mono tracking-widest text-[#FF007A] uppercase font-black block">
              3. Regulatory Statutory logs
            </span>
            <p className="text-[11.5px] leading-relaxed text-gray-400 font-sans font-light leading-normal text-left">
              The information shown on NepalEconomy.com corresponds strictly with audited national archives. None of the reports constitute formal tax counseling or financial advisory circles. All entities are advised to retrieve statutory files from government gazette records.
            </p>
          </div>

          <div className="md:col-span-4 bg-[#0A0D18] p-5 rounded-xl border border-nexus-border flex flex-col justify-center text-left select-none space-y-1">
            <span className="text-[8.5px] font-mono text-gray-550 uppercase leading-none">API CORE ENVIRONMENT</span>
            <span className="text-white text-[12.5px] block font-mono font-black text-nexus-cyan">NEPALECONOMY ENGINE ACTIVE</span>
            <span className="font-mono text-[9px] text-gray-500 block">SSL SECURED ENVELOPE</span>
          </div>

        </div>

      </div>

    </div>
  );
}
