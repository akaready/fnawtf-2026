'use client';

import { useEffect } from 'react';
import { useAnimate, stagger } from 'framer-motion';
import { PageHero } from '@/components/layout/PageHero';

const WORDS = ['Positioning.', 'Perspective.', 'Personality.'];
const COLOR_ACCENT = '#a14dfd';
const COLOR_WHITE = '#ffffff';

export function AboutHero() {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    let cancelled = false;
    const pause = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

    const run = async () => {
      while (!cancelled) {
        for (let i = 0; i < WORDS.length; i++) {
          if (cancelled) break;
          await animate(
            `[data-word="${i}"] [data-letter]`,
            { color: COLOR_ACCENT },
            { delay: stagger(0.06), duration: 0.45, ease: 'easeInOut' }
          );
          if (cancelled) break;
          await pause(600);
          if (cancelled) break;
          await animate(
            `[data-word="${i}"] [data-letter]`,
            { color: COLOR_WHITE },
            { delay: stagger(0.06), duration: 0.55, ease: 'easeInOut' }
          );
          if (cancelled) break;
          if (i < WORDS.length - 1) await pause(0);
        }
        if (cancelled) break;
        await pause(3000);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [animate]);

  const title = (
    <>
      {WORDS.map((word, wi) => (
        <span key={word} data-word={wi} style={{ display: 'block' }}>
          {word.split('').map((char, ci) => (
            <span key={ci} data-letter style={{ display: 'inline' }}>
              {char}
            </span>
          ))}
        </span>
      ))}
    </>
  );

  return (
    <PageHero
      label="About"
      title={title}
      titleRef={scope}
      subCopy="We help brands become the brand they long to be."
    />
  );
}
