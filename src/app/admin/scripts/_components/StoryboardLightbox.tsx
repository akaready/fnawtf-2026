'use client';

import { useEffect, useCallback, useState } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { downloadSingleImage } from '@/lib/scripts/downloadStoryboards';

interface Props {
  frames: { imageUrl: string; label: string; filename: string; audioContent?: string; visualContent?: string }[];
  initialIndex: number;
  onClose: () => void;
}

const SLIDE_DISTANCE = 48;
const TRANSITION = { duration: 0.35, ease: [0.32, 0.72, 0, 1] };

export function StoryboardLightbox({ frames, initialIndex, onClose }: Props) {
  const [idx, setIdx] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const current = frames[idx];
  const hasContent = !!(current.audioContent || current.visualContent);

  const goNext = useCallback(() => {
    setDirection(1);
    setIdx(i => (i + 1) % frames.length);
  }, [frames.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setIdx(i => (i - 1 + frames.length) % frames.length);
  }, [frames.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    },
    [onClose, goPrev, goNext]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Screen-edge nav arrows */}
      {frames.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-10"
            title="Previous"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-10"
            title="Next"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Image + header + beat content — centered block */}
      <div
        className="flex flex-col items-center w-[90vw] max-w-5xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar — label + download + close, right above image */}
        <div className="flex items-center justify-between w-full mb-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={current.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-white/60 text-sm font-mono"
            >
              {current.label}
            </motion.span>
          </AnimatePresence>
          <div className="flex items-center gap-1">
            <button
              onClick={() => downloadSingleImage(current.imageUrl, current.filename)}
              className="p-2 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Download image"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="relative w-full overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.img
              key={current.imageUrl}
              custom={direction}
              src={current.imageUrl}
              alt={current.label}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * SLIDE_DISTANCE }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: d * -SLIDE_DISTANCE }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={TRANSITION}
              className={`w-full object-contain ${hasContent ? 'max-h-[62vh]' : 'max-h-[82vh]'}`}
            />
          </AnimatePresence>
        </div>

        {/* Beat content */}
        {hasContent && (
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={idx}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * SLIDE_DISTANCE }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: d * -SLIDE_DISTANCE }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={TRANSITION}
              className="grid grid-cols-2 w-full mt-2"
            >
              <div className="border-l-2 border-l-[var(--admin-accent)] bg-black/30 backdrop-blur-xl px-4 py-3 mr-px">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">Audio</p>
                <p className="text-sm text-white/80 leading-relaxed">{current.audioContent}</p>
              </div>
              <div className="border-l-2 border-l-[var(--admin-info)] bg-black/30 backdrop-blur-xl px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">Visual</p>
                <p className="text-sm text-white/80 leading-relaxed">{current.visualContent}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
