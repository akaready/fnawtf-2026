'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import ReactMarkdown from 'react-markdown';
import type { ProposalSectionRow } from '@/types/proposal';
import { SlideHeader } from '@/components/proposal/SlideHeader';

interface Props {
  section: ProposalSectionRow | null;
  slideRef?: React.RefObject<HTMLElement>;
}

const mdComponents = {
  p:          ({ children }: any) => <p className="text-white/55 leading-relaxed mb-4 last:mb-0 text-base">{children}</p>,
  strong:     ({ children }: any) => <strong className="text-white/80 font-semibold">{children}</strong>,
  em:         ({ children }: any) => <em className="not-italic text-white/60">{children}</em>,
  blockquote: ({ children }: any) => <blockquote className="border-l-2 border-[var(--accent)]/50 pl-4 text-white/40 my-4">{children}</blockquote>,
  ul:         ({ children }: any) => <ul className="list-none space-y-2 mb-4">{children}</ul>,
  li:         ({ children }: any) => <li className="flex gap-2 text-white/55"><span className="text-[var(--accent)]/60 mt-[3px] flex-shrink-0">–</span><span>{children}</span></li>,
};

export function ApproachSlide({ section, slideRef }: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const rawContent = section?.custom_content ?? '';
  const title      = section?.custom_title ?? 'Our Approach';

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const eyebrow    = el.querySelector('[data-eyebrow]')     as HTMLElement;
      const wordEls    = el.querySelectorAll('[data-word]');
      const accentLine = el.querySelector('[data-accent-line]') as HTMLElement;
      const body       = el.querySelector('[data-body]')        as HTMLElement;

      gsap.set(eyebrow,    { opacity: 0, y: 12 });
      gsap.set(wordEls,    { y: '115%' });
      gsap.set(accentLine, { scaleX: 0, transformOrigin: 'left center' });
      gsap.set(body,       { opacity: 0, y: 20 });

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          gsap.timeline()
            .to(eyebrow,    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
            .to(wordEls,    { y: '0%', duration: 1.1, ease: 'expo.out', stagger: 0.025 }, '-=0.2')
            .to(accentLine, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, '-=0.5')
            .to(body,       { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, '-=0.3');
        }
      }, { threshold: 0.35 });

      observer.observe(el.closest('[data-slide]') ?? el);
      return () => observer.disconnect();
    }, innerRef);

    return () => ctx.revert();
  }, []);

  if (!rawContent) return null;

  return (
    <section
      ref={slideRef as React.RefObject<HTMLElement>}
      data-slide
      className="[scroll-snap-align:start] flex-shrink-0 w-screen h-screen relative bg-black overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="sticky top-0 z-20 h-32 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-transparent" />
      </div>

      <div ref={innerRef} className="max-w-4xl mx-auto px-12 lg:px-20 -mt-16 min-h-[calc(100vh-9rem)] flex flex-col justify-center py-16">
        <SlideHeader
          eyebrow="approach"
          titleWords={title.split(' ')}
          className="mb-8"
        />

        <div data-body>
          <ReactMarkdown components={mdComponents}>{rawContent}</ReactMarkdown>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 h-48 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 backdrop-blur-[6px]" style={{ maskImage: 'linear-gradient(to top, black 20%, transparent)', WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent)' }} />
      </div>
    </section>
  );
}
