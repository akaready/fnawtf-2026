'use client';

import { useEffect } from 'react';
import { useAnimate, stagger } from 'framer-motion';
import { PageHero } from '@/components/layout/PageHero';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const COLOR_ACCENT = '#a14dfd';
const COLOR_WHITE = '#ffffff';

export function PricingHero() {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    let cancelled = false;

    const pause = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

    const run = async () => {
      let first = true;
      while (!cancelled) {
        try {
          await animate(
            '[data-letter]',
            { color: COLOR_ACCENT },
            { delay: stagger(0.07, { startDelay: first ? 0.45 : 0 }), duration: 0.5, ease: EASE }
          );
          if (cancelled) break;
          await animate(
            '[data-letter]',
            { color: COLOR_WHITE },
            { delay: stagger(0.07), duration: 0.5, ease: EASE }
          );
          if (cancelled) break;
          await pause(3000);
          first = false;
        } catch {
          break;
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [animate]);

  const title = (
    <>
      <span aria-label="Transparent">
        {'Transparent'.split('').map((char, i) => (
          <span key={i} data-letter style={{ display: 'inline' }}>
            {char}
          </span>
        ))}
      </span>
      {' Pricing'}
    </>
  );

  return (
    <PageHero
      label="Pricing"
      title={title}
      titleRef={scope}
      subCopy="No hidden fees, just honest pricing and exceptional work."
    />
  );
}
