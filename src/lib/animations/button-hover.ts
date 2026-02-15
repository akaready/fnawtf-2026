'use client';

import { useEffect, useRef } from 'react';

export type ButtonTheme = 'dark' | 'light' | 'primary';

interface ButtonHoverOptions {
  theme?: ButtonTheme;
}

/**
 * Directional Button Hover Animation
 * Based on _assets/directional-button-hover.md
 *
 * Features:
 * - Directional fill on hover (detects mouse entry direction)
 * - Three themes: dark, light, primary
 * - Smooth easing animation
 *
 * Usage:
 * <button data-btn-hover data-theme="primary">Click me</button>
 * <a href="#" data-btn-hover data-theme="dark">Link Button</a>
 */

// Global reference to track initialized buttons
const initializedButtons = new Set<Element>();

export function useButtonHover(options: ButtonHoverOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initButtons = async () => {
      const gsapModule = await import('gsap');
      const gsap = gsapModule.default;

      // Get all button elements within this container
      const buttons = container.querySelectorAll('[data-btn-hover]');
      
      buttons.forEach((btn) => {
        // Skip if already initialized
        if (initializedButtons.has(btn)) return;
        
        const htmlBtn = btn as HTMLElement;
        const theme = htmlBtn.dataset.theme || options.theme || 'primary';
        
        // Create background element if it doesn't exist
        if (!htmlBtn.querySelector('.btn__bg')) {
          const bg = document.createElement('span');
          bg.className = 'btn__bg';
          
          const circle = document.createElement('span');
          circle.className = 'btn__circle';
          bg.appendChild(circle);
          
          htmlBtn.appendChild(bg);
        }

        // Set theme class
        htmlBtn.classList.add(`btn--${theme}`);

        // Mouse move handler for direction detection and circle origin
        const handleMouseMove = (e: MouseEvent) => {
          const rect = htmlBtn.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Calculate which edge/corner the mouse is closest to
          const fromLeft = x;
          const fromRight = rect.width - x;
          const fromTop = y;
          const fromBottom = rect.height - y;
          
          const min = Math.min(fromLeft, fromRight, fromTop, fromBottom);
          
          let direction: 'left' | 'right' | 'top' | 'bottom' = 'left';
          if (min === fromRight) direction = 'right';
          else if (min === fromTop) direction = 'top';
          else if (min === fromBottom) direction = 'bottom';
          
          // Store direction for animation
          htmlBtn.dataset.hoverDirection = direction;

          const circleWrap = htmlBtn.querySelector('.btn__circle-wrap') as HTMLElement | null;
          if (circleWrap) {
            circleWrap.style.left = `${x}px`;
            circleWrap.style.top = `${y}px`;
          }
        };

        // Mouse enter handler
        const handleMouseEnter = () => {
          const direction = htmlBtn.dataset.hoverDirection || 'left';
          const circle = htmlBtn.querySelector('.btn__circle') as HTMLElement | null;
          const circleWrap = htmlBtn.querySelector('.btn__circle-wrap') as HTMLElement | null;
          
          if (!circle || !circleWrap) return;

          if (!htmlBtn.dataset.hoverDirection) {
            const rect = htmlBtn.getBoundingClientRect();
            circleWrap.style.left = `${rect.width / 2}px`;
            circleWrap.style.top = `${rect.height / 2}px`;
          }

          gsap.set(circle, { scale: 0, opacity: 1, transformOrigin: 'center center' });

          // Animate circular fill in
          gsap.to(circle, {
            scale: 1,
            duration: 0.4,
            ease: 'button-ease',
            overwrite: true
          });
        };

        // Mouse leave handler
        const handleMouseLeave = () => {
          const circle = htmlBtn.querySelector('.btn__circle') as HTMLElement | null;
          if (!circle) return;
          
          gsap.to(circle, {
            scale: 0,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true
          });
        };

        htmlBtn.addEventListener('mousemove', handleMouseMove);
        htmlBtn.addEventListener('mouseenter', handleMouseEnter);
        htmlBtn.addEventListener('mouseleave', handleMouseLeave);

        // Store cleanup functions
        (htmlBtn as HTMLElement & {
          cleanupButtonHover?: () => void;
        }).cleanupButtonHover = () => {
          htmlBtn.removeEventListener('mousemove', handleMouseMove);
          htmlBtn.removeEventListener('mouseenter', handleMouseEnter);
          htmlBtn.removeEventListener('mouseleave', handleMouseLeave);
        };
      });
    };

    initButtons();

    return () => {
      // Cleanup
      const containerToClean = containerRef.current;
      if (!containerToClean) return;
      
      const buttons = containerToClean.querySelectorAll('[data-btn-hover]');
      buttons.forEach((btn) => {
        const cleanup = (btn as HTMLElement & { cleanupButtonHover?: () => void }).cleanupButtonHover;
        if (cleanup) cleanup();
      });
    };
  }, [options.theme]);

  return containerRef;
}

