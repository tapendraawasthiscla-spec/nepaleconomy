import React, { useState, useRef } from 'react';
import {
  X, Check, Sparkles, Upload, FileText, ArrowRight, ArrowLeft,
  RefreshCw, Newspaper, Edit3, Eye, FileCheck
} from 'lucide-react';
import { Article, ArticleCategory } from '../types';
import { useToast } from './ToastContext';

interface QuickPostWizardProps {
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function QuickPostWizard({ onClose, onSaveSuccess }: QuickPostWizardProps) {
  const { addToast } = useToast();
  const fileCoverRef = useRef<HTMLInputElement>(null);
  const fileThumbRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ArticleCategory>('Economy');
  
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80');
  const [thumbUrl, setFormThumbUrl] = useState('');
  
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [tags, setFormTags] = useState<string[]>([]);
  const [sources, setSources] = useState('Newsroom Editorial Team\nMinistry of Finance guidelines');

  // STEP 1 Action: Auto co-author with Gemini
  const handleAIGenerateStep1 = async () => {
    if (!title.trim()) {
      addToast('Please enter an outline title first.', 'error');
      return;
    }
    setLoading(true);
    addToast('Contacting Sovereign Gemini AI desk for composition...', 'info');

    try {
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('ne_admin_token') || ''
        },
        body: JSON.stringify({ prompt: title.trim(), category })
      });
      if (!res.ok) throw new Error();
      const payload = await res.json();
      if (payload.success && payload.article) {
        setContentMarkdown(payload.article.content || '');
        setExcerpt(payload.article.excerpt || '');
        setMetaDescription(payload.article.metaDescription || '');
        setFormTags(payload.article.tags || [category]);
        addToast('✓ Gemini Co-Author draft loaded! Progressing to images...', 'success');
        setStep(2);
      }
    } catch {
      // Fallback
      setContentMarkdown(`## Policy Alignments on ${title}\n\nThis is a standard investigative report regarding ${title} inside Nepal's economic corridors.`);
      setExcerpt(`Analytical assessment review detailing key indicators and capital movements regarding ${title}.`);
      setMetaDescription(`Investigations and reports detailing ${title}.`);
      setFormTags([category, 'Nepal']);
      addToast('Constructed structural baseline outline draft. Progressing to step 2.', 'success');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 Image uploads
  const handleCoverUploadWeb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': localStorage.getItem('ne_admin_token') || '' },
        body: formData
      });
      if (!res.ok) throw new Error();
      const payload = await res.json();
      setCoverUrl(payload.file.url);
      addToast('✓ Main cover image uploaded!', 'success');
    } catch {
      addToast('Cover image upload failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbUploadWeb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': localStorage.getItem('ne_admin_token') || '' },
        body: formData
      });
      if (!res.ok) throw new Error();
      const payload = await res.json();
      setFormThumbUrl(payload.file.url);
      addToast('✓ List thumbnail customized!', 'success');
    } catch {
      addToast('Thumbnail template upload failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 Publish
  const handlePublishNow = async (statusOverride: 'published' | 'draft') => {
    setLoading(true);
    const slugified = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newDispatch: Article = {
      id: `art-q-${Date.now()}`,
      title: title.trim(),
      excerpt: excerpt.trim() || 'Custom economic research bulletin brief representation.',
      content: contentMarkdown.trim() || 'No body text supplied.',
      category,
      author: 'NepalEconomy Newsdesk',
      authorTitle: 'Senior Sovereign Correspondent',
      imageUrl: coverUrl,
      thumbnailUrl: thumbUrl || coverUrl, // fallback cropcover logic (Section 3 specs)
      status: statusOverride,
      slug: slugified,
      metaDescription: metaDescription || excerpt,
      tags,
      sources: sources.split('\n').filter(Boolean),
      views: 0,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      readTime: '3 min read'
    };

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('ne_admin_token') || ''
        },
        body: JSON.stringify(newDispatch)
      });

      if (res.ok) {
        addToast(`✓ Dispatch Published! Live sitemaps updated successfully.`, 'success');
        onSaveSuccess();
        onClose();
      } else {
        addToast('Invalid admin credentials.', 'error');
      }
    } catch {
      addToast('Database connection failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0F1E]/95 backdrop-blur-sm flex items-center justify-center p-4 select-none text-left pointer-events-auto">
      <div className="bg-nexus-panel border border-nexus-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-left">
        
        {/* Header progress line indicator */}
        <div className="h-1 w-full bg-nexus-border relative select-none">
          <div 
            className="absolute top-0 left-0 h-full bg-nexus-cyan transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="px-6 py-4 border-b border-nexus-border bg-nexus-void flex items-center justify-between select-none">
          <div className="text-left font-sans leading-none">
            <span className="text-[10px] font-mono tracking-widest text-nexus-cyan uppercase font-black">
              NEPALECONOMY RAPID PROCESSOR • STEP {step} OF 3
            </span>
            <h3 className="text-sm font-serif font-black text-white uppercase mt-1 leading-none font-serif">
              {step === 1 && 'Step 1: Outlining dispatch topic'}
              {step === 2 && 'Step 2: Dual Images synchronization'}
              {step === 3 && 'Step 3: Preflight check & Pub'}
            </h3>
          </div>

          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-left font-sans">
          
          {/* STEP 1 SURFACE */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in text-left">
              <div className="text-left space-y-1.5 font-sans">
                <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px]">
                  What's the main headline story summary? *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g., Nepal exports record Tea volumes worth 1.5 Billion in Q1..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 h-12 bg-nexus-void border border-nexus-border text-sm rounded-xl text-white font-serif font-bold placeholder-gray-600 focus:outline-none focus:border-nexus-cyan"
                />
              </div>

              {/* Category Pills Selector */}
              <div className="text-left font-sans space-y-1.5">
                <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px]">
                  Select Sector Category *
                </label>
                <div className="grid grid-cols-5 gap-2 select-none leading-none font-mono text-[9px] uppercase font-bold text-center">
                  {(['Economy', 'Business', 'Policy', 'Startups', 'Global'] as ArticleCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-2 rounded-lg border transition-all cursor-pointer ${
                        category === cat 
                          ? 'bg-nexus-cyan border-nexus-cyan text-nexus-void' 
                          : 'bg-nexus-void border-nexus-border text-gray-500 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Easiest choice split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 select-none pt-2 text-left">
                
                <button
                  type="button"
                  disabled={loading || !title.trim()}
                  onClick={handleAIGenerateStep1}
                  className="p-5 rounded-xl border border-nexus-cyan/40 bg-nexus-cyan/5 hover:bg-nexus-cyan/10 hover:border-nexus-cyan text-left select-none space-y-2 cursor-pointer transition-all duration-200"
                >
                  <Sparkles className="w-6 h-6 text-nexus-cyan animate-pulse" />
                  <div className="text-left font-sans">
                    <span className="block text-[10px] font-mono tracking-widest text-[#00D4FF] font-black uppercase leading-none mb-1">
                      Gemini Co-Author
                    </span>
                    <p className="text-[10px] leading-relaxed text-gray-400 font-light font-sans text-left">
                      Generate full sections, tag arrays, and captions based strictly on standard MoF templates. Takes ~10s.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!title.trim()}
                  onClick={() => {
                    setContentMarkdown(`## Executive summary on ${title}\n\nAdd content details here...`);
                    setExcerpt(`Brief analysis on ${title}.`);
                    setMetaDescription(`Brief news brief on ${title}.`);
                    setStep(2);
                  }}
                  className="p-5 rounded-xl border border-nexus-border hover:border-gray-500 bg-nexus-void text-left select-none space-y-2 cursor-pointer transition-all duration-200"
                >
                  <Edit3 className="w-6 h-6 text-gray-400" />
                  <div className="text-left font-sans">
                    <span className="block text-[10px] font-mono tracking-widest text-white uppercase font-black leading-none mb-1">
                      Write manually
                    </span>
                    <p className="text-[10px] leading-relaxed text-gray-500 font-light font-sans text-left">
                      Proceed to next step where you can drag images and finalize editing attributes yourself.
                    </p>
                  </div>
                </button>

              </div>
            </div>
          )}

          {/* STEP 2 IMAGES ACCUMULATION */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in text-left">
              
              <div className="text-left space-y-2">
                <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px] select-none text-left">
                  Large Cover Image Asset *
                </label>
                
                <div 
                  className="border-2 border-dashed border-nexus-border rounded-xl p-5 bg-nexus-void hover:border-nexus-cyan flex flex-col justify-center items-center text-center cursor-pointer select-none"
                  onClick={() => fileCoverRef.current?.click()}
                >
                  <Upload className="w-6 h-6 text-gray-405 mx-auto mb-1.5 animate-bounce-short" />
                  <span className="font-bold text-white text-[11px] block">Upload full cover photo</span>
                  <span className="text-[10px] text-gray-500 mt-0.5">JPG, PNG — Max 10MB limits</span>
                  <input
                    ref={fileCoverRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUploadWeb}
                  />
                </div>
                {coverUrl && (
                  <div className="flex items-center gap-2 select-none justify-between text-[10px] bg-nexus-cyan/5 border border-nexus-cyan/20 p-2 rounded-lg">
                    <span className="font-mono text-nexus-cyan truncate max-w-[350px]">Cover Linked: {coverUrl}</span>
                    <span className="text-nexus-green font-bold">✓ Ready</span>
                  </div>
                )}
              </div>

              <div className="text-left space-y-2">
                <label className="block text-[#4A6080] uppercase font-mono font-bold tracking-tight text-[9px] select-none text-left">
                  Card Listing Thumbnail
                </label>
                
                <div 
                  className="border border-nexus-border rounded-xl p-4 bg-nexus-void/40 hover:border-nexus-cyan flex flex-col justify-center items-center text-center cursor-pointer select-none"
                  onClick={() => fileThumbRef.current?.click()}
                >
                  <Upload className="w-5.5 h-5.5 text-gray-500 mx-auto mb-1" />
                  <span className="font-bold text-gray-300 text-[10.5px] block">Upload separate small thumbnail</span>
                  <span className="text-[9.5px] text-gray-500 italic mt-0.5">(Optional - skips to crop cover image if ignored)</span>
                  <input
                    ref={fileThumbRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbUploadWeb}
                  />
                </div>
                {thumbUrl ? (
                  <div className="flex items-center gap-2 select-none justify-between text-[10px] bg-nexus-cyan/5 border border-nexus-cyan/20 p-2 rounded-lg">
                    <span className="font-mono text-nexus-cyan truncate max-w-[350px]">Thumb Linked: {thumbUrl}</span>
                    <span className="text-nexus-green font-bold">✓ Ready</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-500 italic block font-light select-none">
                    *Will automatically crop and resize the primary Cover story image instead.
                  </span>
                )}
              </div>

              {loading && (
                <div className="p-3 bg-nexus-cyan/5 border border-nexus-cyan/35 flex items-center justify-center gap-2 rounded-lg select-none">
                  <RefreshCw className="w-4 h-4 animate-spin text-nexus-cyan" />
                  <span className="font-mono font-bold text-nexus-cyan">PROCESSING UPLOAD DIRECTORY...</span>
                </div>
              )}

              <div className="flex justify-between select-none pt-2 border-t border-nexus-border">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-nexus-border text-gray-400 hover:text-white rounded-lg flex items-center gap-1 cursor-pointer uppercase font-bold text-[9.5px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Topic</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4.5 py-2 hover:bg-white/5 text-gray-300 rounded-lg flex items-center gap-1 cursor-pointer font-bold uppercase text-[9.5px]"
                >
                  <span>Skip/Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 3 PREFLIGHT VERIFY & EMIT */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in text-left">
              
              <div className="text-left font-sans space-y-1 select-none">
                <span className="block text-[9.5px] font-mono text-nexus-gold font-bold uppercase">Preflight Preview Verification</span>
                
                <div className="bg-nexus-card border border-nexus-border rounded-xl p-4.5 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-405 leading-none">
                    <span className="font-bold text-nexus-cyan shrink-0 uppercase">{category}</span>
                    <span>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                  </div>

                  <div className="space-y-1 text-left">
                    <span className="block text-[9px] font-mono text-gray-500 uppercase leading-none">Headline dispatch title:</span>
                    <input 
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-nexus-void border border-nexus-border rounded p-1.5 font-serif font-black text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <span className="block text-[9px] font-mono text-gray-500 uppercase leading-none">Abstract summary lead:</span>
                    <textarea 
                      rows={2}
                      value={excerpt}
                      onChange={e => setExcerpt(e.target.value)}
                      className="w-full bg-nexus-void border border-nexus-border rounded p-1.5 font-sans font-light text-gray-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-4 bg-nexus-cyan/5 border border-nexus-cyan/35 flex items-center justify-center gap-2 rounded-xl select-none">
                  <RefreshCw className="w-5 h-5 animate-spin text-nexus-cyan" />
                  <span className="font-mono font-bold text-nexus-cyan uppercase">COMMITTING RECORD FILES SECURELY...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5 select-none pt-2 border-t border-nexus-border">
                  <button
                    type="button"
                    onClick={() => handlePublishNow('draft')}
                    className="py-3 border border-nexus-border text-gray-400 hover:text-white bg-nexus-void rounded-xl font-mono uppercase font-black tracking-wider shadow cursor-pointer text-center text-[10px]"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePublishNow('published')}
                    className="py-3 bg-nexus-cyan text-nexus-void hover:bg-cyan-400 rounded-xl font-mono uppercase font-black tracking-widest shadow-lg shadow-cyan-500/10 cursor-pointer text-center text-[10px]"
                  >
                    ✓ Publish Now
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-[9.5px] font-mono text-gray-500 hover:text-white flex items-center gap-1 mt-2 tracking-wider uppercase select-none w-full justify-center"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Adjust Cover Photos</span>
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
