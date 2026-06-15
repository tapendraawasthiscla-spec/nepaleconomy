// src/components/HeroCarousel.tsx
// ──────────────────────────────────────────────────────────────────────────────
// Drop-in hero carousel with:
//  • Auto-advance every 6 seconds
//  • Pause / Resume button
//  • Prev / Next arrow buttons
//  • Dot indicators
//  • Admin-only: Upload images + link articles to each slide
//  • Slides persisted in localStorage under "ne_hero_slides"
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Upload,
  X,
  Link2,
  ImagePlus,
  Trash2,
} from 'lucide-react';
import { Article } from '../types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CarouselSlide {
  id: string;
  imageUrl: string;          // base64 OR remote URL
  caption?: string;          // optional overlay caption
  linkedArticleId?: string;  // links to an Article in articles[]
}

interface HeroCarouselProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onSelectCategory: (category: string) => void;
  isAdminMode: boolean;
  /** Fallback: first heroArticle from App.tsx — used when no slides saved yet */
  fallbackArticle?: Article | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ne_hero_slides';
const INTERVAL_MS = 6000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadSlides(): CarouselSlide[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CarouselSlide[];
  } catch { /* ignore */ }
  return [];
}

function saveSlides(slides: CarouselSlide[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
  } catch (e) {
    console.warn('Could not save hero slides to localStorage:', e);
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = () => rej(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ── Component ────────────────────────────────────────────────────────────────

export default function HeroCarousel({
  articles,
  onSelectArticle,
  onSelectCategory,
  isAdminMode,
  fallbackArticle,
}: HeroCarouselProps) {

  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [linkTarget, setLinkTarget] = useState<{ slideId: string } | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [captionInput, setCaptionInput] = useState('');
  const [editingCaption, setEditingCaption] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load from storage on mount ─────────────────────────────────────────────
  useEffect(() => {
    const stored = loadSlides();
    if (stored.length > 0) {
      setSlides(stored);
    } else if (fallbackArticle) {
      // Seed the carousel from the existing hero article so it's never empty
      const seed: CarouselSlide = {
        id: `slide-${Date.now()}`,
        imageUrl: fallbackArticle.imageUrl,
        linkedArticleId: fallbackArticle.id,
      };
      setSlides([seed]);
      saveSlides([seed]);
    }
  }, [fallbackArticle]);

  // ── Auto-advance timer ─────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % Math.max(slides.length, 1));
    }, INTERVAL_MS);
  }, [slides.length]);

  useEffect(() => {
    if (!paused && slides.length > 1) {
      startTimer();
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, slides.length, startTimer]);

  // Keep current index in bounds when slides change
  useEffect(() => {
    if (slides.length > 0 && current >= slides.length) {
      setCurrent(slides.length - 1);
    }
  }, [slides, current]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = (idx: number) => {
    setCurrent((idx + slides.length) % slides.length);
    // Restart timer on manual navigation
    if (!paused) startTimer();
  };
  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  // ── Upload handlers ────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newSlides: CarouselSlide[] = [];
    for (const file of files) {
      const base64 = await fileToBase64(file);
      newSlides.push({ id: `slide-${Date.now()}-${Math.random()}`, imageUrl: base64 });
    }
    const updated = [...slides, ...newSlides];
    setSlides(updated);
    saveSlides(updated);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    const slide: CarouselSlide = {
      id: `slide-${Date.now()}`,
      imageUrl: url,
    };
    const updated = [...slides, slide];
    setSlides(updated);
    saveSlides(updated);
    setUrlInput('');
  };

  const removeSlide = (id: string) => {
    const updated = slides.filter(s => s.id !== id);
    setSlides(updated);
    saveSlides(updated);
  };

  const linkArticleToSlide = (slideId: string, articleId: string) => {
    const updated = slides.map(s =>
      s.id === slideId ? { ...s, linkedArticleId: articleId } : s
    );
    setSlides(updated);
    saveSlides(updated);
    setLinkTarget(null);
  };

  const saveCaptionForSlide = (slideId: string, caption: string) => {
    const updated = slides.map(s =>
      s.id === slideId ? { ...s, caption } : s
    );
    setSlides(updated);
    saveSlides(updated);
    setEditingCaption(null);
    setCaptionInput('');
  };

  const moveSlide = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= slides.length) return;
    const updated = [...slides];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setSlides(updated);
    saveSlides(updated);
    setCurrent(toIdx);
  };

  // ── Derived data for current slide ────────────────────────────────────────
  const slide = slides[current];
  const linkedArticle = slide?.linkedArticleId
    ? articles.find(a => a.id === slide.linkedArticleId)
    : undefined;

  // ── Empty state ────────────────────────────────────────────────────────────
  if (slides.length === 0) {
    return (
      <div className="w-full h-[220px] sm:h-[380px] bg-gray-100 dark:bg-secondary-navy rounded-xl border border-border-warm dark:border-gray-800 flex flex-col items-center justify-center gap-3">
        <ImagePlus className="w-10 h-10 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-400 dark:text-gray-500 font-sans">No hero images yet.</p>
        {isAdminMode && (
          <button
            onClick={() => setShowManager(true)}
            className="mt-1 text-xs font-mono font-bold uppercase bg-primary-crimson text-white px-4 py-2 rounded hover:bg-[#6B0000] transition-colors"
          >
            + Add Images
          </button>
        )}
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="group/carousel bg-white dark:bg-secondary-navy rounded-xl border border-border-warm dark:border-gray-800 overflow-hidden shadow-premium hover:shadow-2xl transition-all duration-300 text-left">

      {/* ── Image area ─────────────────────────────────────────────────────── */}
      <div
        className="w-full h-[220px] sm:h-[380px] overflow-hidden relative select-none cursor-pointer"
        onClick={() => { if (linkedArticle) onSelectArticle(linkedArticle); }}
      >
        {/* Slides */}
        {slides.map((s, idx) => (
          <img
            key={s.id}
            src={s.imageUrl}
            alt={`Hero slide ${idx + 1}`}
            referrerPolicy="no-referrer"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${idx === current ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          />
        ))}

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* COVER STORY badge */}
        <div className="absolute top-4 left-4 bg-primary-crimson text-white text-[10px] font-mono font-black uppercase tracking-wider py-1 px-3 rounded shadow-md border border-accent-gold/20 leading-none z-10">
          COVER STORY
        </div>

        {/* Slide counter */}
        {slides.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/50 text-white text-[10px] font-mono px-2 py-1 rounded z-10">
            {current + 1} / {slides.length}
          </div>
        )}

        {/* ── Controls ──────────────────────────────────────────────────────── */}
        {slides.length > 1 && (
          <>
            {/* Prev */}
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover/carousel:opacity-100 backdrop-blur-sm"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next */}
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover/carousel:opacity-100 backdrop-blur-sm"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Pause / Play */}
            <button
              onClick={e => { e.stopPropagation(); setPaused(p => !p); }}
              className="absolute bottom-14 right-3 z-20 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover/carousel:opacity-100 backdrop-blur-sm"
              aria-label={paused ? 'Play' : 'Pause'}
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </>
        )}

        {/* Dot indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={e => { e.stopPropagation(); goTo(idx); }}
                className={`w-2 h-2 rounded-full transition-all ${idx === current ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Progress bar */}
        {slides.length > 1 && !paused && (
          <div className="absolute bottom-0 left-0 h-[3px] bg-accent-gold/80 z-20 transition-all duration-100"
            style={{ width: `${((current + 1) / slides.length) * 100}%` }}
          />
        )}

        {/* Paused indicator */}
        {paused && (
          <div className="absolute bottom-4 left-4 z-20 bg-black/60 text-accent-gold text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded">
            ⏸ Paused
          </div>
        )}

        {/* Admin: Manage Slides button */}
        {isAdminMode && (
          <button
            onClick={e => { e.stopPropagation(); setShowManager(true); }}
            className="absolute top-4 right-16 z-20 flex items-center gap-1.5 bg-accent-gold text-secondary-navy text-[9.5px] font-mono font-black uppercase tracking-wider py-1 px-2.5 rounded shadow hover:bg-yellow-400 transition-colors"
          >
            <Upload className="w-3 h-3" />
            Manage Slides
          </button>
        )}
      </div>

      {/* ── Article info below image ────────────────────────────────────────── */}
      {linkedArticle ? (
        <div
          className="p-6 md:p-8 space-y-3 text-left cursor-pointer"
          onClick={() => onSelectArticle(linkedArticle)}
        >
          <div className="flex items-center gap-2 select-none">
            <button
              onClick={e => { e.stopPropagation(); onSelectCategory(linkedArticle.category); }}
              className="px-2.5 py-0.5 text-[9.5px] font-mono font-extrabold uppercase bg-[#8B0000] text-white rounded cursor-pointer leading-none"
            >
              {linkedArticle.category}
            </button>
            <span className="text-[11px] text-text-secondary select-none font-sans font-medium">
              • By {linkedArticle.author} ({linkedArticle.readTime})
            </span>
          </div>

          <h2 className="font-serif font-black text-2xl sm:text-3xl text-secondary-navy dark:text-white leading-tight tracking-tight hover:text-primary-crimson dark:hover:text-accent-gold hover:underline transition-colors text-left">
            {linkedArticle.title}
          </h2>

          <p className="text-xs sm:text-sm text-text-secondary dark:text-gray-305 max-w-3xl leading-relaxed text-left font-light font-sans">
            {linkedArticle.excerpt}
          </p>
        </div>
      ) : slide?.caption ? (
        <div className="p-6 md:p-8 text-left">
          <p className="font-serif font-semibold text-lg text-secondary-navy dark:text-white leading-snug">
            {slide.caption}
          </p>
        </div>
      ) : (
        /* Empty article area – still keep the card height consistent */
        <div className="p-4" />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Slide Manager Panel (Admin only)
      ══════════════════════════════════════════════════════════════════════ */}
      {showManager && isAdminMode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-secondary-navy rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border-warm dark:border-gray-700 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-warm dark:border-gray-700">
              <h3 className="font-serif font-black text-lg text-secondary-navy dark:text-white">
                🖼️ Hero Carousel Manager
              </h3>
              <button
                onClick={() => { setShowManager(false); setLinkTarget(null); setEditingCaption(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* ── Add images ──────────────────────────────────────────────── */}
              <div className="space-y-3">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Add Slides
                </p>

                {/* Upload files */}
                <div
                  className="border-2 border-dashed border-border-warm dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-accent-gold dark:hover:border-accent-gold transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-sans text-gray-500 dark:text-gray-400">
                    Click to upload images <span className="text-gray-400">(JPG, PNG, WebP)</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">You can select multiple files at once</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {/* OR paste URL */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddUrl(); }}
                    placeholder="Or paste an image URL and press Enter…"
                    className="flex-1 text-sm border border-border-warm dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-gold"
                  />
                  <button
                    onClick={handleAddUrl}
                    className="px-4 py-2 text-xs font-mono font-bold bg-primary-crimson text-white rounded-lg hover:bg-[#6B0000] transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* ── Slide list ──────────────────────────────────────────────── */}
              {slides.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Slides ({slides.length})
                  </p>

                  {slides.map((s, idx) => {
                    const linked = articles.find(a => a.id === s.linkedArticleId);
                    return (
                      <div
                        key={s.id}
                        className={`flex gap-3 items-start border rounded-xl p-3 transition-all ${idx === current ? 'border-accent-gold bg-accent-gold/5' : 'border-border-warm dark:border-gray-700'}`}
                      >
                        {/* Thumbnail */}
                        <img
                          src={s.imageUrl}
                          alt={`Slide ${idx + 1}`}
                          className="w-20 h-14 object-cover rounded-lg shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => { setCurrent(idx); setShowManager(false); }}
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-gray-400">#{idx + 1}</span>
                            {idx === current && (
                              <span className="text-[9px] font-mono bg-accent-gold/20 text-amber-700 dark:text-accent-gold px-1.5 py-0.5 rounded">
                                CURRENT
                              </span>
                            )}
                          </div>

                          {/* Linked article */}
                          {linked ? (
                            <p className="text-xs font-sans text-secondary-navy dark:text-gray-200 line-clamp-1">
                              📰 {linked.title}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No article linked</p>
                          )}

                          {/* Caption / label */}
                          {editingCaption === s.id ? (
                            <div className="flex gap-1 mt-1">
                              <input
                                autoFocus
                                type="text"
                                value={captionInput}
                                onChange={e => setCaptionInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveCaptionForSlide(s.id, captionInput); }}
                                placeholder="Enter caption…"
                                className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-accent-gold"
                              />
                              <button
                                onClick={() => saveCaptionForSlide(s.id, captionInput)}
                                className="text-[10px] font-mono font-bold bg-secondary-navy text-white px-2 py-1 rounded hover:bg-black transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          ) : s.caption ? (
                            <p
                              className="text-xs text-gray-500 italic cursor-pointer hover:text-primary-crimson"
                              onClick={() => { setEditingCaption(s.id); setCaptionInput(s.caption || ''); }}
                            >
                              💬 "{s.caption}"
                            </p>
                          ) : null}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {/* Link article */}
                          {linkTarget?.slideId === s.id ? (
                            <div className="bg-white dark:bg-dark-navy border border-border-warm dark:border-gray-700 rounded-lg p-2 w-52 space-y-1.5 shadow-xl">
                              <p className="text-[10px] font-mono font-bold uppercase text-gray-400 mb-1">Pick an article</p>
                              <div className="max-h-40 overflow-y-auto space-y-1">
                                {articles.slice(0, 20).map(a => (
                                  <button
                                    key={a.id}
                                    onClick={() => linkArticleToSlide(s.id, a.id)}
                                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent-gold/10 hover:text-primary-crimson transition-colors line-clamp-2"
                                  >
                                    {a.title}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => setLinkTarget(null)}
                                className="text-[10px] text-gray-400 hover:text-primary-crimson w-full text-center pt-1"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setLinkTarget({ slideId: s.id })}
                              title="Link article"
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border-warm dark:border-gray-700 hover:border-accent-gold hover:text-accent-gold text-gray-400 transition-colors"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit caption */}
                          <button
                            onClick={() => { setEditingCaption(s.id); setCaptionInput(s.caption || ''); }}
                            title="Edit caption"
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border-warm dark:border-gray-700 hover:border-accent-gold hover:text-accent-gold text-gray-400 transition-colors text-[10px] font-bold"
                          >
                            T
                          </button>

                          {/* Move up */}
                          <button
                            onClick={() => moveSlide(idx, idx - 1)}
                            disabled={idx === 0}
                            title="Move up"
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border-warm dark:border-gray-700 hover:border-accent-gold hover:text-accent-gold text-gray-400 transition-colors disabled:opacity-30 text-xs"
                          >
                            ↑
                          </button>

                          {/* Move down */}
                          <button
                            onClick={() => moveSlide(idx, idx + 1)}
                            disabled={idx === slides.length - 1}
                            title="Move down"
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border-warm dark:border-gray-700 hover:border-accent-gold hover:text-accent-gold text-gray-400 transition-colors disabled:opacity-30 text-xs"
                          >
                            ↓
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => removeSlide(s.id)}
                            title="Remove slide"
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border-warm dark:border-gray-700 flex items-center justify-between">
              <p className="text-xs text-gray-400 font-sans">
                Slides auto-advance every 6 s · Hover to pause
              </p>
              <button
                onClick={() => setShowManager(false)}
                className="px-5 py-2 text-xs font-mono font-bold uppercase bg-secondary-navy text-white rounded-lg hover:bg-black dark:bg-accent-gold dark:text-secondary-navy dark:hover:bg-yellow-400 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
