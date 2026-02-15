'use client';

import { useEffect, useRef, type ReactNode } from 'react';

declare global {
  interface Window {
    gsap: typeof import('gsap').default;
    ScrollTrigger: typeof import('gsap/ScrollTrigger').default;
    CustomEase: typeof import('gsap/CustomEase').default;
  }
}

interface GsapProviderProps {
  children: ReactNode;
}

/**
 * GSAP Provider - Initializes GSAP and its plugins
 * Must be rendered at the root of the application
 */
export function GsapProvider({ children }: GsapProviderProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initGsap = async () => {
      // Dynamically import GSAP and plugins
      const gsapModule = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      const { CustomEase } = await import('gsap/CustomEase');

      // Register plugins globally
      gsapModule.default.registerPlugin(ScrollTrigger, CustomEase);

      // Make available globally for legacy code
      window.gsap = gsapModule.default;
      window.ScrollTrigger = ScrollTrigger;
      window.CustomEase = CustomEase;

      // Create custom ease for buttons
      CustomEase.create('button-ease', '0.5, 0.05, 0.05, 0.99');

      // Set up ScrollTrigger defaults
      ScrollTrigger.defaults({
        toggleActions: 'play none none reverse',
      });

      // Global reveal-on-scroll system (_assets/elements-reveal-on-scroll.md)
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const revealCtx = gsapModule.default.context(() => {
        document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((groupEl) => {
          const groupStaggerSec = (parseFloat(groupEl.getAttribute('data-stagger') || '100') || 100) / 1000;
          const groupDistance = groupEl.getAttribute('data-distance') || '2em';
          const triggerStart = groupEl.getAttribute('data-start') || 'top 80%';

          const animDuration = 0.8;
          const animEase = 'power4.inOut';

          if (prefersReduced) {
            gsapModule.default.set(groupEl, { clearProps: 'all', y: 0, autoAlpha: 1 });
            return;
          }

          const directChildren = Array.from(groupEl.children).filter((el) => el.nodeType === 1) as HTMLElement[];
          if (!directChildren.length) {
            gsapModule.default.set(groupEl, { y: groupDistance, autoAlpha: 0 });
            ScrollTrigger.create({
              trigger: groupEl,
              start: triggerStart,
              once: true,
              onEnter: () => {
                gsapModule.default.to(groupEl, {
                  y: 0,
                  autoAlpha: 1,
                  duration: animDuration,
                  ease: animEase,
                  onComplete: () => {
                    gsapModule.default.set(groupEl, { clearProps: 'all' });
                  },
                });
              },
            });
            return;
          }

          type Slot =
            | { type: 'item'; el: HTMLElement }
            | { type: 'nested'; parentEl: HTMLElement; nestedEl: HTMLElement; includeParent: boolean };

          const slots: Slot[] = [];
          directChildren.forEach((child) => {
            const nestedGroup = child.matches('[data-reveal-group-nested]')
              ? child
              : (child.querySelector(':scope [data-reveal-group-nested]') as HTMLElement | null);

            if (nestedGroup) {
              const includeParent =
                child.getAttribute('data-ignore') === 'false' || nestedGroup.getAttribute('data-ignore') === 'false';
              slots.push({ type: 'nested', parentEl: child, nestedEl: nestedGroup, includeParent });
            } else {
              slots.push({ type: 'item', el: child });
            }
          });

          slots.forEach((slot) => {
            if (slot.type === 'item') {
              const isNestedSelf = slot.el.matches('[data-reveal-group-nested]');
              const d = isNestedSelf ? groupDistance : slot.el.getAttribute('data-distance') || groupDistance;
              gsapModule.default.set(slot.el, { y: d, autoAlpha: 0 });
            } else {
              if (slot.includeParent) gsapModule.default.set(slot.parentEl, { y: groupDistance, autoAlpha: 0 });
              const nestedD = slot.nestedEl.getAttribute('data-distance') || groupDistance;
              Array.from(slot.nestedEl.children).forEach((target) =>
                gsapModule.default.set(target, { y: nestedD, autoAlpha: 0 })
              );
            }
          });

          ScrollTrigger.create({
            trigger: groupEl,
            start: triggerStart,
            once: true,
            onEnter: () => {
              const tl = gsapModule.default.timeline();
              slots.forEach((slot, slotIndex) => {
                const slotTime = slotIndex * groupStaggerSec;
                if (slot.type === 'item') {
                  tl.to(
                    slot.el,
                    {
                      y: 0,
                      autoAlpha: 1,
                      duration: animDuration,
                      ease: animEase,
                      onComplete: () => {
                        gsapModule.default.set(slot.el, { clearProps: 'all' });
                      },
                    },
                    slotTime
                  );
                  return;
                }

                if (slot.includeParent) {
                  tl.to(
                    slot.parentEl,
                    {
                      y: 0,
                      autoAlpha: 1,
                      duration: animDuration,
                      ease: animEase,
                      onComplete: () => {
                        gsapModule.default.set(slot.parentEl, { clearProps: 'all' });
                      },
                    },
                    slotTime
                  );
                }

                const nestedMs = parseFloat(slot.nestedEl.getAttribute('data-stagger') || '');
                const nestedStaggerSec = Number.isNaN(nestedMs) ? groupStaggerSec : nestedMs / 1000;
                Array.from(slot.nestedEl.children).forEach((nestedChild, nestedIndex) => {
                  tl.to(
                    nestedChild,
                    {
                      y: 0,
                      autoAlpha: 1,
                      duration: animDuration,
                      ease: animEase,
                      onComplete: () => {
                        gsapModule.default.set(nestedChild, { clearProps: 'all' });
                      },
                    },
                    slotTime + nestedIndex * nestedStaggerSec
                  );
                });
              });
            },
          });
        });
      });

      // Global parallax system (_assets/global-parallax-setup.md)
      const mm = gsapModule.default.matchMedia();
      mm.add(
        {
          isMobile: '(max-width:479px)',
          isMobileLandscape: '(max-width:767px)',
          isTablet: '(max-width:991px)',
        },
        (context) => {
          const { isMobile, isMobileLandscape, isTablet } = context.conditions as {
            isMobile: boolean;
            isMobileLandscape: boolean;
            isTablet: boolean;
          };

          const parallaxCtx = gsapModule.default.context(() => {
            document.querySelectorAll<HTMLElement>('[data-parallax="trigger"]').forEach((trigger) => {
              const disable = trigger.getAttribute('data-parallax-disable');
              if (
                (disable === 'mobile' && isMobile) ||
                (disable === 'mobileLandscape' && isMobileLandscape) ||
                (disable === 'tablet' && isTablet)
              ) {
                return;
              }

              const target = (trigger.querySelector('[data-parallax="target"]') as HTMLElement | null) || trigger;
              const direction = trigger.getAttribute('data-parallax-direction') || 'vertical';
              const prop = direction === 'horizontal' ? 'xPercent' : 'yPercent';

              const scrubAttr = trigger.getAttribute('data-parallax-scrub');
              const scrub = scrubAttr ? parseFloat(scrubAttr) : true;

              const startAttr = trigger.getAttribute('data-parallax-start');
              const startVal = startAttr !== null ? parseFloat(startAttr) : 20;

              const endAttr = trigger.getAttribute('data-parallax-end');
              const endVal = endAttr !== null ? parseFloat(endAttr) : -20;

              const scrollStartRaw = trigger.getAttribute('data-parallax-scroll-start') || 'top bottom';
              const scrollEndRaw = trigger.getAttribute('data-parallax-scroll-end') || 'bottom top';

              gsapModule.default.fromTo(
                target,
                { [prop]: startVal },
                {
                  [prop]: endVal,
                  ease: 'none',
                  scrollTrigger: {
                    trigger,
                    start: `clamp(${scrollStartRaw})`,
                    end: `clamp(${scrollEndRaw})`,
                    scrub,
                  },
                }
              );
            });
          });

          return () => parallaxCtx.revert();
        }
      );

      console.log('GSAP initialized');

      return () => {
        revealCtx.revert();
        mm.revert();
      };
    };

    initGsap().catch(console.error);

    return () => {
      // Cleanup on unmount
      if (typeof window !== 'undefined' && window.ScrollTrigger) {
        window.ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      }
    };
  }, []);

  return <>{children}</>;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Wait for a condition to be true
 */
export function waitFor(
  condition: () => boolean,
  timeout = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
        return;
      }

      requestAnimationFrame(check);
    };

    check();
  });
}
