'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { VideoPlayerProvider } from '@/contexts/VideoPlayerContext';
import { TitleSlide } from '@/components/proposal/slides/TitleSlide';
import { WelcomeSlide } from '@/components/proposal/slides/WelcomeSlide';
import { ApproachSlide } from '@/components/proposal/slides/ApproachSlide';
import { ScheduleSlide } from '@/components/proposal/slides/ScheduleSlide';
import { SamplesIntroSlide } from '@/components/proposal/slides/SamplesIntroSlide';
import { ProjectSlide } from '@/components/proposal/slides/ProjectSlide';
import { InvestmentSlide } from '@/components/proposal/slides/InvestmentSlide';
import { ProcessSlide } from '@/components/proposal/slides/ProcessSlide';
import { NextStepsSlide } from '@/components/proposal/slides/NextStepsSlide';
import { ProposalProgressDots } from '@/components/proposal/ProposalProgressDots';
import { ProposalNavArrows } from '@/components/proposal/ProposalNavArrows';
import type { ProposalRow, ProposalSectionRow, ProposalQuoteRow, ProposalMilestoneRow, ProposalVideo } from '@/types/proposal';

interface Props {
  proposal: ProposalRow;
  sections: ProposalSectionRow[];
  videos: ProposalVideo[];
  quotes: ProposalQuoteRow[];
  milestones: ProposalMilestoneRow[];
  viewerEmail: string;
}

