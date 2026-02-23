'use client';

import { ReactNode, Ref, useEffect, useState } from 'react';
import { Reveal } from '@/components/animations/Reveal';

interface PageHeroProps {
  label: string;
  /** Static title — pass a string or pre-styled ReactNode (e.g. with letter animations). */
  title?: ReactNode;
  /** When provided, renders cycling inline words inside the h1 instead of `title`. */
  cyclingWords?: string[];
  /** Sub-copy below the title. */
  subCopy?: string;
  /** Optional ref forwarded to the h1 — useful for imperative animations (e.g. framer-motion useAnimate). */
  titleRef?: Ref<HTMLHeadingElement>;
}

export function PageHero({ label, title, cyclingWords, subCopy, titleRef }: PageHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!cyclingWords?.length) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cyclingWords.length);
    }, 2000);
    return () => clearInterval(id);
  }, [cyclingWords]);

  const titleContent: ReactNode = cyclingWords ? (
    <>
      {cyclingWords.map((word, i) => (
        <span key={word}>
          <span
            className={[
              'transition-colors duration-150',
              activeIndex === i ? 'text-accent' : 'text-white',
            ].join(' ')}
            style={
              activeIndex === i
                ? { textShadow: '0 0 80px rgba(161,77,253,0.35), 0 0 30px rgba(161,77,253,0.2)' }
                : { textShadow: 'none' }
            }
          >
            {word}
          </span>
          {i < cyclingWords.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  ) : (
    title
  );

  return (
    <section
      className="pt-40 pb-20 px-6 lg:px-16 relative overflow-hidden border-b border-border"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 100% at 50% 50%, transparent 40%, var(--surface-elevated) 100%)',
        }}
      />
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <Reveal distance="1.5em" duration={1.2}>
          <p className="text-sm tracking-[0.4em] uppercase text-white/30 font-mono mb-4">
            {label}
          </p>
        </Reveal>

        <Reveal distance="2em" duration={1.2} delay={0.05}>
          <h1
            ref={titleRef}
            className="font-display font-bold text-white mb-8 leading-[0.88]"
            style={{ fontSize: 'clamp(3rem, 8vw, 9rem)' }}
          >
            {titleContent}
          </h1>
        </Reveal>

        {subCopy && (
          <Reveal distance="1em" duration={1.0} delay={0.15}>
            <p className="text-lg text-white/50 max-w-lg mx-auto leading-relaxed">
              {subCopy}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
