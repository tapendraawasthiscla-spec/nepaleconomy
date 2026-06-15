import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

interface ContactPageProps {
  onAddTip: (tip: { name: string; email: string; subject: string; message: string; date: string }) => void;
}

export default function ContactPage({ onAddTip }: ContactPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('ANONYMOUS REVENUE SIGNAL');
  const [message, setMessage] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !subject.trim()) return;

    setSubmitting(true);
    
    setTimeout(() => {
      const finalName = isAnonymous ? 'Anonymous Source' : (name.trim() || 'Anonymous Source');
      const finalEmail = isAnonymous ? 'encrypted-proxy@nepaleconomy.net' : (email.trim() || 'anonymous@nepaleconomy.net');

      const tipObj = {
        name: finalName,
        email: finalEmail,
        subject: subject.trim(),
        message: message.trim(),
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      };

      // Append to local tips storage
      try {
        const stored = localStorage.getItem('ne_tips') || '[]';
        const parsed = JSON.parse(stored);
        const updated = [tipObj, ...parsed];
        localStorage.setItem('ne_tips', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }

      onAddTip(tipObj);

      setSubmitting(false);
      setSuccess(true);
      
      // Resets
      setName('');
      setEmail('');
      setMessage('');
      setSubject('ANONYMOUS REVENUE SIGNAL');

      setTimeout(() => {
        setSuccess(false);
      }, 3500);

    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 font-sans text-left">
      
      {/* Page Header */}
      <div className="border-b border-border-warm dark:border-gray-800 pb-5 mb-8 text-left select-none">
        <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#5A6475] uppercase dark:text-gray-400 font-extrabold block">
          COMMUNICATIONS & PRESS CHANNELS
        </span>
        <h1 className="text-3xl sm:text-4.5xl font-serif font-black text-secondary-navy dark:text-white leading-tight tracking-tight mt-1 text-left">
          Contact Our Newsroom
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6475] dark:text-gray-305 mt-2 max-w-2xl font-light text-left">
          Submit secure intelligence signals, news tips, correction alerts, or register institutional media credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
        
        {/* Left Side: Contact details (span 5) */}
        <div className="md:col-span-5 space-y-6 text-left select-none font-sans">
          
          <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium space-y-5">
            <h3 className="font-serif font-bold text-[#8B0000] text-sm uppercase tracking-wider text-left pb-1 border-b">
              Correspondence Desk
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent-gold shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-left">
                  <span className="block font-bold text-secondary-navy dark:text-white font-sans uppercase text-[10px]">Headquarters Office</span>
                  <p className="text-[#5A6475] dark:text-gray-350 leading-relaxed font-light">
                    Level-4 National Stock House,<br />Kathmandu, Nepal
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-accent-gold shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-left">
                  <span className="block font-bold text-secondary-navy dark:text-white font-sans uppercase text-[10px]">News Tips & Intelligence</span>
                  <p className="text-[#5A6475] dark:text-gray-350 font-light font-sans">
                    intelligence@nepaleconomy.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-accent-gold shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-left">
                  <span className="block font-bold text-secondary-navy dark:text-white font-sans uppercase text-[10px]">Administrative Hotline</span>
                  <p className="text-[#5A6475] dark:text-gray-350 font-light font-mono">
                    +977 (1) 420-1928 / 420-1929
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark-navy text-white p-6 rounded-xl border border-accent-gold/25 relative overflow-hidden text-left shadow-premium select-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none"></div>

            <span className="inline-block bg-primary-crimson text-white font-mono text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded border border-white/10 mb-3 leading-none">
              INSTITUTIONAL
            </span>
            <h5 className="font-serif font-black text-base text-gray-105 leading-tight">Media Credential Submissions</h5>
            <p className="text-xs text-gray-300 leading-relaxed font-sans font-light mt-2">
              Corporate representatives, investment banks, and accredited research desks can submit formal credentials files at the Level-4 headquarters. Approved credentials receive access keys.
            </p>
          </div>

        </div>

        {/* Right Side whistleblower form (span 7) */}
        <div className="md:col-span-7 space-y-8 text-left animate-fade-in">
          
          <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border-2 border-primary-crimson shadow-premium">
            <div className="flex items-center gap-2 mb-2 select-none">
              <ShieldAlert className="w-5.5 h-5.5 text-primary-crimson animate-pulse" />
              <h3 className="font-serif font-black text-secondary-navy dark:text-white uppercase tracking-tight text-sm sm:text-base text-left">
                Anonymous News Tip Box
              </h3>
            </div>
            
            <p className="text-[11.5px] text-text-secondary dark:text-gray-305 font-sans leading-relaxed mb-6 font-light text-left">
              Submit anonymous tips or exclusive news leads regarding banking, policy reforms, or hydropower allocations. Your submissions are kept private and secure.
            </p>

            {success ? (
              <div className="p-6 text-center space-y-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/35 rounded-lg animate-fade-in">
                <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-emerald-900 dark:text-emerald-303 text-sm">
                    News Tip Submitted
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-normal font-light">
                    The news tip has been saved securely to our anonymous news tip inbox. Thank you for helping keep Nepal's financial sector transparent and accountable.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs text-left">
                
                {/* Anonymous Selector Toggle */}
                <div className="bg-bg-ivory dark:bg-[#121A28] p-3.5 rounded-lg border border-gray-150 dark:border-gray-850 flex items-center justify-between select-none">
                  <div>
                    <span className="block text-[#111] dark:text-gray-105 font-mono uppercase text-[9px] font-bold text-left">
                      Maintain Full Anonymity
                    </span>
                    <span className="text-[9.5px] text-gray-500 font-sans block leading-normal mt-0.5 text-left font-light">
                      Hides name, mail, and stamps secure proxy tokens instead.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-primary-crimson focus:ring-primary-crimson border-gray-300 rounded cursor-pointer"
                  />
                </div>

                {!isAnonymous && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left animate-fade-in">
                    <div className="text-left font-sans">
                      <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-bold tracking-tight text-[9px] mb-1">Your Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. Niranjan Shah"
                        className="w-full px-3 py-2 bg-bg-ivory dark:bg-[#121A28] border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold dark:text-white"
                      />
                    </div>
                    <div className="text-left font-sans">
                      <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-bold tracking-tight text-[9px] mb-1">Secure Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="niranjan@shah.org"
                        className="w-full px-3 py-2 bg-bg-ivory dark:bg-[#121A28] border border-border-warm dark:border-gray-755 text-xs rounded focus:outline-none focus:border-accent-gold dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="text-left font-sans">
                  <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-bold tracking-tight text-[9px] mb-1">Subject Matter *</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded font-bold text-gray-800 dark:text-white"
                  >
                    <option value="ANONYMOUS REVENUE SIGNAL">ANONYMOUS REVENUE SIGNAL</option>
                    <option value="REGULATORY CORRUPTION REPORT">REGULATORY CORRUPTION REPORT</option>
                    <option value="COMMODITY CORRIDOR INTERFERENCE">COMMODITY CORRIDOR INTERFERENCE</option>
                    <option value="EDITORIAL CORRECTION REQUEST">EDITORIAL CORRECTION REQUEST</option>
                    <option value="GENERAL PRESS INQUIRY">GENERAL PRESS INQUIRY</option>
                  </select>
                </div>

                <div className="text-left font-sans">
                  <label className="block text-secondary-navy dark:text-gray-200 uppercase font-mono font-bold tracking-tight text-[9px] mb-1">Information / Leads *</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide full factual properties. We advise inclusion of project titles, regulatory codes, and clear timestamps where applicable..."
                    className="w-full px-3 py-2 bg-bg-ivory dark:bg-dark-navy border border-border-warm dark:border-gray-750 text-xs rounded focus:outline-none focus:border-accent-gold dark:text-white"
                  />
                </div>

                {submitting ? (
                  <div className="p-3 bg-accent-gold/10 border border-accent-gold text-center rounded text-xs select-none">
                    <div className="flex items-center gap-2 justify-center font-mono font-bold text-secondary-navy animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-primary-crimson" />
                      <span>SUBMITTING NEWS TIP...</span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-primary-crimson hover:bg-black text-white font-mono uppercase font-bold py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md text-center text-xs font-semibold"
                  >
                    <Send className="w-4 h-4 text-accent-gold" />
                    <span>Submit News Tip</span>
                  </button>
                )}

              </form>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
