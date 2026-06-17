import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  Trash2,
  X,
  Upload,
  Link2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from './ToastContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CarouselItem {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'pdf';
  caption?: string;
}

interface HomeCarouselProps {
  isAdminMode: boolean;
  /** Pass the admin token in from your auth context instead of reading
   *  localStorage directly inside this component.
   *  Example: const { token } = useAuth(); <HomeCarousel adminToken={token} />
   */
  adminToken?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROTATION_MS = 6000;
const STORAGE_KEY = 'ne_home_carousel_items';

// TODO: Replace localStorage persistence with a backend API call once the
// carousel-items endpoint is ready, so slides survive across devices/browsers.
const DEFAULT_ITEMS: CarouselItem[] = [
  {
    id: 'def-1',
    url: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=1200&auto=format&fit=crop&q=80',
    name: 'Kathmandu Financial District',
    type: 'image',
    caption: 'Welcome to NepalEconomy — Your trusted source for business intelligence',
  },
  {
    id: 'def-2',
    url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&auto=format&fit=crop&q=80',
    name: 'Economic Analysis',
    type: 'image',
    caption: 'Daily economic surveys and policy briefings',
  },
  {
    id: 'def-3',
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
    name: 'Nepal Stock Exchange',
    type: 'image',
    caption: 'Live NEPSE data and market intelligence',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HomeCarousel({ isAdminMode, adminToken = '' }: HomeCarouselProps) {
  const { addToast } = useToast();

  // Carousel state
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  // Editor modal state
  const [editorOpen, setEditorOpen] = useState(false);

  // New-slide form state
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newType, setNewType] = useState<'image' | 'pdf'>('image');
  const [uploadProgress, setUploadProgress] = useState(false);

  // Inline delete confirmation — stores the id pending confirmation
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const elapsedRef = useRef(0);

  // -------------------------------------------------------------------------
  // Persistence: load from localStorage on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed as CarouselItem[]);
          return;
        }
      }
    } catch (_e) {
      // Malformed data — fall through to defaults
    }
    setItems(DEFAULT_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ITEMS));
  }, []);

  // -------------------------------------------------------------------------
  // Persistence: save to localStorage whenever items change
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  // -------------------------------------------------------------------------
  // Auto-rotation ticker
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (items.length <= 1) {
      setIsPlaying(false);
      return;
    }

    const TICK_MS = 50;
    const intervalId = setInterval(() => {
      if (isPlaying && !isHovered) {
        elapsedRef.current += TICK_MS;
        const pct = Math.min(100, (elapsedRef.current / ROTATION_MS) * 100);
        setProgress(pct);

        if (elapsedRef.current >= ROTATION_MS) {
          elapsedRef.current = 0;
          setProgress(0);
          setCurrentIdx(prev => (prev + 1) % items.length);
        }
      }
    }, TICK_MS);

    return () => clearInterval(intervalId);
  }, [isPlaying, isHovered, items.length]);

  // -------------------------------------------------------------------------
  // Navigation helpers
  // -------------------------------------------------------------------------

  const resetProgress = () => {
    elapsedRef.current = 0;
    setProgress(0);
  };

  const goNext = () => {
    resetProgress();
    setCurrentIdx(prev => (prev + 1) % items.length);
  };

  const goPrev = () => {
    resetProgress();
    setCurrentIdx(prev => (prev - 1 + items.length) % items.length);
  };

  const goTo = (i: number) => {
    resetProgress();
    setCurrentIdx(i);
  };

  const togglePlay = () => {
    setIsPlaying(prev => {
      if (!prev) resetProgress();
      return !prev;
    });
  };

  // -------------------------------------------------------------------------
  // File upload
  // -------------------------------------------------------------------------

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      addToast('File too large. Max 25 MB.', 'error');
      return;
    }

    setUploadProgress(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        // adminToken is now passed in as a prop from the auth context —
        // avoids coupling this component directly to a localStorage key.
        headers: { Authorization: adminToken },
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

      const payload = await res.json();
      setNewUrl(payload.file.url);
      setNewName(payload.file.name.replace(/\.[^/.]+$/, ''));
      setNewType(file.type.startsWith('image/') ? 'image' : 'pdf');
      addToast('File uploaded! Click "Add to Carousel" to save.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Upload failed. Please try again.', 'error');
    } finally {
      setUploadProgress(false);
      // Reset file input so the same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // -------------------------------------------------------------------------
  // Add slide
  // -------------------------------------------------------------------------

  const handleAddItem = () => {
    if (!newUrl.trim() || !newName.trim()) {
      addToast('URL and name are required.', 'error');
      return;
    }

    try {
      new URL(newUrl);
    } catch {
      addToast('Invalid URL.', 'error');
      return;
    }

    const newItem: CarouselItem = {
      id: `slide-${Date.now()}`,
      url: newUrl.trim(),
      name: newName.trim(),
      type: newType,
      caption: newCaption.trim() || undefined,
    };

    setItems(prev => [...prev, newItem]);
    setNewUrl('');
    setNewName('');
    setNewCaption('');
    setNewType('image');
    addToast('Slide added to carousel.', 'success');
  };

  // -------------------------------------------------------------------------
  // Remove slide — uses inline confirmation instead of window.confirm()
  // -------------------------------------------------------------------------

  const handleConfirmRemove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setPendingDeleteId(null);
    setCurrentIdx(prev => (prev >= items.length - 1 ? 0 : prev));
    addToast('Slide removed.', 'success');
  };

  // -------------------------------------------------------------------------
  // Early return
  // -------------------------------------------------------------------------

  if (items.length === 0) return null;

  const currentItem = items[currentIdx];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Carousel                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-nexus-border bg-nexus-void shadow-2xl select-none group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Slide area */}
        <div className="relative w-full h-[280px] sm:h-[400px] md:h-[480px] bg-nexus-card">

          {currentItem.type === 'image' ? (
            <img
              key={currentItem.id}
              src={currentItem.url}
              alt={currentItem.name}
              className="w-full h-full object-cover transition-opacity duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <iframe
              key={currentItem.id}
              src={`${currentItem.url}#toolbar=0&view=FitH`}
              className="w-full h-full bg-white"
              title={currentItem.name}
            />
          )}

          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-nexus-void via-nexus-void/70 to-transparent pointer-events-none" />

          {/* Top-left badge: type + counter */}
          <div className="absolute top-4 left-4 flex items-center gap-2 select-none">
            <span className="bg-nexus-cyan/15 backdrop-blur-sm border border-nexus-cyan/40 text-nexus-cyan font-mono text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-lg flex items-center gap-1.5">
              {currentItem.type === 'image' ? (
                <><ImageIcon className="w-3.5 h-3.5" /><span>Image</span></>
              ) : (
                <><FileText className="w-3.5 h-3.5" /><span>PDF</span></>
              )}
            </span>
            <span className="bg-nexus-void/70 backdrop-blur-sm border border-white/10 text-white font-mono text-[10px] font-bold tracking-wider py-1 px-2.5 rounded">
              {currentIdx + 1} / {items.length}
            </span>
          </div>

          {/* Admin manage button */}
          {isAdminMode && (
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setEditorOpen(true)}
                className="bg-nexus-cyan text-nexus-void hover:bg-cyan-400 font-mono text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Manage carousel"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manage</span>
              </button>
            </div>
          )}

          {/* Caption */}
          {currentItem.caption && (
            <div className="absolute bottom-16 left-4 right-4 sm:left-8 sm:right-8 z-10">
              <h3 className="text-white font-serif font-black text-lg sm:text-2xl md:text-3xl leading-tight tracking-tight drop-shadow-lg">
                {currentItem.caption}
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm font-light mt-1 truncate">
                {currentItem.name}
              </p>
            </div>
          )}

          {/* Open PDF link */}
          {currentItem.type === 'pdf' && (
            <a
              href={currentItem.url}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-4 right-4 bg-nexus-cyan text-nexus-void hover:bg-cyan-400 font-mono text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md z-10"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open PDF</span>
            </a>
          )}

          {/* Prev / Next arrows (visible on hover) */}
          {items.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-nexus-void/80 backdrop-blur-sm border border-white/10 hover:border-nexus-cyan hover:bg-nexus-void text-white hover:text-nexus-cyan flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg z-20"
                title="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-nexus-void/80 backdrop-blur-sm border border-white/10 hover:border-nexus-cyan hover:bg-nexus-void text-white hover:text-nexus-cyan flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg z-20"
                title="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Progress bar */}
        {items.length > 1 && (
          <div className="w-full h-1 bg-nexus-card relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-nexus-cyan transition-all ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Controls bar */}
        <div className="bg-nexus-panel border-t border-nexus-border px-4 py-2.5 flex items-center justify-between select-none">

          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-nexus-cyan transition-colors cursor-pointer"
              title={isPlaying ? 'Pause auto-rotation' : 'Play auto-rotation'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-nexus-cyan animate-pulse" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={goPrev}
              className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-nexus-cyan transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={goNext}
              className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-nexus-cyan transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-[10px] font-mono text-gray-500 ml-2 hidden sm:inline">
              {isPlaying ? `Auto-rotating every ${ROTATION_MS / 1000}s` : 'Paused'}
            </span>
          </div>

          {/* Dot indicators */}
          <div className="flex gap-1.5 items-center">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === currentIdx ? 'w-6 bg-nexus-cyan' : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                title={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Editor modal                                                         */}
      {/* ------------------------------------------------------------------ */}
      {editorOpen && isAdminMode && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={() => setEditorOpen(false)}
        >
          <div
            className="bg-nexus-panel border border-nexus-cyan/40 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-nexus-border bg-nexus-void flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-nexus-cyan uppercase font-black">
                  HOMEPAGE CAROUSEL MANAGER
                </span>
                <h3 className="text-sm font-serif font-black text-white uppercase mt-1">
                  Manage Slideshow
                </h3>
              </div>
              <button
                onClick={() => setEditorOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Add new slide form */}
              <div className="space-y-3 border-b border-nexus-border pb-6">
                <h4 className="text-[10px] font-mono font-black text-nexus-cyan uppercase tracking-widest">
                  Add New Slide
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-3 border-2 border-dashed border-nexus-border hover:border-nexus-cyan rounded-lg flex items-center justify-center gap-2 text-xs font-mono text-gray-400 hover:text-nexus-cyan cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload File</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <div className="py-3 border border-nexus-border bg-nexus-void rounded-lg flex items-center justify-center gap-2 text-xs font-mono text-gray-500">
                    <Link2 className="w-4 h-4" />
                    <span>or paste URL below</span>
                  </div>
                </div>

                {uploadProgress && (
                  <div className="h-1 bg-nexus-cyan rounded-full animate-pulse" />
                )}

                <div>
                  <label className="block text-[9px] font-mono text-gray-400 uppercase font-bold mb-1">
                    Public URL *
                  </label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg or document.pdf"
                    className="w-full px-3 py-2 bg-nexus-void border border-nexus-border rounded-lg text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-mono text-gray-400 uppercase font-bold mb-1">
                      Slide Name *
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Slide title"
                      className="w-full px-3 py-2 bg-nexus-void border border-nexus-border rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-gray-400 uppercase font-bold mb-1">
                      Type
                    </label>
                    <select
                      value={newType}
                      onChange={e => setNewType(e.target.value as 'image' | 'pdf')}
                      className="w-full px-3 py-2 bg-nexus-void border border-nexus-border rounded-lg text-xs text-nexus-cyan font-mono focus:outline-none"
                    >
                      <option value="image">Image</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-gray-400 uppercase font-bold mb-1">
                    Caption (optional)
                  </label>
                  <input
                    type="text"
                    value={newCaption}
                    onChange={e => setNewCaption(e.target.value)}
                    placeholder="e.g., Welcome to NepalEconomy"
                    className="w-full px-3 py-2 bg-nexus-void border border-nexus-border rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!newUrl.trim() || !newName.trim()}
                  className="w-full py-2.5 bg-nexus-cyan text-nexus-void hover:bg-cyan-400 disabled:opacity-40 rounded-lg font-mono uppercase font-black tracking-widest text-[11px] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Carousel</span>
                </button>
              </div>

              {/* Current slides list */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono font-black text-nexus-cyan uppercase tracking-widest">
                  Current Slides ({items.length})
                </h4>

                {items.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No slides yet.</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="bg-nexus-card border border-nexus-border rounded-lg p-3 flex items-center gap-3"
                      >
                        <span className="text-[10px] font-mono text-nexus-gold font-bold w-5 shrink-0">
                          #{idx + 1}
                        </span>

                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt=""
                            className="w-12 h-12 object-cover rounded border border-nexus-border shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-nexus-void border border-nexus-border rounded flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-danger-red" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-serif font-bold text-white truncate">{item.name}</h5>
                          <p className="text-[10px] text-gray-500 truncate font-mono">{item.url}</p>
                        </div>

                        {/* Inline delete confirmation — replaces window.confirm() */}
                        {pendingDeleteId === item.id ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono text-danger-red flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Remove?
                            </span>
                            <button
                              onClick={() => handleConfirmRemove(item.id)}
                              className="px-2 py-1 bg-danger-red/20 hover:bg-danger-red/40 text-danger-red rounded text-[10px] font-mono font-bold cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setPendingDeleteId(null)}
                              className="px-2 py-1 hover:bg-white/10 text-gray-400 rounded text-[10px] font-mono cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPendingDeleteId(item.id)}
                            className="p-1.5 hover:bg-red-500/10 text-danger-red rounded shrink-0 cursor-pointer"
                            title="Remove slide"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-3 border-t border-nexus-border bg-nexus-void flex justify-end">
              <button
                onClick={() => setEditorOpen(false)}
                className="px-5 py-2 bg-nexus-cyan text-nexus-void hover:bg-cyan-400 rounded-lg font-mono uppercase font-black tracking-widest text-[10px] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
