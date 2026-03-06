'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface CallSheetLightboxProps {
  images: { url: string; alt: string }[];
  startIndex: number;
  onClose: () => void;
}

export function CallSheetLightbox({ images, startIndex, onClose }: CallSheetLightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const current = images[index];
  const hasMultiple = images.length > 1;

  useEffect(() => setMounted(true), []);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const prev = useCallback(() => setIndex(i => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setIndex(i => (i < images.length - 1 ? i + 1 : 0)), [images.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasMultiple) prev();
      if (e.key === 'ArrowRight' && hasMultiple) next();
    },
    [onClose, hasMultiple, prev, next]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !hasMultiple) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) prev();
      else next();
    }
    touchStartX.current = null;
  };

  if (!current || !mounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-12 bg-black/85 backdrop-blur-md"
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Center: image + counter */}
      <div className="relative flex flex-col items-center max-w-[95vw] sm:max-w-[85vw] max-h-[90vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt}
          className="max-w-full max-h-[80vh] object-contain rounded-xl"
        />

        {/* Counter + close */}
        <div className="mt-3 flex items-center gap-4">
          {hasMultiple && (
            <p className="text-sm text-white/50">{index + 1} of {images.length}</p>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Prev / Next arrows */}
      {hasMultiple && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 text-white/60 hover:text-white hover:bg-black/70 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 text-white/60 hover:text-white hover:bg-black/70 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
