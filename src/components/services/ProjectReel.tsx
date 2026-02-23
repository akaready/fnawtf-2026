'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ServiceProject } from './ServicesData';
import { NavButton } from '@/components/layout/NavButton';
import { ReelPlayer } from '@/components/homepage/ReelPlayer';
import { VideoPasswordGate } from '@/components/work/VideoPasswordGate';
import { getBunnyVideoMp4Url, getBunnyVideoThumbnail } from '@/lib/bunny/client';
import { useVideoPlayer } from '@/contexts/VideoPlayerContext';

// ─── Shared Lightbox ─────────────────────────────────────────────────────────

interface LightboxProps {
  project: ServiceProject;
  onClose: () => void;
}

function Lightbox({ project, onClose }: LightboxProps) {
  const { setIsVideoPlaying, setPauseVideo } = useVideoPlayer();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
      // Reset video player context so the global dimming overlay clears
      setIsVideoPlaying(false);
      setPauseVideo(null);
    };
  }, [onClose, setIsVideoPlaying, setPauseVideo]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video / Image */}
        <div className="bg-[#111] relative">
          {project.flagship_video_id && project.flagship_protected ? (
            <VideoPasswordGate
              videoSrc={getBunnyVideoMp4Url(project.flagship_video_id, '720p')}
              placeholderSrc={project.thumbnail_url || getBunnyVideoThumbnail(project.flagship_video_id)}
              password={project.flagship_password ?? ''}
            />
          ) : project.flagship_video_id ? (
            <ReelPlayer
              videoSrc={getBunnyVideoMp4Url(project.flagship_video_id, '720p')}
              placeholderSrc={project.thumbnail_url || getBunnyVideoThumbnail(project.flagship_video_id)}
              defaultMuted={false}
            />
          ) : project.thumbnail_url ? (
            <div className="aspect-video">
              <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-video bg-[#0d0d0d] flex items-center justify-center">
              <span className="text-white/20 text-sm font-mono">No preview</span>
            </div>
          )}
        </div>

        {/* Details + CTA */}
        <div className="p-6 flex items-center justify-between gap-6">
          <div>
            <h3 className="text-white font-bold text-xl">{project.title}</h3>
            {project.subtitle && <p className="text-white/50 text-sm mt-1">{project.subtitle}</p>}
            {project.category && (
              <span className="inline-block mt-3 px-2 py-0.5 text-xs bg-white/10 text-white/60 rounded font-medium">
                {project.category}
              </span>
            )}
          </div>
          <NavButton href={`/work/${project.slug}`} inverted size="lg" iconName="external-link">
            View Project
          </NavButton>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}

// ─── ServicesProjectGrid (Build / Launch / Scale) ────────────────────────────
// Featured card (2.4:1) + 2 smaller cards underneath in a 2-col grid

interface GridCardProps {
  project: ServiceProject;
  onSelect: (p: ServiceProject) => void;
  aspectClass?: string;
}

