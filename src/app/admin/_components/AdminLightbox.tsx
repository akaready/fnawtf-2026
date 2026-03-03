'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { downloadSingleImage } from '@/lib/scripts/downloadStoryboards';

interface AdminLightboxProps {
  images: { url: string; label?: string }[];
  startIndex: number;
  onClose: () => void;
}

export function AdminLightbox({ images, startIndex, onClose }: AdminLightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const [mounted, setMounted] = useState(false);
  const current = images[index];
  const hasMultiple = images.length > 1;

  useEffect(() => setMounted(true), []);

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

  const handleDownload = () => {
    const filename = current.label || `image-${index + 1}.jpg`;
    downloadSingleImage(current.url, filename);
  };

  if (!current || !mounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-12 bg-black/80 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      {/* Center column: image + caption card */}
      <div className="relative flex flex-col items-center max-w-[85vw] max-h-[90vh]">
        {/* Image */}
        <img
          src={current.url}
          alt={current.label || ''}
          className="max-w-full max-h-[75vh] object-contain rounded-xl"
        />

        {/* Caption card */}
        <div className="mt-4 px-5 py-3 rounded-lg bg-white/10 backdrop-blur-sm w-full max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {current.label && (
                <p className="text-base text-white line-clamp-3">{current.label}</p>
              )}
              {hasMultiple && (
                <p className="text-sm text-white/50 mt-0.5">{index + 1} of {images.length}</p>
              )}
              {!current.label && !hasMultiple && (
                <p className="text-sm text-white/50">Image</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="Download"
              >
                <Download size={18} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      {hasMultiple && (
        <>
          <button
            onClick={prev}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 text-white/60 hover:text-white hover:bg-black/70 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 text-white/60 hover:text-white hover:bg-black/70 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
