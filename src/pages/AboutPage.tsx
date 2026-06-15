import React from 'react';
import { Shield, BookOpen, GraduationCap, Award, Compass } from 'lucide-react';

export default function AboutPage() {
  const leadership = [
    {
      name: 'Dr. Niranjan Shah',
      title: 'Chief Economics Editor',
      bio: 'Former senior advisor at the Nepal Rastra Bank and IMF multilateral research wing. Doctorate in monetary economics from London School of Economics.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=260&auto=format&fit=crop&q=80'
    },
    {
      name: 'Ramesh Dahal',
      title: 'Senior Policy Correspondent',
      bio: 'Author of several treatises on cross-border Himalayan trade agreements and dry-port logistics. Over 18 years reporting on South Asian trade.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=260&auto=format&fit=crop&q=80'
    },
    {
      name: 'Ankit Ghimire',
      title: 'Macro Analytics Director',
      bio: 'Specialist in quantitative econometric modelling and cellular supply-chain metrics trackers. Leads our real-time interactive mapping desk.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=260&auto=format&fit=crop&q=80'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 font-sans text-left">
      
      {/* Editorial Header */}
      <div className="border-b border-border-warm dark:border-gray-800 pb-6 mb-8 text-left select-none">
        <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#5A6475] uppercase dark:text-gray-400 font-extrabold block">
          ABOUT NEPALECONOMY.COM
        </span>
        <h1 className="text-3xl sm:text-4.5xl font-serif font-black text-secondary-navy dark:text-white leading-tight tracking-tight mt-1 text-left">
          Editorial Creed & Desks
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6475] dark:text-gray-305 mt-2 max-w-2xl font-light text-left">
          Nepal's premier business and economic intelligence news portal, modeled after Bloomberg and The Economist.
        </p>
      </div>

      <div className="space-y-12 text-left animate-fade-in font-sans text-xs sm:text-sm leading-relaxed text-left">
        
        {/* Editorial Standards section */}
        <div className="space-y-4 text-left">
          <h3 className="font-serif font-bold text-lg sm:text-xl text-secondary-navy dark:text-accent-gold uppercase tracking-tight text-left">
            Institutional Editorial Standards
          </h3>
          <p className="text-gray-700 dark:text-gray-250 font-light font-sans text-left">
            NepalEconomy.com operates under strict guidelines of accuracy, analytical depth, and political non-partisanship. Our missions mandate dry factual reporting, quantitative indicators verification, and strict boundaries separating editorial research from commentary.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 select-none">
            <div className="p-4 bg-bg-ivory dark:bg-secondary-navy rounded-lg border border-border-warm dark:border-gray-800 text-left space-y-1">
              <span className="font-bold font-serif text-secondary-navy dark:text-gray-205 flex items-center gap-1.5 uppercase text-xs">
                <Shield className="w-4 h-4 text-primary-crimson" />
                <span>Editorial Independence</span>
              </span>
              <p className="text-[11.5px] leading-relaxed text-gray-500 font-light font-sans">
                No foreign sovereign actor, corporate syndicate, or political body directs our research frameworks.
              </p>
            </div>

            <div className="p-4 bg-bg-ivory dark:bg-secondary-navy rounded-lg border border-border-warm dark:border-gray-800 text-left space-y-1">
              <span className="font-bold font-serif text-secondary-navy dark:text-gray-205 flex items-center gap-1.5 uppercase text-xs">
                <Compass className="w-4 h-4 text-primary-crimson" />
                <span>Fact Guidelines Verifications</span>
              </span>
              <p className="text-[11.5px] leading-relaxed text-gray-500 font-light font-sans">
                Every macroeconomic ratio published is verified against official records from Central Statistical Agency parameters.
              </p>
            </div>
          </div>
        </div>

        {/* Board Profiles */}
        <div className="space-y-6 text-left">
          <h3 className="font-serif font-black text-lg sm:text-xl text-secondary-navy dark:text-accent-gold uppercase tracking-tight text-left select-none">
            Editorial Board Members
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {leadership.map((member, idx) => (
              <div key={idx} className="space-y-3.5 text-left group">
                <div className="w-full h-56 rounded-xl overflow-hidden shadow border border-border-warm dark:border-gray-800 select-none">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-[1.015] duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <h4 className="font-serif font-bold text-secondary-navy dark:text-white text-base text-left leading-none">
                    {member.name}
                  </h4>
                  <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-primary-crimson block select-none">
                    {member.title}
                  </span>
                  <p className="text-[12px] leading-relaxed text-gray-500 dark:text-gray-400 font-light text-left">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {styleRules}

        {/* Correction policies Block */}
        <div className="bg-bg-ivory dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 space-y-3 text-left">
          <h4 className="font-serif font-bold text-[#8B0000] text-sm uppercase tracking-wider text-left select-none">
            Corrections & Retractions Policy
          </h4>
          <p className="text-xs sm:text-[13px] leading-relaxed text-gray-600 dark:text-gray-300 font-light font-sans text-left">
            We are dedicated to accuracy. Whenever factual errors are discovered in our briefings or index logs, we correct the article text immediately. All past corrections are catalogued within our public correction journal, accessible at the Kathmandu level-4 administrative offices.
          </p>
          <div className="text-[10.5px] text-[#5A6475] font-mono select-none pt-1">
            REPORT AN ERROR: corrections@nepaleconomy.com
          </div>
        </div>

      </div>

    </div>
  );
}

const styleRules = (
  <style>{`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `}</style>
);