/**
 * Initialize all buttons on the page
 */
export function initAllButtons() {
  if (typeof document === 'undefined') return;

  const buttons = document.querySelectorAll('[data-btn-hover]');
  
  buttons.forEach((btn) => {
    const htmlBtn = btn as HTMLButtonElement;
    const theme = htmlBtn.dataset.theme || 'primary';
    
    // Skip if already initialized
    if (htmlBtn.classList.contains('btn--initialized')) return;
    htmlBtn.classList.add('btn--initialized');
    
    // Create background element
    if (!htmlBtn.querySelector('.btn__bg')) {
      const bg = document.createElement('span');
      bg.className = 'btn__bg';
      
      const circle = document.createElement('span');
      circle.className = 'btn__circle';
      bg.appendChild(circle);
      
      htmlBtn.appendChild(bg);
    }

    htmlBtn.classList.add(`btn--${theme}`);

    // Store direction
    let direction: 'left' | 'right' | 'top' | 'bottom' = 'left';

    const handleMouseMove = (e: MouseEvent) => {
      const rect = htmlBtn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const fromLeft = x;
      const fromRight = rect.width - x;
      const fromTop = y;
      const fromBottom = rect.height - y;
      
      const min = Math.min(fromLeft, fromRight, fromTop, fromBottom);
      
      if (min === fromRight) direction = 'right';
      else if (min === fromTop) direction = 'top';
      else if (min === fromBottom) direction = 'bottom';
      else direction = 'left';
    };

    const handleMouseEnter = async () => {
      const gsapModule = await import('gsap');
      const gsap = gsapModule.default;
      const circle = htmlBtn.querySelector('.btn__circle') as HTMLElement | null;
      const circleWrap = htmlBtn.querySelector('.btn__circle-wrap') as HTMLElement | null;
      
      if (!circle || !circleWrap) return;

      if (!htmlBtn.dataset.hoverDirection) {
        const rect = htmlBtn.getBoundingClientRect();
        circleWrap.style.left = `${rect.width / 2}px`;
        circleWrap.style.top = `${rect.height / 2}px`;
      }

      gsap.set(circle, { scale: 0, opacity: 1, transformOrigin: 'center center' });

      gsap.to(circle, {
        scale: 1,
        duration: 0.4,
        ease: 'button-ease',
        overwrite: true
      });
    };

    const handleMouseLeave = async () => {
      const gsapModule = await import('gsap');
      const gsap = gsapModule.default;
      const circle = htmlBtn.querySelector('.btn__circle') as HTMLElement | null;
      
      if (!circle) return;

      gsap.to(circle, {
        scale: 0,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: true
      });
    };

    htmlBtn.addEventListener('mousemove', handleMouseMove);
    htmlBtn.addEventListener('mouseenter', handleMouseEnter);
    htmlBtn.addEventListener('mouseleave', handleMouseLeave);
  });
}
