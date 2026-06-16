import React, { useRef, useEffect, useState } from 'react';
import { X, Download, ExternalLink, Copy, Check, FileText, ChevronLeft, ChevronRight, Play, Pause, RefreshCw } from 'lucide-react';
import QuickShareButton from './QuickShareButton';
import { useToast } from './ToastContext';

interface LightboxItem {
  url: string;
  name: string;
  type: string;
}

interface LightboxPreviewProps {
  items: LightboxItem[];
  startIndex: number;
  onClose: () => void;
}

export default function LightboxPreview({ items, startIndex, onClose }: LightboxPreviewProps) {
  const { addToast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(items.length > 1);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef(0);

  // Safe boundary check
  const currentItem = items[currentIndex] || items[0] || { url: '', name: 'Blank file', type: '' };
  const isPdf = currentItem.type === 'application/pdf' || currentItem.name.slice(-4).toLowerCase() === '.pdf';

  // SAME ORIGIN CHECK FOR DOWNLOAD POLICY
  const isSameOrigin = (targetUrl: string) => {
    try {
      if (targetUrl.startsWith('/') || targetUrl.startsWith('./') || targetUrl.startsWith('../')) {
        return true;
      }
      const parsed = new URL(targetUrl, window.location.origin);
      return parsed.origin === window.location.origin;
    } catch {
      return false;
    }
  };

  // Keyboard and Slide resetting handlers
  const handleNext = () => {
    elapsedRef.current = 0;
    setProgress(100);
    setCurrentIndex(prev => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    elapsedRef.current = 0;
    setProgress(100);
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
  };

  // Autoplay loop timer (ticks every 100ms for responsiveness and progress bar updates)
  useEffect(() => {
    if (items.length <= 1) {
      setIsPlaying(false);
      setProgress(100);
      return;
    }

    const TICK_MS = 100;
    const TOTAL_MS = 7000;

    const intervalId = setInterval(() => {
      if (isPlaying && !isHovered) {
        elapsedRef.current += TICK_MS;
        if (elapsedRef.current >= TOTAL_MS) {
          elapsedRef.current = 0;
          setProgress(100);
          setCurrentIndex(prev => (prev + 1) % items.length);
        } else {
          setProgress(Math.max(0, 100 - (elapsedRef.current / TOTAL_MS) * 100));
        }
      }
    }, TICK_MS);

    return () => clearInterval(intervalId);
  }, [isPlaying, isHovered, items.length]);

  // Arrow key navigation + escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (items.length > 1) {
        if (e.key === 'ArrowRight' || e.key === 'Right') {
          handleNext();
        }
        if (e.key === 'ArrowLeft' || e.key === 'Left') {
          handlePrev();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, items.length]);

  // Dynamic image/PDF loading verification checks
  useEffect(() => {
    setMediaLoading(true);
    setHasError(false);

    let active = true;
    const verifyDocumentReachable = async () => {
      try {
        const response = await fetch(currentItem.url, { method: 'HEAD' });
        if (active && (!response.ok || response.status >= 400)) {
          setHasError(true);
          setMediaLoading(false);
        }
      } catch {
        // If cross-origin block, verify if we can fallback safely. For same-origin we mark as error
        if (active && isSameOrigin(currentItem.url)) {
          setHasError(true);
          setMediaLoading(false);
        }
      }
    };

    verifyDocumentReachable();

    return () => {
      active = false;
    };
  }, [currentIndex, currentItem.url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentItem.url);
      setCopied(true);
      addToast('✓ URL copied to clipboard successfully!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed copying url.', 'error');
    }
  };

  const handleDownload = () => {
    if (isSameOrigin(currentItem.url)) {
      const link = document.createElement('a');
      link.href = currentItem.url;
      link.download = currentItem.name;
      link.click();
    } else {
      window.open(currentItem.url, '_blank');
      addToast('Opened file in a new tab; direct download is unavailable for external URLs.', 'info');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-stretch md:justify-end bg-black/75 backdrop-blur-xs select-none pointer-events-auto transition-opacity"
      onClick={onClose}
    >
      <div 
        ref={panelRef}
        className="w-full md:max-w-xl bg-nexus-panel border-l border-nexus-border flex flex-col justify-between shadow-2xl h-full animate-fade-in relative"
        style={{ animationDuration: '0.2s' }}
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-nexus-border bg-nexus-void">
          <div className="flex items-center gap-2 select-none text-left">
            <div className={`p-1.5 rounded-lg shrink-0 ${isPdf ? 'bg-red-500/10 text-red-400' : 'bg-nexus-cyan/10 text-nexus-cyan'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 text-left">
              <h4 className="text-xs sm:text-sm font-serif font-black text-white leading-tight truncate max-w-[160px] sm:max-w-[200px]" title={currentItem.name}>
                {currentItem.name}
              </h4>
              <span className="text-[10px] font-mono text-gray-405 block uppercase mt-0.5">
                {isPdf ? 'PDF document' : 'Asset Photo'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Gallery counter Indicator */}
            {items.length > 1 && (
              <span className="text-[10px] font-mono text-nexus-cyan bg-nexus-cyan/10 border border-nexus-cyan/20 px-1.5 py-0.5 rounded font-bold">
                {currentIndex + 1} / {items.length}
              </span>
            )}

            {/* Play/Pause Autoplay button */}
            {items.length > 1 && (
              <button
                id="autoplay-toggle"
                onClick={() => {
                  setIsPlaying(prev => {
                    if (!prev) {
                      elapsedRef.current = 0;
                      setProgress(100);
                    }
                    return !prev;
                  });
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                title={isPlaying ? "Pause autoplay" : "Play autoplay"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-nexus-cyan animate-pulse" />
                ) : (
                  <Play className="w-4 h-4 text-gray-400 animate-none" />
                )}
              </button>
            )}

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Autoplay Progress Bar */}
        {items.length > 1 && (
          <div className="w-full h-0.5 bg-nexus-void select-none relative overflow-hidden shrink-0">
            <div 
              className="h-full bg-nexus-cyan transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Central Display */}
        <div 
          id="lightbox-display-area"
          className="flex-1 overflow-auto bg-nexus-void flex items-center justify-center p-4 relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Back/Forward navigation overlay controls */}
          {items.length > 1 && (
            <>
              <button
                id="lightbox-prev"
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-4 z-10 w-9 h-9 rounded-full bg-[#0A111F]/90 border border-nexus-border hover:border-nexus-cyan hover:text-nexus-cyan flex items-center justify-center text-gray-400 transition-all shadow-lg active:scale-95 cursor-pointer backdrop-blur-xs"
                title="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                id="lightbox-next"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-4 z-10 w-9 h-9 rounded-full bg-[#0A111F]/90 border border-nexus-border hover:border-nexus-cyan hover:text-nexus-cyan flex items-center justify-center text-gray-400 transition-all shadow-lg active:scale-95 cursor-pointer backdrop-blur-xs"
                title="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {hasError ? (
            <div id="preview-fallback" className="flex flex-col items-center justify-center text-center p-8 bg-nexus-card/50 border border-nexus-border rounded-xl max-w-sm mx-auto animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-danger-red/10 flex items-center justify-center text-danger-red/80 mb-3">
                <X className="w-6 h-6" />
              </div>
              <h5 className="font-serif font-bold text-white text-sm mb-1">Preview unavailable</h5>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                {isPdf 
                  ? "This PDF document could not be loaded directly. It may have security restrictions or require external viewing."
                  : "The image asset could not be loaded or is in an unsupported format."}
              </p>
              <button
                id="fallback-download"
                onClick={handleDownload}
                className="bg-nexus-cyan text-nexus-void px-4 py-2 rounded-lg font-mono text-[10px] font-black uppercase tracking-wider hover:bg-nexus-cyan/95 transition-all text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download instead</span>
              </button>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center relative">
              {/* Loaded item viewports */}
              {isPdf ? (
                <iframe 
                  src={`${currentItem.url}#toolbar=0`}
                  className={`w-full h-full border border-nexus-border rounded-lg bg-nexus-card transition-opacity duration-200 ${mediaLoading ? 'opacity-0 absolute' : 'opacity-100'}`}
                  title="Preflight PDF check"
                  style={{ minHeight: '350px' }}
                  onLoad={() => setMediaLoading(false)}
                />
              ) : (
                <div className={`max-w-full max-h-full flex items-center justify-center rounded-lg border border-nexus-border/60 bg-nexus-card overflow-hidden transition-opacity duration-200 ${mediaLoading ? 'opacity-0 absolute' : 'opacity-100'}`}>
                  <img 
                    src={currentItem.url} 
                    alt={currentItem.name}
                    className="max-w-full max-h-[70vh] object-contain rounded-md"
                    referrerPolicy="no-referrer"
                    onLoad={() => setMediaLoading(false)}
                    onError={() => {
                      setHasError(true);
                      setMediaLoading(false);
                    }}
                  />
                </div>
              )}

              {/* SKELETON PREVIEW LOAD PANEL */}
              {mediaLoading && (
                <div className="w-full h-full min-h-[350px] bg-nexus-card/40 border border-nexus-border rounded-lg flex flex-col items-center justify-center text-center animate-pulse p-8">
                  <RefreshCw className="w-8 h-8 text-nexus-cyan animate-spin mb-2" />
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Loading artifact preview...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom actions toolbar */}
        <div className="p-5 border-t border-nexus-border bg-nexus-panel flex flex-col gap-3 shrink-0">
          
          <div className="flex flex-wrap items-center justify-between gap-2 bg-nexus-card p-3 rounded-lg border border-nexus-border">
            <span className="text-[10px] font-mono text-nexus-gold font-bold uppercase select-none">
              Sovereign Sharing
            </span>
            <div className="flex items-center gap-2 select-none">
              <QuickShareButton url={currentItem.url} title={currentItem.name} variant="badge" />
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1 font-mono text-[10px] font-bold text-gray-400 hover:text-white uppercase transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 stroke-[3] text-nexus-green" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy URL</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 select-none pt-1">
            <a 
              href={currentItem.url}
              target="_blank"
              rel="noreferrer"
              className="border border-nexus-border hover:border-nexus-cyan hover:text-nexus-cyan hover:bg-nexus-cyan/5 text-gray-300 font-mono text-center py-2.5 rounded-lg font-bold text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full Tab</span>
            </a>
            
            <button
              onClick={handleDownload}
              className="bg-nexus-cyan text-nexus-void hover:bg-nexus-cyan/95 rounded-lg font-mono py-2.5 text-center font-black text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all select-none shadow hover:shadow-cyan-500/10 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Download file</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
