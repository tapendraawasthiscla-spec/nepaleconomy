import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => {
      const next = [...prev, { id, message, type }];
      if (next.length > 3) {
        next.shift(); // keep max 3 toasts
      }
      return next;
    });

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
        {toasts.map(t => {
          let bg = 'bg-nexus-panel border-nexus-border';
          let textColor = 'text-white';
          let icon = <Info className="w-5 h-5 text-nexus-cyan" />;
          
          if (t.type === 'success') {
            bg = 'bg-nexus-panel border-nexus-green/30';
            textColor = 'text-nexus-green';
            icon = <CheckCircle className="w-5 h-5 text-nexus-green" />;
          } else if (t.type === 'error') {
            bg = 'bg-nexus-panel border-red-500/30';
            textColor = 'text-red-400';
            icon = <AlertTriangle className="w-5 h-5 text-red-500" />;
          }

          return (
            <div
              key={t.id}
              className={`p-4 rounded-xl border shadow-xl flex items-start gap-3 pointer-events-auto animate-fade-in ${bg} text-left`}
            >
              <div className="shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 text-xs sm:text-sm font-sans font-light text-gray-250 leading-relaxed min-w-0">
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider');
  }
  return context;
}
