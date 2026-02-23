'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useVideoPlayer } from '@/contexts/VideoPlayerContext';

interface ReelPlayerProps {
  videoSrc: string;
  placeholderSrc?: string;
  aspectRatio?: string;
  defaultMuted?: boolean;
  hoverPreview?: boolean;
}

/**
 * ReelPlayer - Click-to-play video with direct MP4 loading.
 * Integrates with VideoPlayerContext for dimming overlay.
 * Optional hoverPreview: hover starts muted playback, leave pauses.
 * Clicking play always unmutes and starts with sound.
 * Renders only the player div — callers provide any section/title wrapper.
 */
export function ReelPlayer({
  videoSrc,
  placeholderSrc,
  aspectRatio = '16/9',
  defaultMuted = true,
  hoverPreview = false,
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const playPendingRef = useRef(false);
  const hoverInitiatedRef = useRef(false);
  // Tracks if user has ever interacted (clicked play or pause) — disables hover preview
  const userInteractedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(defaultMuted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setIsVideoPlaying, setPauseVideo } = useVideoPlayer();

  // Initialize video source
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setIsLoading(true);

    video.src = videoSrc;

    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setError('Video failed to load');
      setIsLoading(false);
    };

    video.addEventListener('canplaythrough', handleCanPlay, { once: true });
    video.addEventListener('error', handleError, { once: true });

    return () => {
      video.removeEventListener('canplaythrough', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [videoSrc]);

  // Safe pause — waits for any pending play() to settle before calling pause()
  const safePause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playPendingRef.current || video.paused) return;

    const doPause = () => {
      if (!video.paused) {
        video.pause();
      }
      setIsPlaying(false);
      setIsVideoPlaying(false);
    };

    if (playPromiseRef.current) {
      playPromiseRef.current.then(doPause).catch(() => {});
    } else {
      doPause();
    }
  }, [setIsVideoPlaying]);

  // Register pause function with context for external control
  useEffect(() => {
    setPauseVideo(() => safePause);
    return () => setPauseVideo(null);
  }, [safePause, setPauseVideo]);

  // Pause when reel is more than 50% out of viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!isPlaying || !container) return;

    let observer: IntersectionObserver | null = null;

    const timeoutId = setTimeout(() => {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting && !playPendingRef.current && !playPromiseRef.current) {
            safePause();
            hoverInitiatedRef.current = false;
          }
        },
        { threshold: 0.5 },
      );

      observer.observe(container);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, [isPlaying, safePause]);

  // Play (internal)
  const startPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.paused || playPendingRef.current) return;

    playPendingRef.current = true;
    const promise = video.play();
    playPromiseRef.current = promise;
    promise
      .then(() => {
        playPromiseRef.current = null;
        playPendingRef.current = false;
        setIsPlaying(true);
        // Only trigger page dimming for user-initiated play, not hover
        if (!hoverInitiatedRef.current) {
          setIsVideoPlaying(true);
        }
      })
      .catch((err: Error) => {
        playPromiseRef.current = null;
        playPendingRef.current = false;
        if (err.name !== 'AbortError') {
          console.error('Play failed:', err);
        }
      });
  }, [setIsVideoPlaying]);

  // Toggle play/pause (user click) — always unmutes on play
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Mark that user has interacted — no more hover preview after this
    userInteractedRef.current = true;

    // If hover preview is playing, transition to user playback with sound.
    // Pause → unmute → play() synchronously within click handler for autoplay policy.
    if (hoverInitiatedRef.current && !video.paused) {
      hoverInitiatedRef.current = false;
      video.pause();
      video.muted = false;
      setIsMuted(false);
      video.play().catch(() => {});
      setIsPlaying(true);
      setIsVideoPlaying(true);
      return;
    }

    if (video.paused && !playPendingRef.current) {
      // User clicks play → unmute and play with sound
      video.muted = false;
      setIsMuted(false);
      startPlay();
      setIsVideoPlaying(true);
    } else if (!playPendingRef.current) {
      safePause();
      hoverInitiatedRef.current = false;
    }
  }, [startPlay, safePause, setIsVideoPlaying]);

  // Hover handlers
  const handleMouseEnter = useCallback(() => {
    setShowControls(true);
    // Only start hover preview if user hasn't interacted yet (never clicked play or pause)
    if (hoverPreview && !isPlaying && !playPendingRef.current && !userInteractedRef.current) {
      hoverInitiatedRef.current = true;
      if (videoRef.current) videoRef.current.muted = true;
      setIsMuted(true);
      startPlay();
    }
  }, [hoverPreview, isPlaying, startPlay]);

  const handleMouseLeave = useCallback(() => {
    setShowControls(false);
    // Only auto-pause if this was hover-initiated (not user-clicked)
    if (hoverPreview && hoverInitiatedRef.current) {
      safePause();
      hoverInitiatedRef.current = false;
    }
  }, [hoverPreview, safePause]);

  // Sync muted state directly to DOM (React doesn't correctly propagate the muted prop on <video>)
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  // Mute / Unmute — set video.muted synchronously within click (user gesture)
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setIsMuted(next);
  }, []);

  // Fullscreen
  const toggleFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
      setIsVideoPlaying(false);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
      if (isPlaying) {
        setIsVideoPlaying(true);
      }
    }
  }, [isPlaying, setIsVideoPlaying]);

  // Show play button when paused, or during hover preview (encourages click-to-play with sound)
  const showPlayButton = !isLoading && !error && (!isPlaying || hoverInitiatedRef.current);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-lg overflow-hidden bg-black ${isPlaying ? 'z-[51]' : ''}`}
      style={{ aspectRatio }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={placeholderSrc}
        playsInline
        onClick={togglePlay}
      >
        Your browser does not support video playback.
      </video>

      {/* Loading Indicator */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center px-4 max-w-sm">
            <p className="text-white text-sm font-medium mb-2">Unable to load video</p>
            <p className="text-white/60 text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Center Play Button */}
      {showPlayButton && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors duration-300 group"
          aria-label="Play video"
        >
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-accent/90 text-white group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
            <Play className="w-8 h-8 ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Controls - Bottom Right (z-20 to sit above play overlay) */}
      <div
        className={`absolute bottom-4 right-4 z-20 flex items-center gap-3 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={toggleMute}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleFullscreen}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
