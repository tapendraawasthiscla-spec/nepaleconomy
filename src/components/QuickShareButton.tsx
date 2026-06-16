import React, { useState } from 'react';
import { Share2, Link, Copy, Check, QrCode, X } from 'lucide-react';
import { useToast } from './ToastContext';

interface QuickShareButtonProps {
  url: string;
  title?: string;
  variant?: 'icon' | 'badge' | 'button';
}

export default function QuickShareButton({ url, title, variant = 'button' }: QuickShareButtonProps) {
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      addToast('✓ Link copied to clipboard successfully!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      addToast('Failed copying link.', 'error');
    }
  };

  const shareTitle = title || 'Shared Document from NepalEconomy.com';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`;

  return (
    <div className="relative inline-block text-left font-sans text-xs">
      
      {variant === 'icon' && (
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-nexus-cyan hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Share resource"
        >
          <Share2 className="w-4 h-4" />
        </button>
      )}

      {variant === 'badge' && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold uppercase bg-nexus-cyan/10 border border-nexus-cyan/20 text-nexus-cyan hover:bg-nexus-cyan/20 rounded transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Link</span>
        </button>
      )}

      {variant === 'button' && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-nexus-border hover:border-nexus-cyan hover:text-nexus-cyan rounded-lg text-[10px] font-mono font-bold uppercase transition-all duration-200 cursor-pointer select-none bg-nexus-card text-gray-300"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      )}

      {open && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in select-none text-left pointer-events-auto"
          onClick={() => setOpen(false)}
        >
          <div 
            className="bg-nexus-panel border border-nexus-border rounded-xl p-6 md:p-7 w-full max-w-sm shadow-2xl relative text-center mx-4 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center font-sans space-y-1.5 pt-1">
              <span className="text-[10px] font-mono tracking-widest text-nexus-cyan uppercase font-black">
                RESOURCE DISPATCH MANAGER
              </span>
              <h4 className="font-serif font-black text-white text-base sm:text-lg line-clamp-1 leading-snug">
                {shareTitle}
              </h4>
            </div>

            {/* Read only Copy Input field */}
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={url}
                className="flex-1 px-3 py-2 bg-nexus-void border border-nexus-border text-xs rounded-lg text-gray-300 font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3 bg-nexus-cyan text-nexus-void hover:bg-nexus-cyan/95 rounded-lg flex items-center justify-center transition-all cursor-pointer font-extrabold"
                title="Copy Link URL"
              >
                {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* QR Code and sharing specs */}
            <div className="bg-nexus-card border border-nexus-border rounded-lg p-4 flex flex-col items-center justify-center space-y-3">
              <span className="text-[10px] font-mono text-nexus-gold font-bold uppercase flex items-center gap-1.5 leading-none">
                <QrCode className="w-3.5 h-3.5" />
                <span>GENERATE MOBILE QR CONDUIT</span>
              </span>
              
              <div className="p-1 px-[5px] bg-white rounded border border-gray-100 flex items-center justify-center select-none shadow">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-[140px] h-[140px]"
                  onError={e => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" fill="%23eee"/>';
                  }}
                />
              </div>
              <p className="text-[10.5px] leading-relaxed text-gray-400 font-sans font-light text-center">
                Scan with any standard smartphone camera to access this PDF asset or dossier directly.
              </p>
            </div>

            <div className="text-[9.5px] text-gray-550 font-mono text-center tracking-widest uppercase">
              SSL EXCRYPTED DELIVERY HUB
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
