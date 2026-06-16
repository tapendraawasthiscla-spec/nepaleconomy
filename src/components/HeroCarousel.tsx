// src/components/HeroCarousel.tsx
// Hero carousel with image AND PDF support
// PDF slides render pages via PDF.js; nav buttons let you page through the doc.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Pause, Play, Upload,
  X, Link2, ImagePlus, Trash2, FileText, Plus,
} from 'lucide-react';
import { Article } from '../types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CarouselSlide {
  id: string;
  imageUrl: string;          // base64 OR remote URL (for images)
  isPdf?: boolean;           // true when this slide holds a PDF
  caption?: string;
  linkedArticleId?: string;
}

interface HeroCarouselProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onSelectCategory: (category: string) => void;
  isAdminMode: boolean;
  fallbackArticle?: Article | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ne_hero_slides';
const INTERVAL_MS = 6000;

// ── Storage helpers ──────────────────────────────────────────────────────────

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

// ── PDF.js loader ────────────────────────────────────────────────────────────

declare global {
  interface Window { pdfjsLib: any; }
}

let pdfJsLoading = false;
let pdfJsReady = false;
const pdfJsCallbacks: Array<() => void> = [];

function loadPdfJs(): Promise<void> {
  return new Promise((resolve) => {
    if (pdfJsReady) { resolve(); return; }
    pdfJsCallbacks.push(resolve);
    if (pdfJsLoading) return;
    pdfJsLoading = true;

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      pdfJsReady = true;
      pdfJsLoading = false;
      pdfJsCallbacks.forEach(cb => cb());
      pdfJsCallbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

// ── PDF Viewer Component ─────────────────────────────────────────────────────

function PdfViewer({
  dataUrl,
  paused,
  onTogglePause,
}: {
  dataUrl: string;
  paused: boolean;
  onTogglePause: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const renderTaskRef = useRef<any>(null);

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setPageNum(1);
    setPdfDoc(null);

    async function load() {
      try {
        await loadPdfJs();
        if (cancelled) return;
        const pdfData = atob(dataUrl.split(',')[1]);
        const bytes = new Uint8Array(pdfData.length);
        for (let i = 0; i < pdfData.length; i++) bytes[i] = pdfData.charCodeAt(i);
        const doc = await window.pdfjsLib.getDocument({ data: bytes }).promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) { setError('Could not render PDF.'); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [dataUrl]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;

    async function renderPage() {
      try {
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch {}
        }
        const page = await pdfDoc.getPage(pageNum);
        if (cancelled || !canvasRef.current) return;

        const container = canvasRef.current.parentElement;
        const containerWidth = container?.clientWidth || 800;
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(containerWidth / viewport.width, 2);
        const scaledViewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const task = page.render({ canvasContext: ctx, viewport: scaledViewport });
        renderTaskRef.current = task;
        await task.promise;
      } catch (e: any) {
        if (e?.name !== 'RenderingCancelledException' && !cancelled) {
          console.warn('PDF render error:', e);
        }
      }
    }
    renderPage();
    return () => { cancelled = true; };
  }, [pdfDoc, pageNum]);

  const prevPage = () => setPageNum(p => Math.max(1, p - 1));
  const nextPage = () => setPageNum(p => Math.min(totalPages, p + 1));

  if (loading) {
    return (
      <div className="w-full h-[220px] sm:h-[380px] flex items-center justify-center bg-gray-50 dark:bg-dark-navy">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
          <p className="text-xs font-mono text-gray-400">Loading PDF…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[220px] sm:h-[380px] flex items-center justify-center bg-gray-50 dark:bg-dark-navy">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full relative bg-gray-100 dark:bg-dark-navy">
      {/* Canvas */}
      <div className="w-full overflow-auto flex justify-center" style={{ maxHeight: '380px' }}>
        <canvas
          ref={canvasRef}
          className="max-w-full shadow-md"
          style={{ display: 'block' }}
        />
      </div>

      {/* PDF page controls */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 text-white">
          {/* Back */}
          <button
            onClick={prevPage}
            disabled={pageNum <= 1}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Pause / Play (stop auto-advance) */}
          <button
            onClick={onTogglePause}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            title={paused ? 'Resume auto-advance' : 'Pause auto-advance'}
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Page counter */}
          <span className="text-[11px] font-mono font-bold px-1">
            {pageNum} / {totalPages}
          </span>

          {/* Next */}
          <button
            onClick={nextPage}
            disabled={pageNum >= totalPages}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-mono font-black uppercase tracking-wider py-1 px-2.5 rounded shadow-md">
        <FileText className="w-3 h-3" />
        PDF
      </div>

      {/* Paused indicator */}
      {paused && (
        <div className="absolute top-3 right-3 z-10 bg-black/60 text-accent-gold text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded">
          ⏸ Paused
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

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
  const [uploadError, setUploadError] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from storage
  useEffect(() => {
    const stored = loadSlides();
    if (stored.length > 0) {
      setSlides(stored);
    } else if (fallbackArticle) {
      const seed: CarouselSlide = {
        id: `slide-${Date.now()}`,
        imageUrl: fallbackArticle.imageUrl,
        linkedArticleId: fallbackArticle.id,
      };
      setSlides([seed]);
      saveSlides([seed]);
    }
  }, [fallbackArticle]);

  // Auto-advance timer
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

  useEffect(() => {
    if (slides.length > 0 && current >= slides.length) {
      setCurrent(slides.length - 1);
    }
  }, [slides, current]);

  // Auto-pause when a PDF slide is active
  useEffect(() => {
    const slide = slides[current];
    if (slide?.isPdf && !paused) {
      setPaused(true);
    }
  }, [current, slides]);

  const goTo = (idx: number) => {
    setCurrent((idx + slides.length) % slides.length);
    if (!paused) startTimer();
  };
  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  // Upload handler — images AND PDFs
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadError('');

    const newSlides: CarouselSlide[] = [];
    for (const file of files) {
      if (file.size > 8 * 1024 * 1024) {
        setUploadError(`"${file.name}" exceeds the 8 MB limit. Skipped.`);
        continue;
      }
      try {
        const base64 = await fileToBase64(file);
        const isPdf = file.type === 'application/pdf';
        newSlides.push({
          id: `slide-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          imageUrl: base64,
          isPdf,
        });
      } catch {
        setUploadError(`Failed to read "${file.name}". Skipped.`);
      }
    }

    if (newSlides.length > 0) {
      const updated = [...slides, ...newSlides];
      setSlides(updated);
      try {
        saveSlides(updated);
      } catch {
        setUploadError('Storage limit reached. Try a smaller file.');
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    const slide: CarouselSlide = { id: `slide-${Date.now()}`, imageUrl: url };
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
    const updated = slides.map(s => s.id === slideId ? { ...s, linkedArticleId: articleId } : s);
    setSlides(updated);
    saveSlides(updated);
    setLinkTarget(null);
  };

  const saveCaptionForSlide = (slideId: string, caption: string) => {
    const updated = slides.map(s => s.id === slideId ? { ...s, caption } : s);
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

  const slide = slides[current];
  const linkedArticle = slide?.linkedArticleId
    ? articles.find(a => a.id === slide.linkedArticleId)
    : undefined;

  // ── Empty state ────────────────────────────────────────────────────────────
  if (slides.length === 0) {
    return (
      <div className="w-full h-[220px] sm:h-[380px] bg-gray-100 dark:bg-secondary-navy rounded-xl border border-border-warm dark:border-gray-800 flex flex-col items-center justify-center gap-3">
        <ImagePlus className="w-10 h-10 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-400 dark:text-gray-500 font-sans">No hero slides yet.</p>
        {isAdminMode && (
          <button
            onClick={() => setShowManager(true)}
            className="mt-1 text-xs font-mono font-bold uppercase bg-primary-crimson text-white px-4 py-2 rounded hover:bg-[#6B0000] transition-colors"
          >
            + Add Images / PDFs
          </button>
        )}
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="group/carousel bg-white dark:bg-secondary-navy rounded-xl border border-border-warm dark:border-gray-800 overflow-hidden shadow-premium hover:shadow-2xl transition-all duration-300 text-left">

      {/* ── Slide area ──────────────────────────────────────────────────────── */}
      <div className="relative select-none">

        {/* Render slides */}
        {slides.map((s, idx) => (
          <div
            key={s.id}
            className={`transition-opacity duration-700 ${idx === current ? 'block' : 'hidden'}`}
          >
            {s.isPdf ? (
              <PdfViewer
                dataUrl={s.imageUrl}
                paused={paused}
                onTogglePause={() => setPaused(p => !p)}
              />
            ) : (
              <div
                className="w-full h-[220px] sm:h-[380px] overflow-hidden relative cursor-pointer"
                onClick={() => { if (linkedArticle) onSelectArticle(linkedArticle); }}
              >
                <img
                  src={s.imageUrl}
                  alt={`Hero slide ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="380" fill="%23f3f4f6"><rect width="800" height="380"/><text x="400" y="200" font-size="16" fill="%239ca3af" text-anchor="middle">Image unavailable</text></svg>';
                  }}
                />
                {/* Gradient overlay */}
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

                {/* Progress bar */}
                {slides.length > 1 && !paused && (
                  <div
                    className="absolute bottom-0 left-0 h-[3px] bg-accent-gold/80 z-20 transition-all duration-100"
                    style={{ width: `${((current + 1) / slides.length) * 100}%` }}
                  />
                )}

                {/* Paused indicator */}
                {paused && (
                  <div className="absolute bottom-4 left-4 z-20 bg-black/60 text-accent-gold text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded">
                    ⏸ Paused
                  </div>
                )}

                {/* Dot indicators */}
                {slides.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={e => { e.stopPropagation(); goTo(i); }}
                        className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Slide navigation arrows (only for non-PDF or when > 1 slide) */}
        {slides.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/3 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover/carousel:opacity-100 backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/3 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover/carousel:opacity-100 backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Pause / play for image slides (shown in overlay, not for PDF — PDF has its own) */}
            {!slide?.isPdf && (
              <button
                onClick={e => { e.stopPropagation(); setPaused(p => !p); }}
                className="absolute bottom-14 right-3 z-20 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover/carousel:opacity-100 backdrop-blur-sm"
              >
                {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            )}
          </>
        )}

        {/* Admin: Manage Slides */}
        {isAdminMode && (
          <button
            onClick={e => { e.stopPropagation(); setShowManager(true); }}
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-accent-gold text-secondary-navy text-[9.5px] font-mono font-black uppercase tracking-wider py-1 px-2.5 rounded shadow hover:bg-yellow-400 transition-colors"
          >
            <Upload className="w-3 h-3" />
            Manage Slides
          </button>
        )}
      </div>

      {/* Article info below */}
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
        <div className="p-4" />
      )}

      {/* ── Slide Manager Modal ─────────────────────────────────────────────── */}
      {showManager && isAdminMode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-secondary-navy rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border-warm dark:border-gray-700 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-warm dark:border-gray-700">
              <h3 className="font-serif font-black text-lg text-secondary-navy dark:text-white">
                🖼️ Hero Carousel Manager
              </h3>
              <button
                onClick={() => { setShowManager(false); setLinkTarget(null); setEditingCaption(null); setUploadError(''); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Upload area */}
              <div className="space-y-3">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Add Slides
                </p>

                <div
                  className="border-2 border-dashed border-border-warm dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-accent-gold dark:hover:border-accent-gold transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-sans text-gray-500 dark:text-gray-400">
                    Click to upload <span className="font-bold text-secondary-navy dark:text-white">Images or PDFs</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, PDF — max 8 MB each</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {uploadError && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                    ⚠️ {uploadError}
                  </p>
                )}

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

              {/* Slide list */}
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
                        {s.isPdf ? (
                          <div
                            className="w-20 h-14 bg-red-50 dark:bg-red-900/20 rounded-lg shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => { setCurrent(idx); setShowManager(false); }}
                          >
                            <FileText className="w-6 h-6 text-red-500" />
                          </div>
                        ) : (
                          <img
                            src={s.imageUrl}
                            alt={`Slide ${idx + 1}`}
                            className="w-20 h-14 object-cover rounded-lg shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => { setCurrent(idx); setShowManager(false); }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-gray-400">#{idx + 1}</span>
                            {s.isPdf && (
                              <span className="text-[9px] font-mono bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">PDF</span>
                            )}
                            {idx === current && (
                              <span className="text-[9px] font-mono bg-accent-gold/20 text-amber-700 dark:text-accent-gold px-1.5 py-0.5 rounded">
                                CURRENT
                              </span>
                            )}
                          </div>

                          {linked ? (
                            <p className="text-xs font-sans text-secondary-navy dark:text-gray-200 line-clamp-1">
                              📰 {linked.title}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No article linked</p>
                          )}

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

                          <button
                            onClick={() => { setEditingCaption(s.id); setCaptionInput(s.caption || ''); }}
                            title="Edit caption"
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border-warm dark:border-gray-700 hover:border-accent-gold hover:text-accent-gold text-gray-400 transition-colors text-[10px] font-bold"
                          >
                            T
                          </button>

                          <button
                            onClick={() => moveSlide(idx, idx - 1)}
                            disabled={idx === 0}
                            title="Move up"
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border-warm dark:border-gray-700 hover:border-accent-gold hover:text-accent-gold text-gray-400 transition-colors disabled:opacity-30 text-xs"
                          >
                            ↑
                          </button>

                          <button
                            onClick={() => moveSlide(idx, idx + 1)}
                            disabled={idx === slides.length - 1}
                            title="Move down"
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border-warm dark:border-gray-700 hover:border-accent-gold hover:text-accent-gold text-gray-400 transition-colors disabled:opacity-30 text-xs"
                          >
                            ↓
                          </button>

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
                Supports images (JPG/PNG/WebP) and PDFs · Max 8 MB per file
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
