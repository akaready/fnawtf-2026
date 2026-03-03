'use client';

import { useEffect, useCallback } from 'react';
import { X, Download } from 'lucide-react';
import { downloadSingleImage } from '@/lib/scripts/downloadStoryboards';

interface Props {
  imageUrl: string;
  label: string;
  filename: string;
  onClose: () => void;
}

export function StoryboardLightbox({ imageUrl, label, filename, onClose }: Props) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDownload = () => {
    downloadSingleImage(imageUrl, filename);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
        <span className="text-white text-sm font-mono">{label}</span>
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

      {/* Image */}
      <img
        src={imageUrl}
        alt={label}
        className="max-w-[90vw] max-h-[85vh] object-contain"
      />
    </div>
  );
}