export function ProposalPageClient({ proposal, sections, videos, quotes, milestones, viewerEmail: _viewerEmail }: Props) {
  const router = useRouter();

  const welcomeSection = sections.find(
    (s) => s.sort_order === 0 && (s.section_type === 'text' || s.section_type === 'custom_text')
  ) ?? null;
  const approachSection = sections.find(
    (s) => s.sort_order === 1 && (s.section_type === 'text' || s.section_type === 'custom_text')
  ) ?? null;

  const hasSchedule = milestones.length > 0;
  const hasQuotes   = quotes.length > 0;

  // ── Exit handler ───────────────────────────────────────────
  const handleExit = useCallback(() => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:black;opacity:0;pointer-events:none;';
    document.body.appendChild(overlay);

    // Phase 1: Fade to black
    gsap.to(overlay, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        // Tell Navigation to start hidden on next render
        sessionStorage.setItem('fna_proposal_exit', 'true');

        // Set cookie + navigate
        document.cookie = 'proposal_exited=true; path=/; max-age=2592000';
        router.push('/');

        // Phase 2: Wait for home page to render, then fade overlay out
        requestAnimationFrame(() => {
          setTimeout(() => {
            gsap.to(overlay, {
              opacity: 0,
              duration: 0.6,
              ease: 'power2.out',
              onComplete: () => {
                overlay.remove();

                // Phase 3: Tell Navigation to animate back in
                window.dispatchEvent(new Event('fna-nav-reveal'));
              },
            });
          }, 150);
        });
      },
    });
  }, [router]);

  // ── Slide refs ─────────────────────────────────────────────
  const titleRef        = useRef<HTMLElement>(null);
  const welcomeRef      = useRef<HTMLElement>(null);
  const processRef      = useRef<HTMLElement>(null);
  const approachRef     = useRef<HTMLElement>(null);
  const scheduleRef     = useRef<HTMLElement>(null);
  const samplesIntroRef = useRef<HTMLElement>(null);
  const investmentRef   = useRef<HTMLElement>(null);
  const nextStepsRef    = useRef<HTMLElement>(null);

  // Dynamic refs for N video slides
  const videoSlideRefsRef = useRef<{ current: HTMLElement | null }[]>([]);
  const validVideos = (videos ?? []).filter((v: ProposalVideo) => v.project_video?.project && (v.project_video.project.testimonials?.length ?? 0) > 0);

  // Slide order: Title → Welcome → Process → Approach → Timeline → Samples → Projects... → Investment → Next Steps
  const slideNames = [
    'Title',
    ...(welcomeSection?.custom_content  ? ['Welcome']  : []),
    'Process',
    ...(approachSection?.custom_content ? ['Approach'] : []),
    ...(hasSchedule                     ? ['Timeline'] : []),
    ...(validVideos.length > 0          ? ['Samples']  : []),
    ...validVideos.map((v: ProposalVideo) => v.project_video?.project?.title ?? 'Project'),
    ...(hasQuotes                       ? ['Investment'] : []),
    'Next Steps',
  ];

  while (videoSlideRefsRef.current.length < validVideos.length) {
    videoSlideRefsRef.current.push({ current: null });
  }
  const videoSlideRefs = videoSlideRefsRef.current.slice(0, validVideos.length);

  const slideRefs = [
    titleRef,
    ...(welcomeSection?.custom_content  ? [welcomeRef]    : []),
    processRef,
    ...(approachSection?.custom_content ? [approachRef]   : []),
    ...(hasSchedule                     ? [scheduleRef]   : []),
    ...(validVideos.length > 0          ? [samplesIntroRef] : []),
    ...(videoSlideRefs as React.RefObject<HTMLElement>[]),
    ...(hasQuotes                       ? [investmentRef] : []),
    nextStepsRef,
  ] as React.RefObject<HTMLElement>[];

  const deckRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // ── Track active slide from IntersectionObserver ──────────
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    slideRefs.forEach((ref, i) => {
      if (!ref.current) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setCurrentSlide(i); },
        { threshold: 0.5 }
      );
      obs.observe(ref.current);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Smooth scroll navigation (same as dots) ─────────────────
  const navigateTo = useCallback((target: number) => {
    if (target < 0 || target >= slideRefs.length) return;
    const el = slideRefs[target]?.current;
    if (!el) return;
    el.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'smooth' });
  }, [slideRefs]);

  // ── Wheel → horizontal scroll ─────────────────────────────
  useEffect(() => {
    const container = deckRef.current;
    if (!container) return;
    const handler = (e: WheelEvent) => {
      let el = e.target as HTMLElement | null;
      while (el && el !== container) {
        const style = getComputedStyle(el);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
          return;
        }
        el = el.parentElement;
      }
      e.preventDefault();
      container.scrollLeft += (e.deltaY + e.deltaX) * 1.2;
    };
    container.addEventListener('wheel', handler, { passive: false });
    return () => container.removeEventListener('wheel', handler);
  }, []);

  // ── Keyboard arrow navigation ─────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigateTo(currentSlide + 1);
      if (e.key === 'ArrowLeft')  navigateTo(currentSlide - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigateTo, currentSlide]);

  // ── Nav + footer sweep off on load ─────────────────────────
  useEffect(() => {
    const navEl    = document.querySelector('nav')    as HTMLElement | null;
    const footerEl = document.querySelector('footer') as HTMLElement | null;

    if (footerEl) gsap.set(footerEl, { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 900, y: 0 });

    const tl = gsap.timeline({ delay: 0.7 });
    if (navEl)    tl.to(navEl,    { y: '-100%', duration: 1, ease: 'power3.inOut' }, 0);
    if (footerEl) tl.to(footerEl, { y: '100%',  duration: 1, ease: 'power3.inOut' }, 0.05);

    return () => {
      tl.kill();
      if (navEl)    gsap.set(navEl,    { clearProps: 'transform' });
      if (footerEl) gsap.set(footerEl, { clearProps: 'all' });
    };
  }, []);

  return (
    <VideoPlayerProvider>

      {/* ── Horizontal scroll deck ───────────────────────────── */}
      <div
        ref={deckRef}
        className="h-screen flex overflow-x-scroll [scroll-snap-type:x_mandatory] proposal-deck-scroll"
        style={{ scrollbarWidth: 'none' }}
      >
        <TitleSlide proposal={proposal} slideRef={titleRef} onNext={() => navigateTo(1)} />

        {welcomeSection?.custom_content && (
          <WelcomeSlide section={welcomeSection} slideRef={welcomeRef} />
        )}

        <ProcessSlide slideRef={processRef} />

        {approachSection?.custom_content && (
          <ApproachSlide section={approachSection} slideRef={approachRef} />
        )}

        {hasSchedule && (
          <ScheduleSlide
            milestones={milestones}
            startDate={proposal.schedule_start_date}
            endDate={proposal.schedule_end_date}
            slideRef={scheduleRef}
          />
        )}

        {validVideos.length > 0 && (
          <SamplesIntroSlide
            videos={validVideos}
            slideRef={samplesIntroRef}
            onViewProject={(videoIndex: number) => {
              // Samples intro slide is at a certain position in slideRefs
              // Video slides come after it, so find the right index
              const samplesIdx = slideRefs.findIndex((r) => r === samplesIntroRef);
              if (samplesIdx >= 0) navigateTo(samplesIdx + 1 + videoIndex);
            }}
          />
        )}

        {validVideos.map((v: ProposalVideo, i: number) => (
          <ProjectSlide
            key={v.id}
            video={v}
            contactCompany={proposal.contact_company}
            slideRef={videoSlideRefs[i] as React.RefObject<HTMLElement>}
          />
        ))}

        {hasQuotes && (
          <InvestmentSlide
            proposalId={proposal.id}
            proposalType={proposal.proposal_type}
            quotes={quotes}
            crowdfundingApproved={proposal.crowdfunding_approved}
            slideRef={investmentRef}
          />
        )}

        <NextStepsSlide proposal={proposal} slideRef={nextStepsRef} />
      </div>

      <ProposalProgressDots
        slideCount={slideRefs.length}
        slideRefs={slideRefs}
        slideNames={slideNames}
        proposalTitle={proposal.title}
        onExit={handleExit}
      />

      <ProposalNavArrows
        onPrev={() => navigateTo(currentSlide - 1)}
        onNext={() => navigateTo(currentSlide + 1)}
        canGoPrev={currentSlide > 0}
        canGoNext={currentSlide < slideRefs.length - 1}
        isFirst={currentSlide === 0}
        isLast={currentSlide === slideRefs.length - 1}
        onExit={handleExit}
      />

    </VideoPlayerProvider>
  );
}
