import React, { useState } from 'react';
import { Mail, Phone, MapPin, ShieldCheck, ArrowUpRight, Facebook, Twitter, Linkedin, Youtube, Instagram } from 'lucide-react';
import { useToast } from './ToastContext';

interface FooterProps {
  setActivePage: (page: string) => void;
  setIsAdminMode: (mode: boolean) => void;
}

export default function Footer({ setActivePage, setIsAdminMode }: FooterProps) {
  const { addToast } = useToast();
  const [emailSub, setEmailSub] = useState('');
  const [success, setSuccess] = useState(false);

  const triggerPage = (page: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActivePage(page);
    setIsAdminMode(false);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSub.trim() || !emailSub.includes('@')) {
      addToast('Please enter a valid secure email.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailSub.trim() })
      });
      if (res.ok) {
        setSuccess(true);
        addToast('Added email to subscriber list!', 'success');
        setEmailSub('');
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch {
      addToast('System pipeline busy.', 'error');
    }
  };

  return (
    <footer className="bg-nexus-void text-white font-sans border-t-2 border-nexus-cyan relative z-10 select-none text-left">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-nexus-cyan/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16 relative z-10">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 text-left">
          
          {/* Column 1: Logo, bio, social icons */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => triggerPage('home')}>
              <div className="w-[18px] h-[18px] bg-nexus-cyan rounded flex items-center justify-center text-[10px] text-nexus-void font-bold animate-pulse text-center">NE</div>
              <span className="text-md sm:text-lg font-serif font-black text-white hover:text-nexus-cyan transition-colors">
                Nepal<span className="text-nexus-cyan">Economy</span>
              </span>
            </div>
            
            <p className="text-[11.5px] leading-relaxed text-gray-400 font-sans font-light text-left">
              Nepal's premium business and economic intelligence portal delivering factual economic metrics, hydropower transaction audits, tax statutes libraries, and investigative dispatches.
            </p>

            <div className="flex items-center gap-3.5 pt-2 select-none text-left">
              <a href="#" className="p-1 px-[7px] bg-[#121A28] border border-nexus-border hover:border-nexus-cyan rounded-md text-gray-400 hover:text-nexus-cyan transition-all text-xs" title="Facebook">
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="p-1 px-[7px] bg-[#121A28] border border-nexus-border hover:border-nexus-cyan rounded-md text-gray-400 hover:text-nexus-cyan transition-all text-xs" title="Twitter/X">
                <Twitter className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="p-1 px-[7px] bg-[#121A28] border border-nexus-border hover:border-nexus-cyan rounded-md text-gray-400 hover:text-nexus-cyan transition-all text-xs" title="LinkedIn">
                <Linkedin className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="p-1 px-[7px] bg-[#121A28] border border-nexus-border hover:border-nexus-cyan rounded-md text-gray-400 hover:text-nexus-cyan transition-all text-xs" title="YouTube">
                <Youtube className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="p-1 px-[7px] bg-[#121A28] border border-nexus-border hover:border-nexus-cyan rounded-md text-gray-400 hover:text-nexus-cyan transition-all text-xs" title="Instagram">
                <Instagram className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Column 2: News */}
          <div className="space-y-4 text-left">
            <h4 className="text-[10px] uppercase font-mono tracking-widest text-nexus-cyan border-b border-nexus-border pb-1.5 font-black text-left">
              News Desks
            </h4>
            <ul className="space-y-2 text-[12px] text-gray-300 font-sans font-light text-left select-none">
              <li><button onClick={() => triggerPage('economy')} className="hover:text-nexus-cyan transition-colors text-left cursor-pointer">Macro Economy</button></li>
              <li><button onClick={() => triggerPage('business')} className="hover:text-nexus-cyan transition-colors text-left cursor-pointer">Commerce &amp; Ratios</button></li>
              <li><button onClick={() => triggerPage('policy')} className="hover:text-nexus-cyan transition-colors text-left cursor-pointer">Policy Ordinances</button></li>
              <li><button onClick={() => triggerPage('startups')} className="hover:text-nexus-cyan transition-colors text-left cursor-pointer">Kathmandu SaaS Exports</button></li>
              <li><button onClick={() => triggerPage('global')} className="hover:text-nexus-cyan transition-colors text-left cursor-pointer">Global NRN Capital</button></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="space-y-4 text-left">
            <h4 className="text-[10px] uppercase font-mono tracking-widest text-nexus-cyan border-b border-nexus-border pb-1.5 font-black text-left">
              Resources
            </h4>
            <ul className="space-y-2 text-[12px] text-gray-300 font-sans font-light text-left select-none">
              <li><button onClick={() => triggerPage('reports')} className="hover:text-nexus-cyan transition-colors text-left cursor-pointer">Advisory Reports</button></li>
              <li><button onClick={() => triggerPage('downloads')} className="hover:text-nexus-cyan transition-colors text-left cursor-pointer">Downloads &amp; Statues</button></li>
              <li><button onClick={() => triggerPage('contact')} className="hover:text-nexus-cyan transition-colors text-left cursor-pointer">Contact &amp; Tip Box</button></li>
              <li><button onClick={() => triggerPage('about')} className="hover:text-nexus-cyan transition-colors text-left cursor-pointer">About Us</button></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="space-y-4 text-left">
            <h4 className="text-[10px] uppercase font-mono tracking-widest text-nexus-cyan border-b border-nexus-border pb-1.5 font-black text-left">
              Follow Briefs
            </h4>
            <p className="text-[11.5px] leading-relaxed text-gray-400 font-sans font-light text-left">
              Join thousands of central banking officers and asset managers receiving daily intelligence indices.
            </p>

            {success ? (
              <div className="p-2.5 bg-nexus-green/10 border border-nexus-green/20 text-nexus-green text-[10px] font-mono rounded-lg">
                Email added successfully. Thank you.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-1.5 select-none w-full">
                <input 
                  type="email"
                  required
                  placeholder="name@nrb.gov.np"
                  value={emailSub}
                  onChange={e => setEmailSub(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-nexus-void border border-nexus-border text-xs rounded-lg text-white focus:outline-none placeholder-gray-650 min-w-0"
                />
                <button
                  type="submit"
                  className="bg-nexus-cyan text-nexus-void hover:bg-cyan-400 font-mono text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer text-center"
                >
                  Join
                </button>
              </form>
            )}

            <div className="flex items-center gap-1.5 text-gray-500 text-[9.5px] font-mono select-none pt-1">
              <ShieldCheck className="w-4 h-4 text-nexus-green shrink-0" />
              <span>SSL ENCRYPTED DELIVERY</span>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-nexus-border flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-sans text-gray-500">
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center sm:justify-start">
            <span>© 2026 NepalEconomy.com. All Rights Reserved.</span>
            <span>|</span>
            <button onClick={() => triggerPage('about')} className="hover:text-nexus-cyan cursor-pointer font-light">Privacy Guidelines</button>
            <span>|</span>
            <button onClick={() => triggerPage('about')} className="hover:text-nexus-cyan cursor-pointer font-light">Corrections</button>
          </div>

          <button 
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'instant' as any });
              setIsAdminMode(false);
              addToast('Click "Studio" in header and provide your admin passkey.', 'info');
            }}
            className="text-nexus-cyan hover:underline font-mono uppercase font-black tracking-widest text-[9.5px] cursor-pointer"
          >
            Admin Login
          </button>
        </div>

      </div>

    </footer>
  );
}
