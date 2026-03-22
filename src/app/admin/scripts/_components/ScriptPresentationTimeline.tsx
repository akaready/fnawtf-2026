'use client';

import { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import type { PresentationSlide } from './presentationUtils';
import type { CommentAuthor } from '@/app/s/[token]/actions';

/* ── Deterministic avatar color from email ── */

function avatarColor(email: string): string {
  let hash = 0;
  for (const ch of email) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  const colors = ['#e67e22','#3b82f6','#22c55e','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f59e0b','#14b8a6','#6366f1'];
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

/* ── BeatAvatars — staggered pop-up above a beat mark ── */

function BeatAvatars({
  authors,
  onClickAvatar,
  isCurrent,
}: {
  authors: CommentAuthor[];
  onClickAvatar: (email: string) => void;
  isCurrent: boolean;
}) {
  // Most recent commenter is last in the array — reverse so they're on top of the stack
  const stacked = [...authors].reverse().slice(0, 5);
  // Opacity fades after the top avatar: 1, 0.55, 0.3, then hidden
  const layerOpacity = [1, 0.55, 0.3];

  return (
    <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto" style={{ width: 20, height: stacked.length * 4 + 16, bottom: '100%', marginBottom: 4 }}>
      {stacked.map((author, i) => {
        const baseOpacity = layerOpacity[i] ?? 0.15;
        return (
          <motion.button
            key={author.email}
            onClick={(e) => { e.stopPropagation(); onClickAvatar(author.email); }}
            initial={{ y: 8, opacity: 0, scale: 0.5 }}
            animate={{
              y: 0,
              opacity: isCurrent ? baseOpacity : baseOpacity * 0.7,
              scale: 1,
            }}
            transition={{
              duration: 0.25,
              ease: [0.22, 1, 0.36, 1],
              delay: i * 0.04,
            }}
            whileHover={{ scale: 1.15, opacity: 1 }}
            className="absolute left-0 w-5 h-5 rounded-full ring-1 ring-black/60 flex-shrink-0 overflow-hidden flex items-center justify-center cursor-pointer"
            style={{
              top: i * 4,
              zIndex: stacked.length - i,
              ...(!author.avatar_url ? { backgroundColor: avatarColor(author.email) } : {}),
            }}
            title={author.name || author.email}
          >
            {author.avatar_url ? (
              <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-black leading-none" style={{ fontWeight: 900 }}>
                {getInitials(author.name, author.email)}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ── Timeline ── */

interface Props {
  slides: PresentationSlide[];
  currentIndex: number;
  onSeek: (index: number) => void;
  commentAuthors?: Record<string, CommentAuthor[]>;
  onClickCommentAvatar?: (beatId: string, email: string) => void;
}

export function ScriptPresentationTimeline({ slides, currentIndex, onSeek, commentAuthors, onClickCommentAvatar }: Props) {
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
          {slides.map((slide, i) => {
            const left = slides.length > 1 ? `${(i / (slides.length - 1)) * 100}%` : '0%';
            const isSceneBoundary = sceneBoundarySet.has(i);
            const isCurrent = i === currentIndex;
            const authors = commentAuthors?.[slide.beatId];

            if (isSceneBoundary) {
              return (
                <div
                  key={i}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-px h-3 pointer-events-none ${isCurrent ? 'bg-white' : 'bg-[#555]'}`}
                  style={{ left }}
                >
                  {authors && authors.length > 0 && onClickCommentAvatar && (
                    <BeatAvatars
                      authors={authors}
                      isCurrent={isCurrent}
                      onClickAvatar={(email) => onClickCommentAvatar(slide.beatId, email)}
                    />
                  )}
                </div>
              );
            }

            const dotClass = isCurrent ? 'w-1 h-1 bg-white' : 'w-1 h-1 bg-admin-text-faint';

            return (
              <div
                key={i}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full pointer-events-none ${dotClass}`}
                style={{ left }}
              >
                {authors && authors.length > 0 && onClickCommentAvatar && (
                  <BeatAvatars
                    authors={authors}
                    isCurrent={isCurrent}
                    onClickAvatar={(email) => onClickCommentAvatar(slide.beatId, email)}
                  />
                )}
              </div>
            );
          })}

          {/* Playhead */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.3)] pointer-events-none transition-[left] duration-150 ease-out"
            style={{ left: playheadLeft }}
          />
        </div>
      </div>

      {/* Hover tooltip — below the track */}
      <div className="relative px-2 h-0">
        {hoverSlide && !dragging && (
          <div
            className="absolute -translate-x-1/2 px-2 py-1 rounded bg-[#1a1a1a] text-[#888] text-admin-sm font-mono whitespace-nowrap pointer-events-none text-center"
            style={{ left: hoverLeft, top: 3 }}
          >
            {hoverSlide.sceneNumber}{hoverSlide.beatLetter}
          </div>
        )}
      </div>
    </div>
  );
}
