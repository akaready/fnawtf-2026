'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useVideoPlayer } from '@/contexts/VideoPlayerContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Global overlay component that dims the entire website when video plays.
 * Listens to VideoPlayerContext for play/pause state changes.
 * Provides cinema-like focus on video content with smooth GSAP animations.
 */
export function VideoDimmingOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { isVideoPlaying, pauseVideo } = useVideoPlayer();
  const prefersReducedMotion = useReducedMotion();

  const handleClick = () => {
    if (pauseVideo) pauseVideo();
  };

  useEffect(() => {
    if (!overlayRef.current) return;

    const duration = prefersReducedMotion ? 0 : 0.25;

    if (isVideoPlaying) {
      // Fade in - dim the website with subtle blur
      gsap.to(overlayRef.current, {
        opacity: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(2px)',
        webkitBackdropFilter: 'blur(2px)',
        pointerEvents: 'auto',
        duration,
        ease: 'power2.out',
      });
    } else {
      // Fade out - gently ease blur and dim back to zero
      gsap.to(overlayRef.current, {
        opacity: 0,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        backdropFilter: 'blur(0px)',
        webkitBackdropFilter: 'blur(0px)',
        pointerEvents: 'none',
        duration: prefersReducedMotion ? 0 : 0.5,
        ease: 'power3.inOut',
      });
    }
  }, [isVideoPlaying, prefersReducedMotion]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 opacity-0 pointer-events-none"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
      aria-hidden="true"
      onClick={handleClick}
    />
  );
}
