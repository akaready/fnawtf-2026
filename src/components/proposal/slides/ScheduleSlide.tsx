'use client';

import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { Pencil, Camera, Scissors } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ProposalMilestoneRow } from '@/types/proposal';
import { SlideHeader } from '@/components/proposal/SlideHeader';

interface Props {
  milestones: ProposalMilestoneRow[];
  startDate: string | null;
  endDate: string | null;
  slideRef?: React.RefObject<HTMLElement>;
}

function getRainbowColor(index: number, total: number): string {
  if (total <= 1) return 'hsl(0, 85%, 65%)';
  const hue = Math.round((index / (total - 1)) * 280);
  return `hsl(${hue}, 85%, 65%)`;
}

// ── Date helpers ────────────────────────────────────────────
function parseLocal(d: string) { return new Date(d + 'T00:00:00'); }
function ymd(d: Date)  { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function firstOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function daysInMonth(d: Date)  { return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); }
function dayOfWeek(d: Date)    { return (d.getDay() + 6) % 7; } // 0 = Mon
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function formatMonthYear(d: Date) { return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
function formatDate(d: string) {
  const dt = parseLocal(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Day role detection (replaces simple dayMilestones) ──────
type DayRole = 'start' | 'end' | 'span' | 'both';
type DayInfo = { idx: number; role: DayRole } | null;

function getDayInfo(day: string, milestones: ProposalMilestoneRow[]): DayInfo {
  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];
    const start = ymd(parseLocal(m.start_date));
    const end   = m.end_date ? ymd(parseLocal(m.end_date)) : start;
    if (day === start && day === end) return { idx: i, role: 'both' };
    if (day === start)                return { idx: i, role: 'start' };
    if (day === end)                  return { idx: i, role: 'end' };
    if (day > start && day < end)     return { idx: i, role: 'span' };
  }
  return null;
}

// ── Phase grouping ───────────────────────────────────────────
type PhaseGroup = { phase: string | null; milestones: ProposalMilestoneRow[] };

function groupByPhase(milestones: ProposalMilestoneRow[]): PhaseGroup[] {
  const groups: PhaseGroup[] = [];
  let currentPhase: string | null = undefined as unknown as string | null;
  let currentGroup: ProposalMilestoneRow[] = [];

  for (const m of milestones) {
    if (m.phase !== currentPhase) {
      if (currentGroup.length > 0) groups.push({ phase: currentPhase, milestones: currentGroup });
      currentPhase = m.phase ?? null;
      currentGroup = [m];
    } else {
      currentGroup.push(m);
    }
  }
  if (currentGroup.length > 0) groups.push({ phase: currentPhase, milestones: currentGroup });
  return groups;
}

function PhaseIcon({ phase }: { phase: string }) {
  if (phase === 'pre-production')  return <Pencil  size={12} className="text-white/30" />;
  if (phase === 'production')      return <Camera  size={12} className="text-white/30" />;
  if (phase === 'post-production') return <Scissors size={12} className="text-white/30" />;
  return null;
}

const WEEK_DAYS = ['M','T','W','T','F','S','S'];

type DragType = 'move' | 'resize-start' | 'resize-end';

type DragState = {
  milestoneIdx: number;
  color: string;
  originDate: string;
  currentDate: string | null;
  mouseX: number;
  mouseY: number;
  lastMouseX: number;
  rotation: number;
  dragType: DragType;
  prevBoundary: string | null; // start_date of preceding milestone — must not go before this
  nextBoundary: string | null; // start_date of following milestone — must not go after this
  isInvalid: boolean;
} | null;

interface MiniCalProps {
  month: Date;
  milestones: ProposalMilestoneRow[];
  phaseForDay?: (day: string) => string | null;
  dragState?: DragState;
  setDragState?: React.Dispatch<React.SetStateAction<DragState>>;
  deniedIdx?: number | null;
}

function MiniCalendar({ month, milestones, phaseForDay, dragState, setDragState, deniedIdx }: MiniCalProps) {
  const firstDay    = firstOfMonth(month);
  const totalDays   = daysInMonth(month);
  const startOffset = dayOfWeek(firstDay);
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Build a live preview of what milestones would look like if drag was released now
  const previewMilestones: ProposalMilestoneRow[] = dragState?.currentDate
    ? milestones.map((m, i) => {
        if (i !== dragState.milestoneIdx) return m;
        const cur = dragState.currentDate!;
        if (dragState.dragType === 'resize-end') {
          return { ...m, end_date: cur >= m.start_date ? cur : m.start_date };
        }
        if (dragState.dragType === 'resize-start') {
          const end = m.end_date || m.start_date;
          return { ...m, start_date: cur <= end ? cur : end };
        }
        if (dragState.dragType === 'move') {
          const origStart  = parseLocal(m.start_date);
          const origEnd    = m.end_date ? parseLocal(m.end_date) : origStart;
          const durationMs = origEnd.getTime() - origStart.getTime();
          const newStart   = parseLocal(cur);
          const newEnd     = new Date(newStart.getTime() + durationMs);
          return { ...m, start_date: cur, end_date: m.end_date ? ymd(newEnd) : m.end_date };
        }
        return m;
      })
    : milestones;

  // Check if a date was in the original (committed) milestone span
  function isInOriginalSpan(day: string, idx: number): boolean {
    const m = milestones[idx];
    const start = ymd(parseLocal(m.start_date));
    const end   = m.end_date ? ymd(parseLocal(m.end_date)) : start;
    return day >= start && day <= end;
  }

  function startDrag(e: React.PointerEvent, dateStr: string, dayInfo: DayInfo, type: DragType) {
    e.preventDefault();
    e.stopPropagation();
    if (!dayInfo) return;
    const m = milestones[dayInfo.idx];
    const originDate =
      type === 'resize-end'
        ? (m.end_date ? ymd(parseLocal(m.end_date)) : dateStr)
        : m.start_date;
    const prev = milestones[dayInfo.idx - 1];
    const next = milestones[dayInfo.idx + 1];
    setDragState!({
      milestoneIdx: dayInfo.idx,
      color: getRainbowColor(dayInfo.idx, milestones.length),
      originDate,
      currentDate: dateStr,
      mouseX: e.clientX,
      mouseY: e.clientY,
      lastMouseX: e.clientX,
      rotation: 0,
      dragType: type,
      prevBoundary: prev ? ymd(parseLocal(prev.start_date)) : null,
      nextBoundary: next ? ymd(parseLocal(next.start_date)) : null,
      isInvalid: false,
    });
  }

  return (
    <div>
      <p className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/40 mb-3 text-center pt-1">
        {formatMonthYear(month)}
      </p>
      <div className="grid grid-cols-7 gap-px">
        {WEEK_DAYS.map((d, i) => (
          <div key={i} className="text-center text-[11px] text-white/25 pb-1">{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="aspect-square" />;
          const dateStr = ymd(new Date(month.getFullYear(), month.getMonth(), day));

          // Use preview milestones for visual rendering so the span fills in live
          const dayInfo = getDayInfo(dateStr, previewMilestones);
          // But use committed milestones for interaction decisions
          const committedDayInfo = getDayInfo(dateStr, milestones);
          const isToday = dateStr === ymd(new Date());

          // Is this cell a live preview (not yet committed)?
          // Note: previewMilestones naturally handles the origin cell for resize drags
          // (it stays colored as part of the span), so no need to ghost it.
          const isPreviewCell = dragState && dayInfo && dayInfo.idx === dragState.milestoneIdx
            && !isInOriginalSpan(dateStr, dragState.milestoneIdx);

          const milestoneColor = dayInfo ? getRainbowColor(dayInfo.idx, milestones.length) : undefined;
          // Invalid drags show red tint instead of milestone color
          const isDenied = deniedIdx !== null && deniedIdx !== undefined && committedDayInfo?.idx === deniedIdx;
          const isInvalidPreview = isPreviewCell && dragState?.isInvalid;
          const displayColor = isInvalidPreview ? 'rgba(220,38,38,0.9)' : milestoneColor;
          const inPhase = !dayInfo && phaseForDay ? phaseForDay(dateStr) !== null : false;
          const isGoLiveCell = !!dayInfo && milestones[dayInfo.idx]?.label === 'Go Live';

          // Rounding: continuous-bar feel per role
          const roundingClass =
            dayInfo?.role === 'start' ? 'rounded-l-[2px]' :
            dayInfo?.role === 'end'   ? 'rounded-r-[2px]' :
            dayInfo?.role === 'span'  ? '' :
            'rounded-[2px]'; // 'both' or no milestone

          // Opacity for span fill vs anchor
          const bgOpacity = (dayInfo?.role === 'span') ? 0.45 : 0.9;

          // Show edge handles on interactive cells (not span-interior cells)
          // Interaction handles use committed day info only (can't start drag from a preview cell)
          const showLeftHandle  = !!committedDayInfo && (committedDayInfo.role === 'start' || committedDayInfo.role === 'both' || committedDayInfo.role === 'end') && !!setDragState && !dragState;
          const showRightHandle = !!committedDayInfo && (committedDayInfo.role === 'end'   || committedDayInfo.role === 'both' || committedDayInfo.role === 'start') && !!setDragState && !dragState;
          const showBodyHandle  = !!committedDayInfo && !!setDragState && !dragState;

          return (
            <div
              key={idx}
              data-date={dateStr}
              className={[
                'relative w-full aspect-square flex items-center justify-center select-none',
                roundingClass,
                isToday ? 'ring-1 ring-white/30' : '',
                inPhase ? 'ring-1 ring-white/[0.12]' : '',
                isPreviewCell && !isInvalidPreview ? 'ring-1 ring-white/20' : '',
                isInvalidPreview ? 'ring-1 ring-red-500/40' : '',
                isDenied ? 'animate-shake' : '',
                isGoLiveCell ? 'go-live-cell' : '',
                committedDayInfo && !dragState ? 'cursor-grab' : '',
              ].join(' ')}
              style={displayColor ? {
                backgroundColor: displayColor,
                opacity: isPreviewCell ? 0.45 : bgOpacity,
              } : undefined}
            >
              {/* Left-edge resize handle (resize-start) */}
              {showLeftHandle && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-[32%] z-10 cursor-w-resize"
                  onPointerDown={(e) => startDrag(e, dateStr, committedDayInfo!, 'resize-start')}
                />
              )}
              {/* Right-edge resize handle (resize-end) */}
              {showRightHandle && (
                <div
                  className="absolute right-0 top-0 bottom-0 w-[32%] z-10 cursor-e-resize"
                  onPointerDown={(e) => startDrag(e, dateStr, committedDayInfo!, 'resize-end')}
                />
              )}
              {/* Body — move entire span */}
              {showBodyHandle && (
                <div
                  className="absolute inset-0 z-0 cursor-grab"
                  onPointerDown={(e) => startDrag(e, dateStr, committedDayInfo!, 'move')}
                />
              )}
              <span className={[
                'text-[11px] leading-none relative z-[5] pointer-events-none',
                dayInfo ? (isPreviewCell ? 'text-white/60' : 'text-black font-bold') : 'text-white/25',
              ].join(' ')}>
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScheduleSlide({ milestones, slideRef }: Props) {
  const innerRef    = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const [originalMilestones] = useState(milestones);
  const [customMilestones, setCustomMilestones] = useState<ProposalMilestoneRow[]>(milestones);
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
      <div className="sticky top-0 z-20 h-32 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-transparent" />
      </div>
      <div ref={innerRef} className="max-w-4xl mx-auto px-12 lg:px-20 -mt-16 pt-20 pb-20 w-full">

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
