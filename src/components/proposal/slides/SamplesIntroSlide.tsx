'use client';

import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import Image from 'next/image';
import { getBunnyVideoThumbnail, getBunnyVideoMp4Url } from '@/lib/bunny/client';
import { SlideHeader } from '@/components/proposal/SlideHeader';
import type { ProposalVideo } from '@/types/proposal';

interface Props {
  videos: ProposalVideo[];
  slideRef?: React.RefObject<HTMLElement>;
  onViewProject?: (videoIndex: number) => void;
}

function SampleCard({
  v,
  index,
  onViewProject,
}: {
  v: ProposalVideo;
  index: number;
  onViewProject?: (i: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const pv = v.project_video!;
  const project = pv.project;
  const thumbnail = getBunnyVideoThumbnail(pv.bunny_video_id ?? '');
  const videoSrc = getBunnyVideoMp4Url(pv.bunny_video_id ?? '', '360p');
  const title = project?.title ?? pv.title ?? '';
  const styleTags = project?.style_tags ?? [];

  const handleHover = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.readyState >= 1) {
      video.currentTime = video.duration / 2;
    }
    const promise = video.play();
    if (promise) {
      playPromiseRef.current = promise;
      promise
        .then(() => { playPromiseRef.current = null; })
        .catch(() => { playPromiseRef.current = null; });
    }
  }, []);

  const handleUnhover = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const doPause = () => {
      video.pause();
      video.currentTime = video.duration / 2;
    };
    if (playPromiseRef.current) {
      playPromiseRef.current.then(doPause).catch(() => {});
    } else {
      doPause();
    }
  }, []);

  return (
    <div data-card className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 lg:gap-8">
      {/* Video — left on desktop, top on mobile */}
      <div
        className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[2.8/1] lg:aspect-[16/10] group cursor-pointer"
        onClick={() => onViewProject?.(index)}
        onMouseEnter={handleHover}
        onMouseLeave={handleUnhover}
      >
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover"
          unoptimized
        />

        {/* Hover video preview — 360p streamed */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          src={videoSrc}
          muted
          loop
          playsInline
          preload="metadata"
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Arrow button — purple circle, visible on hover */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-[var(--accent)] flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300">
            <svg className="w-5 h-5 text-white ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Text content — right on desktop, below on mobile */}
      <div className="flex flex-col justify-center">
        {project?.client_name && (
          <p className="text-xs tracking-[0.25em] uppercase font-mono text-white/30 mb-2">
            {project.client_name}
          </p>
        )}

        <h3
          className="font-display font-bold text-white leading-[0.92] mb-1.5"
          style={{ fontSize: 'clamp(1.25rem, 2vw, 1.75rem)' }}
        >
          {title}
        </h3>

        {project?.subtitle && (
          <p className="text-sm text-white/35 mb-4 leading-relaxed">
            {project.subtitle}
          </p>
        )}

        {/* Stats — compact row */}
        {(project?.production_days || project?.crew_count || project?.talent_count || project?.location_count) && (
          <div className="flex gap-6 mb-4">
            {project?.production_days && (
              <div>
                <p className="text-[10px] text-white/20 uppercase tracking-widest mb-0.5">Days</p>
                <p className="text-white/70 font-display font-bold text-base">{project.production_days}</p>
              </div>
            )}
            {project?.crew_count && (
              <div>
                <p className="text-[10px] text-white/20 uppercase tracking-widest mb-0.5">Crew</p>
                <p className="text-white/70 font-display font-bold text-base">{project.crew_count}</p>
              </div>
            )}
            {project?.talent_count && (
              <div>
                <p className="text-[10px] text-white/20 uppercase tracking-widest mb-0.5">Talent</p>
                <p className="text-white/70 font-display font-bold text-base">{project.talent_count}</p>
              </div>
            )}
            {project?.location_count && (
              <div>
                <p className="text-[10px] text-white/20 uppercase tracking-widest mb-0.5">Locations</p>
                <p className="text-white/70 font-display font-bold text-base">{project.location_count}</p>
              </div>
            )}
          </div>
        )}

        {/* Style tags */}
        {styleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {styleTags.map((tag) => (
              <span
                key={tag}
                className="bg-white/[0.04] border border-white/[0.08] rounded-full px-2.5 py-1 text-xs text-white/35 leading-none"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Relevance blurb */}
        {v.proposal_blurb && (
          <>
            <p className="text-[10px] tracking-[0.25em] uppercase font-mono text-white/20 mb-2">What to look for</p>
            <p className="text-sm text-white/50 leading-relaxed">
              {v.proposal_blurb}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function SamplesIntroSlide({ videos, slideRef, onViewProject }: Props) {
  const innerRef   = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const titleWords = ["Here's", 'what', "we've", 'made.'];
  const validVideos = videos.filter((v) => v.project_video);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const eyebrow    = el.querySelector('[data-eyebrow]')     as HTMLElement;
      const wordEls    = el.querySelectorAll('[data-word]');
      const accentLine = el.querySelector('[data-accent-line]') as HTMLElement;
      const descEl     = el.querySelector('[data-desc]')        as HTMLElement;
      const cards      = el.querySelectorAll('[data-card]');

      gsap.set(eyebrow,    { opacity: 0, y: 12 });
      gsap.set(wordEls,    { y: '115%' });
      gsap.set(accentLine, { scaleX: 0, transformOrigin: 'left center' });
      if (descEl)         gsap.set(descEl,  { opacity: 0, y: 16 });
      if (cards.length)   gsap.set(cards,   { opacity: 0, y: 32 });

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const tl = gsap.timeline()
            .to(eyebrow,    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
            .to(wordEls,    { y: '0%', duration: 1.1, ease: 'expo.out', stagger: 0.04 }, '-=0.2')
            .to(accentLine, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, '-=0.5');
          if (descEl)       tl.to(descEl,  { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3');
          if (cards.length) tl.to(cards,   { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.15 }, '-=0.2');
        }
      }, { threshold: 0.2 });

      observer.observe(el.closest('[data-slide]') ?? el);
      return () => observer.disconnect();
    }, innerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={slideRef as React.RefObject<HTMLElement>}
      data-slide
      className="[scroll-snap-align:start] flex-shrink-0 w-screen h-screen relative bg-black overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="sticky top-0 z-20 pointer-events-none" style={{ height: 'var(--slide-gradient-h)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black to-transparent" />
      </div>

      <div ref={innerRef} className="max-w-5xl mx-auto px-6 sm:px-12 lg:px-20 pb-56" style={{ paddingTop: 'var(--slide-pt)', marginTop: 'calc(-1 * var(--slide-pull))' }}>
        <SlideHeader
          eyebrow={`${validVideos.length} samples`}
          titleWords={titleWords}
          description="A curated look at recent work relevant to your vision."
          className="mb-12"
        />

        <div className="flex flex-col gap-12">
          {validVideos.map((v, i) => (
            <SampleCard
              key={v.id}
              v={v}
              index={i}
              onViewProject={onViewProject}
            />
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 z-20 h-48 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 backdrop-blur-[6px]" style={{ maskImage: 'linear-gradient(to top, black 20%, transparent)', WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent)' }} />
      </div>
    </section>
  );
}
