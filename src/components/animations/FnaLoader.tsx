'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/**
 * FNA Loader - Modified Willem Animation
 * 
 * Animation sequence:
 * 1. Letters "fna.wtf" appear with reveal animation
 * 2. The "." starts as a small circle
 * 3. Dot expands into preview box
 * 4. Preview scales to full viewport to reveal the site
 * 5. Text fades out during reveal
 * 6. Only site content remains visible
 * 
 * Based on: _assets/willem-loading-animation.md
 */

export interface FnaLoaderProps {
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Optional preview image source (defaults to purple gradient) */
  previewImageSrc?: string;
  /** Minimum time to show loader (ms) */
  minDuration?: number;
}

const FNA_TEXT = 'fna.wtf';

export function FnaLoader({ 
  onComplete, 
  previewImageSrc,
  minDuration = 2000 
}: FnaLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Skip animation for reduced motion preference
      const timer = setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, minDuration);
      return () => clearTimeout(timer);
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsComplete(true);
          onComplete?.();
        }
      });

      // Elements
      const letters = document.querySelectorAll('.fna-loader__letter');
      const dot = document.querySelector('.fna-loader__dot');
      const preview = document.querySelector('.fna-loader__preview');
      const growingImage = document.querySelector('.fna-loader__growing-image');
      const content = document.querySelector('.fna-loader__content');

      // Step 1: Animate letters in from bottom (yPercent: 100 → 0)
      if (letters.length) {
        tl.from(letters, {
          yPercent: 100,
          duration: 1.25,
          ease: 'expo.out',
          stagger: 0.05,
        });
      }

      // Step 2: Animate dot expanding into preview box
      if (dot && preview) {
        tl.to(dot, {
          width: '8em',
          duration: 1.5,
          ease: 'expo.inOut',
        }, '< 0.5');
      }

      // Step 3: Grow preview to full viewport
      if (preview) {
        tl.to(preview, {
          width: '100vw',
          duration: 2,
          ease: 'expo.inOut',
        }, '<');
      }

      // Step 4: Expand to full viewport height (the growing image effect)
      if (growingImage) {
        tl.to(growingImage, {
          width: '100vw',
          height: '100dvh',
          duration: 2,
          ease: 'expo.inOut',
        }, '<');
      }

      // Step 5: Fade out the loader text while image expands
      if (content) {
        tl.to(content, {
          opacity: 0,
          duration: 1,
          ease: 'expo.out',
        }, '< 0.5');
      }

      // Ensure minimum duration
      const totalDuration = tl.duration() * 1000;
      if (totalDuration < minDuration) {
        const remainingTime = minDuration - totalDuration;
        tl.to({}, { duration: remainingTime / 1000 });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete, minDuration]);

  // If animation is complete, return null to render actual content
  if (isComplete) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="fna-loader fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
      data-fna-loader-init
    >
      {/* Growing image that expands to full screen */}
      <div 
        className="fna-loader__growing-image absolute left-0 top-0 h-full w-0 bg-purple-600"
        style={{
          background: previewImageSrc 
            ? `url(${previewImageSrc}) center/cover no-repeat`
            : 'linear-gradient(135deg, #a14dfd 0%, #7a2fd4 50%, #6622b6 100%)',
        }}
      />
      
      {/* Content container */}
      <div className="fna-loader__content relative z-10 flex items-center">
        {/* Letters container */}
        <div className="flex overflow-hidden">
          {FNA_TEXT.split('').map((char, index) => (
            <span
              key={index}
              className="fna-loader__letter inline-block font-display text-5xl md:text-7xl font-bold text-foreground"
              data-fna-letter
              style={{ 
                display: char === '.' ? 'none' : 'inline-block' 
              }}
            >
              {char === '.' ? '' : char}
            </span>
          ))}
        </div>
        
        {/* The dot that expands */}
        <div className="fna-loader__dot relative h-4 w-0 overflow-hidden rounded-full bg-purple-400" data-fna-dot>
          {/* Preview box that appears after dot expansion */}
          <div className="fna-loader__preview absolute left-0 top-0 h-4 w-0 overflow-hidden rounded-full bg-purple-400" />
        </div>
      </div>
    </div>
  );
}

export default FnaLoader;
