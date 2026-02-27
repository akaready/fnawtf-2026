'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  viewerName: string | null;
}

export function ProposalPageClient({ proposal, sections, videos, quotes, milestones, viewerEmail, viewerName }: Props) {
  const welcomeSection = sections.find(
    (s) => s.sort_order === 0 && (s.section_type === 'text' || s.section_type === 'custom_text')
  ) ?? null;
  const approachSection = sections.find(
    (s) => s.sort_order === 1 && (s.section_type === 'text' || s.section_type === 'custom_text')
  ) ?? null;

  const hasSchedule = milestones.length > 0;
  const hasQuotes   = quotes.length > 0;

  const [showExitOverlay, setShowExitOverlay] = useState(false);

  // ── Exit handler ───────────────────────────────────────────
  const handleExit = useCallback(() => {
    // Tell Navigation to start hidden and animate in after remounting
    sessionStorage.setItem('fna_proposal_exit', 'true');

    // Navigate home via synthetic link click so PageTransition plays the purple panel sweep.
    // Nav/footer will remount automatically when SiteLayoutWrapper sees the new pathname.
    const link = document.createElement('a');
    link.href = '/';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, []);

  // Show exit overlay briefly then navigate
  const triggerExit = useCallback(() => {
    setShowExitOverlay(true);
    setTimeout(() => handleExit(), 500);
  }, [handleExit]);

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
  const validVideos = (videos ?? []).filter((v: ProposalVideo) => v.project_video?.project);

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

  // Stable slug for each slide (used for URL hash deep linking)
  const slideSlugs = slideNames.map((name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  );

  const deckRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Track nav highlight: bright on very first slide visited, then dim permanently
  const navVisitCountRef = useRef(0);
  const [navHighlighted, setNavHighlighted] = useState(false);

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

  // ── Deep-link: jump to slide from URL hash on mount ──────────
  const hasNavigatedFromHash = useRef(false);
  useEffect(() => {
    const hash = window.location.hash.slice(1).toLowerCase();
    if (!hash) return;
    const idx = slideSlugs.findIndex((s) => s === hash);
    if (idx > 0) {
      hasNavigatedFromHash.current = true;
      // Delay to let DOM settle after hydration
      requestAnimationFrame(() => {
        slideRefs[idx]?.current?.scrollIntoView({ inline: 'start', block: 'nearest' });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update URL hash as user navigates ───────────────────────
  useEffect(() => {
    const slug = slideSlugs[currentSlide];
    if (slug && currentSlide > 0) {
      window.history.replaceState(null, '', `#${slug}`);
    } else if (currentSlide === 0) {
      // On title slide, remove hash
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [currentSlide, slideSlugs]);

  // ── Nav highlight: bright on first slide visited, dim after ──
  useEffect(() => {
    if (currentSlide === 0) return;
    navVisitCountRef.current += 1;
    if (navVisitCountRef.current === 1 && !hasNavigatedFromHash.current) {
      setNavHighlighted(true);
    } else {
      setNavHighlighted(false);
    }
  }, [currentSlide]);

  // ── Smooth scroll navigation (same as dots) ─────────────────
  const navigateTo = useCallback((target: number) => {
    if (target < 0 || target >= slideRefs.length) return;
    const el = slideRefs[target]?.current;
    if (!el) return;
    el.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'smooth' });
  }, [slideRefs]);

  // ── Keyboard arrow navigation ─────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigateTo(currentSlide + 1);
      if (e.key === 'ArrowLeft')  navigateTo(currentSlide - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigateTo, currentSlide]);

  // ── Lock to current slide on window resize ─────────────────
  useEffect(() => {
    const onResize = () => {
      const el = slideRefs[currentSlide]?.current;
      if (el) el.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'instant' });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [currentSlide, slideRefs]);

  // ── Touch swipe navigation ────────────────────────────────
  const touchStartX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) < 40) return; // dead zone — ignore tiny swipes
    if (dx > 0) {
      // Swipe left = advance
      if (currentSlide === slideRefs.length - 1) triggerExit();
      else navigateTo(currentSlide + 1);
    } else {
      // Swipe right = go back; exit from first slide
      if (currentSlide === 0) triggerExit();
      else navigateTo(currentSlide - 1);
    }
  }, [currentSlide, slideRefs.length, navigateTo, triggerExit]);

  return (
    <VideoPlayerProvider>

      {/* ── Horizontal scroll deck ───────────────────────────── */}
      <div
        ref={deckRef}
        className="h-screen flex overflow-x-scroll [scroll-snap-type:x_mandatory] proposal-deck-scroll"
        style={{ scrollbarWidth: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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
            crowdfundingDeferred={proposal.crowdfunding_deferred}
            slideRef={investmentRef}
            viewerName={viewerName}
          />
        )}

        <NextStepsSlide proposal={proposal} slideRef={nextStepsRef} viewerName={viewerName} viewerEmail={viewerEmail} />
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
        isHighlighted={navHighlighted}
        onExit={handleExit}
      />

      {/* ── Exit overlay (swipe-triggered) ───────────────────── */}
      <AnimatePresence>
        {showExitOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[500] bg-black flex items-center justify-center pointer-events-none"
          >
            <p className="text-white/40 text-sm tracking-[0.3em] uppercase font-mono">Exiting…</p>
          </motion.div>
        )}
      </AnimatePresence>

    </VideoPlayerProvider>
  );
}
