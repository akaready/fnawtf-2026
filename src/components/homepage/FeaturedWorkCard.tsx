'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { FeaturedProject } from '@/types/project';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface FeaturedWorkCardProps {
  project: FeaturedProject;
  index?: number;
  className?: string;
}

/**
 * FeaturedWorkCard - Individual portfolio item with hover reveal details
 * Layout: GIF/image with gradient and white text revealing on hover
 * Implements: resources/play-video-on-hover-lazy.md
 */
export function FeaturedWorkCard({ project, index: _index = 0, className }: FeaturedWorkCardProps) {
  const { ref: cardRef, isVisible } = useIntersectionObserver({ once: false });
  const videoRef = useRef<HTMLVideoElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Determine aspect ratio class - hero projects use 2.4:1, regular projects use fixed height
  const aspectClass = project.fullWidth
    ? 'aspect-[2.4/1]'
    : 'h-96 md:h-80';

  // Video handlers
  const handleHover = () => {
    if (videoRef.current && isVisible) {
      const promise = videoRef.current.play();
      if (promise) {
        playPromiseRef.current = promise;
        promise.then(() => { playPromiseRef.current = null; }).catch(() => { playPromiseRef.current = null; });
      }
    }
  };

  const handleUnhover = () => {
    const video = videoRef.current;
    if (!video) return;
    const doPause = () => {
      video.pause();
      video.currentTime = 0;
    };
    if (playPromiseRef.current) {
      playPromiseRef.current.then(doPause).catch(() => {});
    } else {
      doPause();
    }
  };

  return (
    <Link href={`/work/${project.slug}`} className={className}>
      <div
        ref={cardRef}
        className={`group relative cursor-pointer rounded-lg overflow-hidden bg-black ${aspectClass}`}
        onMouseEnter={handleHover}
        onMouseLeave={handleUnhover}
        data-video-on-hover="not-active"
      >
        {/* Background Image/GIF */}
        {project.thumbnail_url && (
          <img
            src={project.thumbnail_url}
            alt={project.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Hover Video (Lazy Loaded) */}
        {isVisible && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            muted
            loop
            playsInline
            data-video-src={project.id}
          >
            {/* Video will play on hover once video sources are configured */}
          </video>
        )}

        {/* Gradient Overlay - Dark at bottom, transparent at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hover Details - White text, animates up */}
        <div className="absolute bottom-0 left-0 right-0 text-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out px-4 py-3 md:px-6 md:py-4">
          <h3 className="font-bold text-sm md:text-base mb-2">
            {project.title}
          </h3>
          {project.category && (
            <span className="inline-block bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
              {project.category}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
