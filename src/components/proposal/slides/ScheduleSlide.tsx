'use client';

import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { Pencil, Camera, Scissors } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ProposalMilestoneRow } from '@/types/proposal';
import { SlideHeader } from '@/components/proposal/SlideHeader';
import {
  getRainbowColor, groupByPhase, sortMilestones,
  parseLocal, ymd, firstOfMonth,
  addMonths, formatDate,
} from '@/lib/proposal/milestoneColors';
import { MiniCalendar, type DragState } from '@/components/proposal/MiniCalendar';

interface Props {
  milestones: ProposalMilestoneRow[];
  startDate: string | null;
  endDate: string | null;
  slideRef?: React.RefObject<HTMLElement>;
}

function PhaseIcon({ phase }: { phase: string }) {
  if (phase === 'pre-production')  return <Pencil  size={12} className="text-white/30" />;
  if (phase === 'production')      return <Camera  size={12} className="text-white/30" />;
  if (phase === 'post-production') return <Scissors size={12} className="text-white/30" />;
  return null;
}


export function ScheduleSlide({ milestones, slideRef }: Props) {
  const innerRef    = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const [originalMilestones] = useState(() => sortMilestones(milestones));
  const [customMilestones, setCustomMilestones] = useState<ProposalMilestoneRow[]>(() => sortMilestones(milestones));
  const [activeScheduleTab, setActiveScheduleTab] = useState<'recommended' | 'custom'>('recommended');
  const [dragState, setDragState] = useState<DragState>(null);
  const [deniedIdx, setDeniedIdx] = useState<number | null>(null);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // localMilestones is derived from which tab is active
  const localMilestones = activeScheduleTab === 'recommended' ? originalMilestones : customMilestones;

  if (localMilestones.length === 0) return null;

  // Determine the starting month for the mini-calendars
  const firstMilestone = localMilestones[0];
  const baseMonth = firstOfMonth(parseLocal(firstMilestone.start_date));
  const visibleMonths = [0, 1, 2].map((n) => addMonths(baseMonth, n));

  // Compute phase date ranges for calendar outlines (includes end_date)
  const phaseRanges = localMilestones
    .filter((m) => m.phase)
    .reduce<Record<string, { start: string; end: string }>>((acc, m) => {
      const p = m.phase!;
      const endDate = m.end_date || m.start_date;
      if (!acc[p]) {
        acc[p] = { start: ymd(parseLocal(m.start_date)), end: ymd(parseLocal(endDate)) };
      } else {
        if (ymd(parseLocal(m.start_date)) < acc[p].start) acc[p].start = ymd(parseLocal(m.start_date));
        if (ymd(parseLocal(endDate)) > acc[p].end)        acc[p].end   = ymd(parseLocal(endDate));
      }
      return acc;
    }, {});

  function phaseForDay(day: string): string | null {
    for (const [phase, range] of Object.entries(phaseRanges)) {
      if (day >= range.start && day <= range.end) return phase;
    }
    return null;
  }

  // ── Drag-and-drop pointer handlers ──────────────────────
  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const dateCell = el?.closest('[data-date]') as HTMLElement | null;
      const newDate = dateCell?.getAttribute('data-date') ?? dragState.currentDate;

      // Check if this position violates fixed milestone ordering
      const isInvalid = (() => {
        if (!newDate) return false;
        const { dragType, prevBoundary, nextBoundary } = dragState;
        if ((dragType === 'move' || dragType === 'resize-start') && prevBoundary && newDate < prevBoundary) return true;
        if ((dragType === 'move' || dragType === 'resize-end')   && nextBoundary && newDate > nextBoundary) return true;
        return false;
      })();

      const deltaX = e.clientX - dragState.lastMouseX;
      const rotation = Math.max(-5, Math.min(5, deltaX * 0.5));

      setDragState(prev => prev ? {
        ...prev,
        currentDate: newDate,
        mouseX: e.clientX,
        mouseY: e.clientY,
        lastMouseX: e.clientX,
        rotation,
        isInvalid,
      } : null);

      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = setTimeout(() => {
        setDragState(prev => prev ? { ...prev, rotation: 0 } : null);
      }, 150);
    };

    const handleUp = (e: PointerEvent) => {
      const moved = dragState.currentDate && dragState.currentDate !== dragState.originDate;

      if (moved && dragState.isInvalid) {
        // Denied — trigger shake and snap back (don't commit)
        setDeniedIdx(dragState.milestoneIdx);
        setTimeout(() => setDeniedIdx(null), 420);
      } else if (moved) {
        const { dragType, milestoneIdx, currentDate } = dragState;

        setCustomMilestones(prev => prev.map((m, i) => {
          if (i !== milestoneIdx) return m;

          if (dragType === 'move') {
            const origStart  = parseLocal(m.start_date);
            const origEnd    = m.end_date ? parseLocal(m.end_date) : origStart;
            const durationMs = origEnd.getTime() - origStart.getTime();
            const newStart   = parseLocal(currentDate!);
            const newEnd     = new Date(newStart.getTime() + durationMs);
            return {
              ...m,
              start_date: currentDate!,
              end_date: m.end_date ? ymd(newEnd) : m.end_date,
            };
          }

          if (dragType === 'resize-start') {
            const end = m.end_date || m.start_date;
            if (currentDate! > end) return m;
            return { ...m, start_date: currentDate! };
          }

          if (dragType === 'resize-end') {
            if (currentDate! < m.start_date) return m;
            return { ...m, end_date: currentDate! };
          }

          return m;
        }));

        setActiveScheduleTab('custom');

        confetti({
          particleCount: 12,
          spread: 35,
          startVelocity: 12,
          origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
          colors: [dragState.color],
          scalar: 0.3,
          gravity: 0.8,
          ticks: 50,
          drift: 0,
          decay: 0.92,
        });

        const miIdx = dragState.milestoneIdx;
        requestAnimationFrame(() => {
          const rows = innerRef.current?.querySelectorAll('[data-row]');
          if (!rows?.[miIdx]) return;
          const dateEl = rows[miIdx].querySelector('[data-date-text]') as HTMLElement;
          if (!dateEl) return;
          const rect = dateEl.getBoundingClientRect();
          confetti({
            particleCount: 8,
            spread: 25,
            startVelocity: 10,
            angle: 45,
            origin: { x: rect.right / window.innerWidth, y: rect.top / window.innerHeight },
            colors: [dragState.color],
            scalar: 0.25,
            gravity: 0.6,
            ticks: 40,
            drift: 0.5,
          });
        });
      }

      setDragState(null);
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragState]);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const eyebrow    = el.querySelector('[data-eyebrow]')     as HTMLElement;
      const wordEls    = el.querySelectorAll('[data-word]');
      const accentLine = el.querySelector('[data-accent-line]') as HTMLElement;
      const descEl     = el.querySelector('[data-desc]')        as HTMLElement;
      const helper     = el.querySelector('[data-helper]')      as HTMLElement;
      const tabs       = el.querySelector('[data-tabs]')        as HTMLElement;
      const divider    = el.querySelector('[data-divider]')     as HTMLElement;
      const cals       = el.querySelectorAll('[data-cal]');
      const rows       = el.querySelectorAll('[data-row]');

      gsap.set(eyebrow,    { opacity: 0, y: 12 });
      gsap.set(wordEls,    { y: '115%' });
      gsap.set(accentLine, { scaleX: 0, transformOrigin: 'left center' });
      gsap.set(descEl,     { opacity: 0, y: 16 });
      gsap.set(helper,     { opacity: 0, y: 12 });
      gsap.set(tabs,       { opacity: 0, y: 12 });
      gsap.set(divider,    { scaleY: 0, transformOrigin: 'top center' });
      gsap.set(cals,       { opacity: 0, y: 24 });
      gsap.set(rows,       { opacity: 0, x: 20 });

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          gsap.timeline()
            .to(eyebrow,    { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' })
            .to(wordEls,    { y: '0%', duration: 0.8, ease: 'expo.out', stagger: 0.04 }, '-=0.15')
            .to(accentLine, { scaleX: 1, duration: 0.5, ease: 'expo.out' }, '-=0.4')
            .to(descEl,     { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, '-=0.25')
            .to(helper,     { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, '-=0.15')
            .to(tabs,       { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, '-=0.25')
            .to(divider,    { scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, '-=0.25')
            .to(cals,       { opacity: 1, y: 0, duration: 0.55, ease: 'expo.out', stagger: 0.08 }, '-=0.6')
            .to(rows,       { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05 }, '-=0.4');
        }
      }, { threshold: 0.3 });

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
      <div ref={innerRef} className="max-w-4xl mx-auto px-12 lg:px-20 pb-20 w-full" style={{ paddingTop: 'var(--slide-pt)', marginTop: 'calc(-1 * var(--slide-pull))' }}>

        <SlideHeader
          eyebrow="MILESTONES"
          titleWords={['Timeline']}
          description="A breakdown of key milestones across your production."
          className="mb-8"
        />

        <div className="flex gap-8 flex-1 min-h-0">

          {/* ── Left: Mini calendars ───────────────────────── */}
          <div className="flex-shrink-0 w-56 flex flex-col justify-start">
            {/* Help text */}
            <p data-helper className="text-xs text-white/25 leading-relaxed mb-3">
              Click and drag the colored boxes to try a schedule that works better for you.
            </p>
            {/* Schedule tabs */}
            <div data-tabs className="flex items-center gap-0 mb-3 w-full">
              <button
                onClick={() => setActiveScheduleTab('recommended')}
                className={`flex-1 px-3 py-1.5 rounded-l-lg text-xs font-medium transition-colors duration-200 border ${
                  activeScheduleTab === 'recommended'
                    ? 'text-white bg-[var(--accent)] border-[var(--accent)]'
                    : 'text-white/40 hover:text-white/60 bg-white/[0.04] border-white/[0.08]'
                }`}
              >
                Recommended
              </button>
              <button
                onClick={() => setActiveScheduleTab('custom')}
                className={`flex-1 px-3 py-1.5 rounded-r-lg text-xs font-medium transition-colors duration-200 border border-l-0 ${
                  activeScheduleTab === 'custom'
                    ? 'text-white bg-[var(--accent)] border-[var(--accent)]'
                    : 'text-white/30 hover:text-white/50 bg-white/[0.02] border-white/[0.08]'
                }`}
              >
                Adjusted
              </button>
            </div>
            {/* Calendar cards */}
            <div className="flex flex-col gap-1.5">
              {visibleMonths.map((m, i) => (
                <div key={i} data-cal className="border border-white/[0.08] rounded-xl p-1 bg-white/[0.05]">
                  <MiniCalendar
                    month={m}
                    milestones={localMilestones}
                    phaseForDay={phaseForDay}
                    dragState={dragState}
                    setDragState={setDragState}
                    deniedIdx={deniedIdx}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Vertical divider */}
          <div data-divider className="w-px bg-white/[0.06] self-stretch flex-shrink-0" />

          {/* ── Right: Timeline list with phase groups ─────── */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-0 pr-1 min-h-0" style={{ scrollbarWidth: 'none' }}>
            {groupByPhase(localMilestones).map(({ phase, milestones: groupMils }, gi) => (
              <div key={gi} className="flex gap-3 mb-2">
                {/* Phase column */}
                {phase && (
                  <div className="flex-shrink-0 flex flex-col items-center w-8 select-none pt-1">
                    <PhaseIcon phase={phase} />
                    {phase !== 'production' && (
                      <span
                        className="text-[9px] font-mono text-white/25 uppercase my-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        {phase.replace('-', ' ')}
                      </span>
                    )}
                    <div className="flex-1 w-px bg-white/10 mt-1" />
                  </div>
                )}
                {/* Milestone rows */}
                <div className="flex-1 flex flex-col gap-3">
                  {groupMils.map((m) => {
                    const idx = localMilestones.indexOf(m);
                    const color = getRainbowColor(idx, localMilestones.length);
                    const hasSpan = m.end_date && m.end_date !== m.start_date;
                    const isRowDenied = deniedIdx === idx;
                    return (
                      <div
                        key={m.id}
                        data-row
                        className={['flex gap-4 items-start group', isRowDenied ? 'animate-shake' : ''].join(' ')}
                      >
                        <div className="flex-shrink-0 w-1 self-stretch rounded-full mt-1" style={{ backgroundColor: color, minHeight: 40, opacity: 0.7 }} />
                        <div className="flex-1 py-1">
                          <div className="flex items-baseline gap-3 mb-1">
                            <p className="font-display font-semibold text-white text-lg">{m.label}</p>
                            <p data-date-text className="font-mono text-sm tracking-wider flex-shrink-0" style={{ color }}>
                              {formatDate(m.start_date)}
                              {hasSpan && (
                                <> → {formatDate(m.end_date!)}</>
                              )}
                            </p>
                          </div>
                          {m.description && (
                            <p className="text-white/50 text-sm leading-relaxed">{m.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
      <div className="sticky bottom-0 z-20 h-48 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 backdrop-blur-[6px]" style={{ maskImage: 'linear-gradient(to top, black 20%, transparent)', WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent)' }} />
      </div>
      {dragState && (
        <div
          className="fixed z-[300] pointer-events-none"
          style={{
            left: dragState.mouseX - 16,
            top: dragState.mouseY - 16,
            width: 32,
            height: 32,
            backgroundColor: dragState.isInvalid ? 'rgb(220,38,38)' : dragState.color,
            borderRadius: dragState.dragType === 'resize-end' ? '2px 6px 6px 2px' : dragState.dragType === 'resize-start' ? '6px 2px 2px 6px' : 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `rotate(${dragState.rotation}deg)`,
            transition: 'transform 0.1s ease-out',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <span className="text-[11px] font-bold text-black">
            {dragState.currentDate ? new Date(dragState.currentDate + 'T00:00:00').getDate() : ''}
          </span>
        </div>
      )}
    </section>
  );
}
