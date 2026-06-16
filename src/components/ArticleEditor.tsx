import React, { useState, useEffect, useRef } from 'react';
import {
  X, Check, Sparkles, Upload, Link2, Copy, FileText,
  Clock, Calendar, AlertTriangle, Eye, Trash2, HelpCircle, User
} from 'lucide-react';
import { Article, ArticleCategory } from '../types';
import { useToast } from './ToastContext';

interface ArticleEditorProps {
  article: Article | null;
  onClose: () => void;
  onSaveSuccess: () => void;
  articlesPool: Article[];
}

export default function ArticleEditor({ article, onClose, onSaveSuccess, articlesPool }: ArticleEditorProps) {
  const { addToast } = useToast();
  const fileInputCoverRef = useRef<HTMLInputElement>(null);
  const fileInputThumbRef = useRef<HTMLInputElement>(null);
  const fileInputAuthorRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [formCategory, setFormCategory] = useState<ArticleCategory>('Economy');
  const [formStatus, setFormStatus] = useState<'published' | 'draft' | 'scheduled'>('published');
  const [formScheduledDate, setFormScheduledDate] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formMetaDesc, setFormMetaDesc] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [tagInputText, setTagInputText] = useState('');
  const [formIsBreaking, setFormIsBreaking] = useState(false);
  const [formBreakingLabel, setFormBreakingLabel] = useState('BREAKING');
  const [formFeaturedPos, setFormFeaturedPosition] = useState<number | null>(null);
  
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [coverProgress, setCoverProgress] = useState(false);
  const [formThumbUrl, setFormThumbUrl] = useState('');
  const [thumbProgress, setThumbProgress] = useState(false);
  
  // NEW: Author Photo field
  const [formAuthorImage, setFormAuthorImage] = useState('');
  const [authorImageProgress, setAuthorImageProgress] = useState(false);

  const [formContentMarkdown, setFormContentMarkdown] = useState('');
  const [formSources, setFormSources] = useState('');
  const [formAuthor, setFormAuthor] = useState('Editorial Board Desk');
  const [formAuthorTitle, setFormAuthorTitle] = useState('Senior Macroeconomic Correspondent');

  const [aiKeywords, setAiKeywords] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (article) {
      setFormCategory(article.category);
      setFormStatus(article.status || 'published');
      setFormScheduledDate(article.scheduledDate || '');
      setFormTitle(article.title);
      setFormSlug(article.slug || '');
      setFormExcerpt(article.excerpt);
      setFormMetaDesc(article.metaDescription || '');
      setFormTags(article.tags || []);
      setFormIsBreaking(article.isBreaking || false);
      setFormBreakingLabel(article.breakingLabel || 'BREAKING');
      
      const posRatio = article.featuredPosition;
      setFormFeaturedPosition(posRatio !== undefined ? posRatio : null);
      
      setFormCoverUrl(article.imageUrl || '');
      setFormThumbUrl(article.thumbnailUrl || '');
      setFormAuthorImage(article.authorImage || ''); // load existing author image
      setFormContentMarkdown(article.content || '');
      setFormSources(article.sources ? article.sources.join('\n') : '');
      setFormAuthor(article.author || 'Editorial Board Desk');
      setFormAuthorTitle(article.authorTitle || 'Senior Macroeconomic Correspondent');
    } else {
      setFormCategory('Economy');
      setFormStatus('published');
      setFormScheduledDate('');
      setFormTitle('');
      setFormSlug('');
      setFormExcerpt('');
      setFormMetaDesc('');
      setFormTags([]);
      setFormIsBreaking(false);
      setFormBreakingLabel('BREAKING');
      setFormFeaturedPosition(null);
      setFormCoverUrl('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80');
      setFormThumbUrl('');
      setFormAuthorImage(''); // empty by default - no random AI photo
      setFormContentMarkdown('');
      setFormSources('Ministry of Finance, Government of Nepal\nNepal Rastra Bank Policy Registers');
      setFormAuthor('NepalEconomy Editorial Desk');
      setFormAuthorTitle('Senior Executive Correspondent');
    }
  }, [article]);

  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    const slugified = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormSlug(slugified);
  };

  const handleExcerptChange = (val: string) => {
    setFormExcerpt(val);
    if (!formMetaDesc.trim() || formMetaDesc.length <= val.length) {
      setFormMetaDesc(val.slice(0, 150));
    }
  };

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInputText.trim().replace(/,/g, '');
      if (tag && !formTags.includes(tag)) {
        setFormTags([...formTags, tag]);
        setTagInputText('');
      }
    }
  };

  const handleRemoveTag = (t: string) => {
    setFormTags(formTags.filter(item => item !== t));
  };

  // Universal upload handler with auto-copy of public URL
  const uploadFileWithCopyLink = async (
    file: File,
    setUrl: (url: string) => void,
    setProgress: (state: boolean) => void,
    label: string
  ) => {
    if (file.size > 10 * 1024 * 1024) {
      addToast('Image too large. Limit is 10 MB.', 'error');
      return;
    }
    setProgress(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': localStorage.getItem('ne_admin_token') || '' },
        body: formData
      });
      if (!res.ok) throw new Error();
      const resData = await res.json();
      setUrl(resData.file.url);
      
      // Auto-copy public URL to clipboard
      try {
        await navigator.clipboard.writeText(resData.file.url);
        addToast(`✓ ${label} uploaded! Public link copied to clipboard.`, 'success');
      } catch {
        addToast(`✓ ${label} uploaded successfully!`, 'success');
      }
    } catch {
      addToast(`${label} upload failed.`, 'error');
    } finally {
      setProgress(false);
    }
  };

  const handleCoverUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFileWithCopyLink(file, setFormCoverUrl, setCoverProgress, 'Cover Image');
  };

  const handleThumbUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFileWithCopyLink(file, setFormThumbUrl, setThumbProgress, 'Thumbnail');
  };

  // NEW: Author Photo upload handler
  const handleAuthorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFileWithCopyLink(file, setFormAuthorImage, setAuthorImageProgress, 'Author Photo');
  };

  const copyUrlToClipboard = async (url: string, label: string) => {
    if (!url) {
      addToast('No URL to copy.', 'info');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      addToast(`✓ ${label} URL copied!`, 'success');
    } catch {
      addToast('Copy failed.', 'error');
    }
  };

  const handleAICoAuthor = async () => {
    if (!aiKeywords.trim()) return;
    setAiLoading(true);
    addToast('Contacting Gemini AI desk for composition...', 'info');

    try {
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('ne_admin_token') || ''
        },
        body: JSON.stringify({ prompt: aiKeywords.trim(), category: formCategory })
      });
      if (!res.ok) throw new Error('API server busy or ratelimited');
      
      const payload = await res.json();
      if (payload.success && payload.article) {
        const artObj = payload.article;
        setFormTitle(artObj.title || '');
        setFormSlug((artObj.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        setFormExcerpt(artObj.excerpt || '');
        setFormMetaDesc(artObj.metaDescription || artObj.excerpt || '');
        setFormContentMarkdown(artObj.content || '');
        setFormTags(artObj.tags || [formCategory]);
        addToast('Gemini Co-Author draft written! Please verify details.', 'success');
        setAiKeywords('');
      }
    } catch (err: any) {
      addToast(err.message || 'AI Desk timed out.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const injectMarkup = (format: string) => {
    let valueToAdd = '';
    if (format === 'bold') valueToAdd = '**strong text**';
    else if (format === 'italic') valueToAdd = '*italic text*';
    else if (format === 'h2') valueToAdd = '\n## Section Subheading\n';
    else if (format === 'h3') valueToAdd = '\n### Subsection Header\n';
    else if (format === 'quote') valueToAdd = '\n> "The historical capital return was..." \n';
    else if (format === 'bullet') valueToAdd = '\n- Item details citation\n';
    else if (format === 'number') valueToAdd = '\n1. First compliance criteria\n';
    else if (format === 'line') valueToAdd = '\n---\n';
    else if (format === 'link') valueToAdd = '[anchor name](https://nrb.gov.np)';

    setFormContentMarkdown(prev => prev + valueToAdd);
  };

  const handleCommitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContentMarkdown.trim()) {
      addToast('Headline and content are required.', 'error');
      return;
    }

    const sourcesArray = formSources
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const composedArticle: Article = {
      id: article ? article.id : `art-${Date.now()}`,
      title: formTitle.trim(),
      excerpt: formExcerpt.trim() || formContentMarkdown.trim().slice(0, 150) + '...',
      content: formContentMarkdown.trim(),
      category: formCategory,
      author: formAuthor.trim(),
      authorTitle: formAuthorTitle.trim(),
      authorImage: formAuthorImage.trim(), // include author image (empty if not set)
      imageUrl: formCoverUrl.trim() || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
      thumbnailUrl: formThumbUrl.trim() || formCoverUrl.trim(),
      isBreaking: formIsBreaking,
      breakingLabel: formBreakingLabel.trim(),
      status: formStatus,
      scheduledDate: formStatus === 'scheduled' ? formScheduledDate : undefined,
      featuredPosition: formFeaturedPos,
      slug: formSlug.trim(),
      metaDescription: formMetaDesc.trim().slice(0, 160),
      tags: formTags,
      date: article ? article.date : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      readTime: `${Math.max(1, Math.ceil(formContentMarkdown.trim().split(/\s+/).length / 200))} min read`,
      views: article ? article.views : 0,
      sources: sourcesArray
    };

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('ne_admin_token') || ''
        },
        body: JSON.stringify(composedArticle)
      });

      if (res.ok) {
        addToast('Article saved successfully!', 'success');
        onSaveSuccess();
        onClose();
      } else {
        addToast('Authentication expired.', 'error');
      }
    } catch {
      addToast('Database communication failure.', 'error');
    }
  };

  const wordCount = formContentMarkdown.trim().split(/\s+/).filter(Boolean).length;
  const estReadTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0F1E] flex flex-col md:flex-row h-full overflow-hidden select-none text-left pointer-events-auto transition-all">
      
      {/* LEFT PANEL (60%) */}
      <div className="w-full md:w-[60%] border-r border-nexus-border flex flex-col justify-between h-full bg-nexus-void overflow-y-auto">
        
        <div className="sticky top-0 z-30 px-6 py-4 border-b border-nexus-border bg-[#0E1527] flex items-center justify-between select-none">
          <div className="text-left font-sans leading-none">
            <span className="text-[10px] font-mono tracking-widest text-nexus-cyan uppercase font-black">
              NEPALECONOMY EDITORIAL ENGINE
            </span>
            <h2 className="text-sm sm:text-base font-serif font-black text-white uppercase mt-1 leading-none font-serif">
              {article ? `Edit: ${article.slug}` : 'Create New Article'}
            </h2>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
            title="Cancel and close editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCommitSubmit} className="p-6 md:p-8 space-y-6 flex-1 text-xs text-left font-sans">
          
          {/* Gemini AI panel */}
          <div className="p-4 bg-nexus-cyan/5 border border-nexus-cyan/20 rounded-xl space-y-3 text-left">
            <div className="flex items-center gap-1.5 select-none leading-none">
              <Sparkles className="w-4 h-4 text-nexus-cyan animate-pulse" />
              <span className="text-[10px] font-mono font-black text-nexus-cyan uppercase tracking-wider">
                Gemini AI Co-Author Assistant
              </span>
            </div>
            
            <p className="text-[10px] sm:text-[11px] leading-relaxed text-gray-400 font-light font-sans text-left">
              Type the core topic, indicators, or rates. Gemini will compose sections, excerpts, and tags safely on the server.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text"
                value={aiKeywords}
                onChange={e => setAiKeywords(e.target.value)}
                placeholder="e.g., NRB modifies reserve standards in 2026..."
                className="flex-1 px-3 py-2 bg-nexus-void border border-nexus-border text-xs rounded-lg text-white"
              />
              <button
                type="button"
                disabled={aiLoading || !aiKeywords.trim()}
                onClick={handleAICoAuthor}
                className="px-4 py-2 bg-nexus-cyan text-nexus-void hover:bg-cyan-400 disabled:opacity-40 font-mono text-[10px] font-black uppercase rounded-lg shrink-0 cursor-pointer"
              >
                {aiLoading ? 'COMPILING...' : 'CO-AUTHOR'}
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="text-left font-sans space-y-1.5">
            <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px] mb-1">
              Article Category *
            </label>
            <div className="flex flex-wrap gap-2 select-none">
              {(['Economy', 'Business', 'Policy', 'Startups', 'Global'] as ArticleCategory[]).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] uppercase font-bold transition-all cursor-pointer ${
                    formCategory === cat 
                      ? 'bg-nexus-cyan border-nexus-cyan text-nexus-void' 
                      : 'bg-nexus-panel border-nexus-border text-gray-400 hover:text-white hover:border-gray-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Status + Scheduled */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="text-left font-sans">
              <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px] mb-1.5">
                Status *
              </label>
              <div className="grid grid-cols-3 gap-1 px-1 border border-nexus-border bg-nexus-void rounded-lg h-9 items-center select-none text-[9.5px]">
                {(['published', 'draft', 'scheduled'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFormStatus(st)}
                    className={`py-1 rounded font-mono font-bold uppercase cursor-pointer text-center leading-none ${
                      formStatus === st
                        ? st === 'published' 
                          ? 'bg-nexus-green/15 text-nexus-green border border-nexus-green/35'
                          : st === 'scheduled'
                            ? 'bg-nexus-gold/15 text-nexus-gold border border-nexus-gold/35'
                            : 'bg-gray-700/30 text-gray-300 border border-gray-655'
                        : 'text-gray-500 hover:text-gray-305'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-left font-sans">
              <label className="block text-[#4A6080] uppercase font-mono font-bold tracking-tight text-[9px] mb-1.5">
                Scheduled Date
              </label>
              <input
                type="datetime-local"
                disabled={formStatus !== 'scheduled'}
                value={formScheduledDate}
                onChange={e => setFormScheduledDate(e.target.value)}
                className="w-full px-3 h-9 bg-nexus-void border border-nexus-border text-xs rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>

          {/* Title */}
          <div className="text-left font-sans space-y-1">
            <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px]">
              Article Title *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="e.g., Hydropower Corridor Limits Narrow Net FDI Deficit"
              className="w-full px-3 py-2.5 bg-nexus-void border border-nexus-border text-sm rounded-lg text-white font-serif font-bold placeholder-gray-600 focus:outline-none"
            />
            {formSlug && (
              <span className="block text-[9.5px] font-mono text-nexus-cyan/70 select-none text-left leading-none font-bold">
                URL: /article/<span className="underline">{formSlug}</span>
              </span>
            )}
          </div>

          {/* Excerpt */}
          <div className="text-left font-sans leading-none">
            <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px] mb-1">
              One-sentence Excerpt *
            </label>
            <input
              type="text"
              required
              value={formExcerpt}
              onChange={e => handleExcerptChange(e.target.value)}
              placeholder="Provide a brief analytical summary..."
              className="w-full px-3 py-2 bg-nexus-void border border-nexus-border text-xs rounded-lg text-white focus:outline-none"
            />
          </div>

          {/* Meta Description */}
          <div className="text-left font-sans space-y-1">
            <div className="flex justify-between items-center text-[9px] select-none text-left">
              <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight">
                SEO Meta Description (Max 160 chars)
              </label>
              <span className={`font-mono font-bold ${formMetaDesc.length > 160 ? 'text-red-500' : 'text-nexus-cyan'}`}>
                {formMetaDesc.length} / 160
              </span>
            </div>
            <input
              type="text"
              value={formMetaDesc}
              maxLength={180}
              onChange={e => setFormMetaDesc(e.target.value)}
              placeholder="Eye-catching summary for search engines..."
              className="w-full px-3 py-2 bg-nexus-void border border-nexus-border text-xs rounded-lg text-white focus:outline-none"
            />
          </div>

          {/* Tags */}
          <div className="text-left font-sans space-y-1.5">
            <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px]">
              Tags (Press Enter to add)
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-nexus-void border border-nexus-border rounded-lg min-h-10 items-center">
              {formTags.map(tag => (
                <span 
                  key={tag}
                  className="inline-flex items-center gap-1 bg-nexus-cyan/10 border border-nexus-cyan/30 text-nexus-cyan text-[9px] font-mono px-2 py-0.5 rounded"
                >
                  <span>{tag}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500 font-bold shrink-0 cursor-pointer ml-1 select-none text-[8.5px]"
                  >
                    ✕
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInputText}
                onKeyDown={handleTagAdd}
                onChange={e => setTagInputText(e.target.value)}
                placeholder={formTags.length === 0 ? "Type tag and press Enter..." : "+ tag"}
                className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none placeholder-gray-650"
              />
            </div>
          </div>

          {/* Breaking toggle */}
          <div className="p-3.5 bg-nexus-card border border-nexus-border rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-left">
            <div className="sm:col-span-4 flex items-center gap-2 select-none text-left">
              <input
                type="checkbox"
                checked={formIsBreaking}
                onChange={e => setFormIsBreaking(e.target.checked)}
                className="w-4.5 h-4.5 text-nexus-cyan rounded border-nexus-border focus:ring-0 cursor-pointer"
                id="check-breaking-override"
              />
              <label htmlFor="check-breaking-override" className="text-[10px] font-mono uppercase font-black tracking-wider text-white leading-none cursor-pointer">
                Breaking News
              </label>
            </div>

            <div className="sm:col-span-8 text-left font-sans h-8">
              <input
                type="text"
                disabled={!formIsBreaking}
                value={formBreakingLabel}
                onChange={e => setFormBreakingLabel(e.target.value)}
                placeholder="Alert label (e.g., BREAKING)"
                className="w-full px-2.5 h-full bg-nexus-void border border-nexus-border text-xs rounded-lg text-white disabled:opacity-30"
              />
            </div>
          </div>

          {/* Featured Position */}
          <div className="text-left font-sans">
            <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px] mb-2 select-none">
              Featured Placement
            </label>
            <div className="grid grid-cols-3 gap-2.5 select-none font-mono text-[9px] uppercase font-bold text-center">
              {[
                { label: 'Normal Feed', value: null },
                { label: 'Large Hero (65%)', value: 1 },
                { label: 'Secondary (35%)', value: 2 }
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setFormFeaturedPosition(opt.value)}
                  className={`py-2 rounded-lg border transition-all cursor-pointer ${
                    formFeaturedPos === opt.value
                      ? 'bg-nexus-cyan border-nexus-cyan text-nexus-void'
                      : 'bg-nexus-panel border-nexus-border text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-2 text-left">
            <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px] select-none text-left">
              Cover Image (used as full header) *
            </label>
            
            <div className="border border-nexus-border rounded-xl overflow-hidden bg-nexus-panel text-left flex flex-col sm:flex-row gap-4 p-4 text-xs font-sans">
              <div 
                className="flex-1 border-2 border-dashed border-nexus-border rounded-lg p-4 bg-nexus-void/40 flex flex-col justify-center items-center text-center cursor-pointer hover:border-nexus-cyan transition-colors"
                onClick={() => fileInputCoverRef.current?.click()}
              >
                <Upload className="w-7 h-7 text-gray-450 mx-auto mb-1.5 animate-pulse" />
                <span className="font-bold text-white text-[11px] block text-center">Upload Cover or Browse</span>
                <span className="text-[9.5px] text-gray-500 block text-center">JPG, PNG, SVG • Max 10MB</span>
                <input
                  ref={fileInputCoverRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUploadFile}
                />
              </div>

              <div className="flex-1 flex flex-col justify-between text-left space-y-2.5">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-gray-405 block leading-none">OR PASTE EXTERNAL URL</span>
                  <input
                    type="url"
                    value={formCoverUrl}
                    onChange={e => setFormCoverUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-2 py-1.5 bg-nexus-void border border-nexus-border text-xs rounded text-white focus:outline-none"
                  />
                </div>

                {formCoverUrl && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-gray-405 block leading-none">PUBLIC URL:</span>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        readOnly 
                        value={formCoverUrl} 
                        className="flex-1 px-2 py-1 bg-nexus-void border border-nexus-border text-[10px] text-nexus-cyan font-mono rounded" 
                      />
                      <button
                        type="button"
                        onClick={() => copyUrlToClipboard(formCoverUrl, 'Cover')}
                        className="px-2 py-1 bg-nexus-cyan text-nexus-void rounded text-[9px] font-mono font-bold cursor-pointer flex items-center gap-1"
                        title="Copy public link"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {coverProgress && <div className="h-1 bg-nexus-cyan rounded-full animate-pulse" />}
          </div>

          {/* Thumbnail Image */}
          <div className="space-y-2 text-left">
            <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px] select-none text-left">
              Listing Thumbnail (400x300px ideal)
            </label>

            <div className="border border-nexus-border rounded-xl overflow-hidden bg-nexus-panel text-left flex flex-col sm:flex-row gap-4 p-4 text-xs font-sans">
              <div 
                className="flex-1 border-2 border-dashed border-nexus-border rounded-lg p-4 bg-nexus-void/40 flex flex-col justify-center items-center text-center cursor-pointer hover:border-nexus-cyan transition-colors"
                onClick={() => fileInputThumbRef.current?.click()}
              >
                <Upload className="w-7 h-7 text-gray-450 mx-auto mb-1.5" />
                <span className="font-bold text-white text-[11px] block text-center">Browse Thumbnail</span>
                <span className="text-[9.5px] text-gray-500 block text-center">JPG, PNG • Max 10MB</span>
                <input
                  ref={fileInputThumbRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbUploadFile}
                />
              </div>

              <div className="flex-1 flex flex-col justify-center text-left space-y-2 select-none">
                {formThumbUrl ? (
                  <>
                    <span className="text-[9px] font-mono text-gray-405 block leading-none">PUBLIC URL:</span>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        readOnly 
                        value={formThumbUrl} 
                        className="flex-1 px-2 py-1 bg-nexus-void border border-nexus-border text-[10px] text-nexus-cyan font-mono rounded" 
                      />
                      <button
                        type="button"
                        onClick={() => copyUrlToClipboard(formThumbUrl, 'Thumbnail')}
                        className="px-2 py-1 bg-nexus-cyan text-nexus-void rounded text-[9px] font-mono font-bold cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-[10.5px] leading-relaxed text-gray-450 font-sans font-light text-left">
                    If left blank, the listing automatically uses the Cover Image.
                  </p>
                )}
              </div>
            </div>
            {thumbProgress && <div className="h-1 bg-nexus-cyan rounded-full animate-pulse" />}
          </div>

          {/* NEW: AUTHOR PHOTO */}
          <div className="space-y-2 text-left">
            <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px] select-none text-left flex items-center gap-1.5">
              <User className="w-3 h-3" />
              <span>Author Photo (optional)</span>
            </label>

            <div className="border border-nexus-border rounded-xl overflow-hidden bg-nexus-panel text-left flex flex-col sm:flex-row gap-4 p-4 text-xs font-sans">
              
              {/* Preview avatar */}
              <div className="shrink-0 flex flex-col items-center justify-center gap-2">
                {formAuthorImage ? (
                  <img 
                    src={formAuthorImage} 
                    alt="Author preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-nexus-cyan/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-nexus-void border-2 border-dashed border-nexus-border flex items-center justify-center">
                    <User className="w-7 h-7 text-gray-600" />
                  </div>
                )}
                <span className="text-[8.5px] font-mono text-gray-500 uppercase">Preview</span>
              </div>

              <div className="flex-1 flex flex-col gap-2 text-left">
                <button 
                  type="button"
                  onClick={() => fileInputAuthorRef.current?.click()}
                  className="border-2 border-dashed border-nexus-border rounded-lg p-3 bg-nexus-void/40 hover:border-nexus-cyan flex flex-col justify-center items-center text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5 text-gray-450 mb-1" />
                  <span className="font-bold text-white text-[10.5px]">Upload Author Photo</span>
                  <span className="text-[9px] text-gray-500">JPG, PNG • Max 10MB</span>
                </button>
                <input
                  ref={fileInputAuthorRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAuthorImageUpload}
                />

                <input
                  type="url"
                  value={formAuthorImage}
                  onChange={e => setFormAuthorImage(e.target.value)}
                  placeholder="...or paste image URL here"
                  className="w-full px-2 py-1.5 bg-nexus-void border border-nexus-border text-[10.5px] rounded text-white focus:outline-none"
                />

                {formAuthorImage && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => copyUrlToClipboard(formAuthorImage, 'Author Photo')}
                      className="px-2 py-1 bg-nexus-cyan/10 border border-nexus-cyan/30 text-nexus-cyan rounded text-[9px] font-mono font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy URL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAuthorImage('')}
                      className="px-2 py-1 bg-red-500/10 border border-red-500/30 text-danger-red rounded text-[9px] font-mono font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}

                <p className="text-[9.5px] text-gray-500 font-light italic">
                  If left blank, no photo will be shown — just author initials.
                </p>
              </div>
            </div>
            {authorImageProgress && <div className="h-1 bg-nexus-cyan rounded-full animate-pulse" />}
          </div>

          {/* Markdown editor */}
          <div className="text-left font-sans space-y-1.5">
            <div className="flex justify-between items-center select-none text-left mb-1 leading-none">
              <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px]">
                Article Body (Markdown) *
              </label>
              
              <span className="font-mono text-gray-400 text-[10px]">
                WORDS: <span className="text-white font-bold">{wordCount}</span> • READ: <span className="text-white font-bold">{estReadTime}M</span>
              </span>
            </div>

            <div className="border border-nexus-border rounded-xl overflow-hidden bg-nexus-panel text-left font-sans text-xs">
              
              <div className="bg-[#121A28] border-b border-nexus-border px-3 py-1.5 flex flex-wrap gap-1.5 select-none items-center">
                {[
                  { label: 'B', fmt: 'bold', title: 'Bold' },
                  { label: 'I', fmt: 'italic', title: 'Italic' },
                  { label: 'H2', fmt: 'h2', title: 'H2 Heading' },
                  { label: 'H3', fmt: 'h3', title: 'H3 Subheading' },
                  { label: 'Quote', fmt: 'quote', title: 'Blockquote' },
                  { label: 'Bullet', fmt: 'bullet', title: 'Bullet list' },
                  { label: 'Number', fmt: 'number', title: 'Numbered list' },
                  { label: 'Line', fmt: 'line', title: 'Divider' },
                  { label: 'Link', fmt: 'link', title: 'Anchor hyperlink' }
                ].map((btn) => (
                  <button
                    key={btn.fmt}
                    type="button"
                    onClick={() => injectMarkup(btn.fmt)}
                    className="px-2.5 py-1 bg-nexus-void hover:bg-nexus-cyan/15 hover:text-nexus-cyan border border-nexus-border text-[10px] font-mono leading-none rounded cursor-pointer font-extrabold uppercase transition-colors"
                    title={btn.title}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <textarea
                value={formContentMarkdown}
                onChange={e => setFormContentMarkdown(e.target.value)}
                required
                rows={10}
                placeholder="Draft the body here. Press 'H2' or 'Bold' to insert markdown..."
                className="w-full bg-nexus-void text-xs font-sans text-white p-4 focus:outline-none min-h-[300px]"
              />
            </div>
          </div>

          {/* Sources */}
          <div className="text-left font-sans leading-none">
            <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px] mb-1">
              Citation Sources (one per line)
            </label>
            <textarea
              value={formSources}
              onChange={e => setFormSources(e.target.value)}
              rows={2}
              placeholder="e.g., MoF tax registry #18/2026"
              className="w-full px-3 py-2 bg-nexus-void border border-nexus-border text-xs rounded-lg text-white placeholder-gray-655 focus:outline-none"
            />
          </div>

          {/* Author name + title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="text-left font-sans">
              <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px] mb-1">Author Name *</label>
              <input
                type="text"
                required
                value={formAuthor}
                onChange={e => setFormAuthor(e.target.value)}
                className="w-full px-3 py-2 bg-nexus-void border border-nexus-border text-xs rounded-lg text-white focus:outline-none"
              />
            </div>

            <div className="text-left font-sans">
              <label className="block text-[#4A6080] uppercase font-mono font-bold tracking-tight text-[9px] mb-1">Author Title *</label>
              <input
                type="text"
                required
                value={formAuthorTitle}
                onChange={e => setFormAuthorTitle(e.target.value)}
                className="w-full px-3 py-2 bg-nexus-void border border-nexus-border text-xs rounded-lg text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-nexus-border flex justify-end gap-3 select-none">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2.5 border border-nexus-border hover:bg-white/5 text-gray-400 hover:text-white rounded-lg font-mono uppercase font-bold text-[10px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-nexus-cyan text-nexus-void hover:bg-cyan-400 rounded-lg font-mono uppercase font-black tracking-widest text-[10px] shadow-lg cursor-pointer"
            >
              Save Article
            </button>
          </div>

        </form>
      </div>

      {/* RIGHT PANEL (40%) - Live Preview */}
      <div className="hidden md:flex md:w-[40%] flex-col h-full bg-[#070B15] overflow-y-auto px-6 py-5 space-y-5 text-left border-l border-nexus-border/60">
        
        <div className="border-b border-nexus-border pb-2.5 select-none leading-none">
          <span className="text-[10px] font-mono tracking-widest text-nexus-gold uppercase font-black flex items-center gap-1.5 leading-none">
            <Eye className="w-4.5 h-4.5" />
            <span>LIVE PREVIEW</span>
          </span>
        </div>

        <div className="space-y-4 text-left">
          <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest block select-none">HERO CARD PREVIEW</span>

          <div className="relative rounded-xl overflow-hidden border border-nexus-border/60 h-[220px] bg-nexus-void flex flex-col justify-end p-4 text-left">
            <div className="absolute inset-0 select-none">
              <img 
                src={formCoverUrl || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80'} 
                alt="" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-[#0A0F1E]/50 to-transparent pointer-events-none" />
            </div>

            <div className="space-y-1 relative z-10 text-left">
              <span className="text-[8px] font-mono font-bold text-nexus-cyan uppercase bg-nexus-cyan/15 px-1.5 py-0.2 rounded select-none">
                {formCategory}
              </span>
              
              <h4 className="font-serif font-black text-white text-xs sm:text-sm line-clamp-1 leading-tight text-left font-serif">
                {formTitle || 'Sample title placeholder...'}
              </h4>
              
              <p className="text-[10px] text-gray-300 font-light truncate max-w-sm font-sans mb-1 text-left">
                {formExcerpt || 'Summary excerpt appears here.'}
              </p>

              {/* Preview with author photo if set */}
              <div className="flex items-center gap-2">
                {formAuthorImage && (
                  <img 
                    src={formAuthorImage} 
                    alt="" 
                    className="w-5 h-5 rounded-full object-cover border border-nexus-cyan/40"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="text-[8px] font-mono text-gray-500 block select-none">By {formAuthor} • {estReadTime} min read</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-nexus-card rounded-xl border border-nexus-border p-4.5 flex-1 overflow-auto text-left font-sans text-xs">
          <span className="text-[9.5px] font-mono text-nexus-gold font-bold uppercase block select-none border-b border-nexus-border pb-1.5 mb-3">Live Markdown Preview</span>
          
          <div className="space-y-3.5 text-left font-sans leading-relaxed text-gray-300 font-light select-none">
            <h1 className="text-sm font-serif font-black text-white leading-tight uppercase font-serif text-left border-l-3 border-nexus-cyan pl-2 mb-2">
              {formTitle || 'Sample Title'}
            </h1>
            <p className="border-l-2 border-nexus-cyan bg-[#070b15] py-1.5 pr-2 pl-3 text-[10px] leading-relaxed italic text-left text-gray-400">
              "{formExcerpt || 'Excerpt synopsis'}"
            </p>

            <div className="text-[11px] leading-relaxed text-left font-sans font-light text-gray-300 whitespace-pre-wrap shrink-0">
              {formContentMarkdown ? (
                formContentMarkdown.slice(0, 1000) + (formContentMarkdown.length > 1000 ? '...' : '')
              ) : (
                <span className="text-gray-600 italic">Body content awaits.</span>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
