'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import Hls from 'hls.js';

/**
 * Props for the ReelPlayer component
 */
interface ReelPlayerProps {
  videoSrc: string;
  placeholderSrc?: string;
  aspectRatio?: string;
}

/**
 * ReelPlayer component with HLS.js support for Bunny CDN streaming.
 * Features custom controls, lazy loading, and placeholder image.
 */
export function ReelPlayer({
  videoSrc,
  placeholderSrc,
  aspectRatio = '16/9',
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize video playback - HLS.js or native
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    setError(null);
    setIsLoading(true);

    // Detect if URL is HLS playlist or direct video file
    const isHLS = videoSrc.includes('.m3u8');

    if (isHLS && Hls.isSupported()) {
      // Use HLS.js for .m3u8 playlists
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxLoadingDelay: 4,
      });

      hls.loadSource(videoSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('HLS error:', {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
          url: videoSrc,
        });

        if (data.fatal) {
          setError(`Video loading failed: ${data.details}`);
          setIsLoading(false);
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (isHLS && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = videoSrc;
      setIsLoading(false);
    } else {
      // Direct video file (MP4, WebM, etc.) or non-HLS URL
      video.src = videoSrc;
      setIsLoading(false);
    }
  }, [videoSrc]);

  // Handle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(console.error);
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Handle mute/unmute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <section
      className="py-16 md:py-24 bg-muted"
      data-bunny-player-init
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Title */}
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Our Reel
          </h2>
          <p className="mt-2 text-muted-foreground">
            A glimpse into our recent work
          </p>
        </div>

        {/* Video Player */}
        <div
          ref={containerRef}
          className="relative rounded-lg overflow-hidden bg-black"
          style={{ aspectRatio }}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
          data-player-src={videoSrc}
          data-player-status={isPlaying ? 'playing' : 'paused'}
        >
          {/* Placeholder / Video */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            poster={placeholderSrc}
            playsInline
            muted
            loop
            onClick={togglePlay}
            data-player-lazy="meta"
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

          {/* Play Button Overlay (when paused) */}
          {!isPlaying && !isLoading && !error && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 group"
              aria-label="Play video"
            >
              <div className="w-20 h-20 flex items-center justify-center rounded-full bg-accent/90 text-white group-hover:bg-accent transition-colors">
                <Play className="w-8 h-8 ml-1" />
              </div>
            </button>
          )}

          {/* Custom Controls */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                data-player-control="playpause"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              {/* Mute/Unmute */}
              <button
                onClick={toggleMute}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                data-player-control="mute"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                data-player-control="fullscreen"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
