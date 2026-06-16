import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function FloatingBackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShow(true);
      } else {
        setShow(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!show) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 bg-nexus-cyan text-nexus-void p-3 rounded-full shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 hover:-translate-y-1.5 focus:outline-none flex items-center justify-center cursor-pointer border border-[#00D4FF]/30 select-none pointer-events-auto"
      title="Back to Top"
    >
      <ChevronUp className="w-5 h-5 text-nexus-void stroke-[3]" />
    </button>
  );
}
