'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { downloadSingleImage } from '@/lib/scripts/downloadStoryboards';

interface AdminLightboxProps {
  images: { url: string; label?: string }[];
  startIndex: number;
  onClose: () => void;
}

export function AdminLightbox({ images, startIndex, onClose }: AdminLightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const current = images[index];
  const hasMultiple = images.length > 1;

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

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
        <span className="text-white text-sm font-mono">
          {current.label || `Image ${index + 1}`}
          {hasMultiple && (
            <span className="text-white/50 ml-2">{index + 1} / {images.length}</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 rounded text-white hover:bg-white/10 transition-colors"
            title="Download image"
          >
            <Download size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded text-white hover:bg-white/10 transition-colors"
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
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Image */}
      <img
        src={current.url}
        alt={current.label || ''}
        className="max-w-[90vw] max-h-[85vh] object-contain"
      />
    </div>
  );
}
