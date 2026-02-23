'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useVideoPlayer } from '@/contexts/VideoPlayerContext';

interface ReelPlayerProps {
  videoSrc: string;
  placeholderSrc?: string;
  aspectRatio?: string;
}

/**
 * ReelPlayer - Click-to-play video with direct MP4 loading.
 * Integrates with VideoPlayerContext for dimming overlay.
 */
export function ReelPlayer({
  videoSrc,
  placeholderSrc,
  aspectRatio = '16/9',
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const playPendingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
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

    // Don't pause if play is pending or already paused
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

    // Wait a brief moment for play to settle before observing
    const timeoutId = setTimeout(() => {
      observer = new IntersectionObserver(
        ([entry]) => {
          // Only pause if play is not pending and promise has settled
          if (!entry.isIntersecting && !playPendingRef.current && !playPromiseRef.current) {
            safePause();
          }
        },
        { threshold: 0.5 },
      );

      observer.observe(container);
    }, 150); // Small delay to let play() settle

    return () => {
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, [isPlaying, safePause]);

  // Play / Pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused && !playPendingRef.current) {
      playPendingRef.current = true;
      const promise = video.play();
      playPromiseRef.current = promise;
      promise
        .then(() => {
          playPromiseRef.current = null;
          playPendingRef.current = false;
          setIsPlaying(true);
          setIsVideoPlaying(true);
        })
        .catch((err: Error) => {
          playPromiseRef.current = null;
          playPendingRef.current = false;
          // Silently ignore AbortError as it's handled by the pause mechanism
          if (err.name !== 'AbortError') {
            console.error('Play failed:', err);
          }
        });
    } else if (!playPendingRef.current) {
      safePause();
    }
  }, [setIsVideoPlaying, safePause]);

  // Mute / Unmute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
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

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Title */}
        <div className="text-center mb-8">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Watch Our Reel
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You'll sure be glad you did.
          </p>
        </div>

        {/* Video Player */}
        <div
          ref={containerRef}
          className={`relative rounded-lg overflow-hidden bg-black ${isPlaying ? 'z-[51]' : ''}`}
          style={{ aspectRatio }}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            poster={placeholderSrc}
            playsInline
            muted={isMuted}
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

          {/* Center Play Button (when paused) */}
          {!isPlaying && !isLoading && !error && (
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

          {/* Controls - Bottom Right */}
          <div
            className={`absolute bottom-4 right-4 flex items-center gap-3 transition-opacity duration-300 ${
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
      </div>
    </section>
  );
}
