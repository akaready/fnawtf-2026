'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface FnaLoaderProps {
  onComplete?: () => void;
}

export function FnaLoader({ onComplete }: FnaLoaderProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const textStackRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const whiteTextContainerRef = useRef<HTMLDivElement>(null);
  const whiteTextRef = useRef<HTMLDivElement>(null);
  const dotContainerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!outerRef.current || !maskRef.current || !textRef.current ||
        !whiteTextContainerRef.current || !whiteTextRef.current ||
        !dotContainerRef.current || isComplete) return;

    const purpleText = textRef.current;
    const whiteText = whiteTextRef.current;
    const whiteTextContainer = whiteTextContainerRef.current;
    const outer = outerRef.current;

    // Build purple text (base layer) - "fna" + dot + "wtf"
    purpleText.innerHTML = '';
    const purpleLetters: HTMLElement[] = [];
    let purpleLeftGroup: HTMLElement[] = [];
    let purpleRightGroup: HTMLElement[] = [];

    // Left group: "fna"
    'fna'.split('').forEach((letter) => {
      const span = document.createElement('span');
      span.textContent = letter;
      span.className = 'fna-loader__letter';
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      purpleText.appendChild(span);
      purpleLetters.push(span);
      purpleLeftGroup.push(span);
    });

    // SVG dot (purple) - sized to match a period character
    const purpleDotSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    purpleDotSvg.setAttribute('width', '16');
    purpleDotSvg.setAttribute('height', '16');
    purpleDotSvg.setAttribute('viewBox', '0 0 16 16');
    purpleDotSvg.style.display = 'inline-block';
    purpleDotSvg.style.verticalAlign = 'baseline';
    purpleDotSvg.style.opacity = '0';
    purpleDotSvg.style.transform = 'translateY(-4px)'; // Lift to period position
    purpleDotSvg.style.margin = '0 2px 0 4px'; // Small spacing like a period, shifted 2px right

    const purpleDotCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    purpleDotCircle.setAttribute('cx', '8');
    purpleDotCircle.setAttribute('cy', '8');
    purpleDotCircle.setAttribute('r', '6');
    purpleDotCircle.setAttribute('fill', 'var(--accent)');

    purpleDotSvg.appendChild(purpleDotCircle);
    purpleText.appendChild(purpleDotSvg);
    purpleLetters.push(purpleDotSvg as unknown as HTMLElement);

    // Right group: "wtf"
    'wtf'.split('').forEach((letter) => {
      const span = document.createElement('span');
      span.textContent = letter;
      span.className = 'fna-loader__letter';
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      purpleText.appendChild(span);
      purpleLetters.push(span);
      purpleRightGroup.push(span);
    });

    // Build white text (overlay layer) - exact duplicate
    whiteText.innerHTML = '';
    const whiteLetters: HTMLElement[] = [];
    let whiteLeftGroup: HTMLElement[] = [];
    let whiteRightGroup: HTMLElement[] = [];

    // Left group: "fna"
    'fna'.split('').forEach((letter) => {
      const span = document.createElement('span');
      span.textContent = letter;
      span.className = 'fna-loader__letter';
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      whiteText.appendChild(span);
      whiteLetters.push(span);
      whiteLeftGroup.push(span);
    });

    // SVG dot (white)
    const whiteDotSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    whiteDotSvg.setAttribute('width', '16');
    whiteDotSvg.setAttribute('height', '16');
    whiteDotSvg.setAttribute('viewBox', '0 0 16 16');
    whiteDotSvg.style.display = 'inline-block';
    whiteDotSvg.style.verticalAlign = 'baseline';
    whiteDotSvg.style.opacity = '0';
    whiteDotSvg.style.transform = 'translateY(-4px)'; // Lift to period position
    whiteDotSvg.style.margin = '0 2px 0 4px'; // Small spacing like a period, shifted 2px right

    const whiteDotCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    whiteDotCircle.setAttribute('cx', '8');
    whiteDotCircle.setAttribute('cy', '8');
    whiteDotCircle.setAttribute('r', '6');
    whiteDotCircle.setAttribute('fill', 'white');

    whiteDotSvg.appendChild(whiteDotCircle);
    whiteText.appendChild(whiteDotSvg);
    whiteLetters.push(whiteDotSvg as unknown as HTMLElement);

    // Right group: "wtf"
    'wtf'.split('').forEach((letter) => {
      const span = document.createElement('span');
      span.textContent = letter;
      span.className = 'fna-loader__letter';
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      whiteText.appendChild(span);
      whiteLetters.push(span);
      whiteRightGroup.push(span);
    });

    if (prefersReducedMotion) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    let active = true;

    requestAnimationFrame(() => {
      if (!active) return;

      // Get center of purple SVG dot
      const dotRect = purpleDotSvg.getBoundingClientRect();
      const cx = dotRect.left + dotRect.width / 2;
      const cy = dotRect.top + dotRect.height / 2;

      const maxRadius = Math.max(
        Math.hypot(cx, cy),
        Math.hypot(window.innerWidth - cx, cy),
        Math.hypot(cx, window.innerHeight - cy),
        Math.hypot(window.innerWidth - cx, window.innerHeight - cy),
      );

      // --- Loading coordination ---
      let pageReady = false;
      let fillTl: gsap.core.Timeline | null = null;
      let revealTl: gsap.core.Timeline | null = null;

      // Track actual page load progress
      const updateProgress = () => {
        if (!fillTl || pageReady) return;

        const state = document.readyState;
        if (state === 'loading') {
          fillTl.progress(0.3);
        } else if (state === 'interactive') {
          fillTl.progress(0.6);
        } else if (state === 'complete') {
          fillTl.progress(1);
          pageReady = true;
        }
      };

      const onReadyStateChange = () => {
        updateProgress();
        if (document.readyState === 'complete') {
          pageReady = true;
          if (fillTl) {
            fillTl.progress(1);
          }
        }
      };

      document.addEventListener('readystatechange', onReadyStateChange);

      const onLoad = () => {
        pageReady = true;
        if (fillTl) {
          fillTl.progress(1);
        }
      };
      window.addEventListener('load', onLoad, { once: true });

      const maxTimer = setTimeout(() => {
        pageReady = true;
        if (fillTl) {
          fillTl.progress(1);
        }
      }, 15000);

      // === INTRO: letters stagger in ===
      const intro = gsap.timeline();
      let fillStarted = false;

      intro.fromTo(
        [...purpleLetters, ...whiteLetters],
        { opacity: 0, y: 10 },
        {
          opacity: 1, y: 0, duration: 0.6, stagger: 0.12,
          onUpdate() {
            // Start fill once most letters are visible
            if (!fillStarted && this.progress() >= 0.6) {
              fillStarted = true;
              startFill();
            }
          },
        },
        0,
      );

      // === COLOR FILL: tracks actual page load ===
      function startFill() {
        whiteTextContainer.style.willChange = 'width';

        if (document.readyState === 'complete') {
          pageReady = true;
          fillTl = gsap.timeline({
            onComplete: () => {
              whiteTextContainer.style.willChange = 'auto';
              startReveal();
            },
          });
          fillTl.to(whiteTextContainer, {
            width: '100%',
            duration: 1.5,
            ease: 'power1.inOut',
          });
          return;
        }

        fillTl = gsap.timeline({
          paused: true,
          onComplete: () => {
            whiteTextContainer.style.willChange = 'auto';
            if (pageReady) {
              startReveal();
            }
          },
        });

        fillTl.to(whiteTextContainer, {
          width: '100%',
          duration: 1,
          ease: 'none',
        });

        updateProgress();
        const progressInterval = setInterval(() => {
          if (pageReady) {
            clearInterval(progressInterval);
            if (fillTl) {
              fillTl.progress(1);
            }
          } else {
            updateProgress();
          }
        }, 100);

        cleanupRef.current = () => {
          clearInterval(progressInterval);
          intro.kill();
          fillTl?.kill();
          revealTl?.kill();
          clearTimeout(maxTimer);
          document.removeEventListener('readystatechange', onReadyStateChange);
          window.removeEventListener('load', onLoad);
        };
      }

      // === REVEAL: dot→0, beat, portal ===
      function startReveal() {
        const gradient = `radial-gradient(circle calc(var(--reveal-r, 0) * 1px) at ${cx}px ${cy}px, transparent 100%, black 100%)`;
        outer.style.maskImage = gradient;
        outer.style.webkitMaskImage = gradient;
        outer.style.setProperty('--reveal-r', '0');
        outer.style.willChange = '-webkit-mask-image';

        revealTl = gsap.timeline({
          onComplete: () => {
            outer.style.willChange = 'auto';
            outer.style.pointerEvents = 'none';
            setIsComplete(true);
            onComplete?.();
          },
        });

        // 1. Dot swells larger, pushing text outward
        revealTl.to([purpleDotSvg, whiteDotSvg], {
          scale: 1.8,
          duration: 0.3,
          ease: 'power2.out',
          transformOrigin: 'center center',
        }, 0);
        revealTl.to([...purpleLeftGroup, ...whiteLeftGroup], {
          x: -4, duration: 0.3, ease: 'power2.out',
        }, 0);
        revealTl.to([...purpleRightGroup, ...whiteRightGroup], {
          x: 4, duration: 0.3, ease: 'power2.out',
        }, 0);

        // 2. Dot snaps to zero, pulling text inward
        revealTl.to([purpleDotSvg, whiteDotSvg], {
          scale: 0,
          duration: 0.35,
          ease: 'back.in(3)',
          transformOrigin: 'center center',
        });
        revealTl.to([...purpleLeftGroup, ...whiteLeftGroup], {
          x: 3, duration: 0.35, ease: 'power3.in',
        }, '<');
        revealTl.to([...purpleRightGroup, ...whiteRightGroup], {
          x: -3, duration: 0.35, ease: 'power3.in',
        }, '<');

        // Brief beat at zero
        revealTl.to({}, { duration: 0.08 });

        // Letters spring/scatter outward as portal expands
        revealTl.to([...purpleLeftGroup, ...whiteLeftGroup], {
          x: -30, duration: 2, ease: 'back.out(1.4)',
        }, '>');
        revealTl.to([...purpleRightGroup, ...whiteRightGroup], {
          x: 30, duration: 2, ease: 'back.out(1.4)',
        }, '<');

        // Portal springs open (same start as text scatter)
        revealTl.to(outer, {
          '--reveal-r': maxRadius,
          duration: 3,
          ease: 'back.out(0.8)',
        }, '<');
      }
    });

    return () => {
      active = false;
      cleanupRef.current?.();
    };
  }, [onComplete, prefersReducedMotion, isComplete]);

  return (
    <div
      ref={outerRef}
      className="fixed inset-0 z-50"
      data-fna-loader-init
      style={{ display: isComplete ? 'none' : 'block' }}
    >
      <div
        ref={maskRef}
        className="absolute inset-0"
        style={{ background: 'var(--background)' }}
      />
      <div
        ref={textStackRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '4rem',
          fontWeight: 700,
        }}
      >
        <div ref={dotContainerRef} style={{ position: 'relative' }}>
          {/* Purple base layer */}
          <div
            ref={textRef}
            style={{
              position: 'relative',
              zIndex: 1,
              color: 'var(--accent)',
            }}
          />
          {/* White fill layer (clipped) */}
          <div
            ref={whiteTextContainerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '0%',
              height: '100%',
              overflow: 'hidden',
              zIndex: 2,
            }}
          >
            <div
              ref={whiteTextRef}
              style={{
                color: 'white',
                whiteSpace: 'nowrap',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