function GridCard({ project, onSelect, aspectClass = 'aspect-[2.4/1]' }: GridCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const startTimeRef = useRef<number>(project.thumbnail_time ?? 0);
  const metaLoadedRef = useRef(false);

  const videoSrc = project.flagship_video_id
    ? getBunnyVideoMp4Url(project.flagship_video_id, '360p') + (project.thumbnail_time ? `#t=${project.thumbnail_time}` : '')
    : null;

  const handleMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    metaLoadedRef.current = true;
    startTimeRef.current = project.thumbnail_time ?? video.duration / 2;
    video.currentTime = startTimeRef.current;
  }, [project.thumbnail_time]);

  const handleHover = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (metaLoadedRef.current) {
      video.currentTime = startTimeRef.current;
      const p = video.play();
      if (p) {
        playPromiseRef.current = p;
        p.then(() => { playPromiseRef.current = null; }).catch(() => { playPromiseRef.current = null; });
      }
    } else {
      // Metadata not loaded yet — wait for it, then seek and play
      const onReady = () => {
        metaLoadedRef.current = true;
        startTimeRef.current = project.thumbnail_time ?? video.duration / 2;
        video.currentTime = startTimeRef.current;
        const p = video.play();
        if (p) {
          playPromiseRef.current = p;
          p.then(() => { playPromiseRef.current = null; }).catch(() => { playPromiseRef.current = null; });
        }
      };
      video.addEventListener('loadedmetadata', onReady, { once: true });
      video.load();
    }
  }, [project.thumbnail_time]);

  const handleUnhover = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const doPause = () => { video.pause(); video.currentTime = startTimeRef.current; };
    if (playPromiseRef.current) {
      playPromiseRef.current.then(doPause).catch(() => {});
    } else {
      doPause();
    }
  }, []);

  return (
    <button
      onClick={() => onSelect(project)}
      onMouseEnter={handleHover}
      onMouseLeave={handleUnhover}
      className={`relative w-full ${aspectClass} rounded-lg overflow-hidden bg-[#0d0d0d] cursor-pointer group outline-none`}
    >
      {project.thumbnail_url && (
        <img src={project.thumbnail_url} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
      )}
      {!project.thumbnail_url && (
        <div className="absolute inset-0 bg-white/[0.03]" />
      )}
      {videoSrc && (
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4 py-3">
        <p className="text-white font-semibold text-sm truncate">{project.title}</p>
        {project.category && (
          <span className="inline-block mt-1 text-xs text-white/60">{project.category}</span>
        )}
      </div>
    </button>
  );
}

export interface ServicesProjectGridProps {
  projects: ServiceProject[];
  className?: string;
  subGridVariant?: 'landscape' | 'square' | 'portrait';
  featuredAspect?: 'wide' | 'video';
}

export function ServicesProjectGrid({ projects, className = '', subGridVariant = 'landscape', featuredAspect = 'video' }: ServicesProjectGridProps) {
  const [selected, setSelected] = useState<ServiceProject | null>(null);

  if (!projects?.length) return null;

  const [featured, ...rest] = projects;

  const subAspect =
    subGridVariant === 'square' ? 'aspect-square lg:aspect-auto lg:h-full' :
    subGridVariant === 'portrait' ? 'aspect-[9/16]' :
    'aspect-video';

  const subCount = subGridVariant === 'landscape' ? 2 : 3;
  const subCols = subGridVariant === 'landscape' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-3';
  const featuredAspectClass = featuredAspect === 'video' ? 'aspect-video lg:flex-[2] lg:aspect-auto' : 'aspect-[2.4/1]';

  return (
    <>
      <div className={`flex flex-col gap-[18px] lg:h-full ${className}`}>
        <GridCard project={featured} onSelect={setSelected} aspectClass={featuredAspectClass} />
        {rest.length > 0 && (
          <div className={`grid ${subCols} gap-[18px] lg:flex-1`}>
            {rest.slice(0, subCount).map((p) => (
              <GridCard key={p.id} project={p} onSelect={setSelected} aspectClass={subAspect} />
            ))}
          </div>
        )}
      </div>
      {selected && <Lightbox project={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

// ─── ProjectReel (Crowdfunding / Fundraising) ─────────────────────────────────
// Auto-scrolling carousel — slow drift, pauses on hover

interface ReelCardProps {
  project: ServiceProject;
  onClick: () => void;
}

function ReelCard({ project, onClick }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const startTimeRef = useRef<number>(project.thumbnail_time ?? 0);
  const metaLoadedRef = useRef(false);

  const videoSrc = project.flagship_video_id
    ? getBunnyVideoMp4Url(project.flagship_video_id, '360p') + (project.thumbnail_time ? `#t=${project.thumbnail_time}` : '')
    : null;

  const handleMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    metaLoadedRef.current = true;
    startTimeRef.current = project.thumbnail_time ?? video.duration / 2;
    video.currentTime = startTimeRef.current;
  }, [project.thumbnail_time]);

  const handleEnter = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (metaLoadedRef.current) {
      video.currentTime = startTimeRef.current;
      const p = video.play();
      if (p) {
        playPromiseRef.current = p;
        p.then(() => { playPromiseRef.current = null; }).catch(() => { playPromiseRef.current = null; });
      }
    } else {
      const onReady = () => {
        metaLoadedRef.current = true;
        startTimeRef.current = project.thumbnail_time ?? video.duration / 2;
        video.currentTime = startTimeRef.current;
        const p = video.play();
        if (p) {
          playPromiseRef.current = p;
          p.then(() => { playPromiseRef.current = null; }).catch(() => { playPromiseRef.current = null; });
        }
      };
      video.addEventListener('loadedmetadata', onReady, { once: true });
      video.load();
    }
  }, [project.thumbnail_time]);

  const handleLeave = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const doPause = () => { video.pause(); video.currentTime = startTimeRef.current; };
    if (playPromiseRef.current) {
      playPromiseRef.current.then(doPause).catch(() => {});
    } else {
      doPause();
    }
  }, []);

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="relative flex-none w-72 h-48 mr-4 rounded-lg overflow-hidden bg-[#0d0d0d] cursor-pointer group outline-none"
    >
      {project.thumbnail_url && (
        <img src={project.thumbnail_url} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
      )}
      {!project.thumbnail_url && (
        <div className="absolute inset-0 bg-white/[0.03]" />
      )}
      {videoSrc && (
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4 py-3">
        <p className="text-white font-semibold text-sm truncate">{project.title}</p>
        {project.category && (
          <span className="inline-block mt-1 text-xs text-white/60">{project.category}</span>
        )}
      </div>
    </button>
  );
}

export interface ProjectReelProps {
  projects: ServiceProject[];
  className?: string;
  fadeColor?: string;
  direction?: 'left' | 'right';
}

export function ProjectReel({ projects, className = '', fadeColor = '#000000', direction = 'left' }: ProjectReelProps) {
  const [selected, setSelected] = useState<ServiceProject | null>(null);
  const [paused, setPaused] = useState(false);

  if (!projects?.length) return null;

  // Ensure each set has enough cards to exceed the carousel viewport width.
  // With cards at 304px each, 8 cards = 2432px — wider than any constrained column.
  const MIN_PER_SET = 8;
  const baseItems = projects.length >= MIN_PER_SET
    ? projects
    : Array.from({ length: Math.ceil(MIN_PER_SET / projects.length) }, () => projects).flat();
  const items = [...baseItems, ...baseItems]; // 2× for seamless 50% loop
  const animationName = direction === 'right' ? 'reelRight' : 'reelLeft';

  return (
    <>
      <div
        className={`relative overflow-hidden ${className}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex will-change-transform"
          style={{
            width: 'max-content',
            animation: `${animationName} 60s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {items.map((project, i) => (
            <ReelCard
              key={`${project.id}-${i}`}
              project={project}
              onClick={() => setSelected(project)}
            />
          ))}
        </div>

        {/* Fade edges */}
        <div
          className="absolute inset-y-0 left-0 w-16 pointer-events-none z-10"
          style={{ background: `linear-gradient(to right, ${fadeColor}, transparent)` }}
        />
        <div
          className="absolute inset-y-0 right-0 w-16 pointer-events-none z-10"
          style={{ background: `linear-gradient(to left, ${fadeColor}, transparent)` }}
        />
      </div>

      {selected && <Lightbox project={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
