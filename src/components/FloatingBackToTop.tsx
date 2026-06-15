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
      className="fixed bottom-6 right-6 z-40 bg-primary-crimson hover:bg-primary-crimson/90 text-white p-3 rounded-full shadow-lg transition-transform hover:-translate-y-1.5 focus:outline-none flex items-center justify-center cursor-pointer border border-accent-gold/20"
      title="Back to Top"
    >
      <ChevronUp className="w-5 h-5 text-white stroke-[2.5]" />
    </button>
  );
}
