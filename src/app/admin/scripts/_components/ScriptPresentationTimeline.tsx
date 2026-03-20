'use client';

import { useRef, useCallback, useState } from 'react';
import type { PresentationSlide } from './presentationUtils';

interface Props {
  slides: PresentationSlide[];
  currentIndex: number;
  onSeek: (index: number) => void;
  /** Comment counts per beatId — used to show indicators on the timeline */
  commentCounts?: Record<string, number>;
}

export function ScriptPresentationTimeline({ slides, currentIndex, onSeek, commentCounts }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const indexFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track || slides.length === 0) return 0;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (slides.length - 1));
  }, [slides.length]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    const idx = indexFromClientX(e.clientX);
    onSeek(idx);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [indexFromClientX, onSeek]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const idx = indexFromClientX(e.clientX);
    setHoverIndex(idx);
    if (dragging) {
      onSeek(idx);
    }
  }, [dragging, indexFromClientX, onSeek]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Compute scene boundaries — first beat + every scene change
  const sceneBoundarySet = new Set<number>([0]);
  for (let i = 1; i < slides.length; i++) {
    if (slides[i].sceneId !== slides[i - 1].sceneId) {
      sceneBoundarySet.add(i);
    }
  }

  const hoverSlide = hoverIndex !== null ? slides[hoverIndex] : null;
  const hoverLeft = hoverIndex !== null && slides.length > 1
    ? `${(hoverIndex / (slides.length - 1)) * 100}%`
    : '0%';

  const playheadLeft = slides.length > 1 ? `${(currentIndex / (slides.length - 1)) * 100}%` : '0%';

  return (
    <div className="flex-shrink-0 z-10 pt-4 pb-4">
      {/* Hover tooltip */}
      <div className="relative px-2">
        {hoverSlide && !dragging && (
          <div
            className="absolute bottom-1 -translate-x-1/2 px-2 py-1 rounded bg-[#1a1a1a] text-[#888] text-admin-sm font-mono whitespace-nowrap pointer-events-none"
            style={{ left: hoverLeft }}
          >
            Scene {hoverSlide.sceneNumber} — Beat {hoverSlide.beatLetter}
          </div>
        )}
      </div>

      {/* Track area */}
      <div className="px-2 py-1">
        <div
          ref={trackRef}
          className="relative h-1.5 bg-[#1a1a1a] rounded-full cursor-pointer"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => { setHoverIndex(null); }}
        >
          {/* Beat marks — dot for regular beats, line for scene boundaries */}
          {slides.map((_, i) => {
            const left = slides.length > 1 ? `${(i / (slides.length - 1)) * 100}%` : '0%';
            const isSceneBoundary = sceneBoundarySet.has(i);
            const isCurrent = i === currentIndex;
            if (isSceneBoundary) {
              return (
                <div
                  key={i}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-px h-3 pointer-events-none ${isCurrent ? 'bg-white' : 'bg-[#555]'}`}
                  style={{ left }}
                />
              );
            }
            const dotClass = i === currentIndex
              ? 'w-1 h-1 bg-white'
              : (commentCounts?.[slides[i].beatId] ?? 0) > 0
                ? 'w-1.5 h-1.5 bg-admin-warning shadow-[0_0_4px_rgba(245,158,11,0.6)]'
                : 'w-1 h-1 bg-[#444]';
            return (
              <div
                key={i}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full pointer-events-none ${dotClass}`}
                style={{ left }}
              />
            );
          })}

          {/* Playhead */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.3)] pointer-events-none transition-[left] duration-150 ease-out"
            style={{ left: playheadLeft }}
          />
        </div>
      </div>
    </div>
  );
}
