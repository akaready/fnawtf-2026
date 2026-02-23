'use client';

import { useEffect, useRef, useState } from 'react';

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
 * Background video component for Bunny CDN MP4 streaming.
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

  // Initialize video playback
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
    // Otherwise (non-homepage contexts, loader already done, or loader skipped), play on canplay.
    const loaderEl = document.querySelector('[data-fna-loader-init]') as HTMLElement | null;
    const loaderIsActive = !!loaderEl && loaderEl.style.display !== 'none';
    if (loaderIsActive && !sessionStorage.getItem('fna_seen')) {
      window.addEventListener('fna-reveal-start', handleRevealStart, { once: true });
    } else {
      revealStarted = true;
    }

    // Set the video source
    video.src = videoSrc;

    // Safety: if the browser already has enough data (cached video), canplay may
    // have fired synchronously or before our listener. Check readyState as fallback.
    // readyState >= 3 (HAVE_FUTURE_DATA) means enough data to play.
    if (video.readyState >= 3) {
      handleCanPlay();
    }

    // Handle load errors for direct MP4 files
    const handleError = () => {
      if (!active) return;
      console.warn('Background video load error:', video.error?.message, videoSrc);
      setError(video.error?.message ?? 'Video failed to load');
    };
    video.addEventListener('error', handleError);

    return () => {
      active = false;
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
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
