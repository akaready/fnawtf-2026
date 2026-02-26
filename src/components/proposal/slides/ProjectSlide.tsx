'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ReelPlayer } from '@/components/homepage/ReelPlayer';
import { getBunnyVideoMp4Url, getBunnyVideoThumbnail } from '@/lib/bunny/client';
import { ProjectDeliveryAndDescription } from '@/components/work/ProjectDeliveryAndDescription';
import { ProjectMetaGrid } from '@/components/work/ProjectMetaGrid';
import { ProjectQuote } from '@/components/work/ProjectQuote';
import { ProjectBTSGrid } from '@/components/work/ProjectBTSGrid';
import { ProjectCredits } from '@/components/work/ProjectCredits';

import type { ProposalVideo } from '@/types/proposal';

interface Props {
  video: ProposalVideo;
  contactCompany?: string;
  slideRef?: React.RefObject<HTMLElement>;
}

function toCssRatio(r: string) { return r.replace(':', '/'); }

export function ProjectSlide({ video, contactCompany: _contactCompany, slideRef }: Props) {
  const innerRef    = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const pv      = video.project_video;
  const project = pv?.project ?? null;

  const titleWords      = (project?.title ?? pv?.title ?? '').split(' ');
  const subtitle        = project?.subtitle ?? null;
  const description     = project?.description ?? null;
  const assetsDelivered = project?.assets_delivered ?? [];
  const tags            = project?.style_tags ?? [];
  const premium_addons     = project?.premium_addons ?? [];
  const camera_techniques  = project?.camera_techniques ?? [];
  const production_days    = project?.production_days ?? null;
  const crew_count         = project?.crew_count ?? null;
  const talent_count       = project?.talent_count ?? null;
  const location_count     = project?.location_count ?? null;

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const eyebrow    = el.querySelector('[data-eyebrow]')     as HTMLElement | null;
      const wordEls    = el.querySelectorAll('[data-word]');
      const accentLine = el.querySelector('[data-accent-line]') as HTMLElement | null;
      const subtitleEl = el.querySelector('[data-subtitle]')    as HTMLElement | null;
      const blurb      = el.querySelector('[data-blurb]')       as HTMLElement | null;
      const videoEl    = el.querySelector('[data-video]')       as HTMLElement | null;

      if (eyebrow)        gsap.set(eyebrow,    { opacity: 0, y: 12 });
      if (wordEls.length) gsap.set(wordEls,    { y: '115%' });
      if (accentLine)     gsap.set(accentLine,  { scaleX: 0, transformOrigin: 'left center' });
      if (subtitleEl)     gsap.set(subtitleEl,  { opacity: 0, y: 16 });
      if (blurb)          gsap.set(blurb,       { opacity: 0, y: 14 });
      if (videoEl)        gsap.set(videoEl,     { opacity: 0 });

      const tl = gsap.timeline();
      if (eyebrow)        tl.to(eyebrow,    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
      if (wordEls.length) tl.to(wordEls,    { y: '0%', duration: 1.1, ease: 'expo.out', stagger: 0.04 }, '-=0.2');
      if (accentLine)     tl.to(accentLine,  { scaleX: 1, duration: 0.6, ease: 'expo.out' }, '-=0.5');
      if (subtitleEl)     tl.to(subtitleEl,  { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');
      if (blurb)          tl.to(blurb,       { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3');
      if (videoEl)        tl.to(videoEl,     { opacity: 1, duration: 0.7, ease: 'power2.out' }, '-=0.2');

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          tl.play();
        }
      }, { threshold: 0.3 });

      tl.pause();
      observer.observe(el.closest('[data-slide]') ?? el);
      return () => observer.disconnect();
    }, innerRef);

    return () => ctx.revert();
  }, []);


  if (!pv) return null;

  return (
    <section
      ref={slideRef as React.RefObject<HTMLElement>}
      data-slide
      className="[scroll-snap-align:start] flex-shrink-0 w-screen h-screen relative bg-black overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* Top gradient */}
      <div className="sticky top-0 z-20 pointer-events-none" style={{ height: 'var(--slide-gradient-h)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-transparent" />
      </div>

      {/* Main content */}
      <div ref={innerRef} className="max-w-4xl mx-auto px-6 sm:px-12 lg:px-20 pb-20" style={{ paddingTop: 'var(--slide-pt)', marginTop: 'calc(-1 * var(--slide-pull))' }}>

        {/* Eyebrow — project's client name */}
        {project?.client_name && (
          <p
            data-eyebrow
            className="text-sm tracking-[0.4em] uppercase font-mono text-white/50 mb-3"
          >
            {project.client_name}
          </p>
        )}

        {/* Title — clip-reveal */}
        <h2
          className="font-display font-bold text-white leading-[1.05] mb-3"
          style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4rem)' }}
        >
          {titleWords.map((word, i) => (
            <span
              key={i}
              className="inline-block overflow-hidden pb-[0.15em]"
              style={{ verticalAlign: 'top' }}
            >
              <span data-word className="inline-block">
                {word}{i < titleWords.length - 1 ? '\u00a0' : ''}
              </span>
            </span>
          ))}
        </h2>

        {/* Purple accent line */}
        <div
          data-accent-line
          className="h-0.5 w-10 rounded-full bg-[var(--accent)] mb-5"
        />

        {/* Subtitle */}
        {subtitle && (
          <p data-subtitle className="text-white/60 text-lg mb-8 leading-snug">
            {subtitle}
          </p>
        )}

        {/* "What to look for" blurb */}
        {video.proposal_blurb && (
          <div data-blurb className="rounded-xl px-6 py-5 mb-8 bg-white/[0.04] border border-white/[0.12]">
            <p className="text-sm tracking-[0.3em] uppercase font-mono text-white/40 mb-2">What to look for</p>
            <p className="text-white/80 leading-relaxed text-base">
              {video.proposal_blurb}
            </p>
          </div>
        )}

        {/* Video player — full-width on mobile, bleeds to 74vw on desktop */}
        <div data-video className="mb-8 rounded-xl overflow-hidden w-full lg:relative lg:left-1/2 lg:right-1/2 lg:-ml-[37vw] lg:-mr-[37vw] lg:w-[74vw]">
          {/* 4:3 on mobile, natural ratio on sm+ */}
          <div className="aspect-[4/3] sm:aspect-auto">
            <div className="h-full sm:h-auto [&>div]:h-full sm:[&>div]:h-auto">
              <ReelPlayer
                videoSrc={getBunnyVideoMp4Url(pv.bunny_video_id, '720p')}
                placeholderSrc={getBunnyVideoThumbnail(pv.bunny_video_id)}
                aspectRatio={toCssRatio(pv.aspect_ratio)}
                defaultMuted={false}
                hoverPreview={false}
              />
            </div>
          </div>
        </div>

        {/* Testimonial — directly under video */}
        {project?.testimonials?.[0] && (
          <ProjectQuote
            quote={project.testimonials[0].quote}
            personName={project.testimonials[0].person_name}
            personTitle={project.testimonials[0].person_title ?? project.testimonials[0].display_title}
          />
        )}

        {/* Project content — negate parent padding so shared components'
             own px/max-w align with the video edges */}
        <div className="-mx-6 lg:-mx-16 proposal-content-stretch [&_section.border-b]:border-b-0">
          <ProjectDeliveryAndDescription
            assetsDelivered={assetsDelivered}
            description={description ?? ''}
          />

          <div className="pointer-events-none select-none [&_.max-w-4xl]:max-w-none">
            <ProjectMetaGrid
              styleTags={tags}
              premiumAddons={premium_addons}
              cameraTechniques={camera_techniques}
              productionDays={production_days}
              crewCount={crew_count}
              talentCount={talent_count}
              locationCount={location_count}
            />
          </div>

          {(project?.bts_images?.length ?? 0) > 0 && (
            <ProjectBTSGrid images={project!.bts_images!} />
          )}

          {(project?.credits?.length ?? 0) > 0 && (
            <ProjectCredits credits={project!.credits!} compact />
          )}
        </div>
      </div>

      {/* Bottom gradient — scroll cue */}
      <div className="sticky bottom-0 z-20 h-48 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 backdrop-blur-[6px]" style={{ maskImage: 'linear-gradient(to top, black 20%, transparent)', WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent)' }} />
      </div>
    </section>
  );
}
