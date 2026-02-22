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
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Initialize video playback - HLS.js or native
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    setError(null);

    let active = true;
    let currentPlayPromise: Promise<void> | null = null;
    let canPlayReady = false;
    let revealStarted = false;

    // Helper to safely play video with proper promise handling
    const safePlay = async () => {
      if (!active || !video.paused) return;

      try {
        if (currentPlayPromise) {
          await currentPlayPromise;
        }

        if (!active) return;

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

    // Play only when both video is buffered AND the reveal has started
    const tryPlay = () => {
      if (canPlayReady && revealStarted) safePlay();
    };

    const handleCanPlay = () => { canPlayReady = true; tryPlay(); };
    const handleRevealStart = () => { revealStarted = true; tryPlay(); };

    video.addEventListener('canplay', handleCanPlay, { once: true });

    // If FnaLoader is active (not yet complete), wait for its reveal event before playing.
    // Otherwise (non-homepage contexts, or loader already done), play on canplay as normal.
    const loaderEl = document.querySelector('[data-fna-loader-init]') as HTMLElement | null;
    const loaderIsActive = !!loaderEl && loaderEl.style.display !== 'none';
    if (loaderIsActive) {
      window.addEventListener('fna-reveal-start', handleRevealStart, { once: true });
    } else {
      revealStarted = true;
    }

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
        // Video will play when both canplay and fna-reveal-start have fired
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', {
            type: data.type,
            details: data.details,
            url: videoSrc,
          });
          setError(data.details);
        }
      });

      return () => {
        active = false;
        video.removeEventListener('canplay', handleCanPlay);
        window.removeEventListener('fna-reveal-start', handleRevealStart);
        const destroy = () => hls.destroy();
        if (currentPlayPromise) {
          currentPlayPromise.then(destroy).catch(destroy);
        } else {
          destroy();
        }
      };
    } else if (isHLS && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = videoSrc;
    } else {
      // Direct video file (MP4, WebM, etc.)
      video.src = videoSrc;
    }

    return () => {
      active = false;
      video.removeEventListener('canplay', handleCanPlay);
      window.removeEventListener('fna-reveal-start', handleRevealStart);
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
