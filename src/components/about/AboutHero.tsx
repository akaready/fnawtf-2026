'use client';

import { useEffect, useState } from 'react';
import { Reveal } from '@/components/animations/Reveal';

const words = ['Positioning.', 'Perspective.', 'Personality.'];

export function AboutHero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="bg-muted px-6 py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Stacked display words — centered block with increasing offset */}
        <div className="mb-16 md:mb-20">
          {words.map((word, i) => (
            <Reveal key={word} delay={i * 0.12} distance="1.5em">
              <div
                style={{ paddingLeft: `${i * 5}%` }}
                className="leading-none"
              >
                <span
                  className={[
                    'relative inline-block font-bold tracking-tight rounded-sm',
                    'text-[clamp(3rem,10vw,8rem)]',
                    'transition-colors duration-150',
                    activeIndex === i ? 'text-accent' : 'text-foreground',
                  ].join(' ')}
                  style={
                    activeIndex === i
                      ? { textShadow: '0 0 80px rgba(161,77,253,0.35), 0 0 30px rgba(161,77,253,0.2)' }
                      : { textShadow: 'none' }
                  }
                >
                  {word}
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Sub-copy */}
        <Reveal delay={0.45} distance="1em">
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center max-w-2xl">
            <span className="text-foreground">
              We help brands become the brand they long to be.
            </span>{' '}
            We&apos;re two founders, creatives, tinkerers, builders, makers, and more with
            complementary skillsets and a vast network of talented allies we tap in when needed.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
