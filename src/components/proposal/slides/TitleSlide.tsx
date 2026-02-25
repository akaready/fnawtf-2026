'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import type { ProposalRow } from '@/types/proposal';

interface Props {
  proposal: ProposalRow;
  slideRef?: React.RefObject<HTMLElement>;
  onNext?: () => void;
}

const iconVariants = {
  hidden: {
    opacity: 0,
    x: 8,
    width: 0,
    marginLeft: -8,
  },
  visible: {
    opacity: 1,
    x: 0,
    width: 'auto',
    marginLeft: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    }
  }
};

export function TitleSlide({ proposal, slideRef, onNext }: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const titleWords = proposal.title.split(' ');

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const eyebrow = el.querySelector('[data-eyebrow]') as HTMLElement;
      const words = el.querySelectorAll('[data-word]');
      const subtitle = el.querySelector('[data-subtitle]') as HTMLElement | null;
      const button = el.querySelector('[data-button]') as HTMLElement | null;
      const instructions = el.querySelector('[data-instructions]') as HTMLElement | null;

      gsap.set(eyebrow, { opacity: 0, y: 20 });
      gsap.set(words, { y: '115%' });
      if (subtitle) gsap.set(subtitle, { opacity: 0, y: 24 });
      if (button) gsap.set(button, { opacity: 0, y: 24, scale: 0.95 });
      if (instructions) gsap.set(instructions, { opacity: 0, y: 12 });

      const tl = gsap.timeline({ delay: 0.3 });
      tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' })
        .to(words, { y: '0%', duration: 1.3, ease: 'expo.out', stagger: 0.07 }, '-=0.3')
        .to(subtitle, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
        .to(button, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out' }, '-=0.3')
        .to(instructions, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4');
    }, innerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!buttonRef.current || !fillRef.current) return;

    const button = buttonRef.current;
    const fill = fillRef.current;
    const textSpan = button.querySelector('span');

    const handleMouseEnter = (e: MouseEvent) => {
      setIsHovered(true);
      if (!fill) return;

      const rect = button.getBoundingClientRect();
      const x = (e.clientX || e.pageX) - rect.left;
      const direction = x < rect.width / 2 ? 'left' : 'right';

      gsap.killTweensOf([fill, textSpan]);

      if (direction === 'left') {
        gsap.fromTo(
          fill,
          { scaleX: 0, transformOrigin: '0 50%' },
          { scaleX: 1, duration: 0.3, ease: 'power2.out' }
        );
      } else {
        gsap.fromTo(
          fill,
          { scaleX: 0, transformOrigin: '100% 50%' },
          { scaleX: 1, duration: 0.3, ease: 'power2.out' }
        );
      }

      if (textSpan) {
        gsap.to(textSpan, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      gsap.to(fill, { scaleX: 0, duration: 0.3, ease: 'power2.out' });

      if (textSpan) {
        gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
      }
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section
      ref={slideRef as React.RefObject<HTMLElement>}
      data-slide
      className="[scroll-snap-align:start] flex-shrink-0 w-screen h-screen relative flex flex-col items-center justify-center overflow-hidden pb-16"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      {/* Radial edge fade */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 85% 100% at 50% 50%, transparent 35%, var(--surface-elevated) 100%)',
        }}
      />

      <div ref={innerRef} className="relative z-10 flex flex-col items-center text-center px-8 max-w-5xl w-full">
        <p data-eyebrow className="text-sm tracking-[0.45em] uppercase text-white/25 font-mono mb-8">
          Proposal #{proposal.proposal_number}
        </p>

        {/* Clip-reveal title */}
        <h1
          className="font-display font-bold text-white leading-[0.95] mb-10"
          style={{ fontSize: 'clamp(3.5rem, 9vw, 10rem)' }}
        >
          {titleWords.map((word, i) => (
            <span
              key={i}
              className="inline-block overflow-hidden pb-[0.22em]"
              style={{ verticalAlign: 'top' }}
            >
              <span data-word className="inline-block">
                {word}{i < titleWords.length - 1 ? '\u00a0' : ''}
              </span>
            </span>
          ))}
        </h1>

        {proposal.subtitle && (
          <p data-subtitle className="text-xl text-white/40 max-w-lg leading-relaxed mb-12">
            {proposal.subtitle}
          </p>
        )}

        {/* CTA Button */}
        <div data-button className="w-full max-w-sm mb-8">
          <motion.button
            ref={buttonRef}
            onClick={onNext}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full px-6 py-3 font-medium text-black bg-white border border-white rounded-lg overflow-hidden"
          >
            <div
              ref={fillRef}
              className="absolute inset-0 bg-black pointer-events-none"
              style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
            />
            <span className="relative flex items-center justify-center gap-2 whitespace-nowrap" style={{ zIndex: 10 }}>
              Begin Proposal Presentation
              <motion.span
                variants={iconVariants}
                initial="hidden"
                animate={isHovered ? "visible" : "hidden"}
                className="flex items-center text-lg"
              >
                →
              </motion.span>
            </span>
          </motion.button>
        </div>

        {/* Instructions */}
        <p data-instructions className="text-xs text-white/40 max-w-sm leading-relaxed">
          Navigate with arrow keys, page dots below, or the left/right buttons.
        </p>
      </div>
    </section>
  );
}
