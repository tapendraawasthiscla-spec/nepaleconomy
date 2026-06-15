import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, Eye, Sparkles, MessageCircle, Send, Globe, Trash2, ArrowRight } from 'lucide-react';
import { Article, Comment } from '../types';

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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newAuthor, setNewAuthor] = useState('');
  const [newText, setNewText] = useState('');
  const [errorWordLimit, setErrorWordLimit] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load custom comments for this article ID
  useEffect(() => {
    const stor = localStorage.getItem(`ne_comments_${article.id}`);
    if (stor) {
      try {
        setComments(JSON.parse(stor));
      } catch {
        setComments([]);
      }
    } else {
      // Setup some initial comments for realism
      const initial: Comment[] = [
        {
          id: `cmt-1-${article.id}`,
          author: "Rajan Bhandari",
          content: "Excellent analysis. The linkages between hydropower project investment and sovereign debt ratios must be examined in the next policy session.",
          date: "June 14, 2026"
        },
        {
          id: `cmt-2-${article.id}`,
          author: "Sita Pyakurel",
          content: "The agricultural inputs corridor stats resonate deeply with cold-storage networks in Terai. Glad to see serious economic journalism emerging.",
          date: "June 14, 2526"
        }
      ];
      localStorage.setItem(`ne_comments_${article.id}`, JSON.stringify(initial));
      setComments(initial);
    }
    
    // Increment views locally for visual progress feedback
    const originalViews = article.views;
    article.views = originalViews + 1;
    
    // Save views index in localStorage
    const storedArticlesStr = localStorage.getItem('ne_articles');
    if (storedArticlesStr) {
      try {
        const storedList: Article[] = JSON.parse(storedArticlesStr);
        const updated = storedList.map(a => {
          if (a.id === article.id) {
            return {
              ...a,
              views: a.views + 1
            };
          }
          return a;
        });
        localStorage.setItem('ne_articles', JSON.stringify(updated));
      } catch {
        // Keep
      }
    }

    // Scroll to the body top
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [article]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorWordLimit(false);
    setSuccess(false);

    if (!newAuthor.trim() || !newText.trim()) return;

    // Word limits check (Feature 10: Comments count limits)
    const wordCount = newText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 60) {
      setErrorWordLimit(true);
      return;
    }

    const newCommentObj: Comment = {
      id: `cmt-${Date.now()}`,
      author: newAuthor.trim(),
      content: newText.trim(),
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const updated = [newCommentObj, ...comments];
    setComments(updated);
    localStorage.setItem(`ne_comments_${article.id}`, JSON.stringify(updated));
    
    setNewText('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleRelatedClick = (art: Article) => {
    onSelectArticle(art);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerCategoryJump = (catName: string) => {
    if (onSelectCategory) {
      onSelectCategory(catName);
    }
  };

  // Convert markdown to markup elements for beautiful editorial text
  const parseMarkdownToHtml = (mdText: string): string => {
    if (!mdText) return '';
    let parsed = mdText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Subheadings ## -> H4
    parsed = parsed.replace(/^##\s+(.+)$/gm, '<h4 class="font-serif font-black text-[#8B0000] text-lg sm:text-xl mt-6 mb-2 border-l-4 border-primary-crimson pl-3 text-left">$1</h4>');
    // Subheadings ### -> H3
    parsed = parsed.replace(/^###\s+(.+)$/gm, '<h3 class="font-serif font-bold text-secondary-navy text-xl sm:text-2xl mt-8 mb-3 pb-1 border-b border-border-warm text-left">$1</h3>');
    // Bold tags
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-secondary-navy dark:text-white">$1</strong>');
    // Quotes / Blockquotes
    parsed = parsed.replace(/^["“](.*?)["”]$/gm, '<blockquote class="border-l-4 border-accent-gold bg-bg-ivory dark:bg-[#121A28] px-5 py-3 text-gray-750 dark:text-gray-300 italic text-[13px] sm:text-[14px] leading-relaxed my-4 text-left">$1</blockquote>');
    // Lists -> bullet targets
    parsed = parsed.replace(/^\s*-\s+(.+)$/gm, '<li class="list-disc ml-5 text-gray-800 dark:text-gray-300 text-xs sm:text-sm my-1.5 leading-relaxed text-left">$1</li>');

    // Paragraph groups
    return parsed.split('\n\n').map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<li')) {
        return trimmed;
      }
      return `<p class="text-xs sm:text-sm md:text-base text-gray-800 dark:text-gray-250 leading-relaxed sm:leading-loose mb-4.5 text-left font-light font-sans">${trimmed.replace(/\n/g, '<br/>')}</p>`;
    }).join('');
  };

  return (
    <article className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 text-left font-sans">
      
      {/* Back to newsroom top button */}
      <button
        onClick={onBack}
        className="group flex items-center gap-1.5 text-[#5A6475] dark:text-gray-400 font-mono text-xs uppercase tracking-wider mb-6 hover:text-primary-crimson dark:hover:text-amber-500 cursor-pointer select-none"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Return to newsroom</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 text-left">
        
        {/* Core Article Column Left Side (Span 8) */}
        <div className="lg:col-span-8 space-y-6 text-left">
          
          {/* Tags row */}
          <div className="flex items-center gap-2 select-none">
            <button
              onClick={() => triggerCategoryJump(article.category)}
              className="px-3 py-1 text-[10px] font-mono font-bold uppercase bg-primary-crimson text-white rounded cursor-pointer leading-none"
            >
              {article.category} Category
            </button>
            {article.isBreaking && (
              <span className="px-2.5 py-1 text-[10px] font-mono font-black uppercase tracking-wider bg-accent-gold text-secondary-navy rounded leading-none border border-accent-gold/40">
                {article.breakingLabel || 'BREAKING BRAND'}
              </span>
            )}
            <span className="text-xs text-text-secondary select-none font-mono">
              • {article.views} views recorded
            </span>
          </div>

          {/* Heading title */}
          <h1 className="text-2.5xl sm:text-4xl md:text-4.5xl font-serif font-black text-secondary-navy dark:text-white leading-tight tracking-tight mt-1 text-left">
            {article.title}
          </h1>

          {/* Byline Author Header Section */}
          <div className="flex items-center gap-3.5 border-y border-border-warm dark:border-gray-800 py-4 select-none">
            <img
              src={article.authorImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={article.author}
              className="w-11 h-11 rounded-full object-cover border border-accent-gold"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-0.5 text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-serif font-bold text-sm text-secondary-navy dark:text-white uppercase tracking-wide" style={{ fontVariant: 'small-caps' }}>
                  {article.author}
                </span>
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" title="Desk Verified Correspondent" />
              </div>
              <p className="text-[11px] text-[#5A6475] dark:text-gray-400 font-sans tracking-tight font-medium leading-none">
                {article.authorTitle || 'Senior Editorial Board Correspondent'}
              </p>
              <div className="flex items-center gap-2.5 text-[10.5px] text-[#5A6475] pt-0.5 font-mono select-none">
                <span className="flex items-center gap-1 font-bold">
                  <Calendar className="w-3 h-3 text-accent-gold" />
                  <span>{article.date}</span>
                </span>
                <span>•</span>
                <span className="font-bold">{article.readTime}</span>
              </div>
            </div>
          </div>

          {/* Main Cover Photo illustration */}
          <div className="w-full h-[220px] sm:h-[400px] rounded-xl overflow-hidden shadow-premium select-none border border-border-warm dark:border-gray-800 relative group">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover duration-500 transition-transform group-hover:scale-[1.015]"
              referrerPolicy="no-referrer"
            />
            {/* Ambient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
          </div>

          {/* Lead excerpt abstract */}
          <div className="bg-bg-ivory dark:bg-secondary-navy text-gray-850 dark:text-gray-200 py-3 px-5 border-l-4 border-primary-crimson text-sm sm:text-base leading-relaxed italic rounded-r-lg font-light">
            <span className="font-semibold text-secondary-navy dark:text-accent-gold uppercase tracking-wider font-mono text-[10px] block not-italic mb-1 select-none">Advisory Abstract:</span>
            "{article.excerpt}"
          </div>

          {/* Render Full long form editorial body markup details */}
          <div className="pt-3">
            <div 
              className="font-sans text-left space-y-4 text-xs sm:text-sm md:text-base dark:text-gray-205 leading-relaxed sm:leading-loose text-left"
              dangerouslySetInnerHTML={{
                __html: parseMarkdownToHtml(article.content || '')
              }}
            />
          </div>

          {/* Verified Institutional Sources & Citations list */}
          {article.sources && article.sources.length > 0 && (
            <div className="bg-bg-ivory dark:bg-dark-navy p-5 rounded-lg border border-border-warm dark:border-gray-800 select-none text-left">
              <h5 className="font-mono text-[9px] sm:text-[10px] font-black uppercase text-secondary-navy dark:text-accent-gold tracking-widest mb-2.5 text-left flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AUTHENICATED VERIFICATION REGISTRIES</span>
              </h5>
              <ol className="space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-sans leading-snug list-inside list-decimal text-left">
                {article.sources.map((src, index) => (
                  <li key={index} className="text-left font-light font-sans leading-relaxed">
                    {src} <span className="text-[10px] text-accent-gold font-mono uppercase font-bold pl-1.5">[CIT-REG{100 + index}]</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Peer Editorial Verification Stamp */}
          <div className="pt-8 border-t border-border-warm dark:border-gray-800 select-none">
            <div className="border border-green-500/30 bg-green-500/5 px-4.5 py-4 rounded-xl flex items-center gap-3 text-left">
              <Globe className="w-6 h-6 text-green-600 shrink-0" />
              <div className="text-left font-sans">
                <span className="block text-[10.5px] font-mono font-bold text-green-700 uppercase tracking-widest font-black leading-none mb-1 text-left">
                  VERIFIED ECONOMIC RECORD INTEGRITY
                </span>
                <p className="text-[11.5px] leading-relaxed text-gray-500 dark:text-gray-400 font-light text-left">
                  This dispatch has passed central editorial boards verification. Standard ratios conform strictly with the Ministry and Central Bank databases.
                </p>
              </div>
            </div>
          </div>

          {/* Comments Feed list and dispatch form */}
          <div className="pt-8 border-t border-border-warm dark:border-gray-800 text-left">
            <div id="comments-section-pane" className="flex items-center gap-2 mb-6 text-left select-none">
              <MessageCircle className="w-5.5 h-5.5 text-primary-crimson" />
              <h3 className="text-lg font-serif font-bold text-secondary-navy dark:text-white uppercase tracking-tight text-left">
                Discussion Board ({comments.length} entries)
              </h3>
            </div>

            {/* Submit comment Form */}
            <form onSubmit={handleCommentSubmit} className="bg-bg-ivory dark:bg-secondary-navy border border-border-warm dark:border-gray-800 p-5 rounded-xl space-y-3 mb-6 text-left font-sans text-xs">
              <span className="block text-[#5A6475] dark:text-accent-gold uppercase font-mono tracking-wider font-bold text-[9px] select-none text-left mb-1.5">
                Join the discussion (Compliance moderated)
              </span>

              {errorWordLimit && (
                <div className="p-3 bg-red-100 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 text-primary-crimson dark:text-red-300 rounded font-mono text-[10.5px] text-left">
                  ⚠️ <strong>Draft Limit exceeded:</strong> Your entry must not exceed 60 words. Keep it focused and analytical.
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded font-mono text-[10.5px] text-left uppercase">
                  ✓ Comment queued and published successfully.
                </div>
              )}

              <div className="text-left font-sans">
                <input
                  type="text"
                  required
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Your Name (e.g., Dr. Niranjan Shah)"
                  className="w-full px-3 py-2 bg-white dark:bg-dark-navy text-xs dark:text-white border border border-border-warm dark:border-gray-750 rounded focus:outline-none focus:border-accent-gold text-gray-800"
                />
              </div>

              <div className="text-left font-sans">
                <textarea
                  required
                  rows={2}
                  value={newText}
                  onChange={(e) => {
                    setNewText(e.target.value);
                    setErrorWordLimit(false);
                  }}
                  placeholder="Analytical observation... (Maximum 60 words compliance limit)"
                  className="w-full px-3 py-2 bg-white dark:bg-dark-navy text-xs dark:text-white border border border-border-warm dark:border-gray-750 rounded focus:outline-none focus:border-accent-gold text-gray-800"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 bg-primary-crimson hover:bg-primary-crimson/95 text-xs text-white px-4 py-2 rounded font-mono uppercase tracking-wider font-bold transition-all ml-auto block shrink-0 cursor-pointer text-center select-none"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Comment</span>
              </button>
            </form>

            {/* List and comments display */}
            <div className="space-y-4 text-left">
              {comments.length === 0 ? (
                <div className="p-6 bg-slate-50 dark:bg-[#121A28] border border-dashed border-border-warm dark:border-gray-800 text-center rounded text-xs text-gray-400 italic">
                  No public comments submitted on this brief yet.
                </div>
              ) : (
                comments.map((cmt) => (
                  <div key={cmt.id} className="p-4 bg-bg-ivory dark:bg-[#121A28] rounded-xl border border-border-warm dark:border-gray-800 text-left">
                    <div className="flex items-center gap-2 text-[10.5px] text-text-secondary">
                      <User className="w-3.5 h-3.5 text-accent-gold" />
                      <span className="font-bold text-primary-crimson dark:text-red-400 uppercase tracking-wide" style={{ fontVariant: 'small-caps' }}>
                        {cmt.author}
                      </span>
                      <span className="font-mono text-[9px] text-gray-400 dark:text-gray-500 font-bold ml-1">
                        {cmt.date}
                      </span>
                    </div>
                    <p className="text-xs text-text-primary dark:text-gray-300 font-sans leading-relaxed whitespace-pre-wrap mt-2.5 font-light">
                      {cmt.content}
                    </p>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* Sidebar Panel Right Side (Span 4) */}
        <div className="lg:col-span-4 space-y-8 text-left select-none">
          
          {/* Related Articles Widgets */}
          <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 shadow-premium text-left">
            <h4 className="font-serif font-black text-sm uppercase text-secondary-navy dark:text-accent-gold tracking-tight mb-4 text-left border-b border-border-warm dark:border-gray-850 pb-2 flex items-center gap-2 select-none">
              <span>Related Dispatch Links</span>
            </h4>

            {relatedArticles.length === 0 ? (
              <p className="text-[11px] text-text-secondary italic">No overlapping briefs found in current index.</p>
            ) : (
              <div className="space-y-4 text-left">
                {relatedArticles.slice(0, 4).map((art) => (
                  <div
                    key={art.id}
                    onClick={() => handleRelatedClick(art)}
                    className="group cursor-pointer flex gap-3 text-left items-start pb-4 border-b border-gray-100 last:border-none last:pb-0 font-sans"
                  >
                    <img 
                      src={art.imageUrl} 
                      className="w-16 h-12 object-cover rounded bg-slate-100 shrink-0 border border-gray-200" 
                      alt="" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <span className="block text-[8.5px] font-mono font-bold text-primary-crimson uppercase select-none">
                        {art.category}
                      </span>
                      <h5 className="font-serif font-bold text-[#111] dark:text-gray-100 text-xs line-clamp-2 leading-snug group-hover:text-primary-crimson dark:group-hover:text-accent-gold group-hover:underline transition-colors text-left">
                        {art.title}
                      </h5>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Global/Economic Policy Focus Widget card */}
          <div className="bg-dark-navy text-white p-6 rounded-xl border border-accent-gold/25 relative overflow-hidden text-left shadow-premium select-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none"></div>

            <span className="inline-block bg-primary-crimson text-white font-mono text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded border border-white/10 mb-3 leading-none">
              EDITORIAL ADVISER
            </span>
            <h5 className="font-serif font-black text-base text-gray-100 leading-tight">Sovereign Investment Pipeline Guidance</h5>
            <p className="text-xs text-gray-300 leading-relaxed font-sans font-light mt-2">
              For security considerations regarding international capital repatriation certificates or tax alignment schedules, contact our specialized desk at <b className="text-accent-gold font-bold font-sans">Level-4 National Stock House</b> directly.
            </p>
            
            <button 
              onClick={() => triggerCategoryJump('Policy')}
              className="mt-4 flex items-center gap-1.5 font-mono text-[10px] text-accent-gold hover:text-white font-black uppercase tracking-wider group cursor-pointer border-t border-accent-gold/15 pt-3 w-full text-left"
            >
              <span>Explore regulatory rules</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

        </div>

      </div>

    </article>
  );
}
