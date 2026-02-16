'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { FeaturedProject } from '@/types/project';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface FeaturedWorkCardProps {
  project: FeaturedProject;
  index?: number;
}

/**
 * FeaturedWorkCard - Individual portfolio item with hover video preview
 * Layout: Image above with text section below on grey background
 * Masonry grid with hero project support and purple hover effects
 * Implements: resources/play-video-on-hover-lazy.md
 */
export function FeaturedWorkCard({ project, index = 0 }: FeaturedWorkCardProps) {
  const { ref: cardRef, isVisible } = useIntersectionObserver({ once: false });
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine if this is a hero card
  const isHero = project.is_hero || false;

  // Determine aspect ratio
  const aspectRatio = project.aspect_ratio || '16:9';
  const aspectClass = aspectRatio === '1:1' ? 'aspect-square' : 'aspect-[16/9]';

  // Grid span classes for masonry layout
  const gridClasses = isHero ? 'row-span-3 lg:col-span-2' : 'row-span-2';

  // Video handlers
  const handleHover = () => {
    if (videoRef.current && isVisible) {
      videoRef.current.play();
    }
  };

  const handleUnhover = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <Link href={`/work/${project.slug}`}>
      <div
        ref={cardRef}
        className={`
          group cursor-pointer
          border border-border rounded-lg overflow-hidden
          hover:bg-purple-950 hover:border-purple-500
          transition-all duration-300
          flex flex-col h-full
          ${gridClasses}
        `}
        onMouseEnter={handleHover}
        onMouseLeave={handleUnhover}
        data-video-on-hover="not-active"
      >
        {/* Image Container */}
        <div
          className={`relative ${aspectClass} overflow-hidden bg-muted flex-shrink-0`}
        >
          {/* Thumbnail Image */}
          {project.thumbnail_url && (
            <img
              src={project.thumbnail_url}
              alt={project.title}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
            />
          )}

          {/* Hover Video (Lazy Loaded) */}
          {/* TODO: Wire up video sources when ProjectVideo table is integrated */}
          {/* Once database is configured, fetch bunny_video_id from project_videos table */}
          {/* and use: getBunnyVideoUrl(bunny_video_id) for the src attribute */}
          {isVisible && (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              muted
              loop
              playsInline
              data-video-src={project.id}
            >
              {/* Video will play on hover once video sources are configured */}
            </video>
          )}

          {/* Hover Overlay with "View Project" */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300">
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="text-center">
                <p className="text-white font-semibold text-lg">View Project</p>
                <p className="text-purple-300 text-sm">→</p>
              </div>
            </div>
          </div>
        </div>

        {/* Text Section */}
        <div className="bg-muted p-6 flex-grow flex flex-col">
          <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 group-hover:text-white transition-colors">
            {project.title}
          </h3>
          {project.subtitle && (
            <p className="text-sm text-muted-foreground mb-4 group-hover:text-purple-200 transition-colors flex-grow">
              {project.subtitle}
            </p>
          )}
          <div className="text-accent group-hover:text-purple-300 text-sm font-semibold transition-colors mt-auto">
            View Project →
          </div>
        </div>
      </div>
    </Link>
  );
}
