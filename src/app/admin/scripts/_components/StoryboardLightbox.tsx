'use client';

import { useEffect, useCallback, useState } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { downloadSingleImage } from '@/lib/scripts/downloadStoryboards';

interface Props {
  frames: { imageUrl: string; label: string; filename: string }[];
  initialIndex: number;
  onClose: () => void;
}

export function StoryboardLightbox({ frames, initialIndex, onClose }: Props) {
  const [idx, setIdx] = useState(initialIndex);
  const current = frames[idx];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + frames.length) % frames.length);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % frames.length);
    },
    [onClose, frames.length]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDownload = () => {
    downloadSingleImage(current.imageUrl, current.filename);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
        <span className="text-white text-sm font-mono">{current.label}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 rounded text-white hover:bg-admin-bg-hover transition-colors"
            title="Download image"
          >
            <Download size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded text-white hover:bg-admin-bg-hover transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Prev button */}
      {frames.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx(i => (i - 1 + frames.length) % frames.length); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
          title="Previous"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image */}
      <img
        src={current.imageUrl}
        alt={current.label}
        className="max-w-[90vw] max-h-[85vh] object-contain"
      />

      {/* Next button */}
      {frames.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx(i => (i + 1) % frames.length); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
          title="Next"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
}
