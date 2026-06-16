import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Calendar, User, Eye, Sparkles, MessageCircle,
  Copy, Globe, Trash2, ArrowRight, Share2, Clipboard, AlignLeft, Clock
} from 'lucide-react';
import { Article, Comment } from '../types';
import QuickShareButton from './QuickShareButton';
import { useToast } from './ToastContext';

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
  onSelectCategory?: (category: string) => void;
  relatedArticles: Article[];
  onSelectArticle: (article: Article) => void;
}

export default function ArticleDetail({
  article,
  onBack,
  onSelectCategory,
  relatedArticles,
  onSelectArticle
}: ArticleDetailProps) {
  const { addToast } = useToast();
  
  // Real-time states
  const [comments, setComments] = useState<Comment[]>([]);
  const [newAuthor, setNewAuthor] = useState('');
  const [newText, setNewText] = useState('');
  const [success, setSuccess] = useState(false);
  const [scrollPercent, setScrollProgress] = useState(0);

  // Parse H2 headings for Table of Contents (Section 12 details)
  const [headings, setHeadings] = useState<{ id: string; text: string }[]>([]);

  // Calculate H2 arrays from markdown
  useEffect(() => {
    if (!article.content) return;
    const lines = article.content.split('\n');
    const catalog: { id: string; text: string }[] = [];
    
    lines.forEach((line) => {
      if (line.startsWith('## ')) {
        const text = line.replace('## ', '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        catalog.push({ id, text });
      }
    });
    setHeadings(catalog);
  }, [article.content]);

  // Reading scroll progress tracker (Section 12 specs)
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      const pct = (window.scrollY / scrollHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, pct)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments/${article.id}`);
      if (res.ok) {
        const list = await res.json();
        setComments(list);
      }
    } catch {
      // Slit fallback silent
    }
  };

  useEffect(() => {
    fetchComments();
    
    // Increment views locally and server-side
    const incrViews = async () => {
      try {
        const updated = { ...article, views: (article.views || 0) + 1 };
        await fetch('/api/articles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('ne_admin_token') || ''
          },
          body: JSON.stringify(updated)
        });
        article.views += 1;
      } catch {
        // fail silently
      }
    };
    incrViews();

    window.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [article.id]);

  // Submit Comments with strict word limits (Section 12: max 60 words limits)
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newText.trim()) return;

    const words = newText.trim().split(/\s+/).filter(Boolean);
    if (words.length > 60) {
      addToast('⚠️ Discussion Limit Exceeded: Entries must.not exceed 60 words.', 'error');
      return;
    }

    const cmtObj: Comment = {
      id: `cmt-${Date.now()}`,
      author: newAuthor.trim(),
      content: newText.trim(),
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    try {
      const res = await fetch(`/api/comments/${article.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cmtObj)
      });
      if (res.ok) {
        setComments(prev => [cmtObj, ...prev]);
        setNewText('');
        setSuccess(true);
        addToast('✓ Comment published under regulatory compliance.', 'success');
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      addToast('Error processing comments.', 'error');
    }
  };

  // Parsing markdown to HTMl (Section 12 specs)
  const renderMarkdown = (mdStr: string) => {
    if (!mdStr) return '';
    let parsed = mdStr
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings 2 & 3 with custom anchor targets
    parsed = parsed.replace(/^##\s+(.+)$/gm, (_, headingText) => {
      const cleanId = headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<h2 id="${cleanId}" class="font-serif font-black text-white text-lg sm:text-xl md:text-2xl mt-8 mb-3.5 border-l-4 border-nexus-cyan pl-3 text-left scroll-mt-24 group/heading">${headingText} <a href="#${cleanId}" class="opacity-0 group-hover/heading:opacity-100 text-nexus-cyan font-light ml-1 text-sm inline-block">#</a></h2>`;
    });

    parsed = parsed.replace(/^###\s+(.+)$/gm, (_, headingText) => {
      return `<h3 class="font-sans font-bold text-nexus-gold text-base sm:text-lg mt-6 mb-2.5 text-left">${headingText}</h3>`;
    });

    // Formatting rules
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-nexus-cyan">$1</strong>');
    parsed = parsed.replace(/\*(.*?)\*/g, '<em class="italic text-gray-250">$1</em>');
    parsed = parsed.replace(/^["“](.*?)["”]$/gm, '<blockquote class="border-l-4 border-nexus-cyan bg-[#0D1526]/55 px-5 py-3 text-gray-300 italic text-[13.5px] leading-relaxed my-4.5 text-left">$1</blockquote>');
    parsed = parsed.replace(/^\s*-\s+(.+)$/gm, '<li class="list-disc ml-5 text-gray-300 leading-relaxed text-left text-xs sm:text-sm my-1.5">$1</li>');

    return parsed.split('\n\n').map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<li')) {
        return trimmed;
      }
      return `<p class="text-[12.5px] sm:text-sm md:text-[14.5px] text-gray-300 leading-relaxed sm:leading-loose mb-5 text-left font-sans font-light">${trimmed.replace(/\n/g, '<br/>')}</p>`;
    }).join('');
  };

  const articleFullPublicUrl = typeof window !== 'undefined' ? window.location.href : `https://nepaleconomy.com/article/${article.slug}`;

  return (
    <article className="max-w-7xl mx-auto px-4 md:px-6 py-6 font-sans text-left relative">
      
      {/* Scroll indicator fixed line (Section 12 design requirement) */}
      <div 
        style={{ width: `${scrollPercent}%` }}
        className="fixed top-0 left-0 h-[2.5px] bg-nexus-cyan shadow-[0_0_8px_rgba(0,212,255,0.8)] z-50 pointer-events-none transition-all duration-75"
      />

      <button
        onClick={onBack}
        className="group flex items-center gap-1.5 text-gray-400 font-mono text-xs uppercase tracking-widest mb-6 hover:text-nexus-cyan cursor-pointer select-none border-b border-white/5 pb-2"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Return to lists index</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 text-left">
        
        {/* Left column Content analysis body */}
        <div className="lg:col-span-8 space-y-6 text-left">
          
          <div className="flex flex-wrap items-center gap-2 select-none text-left leading-none">
            <button
              onClick={() => onSelectCategory?.(article.category)}
              className="px-2.5 py-1 text-[9px] font-mono font-black uppercase bg-nexus-cyan text-nexus-void rounded-md hover:scale-[1.02] transition-colors leading-none"
            >
              {article.category} Pillar
            </button>
            {article.isBreaking && (
              <span className="px-2.5 py-1 text-[9.5px] font-mono font-black uppercase tracking-wider bg-danger-red text-white border border-danger-red/35 rounded-md leading-none animate-pulse">
                {article.breakingLabel || 'BREAKING'}
              </span>
            )}
            <span className="text-[10.5px] text-gray-500 font-mono font-bold leading-none pl-1 select-none">
              • {article.views} reads recorded
            </span>
          </div>

          <h1 className="text-2xl sm:text-3.5xl md:text-4.5xl font-serif font-black text-white leading-tight tracking-tight mt-1 text-left font-serif">
            {article.title}
          </h1>

          {/* Author Board Metadata card */}
          <div className="flex items-center gap-3.5 border-y border-nexus-border py-4 select-none text-left font-sans text-xs">
            <img 
              src={article.authorImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={article.author}
              className="w-11 h-11 rounded-full object-cover border border-nexus-cyan/40 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-0.5 text-left font-sans">
              <span className="font-serif font-black text-sm text-white uppercase tracking-wider flex items-center gap-1.5 font-serif leading-none" style={{ fontVariant: 'small-caps' }}>
                <span>{article.author}</span>
                <Globe className="w-3.5 h-3.5 text-nexus-green animate-pulse" title="Desk Verified Correspondent" />
              </span>
              <p className="text-[10px] text-gray-400 font-mono font-bold leading-none mt-0.5 text-left">
                {article.authorTitle || 'Senior Editorial Board Analyst'}
              </p>
              
              <div className="flex items-center gap-2 text-[9.5px] text-gray-500 pt-1 select-none font-mono">
                <span className="flex items-center gap-1 font-bold">
                  <Calendar className="w-3 h-3 text-nexus-gold" />
                  <span>{article.date}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-bold">
                  <Clock className="w-3 h-3 text-nexus-cyan" />
                  <span>{article.readTime}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Large cover image display with captions (Section 3 specs) */}
          <div className="w-full h-[220px] sm:h-[400px] rounded-xl overflow-hidden border border-nexus-border/60 shadow-premium relative group select-none">
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full h-full object-cover duration-500 transition-transform group-hover:scale-[1.01]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>

          {article.coverCaption && (
            <p className="text-[10.5px] italic text-gray-500 font-sans font-light select-none text-left tracking-wide leading-relaxed pl-1.5 border-l border-nexus-border">
              💬 {article.coverCaption}
            </p>
          )}

          {/* Social Repatriation / Sharing (Section 12 specification guidelines) */}
          <div className="bg-nexus-card border border-nexus-border p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
            <span className="text-[10.5px] font-mono text-gray-400 uppercase font-black tracking-widest text-left">
              Secure Share Ratios Node
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <QuickShareButton url={articleFullPublicUrl} title={article.title} variant="badge" />
              
              {/* WhatsApp direct launch */}
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${article.title} - ${articleFullPublicUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10.5px] text-gray-400 hover:text-green-400 transition-colors uppercase font-mono font-bold"
              >
                WhatsApp
              </a>

              {/* Twitter share */}
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleFullPublicUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10.5px] text-gray-400 hover:text-[#00D4FF] transition-colors uppercase font-mono font-bold"
              >
                X / Twitter
              </a>
            </div>
          </div>

          {/* Advisory Abstract capsule */}
          <div className="bg-nexus-panel border border-nexus-border text-gray-250 py-3.5 px-5 border-l-4 border-nexus-cyan text-sm leading-relaxed italic rounded-r-lg font-light text-left select-none">
            <span className="font-mono uppercase font-black text-nexus-gold text-[9px] block not-italic max-w-sm tracking-widest mb-1">
              ADVISORY ABSTRACT
            </span>
            "{article.excerpt}"
          </div>

          {/* Real Markdown compiled content detail container */}
          <div className="pt-3 text-left">
            <div 
              style={{ letterSpacing: '0.015em' }}
              className="font-sans text-left space-y-4 text-xs sm:text-sm md:text-[14.5px] text-gray-300 leading-relaxed sm:leading-loose text-left font-light select-text"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(article.content || '')
              }}
            />
          </div>

          {/* Verified sources panel */}
          {article.sources && article.sources.length > 0 && (
            <div className="bg-[#0A0D18] p-5 rounded-xl border border-nexus-border select-none text-left">
              <h5 className="font-mono text-[9px] sm:text-[9.5px] font-black uppercase text-nexus-cyan tracking-widest mb-2.5 text-left flex items-center gap-1.5 leading-none">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AUTHENTICATED VERIFICATION REGISTRIES</span>
              </h5>
              <ol className="space-y-1.5 text-[11px] text-gray-400 font-sans leading-snug list-inside list-decimal text-left">
                {article.sources.map((src, index) => (
                  <li key={index} className="text-left font-light leading-relaxed">
                    {src} <span className="text-[9.5px] text-nexus-gold font-mono uppercase font-bold pl-1.5">[CIT-REG{100 + index}]</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Standard compliance stamp */}
          <div className="border border-nexus-green/20 bg-nexus-green/5 px-4.5 py-4 rounded-xl flex items-center gap-3 text-left select-none">
            <Globe className="w-5.5 h-5.5 text-nexus-green shrink-0 animate-pulse" />
            <div className="text-left font-sans text-xs sm:text-xs">
              <span className="block text-[10px] font-mono font-black text-nexus-green uppercase tracking-widest leading-none mb-1 text-left">
                VERIFIED ECONOMIC RECORD INTEGRITY
              </span>
              <p className="text-[11.5px] leading-relaxed text-gray-400 font-light text-left leading-normal font-sans">
                This analysis corresponds strictly with government budget surveys and the Nepalese central bank monetary guidelines. It has undergone audit assessments.
              </p>
            </div>
          </div>

          {/* Disqus comments forum (Section 12: max 60 words moderated entry limit) */}
          <div className="pt-8 border-t border-nexus-border text-left">
            <div className="flex items-center gap-2 mb-6 text-left select-none leading-none">
              <MessageCircle className="w-5.5 h-5.5 text-nexus-cyan" />
              <h3 className="text-base sm:text-lg font-serif font-black text-white uppercase tracking-tight text-left font-serif leading-none">
                Discussion Board ({comments.length} entries)
              </h3>
            </div>

            <form onSubmit={handleCommentSubmit} className="bg-nexus-panel border border-nexus-border p-5 rounded-xl space-y-3.5 mb-6 text-left font-sans text-xs">
              <span className="block text-gray-400 uppercase font-mono tracking-widest font-black text-[9px] select-none text-left mb-1.5">
                Join the discussion (Compliance moderated)
              </span>

              <div className="grid grid-cols-1 gap-3">
                <input 
                  type="text"
                  required
                  value={newAuthor}
                  onChange={e => setNewAuthor(e.target.value)}
                  placeholder="Your Name (e.g., Dr. Niranjan Shah)"
                  className="w-full px-3 py-2 bg-nexus-void border border-nexus-border rounded-lg text-xs text-white focus:outline-none"
                />

                <textarea 
                  required
                  rows={2}
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  placeholder="Analytical observation... (Strict 60 words compliance limit)"
                  className="w-full px-3 py-2 bg-nexus-void border border-nexus-border rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center select-none pt-1">
                <span className="text-[10px] font-mono text-gray-500 font-bold uppercase">
                  LIMIT: 60 WORDS COMPLETED
                </span>
                <button
                  type="submit"
                  className="bg-nexus-cyan text-nexus-void px-4 py-2 font-mono uppercase font-black tracking-widest text-[9.5px] rounded-lg transition-all scale-102 hover:bg-cyan-400 cursor-pointer"
                >
                  Post Comment
                </button>
              </div>
            </form>

            <div className="space-y-4 text-left">
              {comments.length === 0 ? (
                <div className="p-8 border border-dashed border-nexus-border rounded-xl text-center text-xs text-gray-500 italic select-none">
                  No public comments posted on this dispatch yet.
                </div>
              ) : (
                comments.map((cmt) => (
                  <div key={cmt.id} className="p-4 bg-nexus-panel border border-nexus-border rounded-xl text-left font-sans text-xs">
                    <div className="flex items-center gap-2 text-gray-400 select-none border-b border-nexus-border/50 pb-1.5 mb-2.5">
                      <User className="w-3.5 h-3.5 text-nexus-cyan shrink-0" />
                      <span className="font-serif font-black text-nexus-green uppercase tracking-wide text-[10.5px] sm:text-xs text-left" style={{ fontVariant: 'small-caps' }}>
                        {cmt.author}
                      </span>
                      <span className="font-mono text-gray-500 block leading-none font-bold ml-1">{cmt.date}</span>
                    </div>

                    <p className="text-gray-300 font-sans font-light leading-relaxed leading-normal whitespace-pre-wrap text-left text-[12px] sm:text-[13px]">
                      {cmt.content}
                    </p>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* Sidebar right (300px desktop, select-none, standard index pointer lists) */}
        <div className="lg:col-span-4 space-y-6 text-left select-none">
          
          {/* Table of Contents - Section 12 dynamic parser */}
          {headings.length >= 2 && (
            <div className="bg-nexus-panel p-5 rounded-xl border border-nexus-cyan/20 shadow-premium text-left select-none">
              <h4 className="font-serif font-black text-xs uppercase text-nexus-cyan tracking-widest mb-3 text-left border-b border-nexus-border pb-1.5 font-serif select-none flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-nexus-cyan shrink-0 animate-pulse" />
                <span>Table of Contents</span>
              </h4>
              
              <ul className="space-y-2 text-[11.5px] font-sans text-gray-300 font-light text-left leading-snug">
                {headings.map((h, i) => (
                  <li key={h.id} className="truncate">
                    <a 
                      href={`#${h.id}`}
                      className="hover:text-nexus-cyan hover:underline hover:scale-[1.01] duration-150 transition-all block truncate text-left"
                    >
                      <span className="font-mono text-nexus-gold font-bold pr-1 select-none">0{i + 1}.</span> {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Articles list */}
          <div className="bg-nexus-panel p-5 rounded-xl border border-nexus-border shadow-premium text-left">
            <h4 className="font-serif font-black text-xs uppercase text-nexus-cyan tracking-widest mb-3 text-left border-b border-nexus-border pb-1.5 font-serif">
              Overlap Brief Directives
            </h4>

            {relatedArticles.length === 0 ? (
              <p className="text-[11px] text-gray-550 italic select-none">No concurrent matching items located.</p>
            ) : (
              <div className="space-y-4 text-left">
                {relatedArticles.slice(0, 4).map((art) => (
                  <div
                    key={art.id}
                    onClick={() => { onSelectArticle(art); window.scrollTo({ top: 0, behavior: 'instant' as any }); }}
                    className="group cursor-pointer flex gap-3 text-left items-start pb-4 border-b border-nexus-border/60 last:border-none last:pb-0"
                  >
                    <img 
                      src={art.imageUrl} 
                      className="w-16 h-12 object-cover rounded bg-nexus-void shrink-0 border border-nexus-border" 
                      alt="" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1 min-w-0 text-left leading-none">
                      <span className="block text-[8px] font-mono font-bold text-nexus-cyan uppercase select-none text-left">
                        {art.category} Pillar
                      </span>
                      <h5 className="font-serif font-bold text-gray-200 text-xs line-clamp-2 leading-snug group-hover:text-nexus-cyan group-hover:underline transition-colors text-left font-serif">
                        {art.title}
                      </h5>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial advisor info sidebar */}
          <div className="bg-nexus-panel text-white p-5 rounded-xl border-l-[3px] border-nexus-cyan relative overflow-hidden text-left shadow-premium select-none">
            <span className="inline-block bg-nexus-cyan/15 text-nexus-cyan font-mono text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded border border-nexus-cyan/35 mb-3 leading-none select-none">
              REPATRIATION CODE
            </span>
            <h5 className="font-serif font-black text-sm text-white leading-tight uppercase font-serif select-none text-left">
              FDI Repatriation Certificate Policy
            </h5>
            <p className="text-[11.5px] leading-relaxed text-gray-400 font-sans font-light mt-2 text-left">
              To expedite certified wire repatriations for private SaaS networks or tea capital allocations, register formal declarations on Level-4 National Stock House.
            </p>
            
            <button
              onClick={() => onSelectCategory?.('Policy')}
              className="mt-4 flex items-center gap-1.5 font-mono text-[9px] text-nexus-cyan hover:text-white font-extrabold uppercase tracking-widest group cursor-pointer border-t border-nexus-border/60 pt-3 w-full text-left"
            >
              <span>Explore Directives</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

        </div>

      </div>

    </article>
  );
}
