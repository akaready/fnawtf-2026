'use client';

import { useRef, useCallback } from 'react';
import Link from 'next/link';
import { FeaturedProject } from '@/types/project';
import { getBunnyVideoMp4Url } from '@/lib/bunny/client';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface FeaturedWorkCardProps {
  project: FeaturedProject;
  index?: number;
  className?: string;
}

/**
 * FeaturedWorkCard - Individual portfolio item with hover video preview
 * Streams 360p MP4 on hover via range requests (only downloads what's needed)
 */
export function FeaturedWorkCard({ project, index: _index = 0, className }: FeaturedWorkCardProps) {
  const { ref: cardRef, isVisible } = useIntersectionObserver({ once: false });
  const videoRef = useRef<HTMLVideoElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const aspectClass = project.fullWidth
    ? 'aspect-[1/1] md:aspect-[2.4/1]'
    : 'aspect-[2.4/1] md:aspect-auto md:h-96 md:h-80';

  const videoSrc = project.flagship_video_id
    ? getBunnyVideoMp4Url(project.flagship_video_id, '360p')
    : null;

  // Use admin-set thumbnail time, fall back to video midpoint
  const startTimeRef = useRef<number>(0);

  const handleMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    startTimeRef.current = project.thumbnail_time ?? video.duration / 2;
    video.currentTime = startTimeRef.current;
  }, [project.thumbnail_time]);

  const handleHover = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isVisible) return;
    // Seek to midpoint (matching thumbnail) before playing
    if (video.readyState >= 1) {
      video.currentTime = startTimeRef.current;
    }
    const promise = video.play();
    if (promise) {
      playPromiseRef.current = promise;
      promise
        .then(() => { playPromiseRef.current = null; })
        .catch(() => { playPromiseRef.current = null; });
    }
  }, [isVisible]);

  const handleUnhover = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const doPause = () => {
      video.pause();
      video.currentTime = startTimeRef.current;
    };
    if (playPromiseRef.current) {
      playPromiseRef.current.then(doPause).catch(() => {});
    } else {
      doPause();
    }
  }, []);

  return (
    <Link href={`/work/${project.slug}`} className={className}>
      <div
        ref={cardRef}
        className={`group relative cursor-pointer rounded-lg overflow-hidden bg-black ${aspectClass}`}
        onMouseEnter={handleHover}
        onMouseLeave={handleUnhover}
      >
        {/* Background Thumbnail */}
        {project.thumbnail_url && (
          <img
            src={project.thumbnail_url}
            alt={project.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Hover Video Preview - 360p MP4 streamed via range requests */}
        {videoSrc && isVisible && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            src={videoSrc}
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedMetadata={handleMetadata}
          />
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
