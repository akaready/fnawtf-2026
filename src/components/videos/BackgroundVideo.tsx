'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

/**
 * Props for the BackgroundVideo component
 */
interface BackgroundVideoProps {
  videoSrc: string;
  posterSrc?: string;
  className?: string;
  overlayClassName?: string;
}

/**
 * Background video component with HLS.js support for Bunny CDN streaming.
 * Optimized for background use - autoplay, muted, loop, no controls.
 */
export function BackgroundVideo({
  videoSrc,
  posterSrc,
  className = '',
  overlayClassName = 'bg-black/60',
}: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Initialize video playback - HLS.js or native
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    setError(null);
    setIsLoading(true);

    let playAttempted = false;
    let currentPlayPromise: Promise<void> | null = null;

    // Helper to safely play video with proper promise handling
    const safePlay = async () => {
      if (playAttempted || !video.paused) return;
      playAttempted = true;

      try {
        // Wait for previous play promise if it exists
        if (currentPlayPromise) {
          await currentPlayPromise;
        }

        currentPlayPromise = video.play();
        await currentPlayPromise;
        currentPlayPromise = null;
      } catch (err: any) {
        currentPlayPromise = null;
        // Silently ignore AbortError and NotAllowedError (autoplay policy)
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          console.warn('Background video playback error:', err);
        }
      }
    };

    // Use canplay event for more reliable playback timing
    const handleCanPlay = () => {
      safePlay();
    };

    video.addEventListener('canplay', handleCanPlay, { once: true });

    // Detect if URL is HLS playlist or direct video file
    const isHLS = videoSrc.includes('.m3u8');

    if (isHLS && Hls.isSupported()) {
      // Use HLS.js for .m3u8 playlists
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false, // Background video doesn't need low latency
        maxLoadingDelay: 4,
        startLevel: 2, // Start with medium quality for background
      });

      hls.loadSource(videoSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        // Video will play when canplay event fires
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', {
            type: data.type,
            details: data.details,
            url: videoSrc,
          });
          setError(data.details);
          setIsLoading(false);
        }
      });

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        hls.destroy();
      };
    } else if (isHLS && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = videoSrc;
      setIsLoading(false);
      // Video will play when canplay event fires
    } else {
      // Direct video file (MP4, WebM, etc.)
      video.src = videoSrc;
      setIsLoading(false);
      // Video will play when canplay event fires
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoSrc]);

  // Track when video actually starts playing
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setHasStarted(true);
    video.addEventListener('playing', handlePlay);

    return () => video.removeEventListener('playing', handlePlay);
  }, []);

  return (
    <>
      {/* Background Video */}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        poster={posterSrc}
        className={`absolute inset-0 w-full h-full object-cover ${className} ${
          hasStarted ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-1000`}
        aria-hidden="true"
      >
        Your browser does not support video playback.
      </video>

      {/* Dark Overlay */}
      {overlayClassName && (
        <div className={`absolute inset-0 ${overlayClassName}`} />
      )}

      {/* Error Fallback - subtle gradient instead of error message */}
      {error && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-black" />
      )}
    </>
  );
}
