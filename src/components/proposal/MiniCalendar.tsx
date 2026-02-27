'use client';

import type { ProposalMilestoneRow } from '@/types/proposal';
import {
  getRainbowColor,
  parseLocal, ymd, firstOfMonth, daysInMonth, dayOfWeek, formatMonthYear,
} from '@/lib/proposal/milestoneColors';

export type DayRole = 'start' | 'end' | 'span' | 'both';
export type DayInfo = { idx: number; role: DayRole } | null;
export type DragType = 'move' | 'resize-start' | 'resize-end';

export type DragState = {
  milestoneIdx: number;
  color: string;
  originDate: string;
  currentDate: string | null;
  mouseX: number;
  mouseY: number;
  lastMouseX: number;
  rotation: number;
  dragType: DragType;
  prevBoundary: string | null;
  nextBoundary: string | null;
  isInvalid: boolean;
} | null;

export function getDayInfo(day: string, milestones: ProposalMilestoneRow[]): DayInfo {
  let fallback: DayInfo = null;
  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];
    const start = ymd(parseLocal(m.start_date));
    const end   = m.end_date ? ymd(parseLocal(m.end_date)) : start;
    if (day === start && day === end) return { idx: i, role: 'both' };
    if (day === start)                return { idx: i, role: 'start' };
    if (day === end   && !fallback)   fallback = { idx: i, role: 'end' };
    if (day > start && day < end && !fallback) fallback = { idx: i, role: 'span' };
  }
  return fallback;
}

/** When two different milestones both occupy the same day, return both indices + colors. */
export type OverlapInfo = { leftIdx: number; rightIdx: number } | null;
export function getOverlapInfo(day: string, milestones: ProposalMilestoneRow[]): OverlapInfo {
  const hits: number[] = [];
  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];
    const start = ymd(parseLocal(m.start_date));
    const end   = m.end_date ? ymd(parseLocal(m.end_date)) : start;
    if (day >= start && day <= end) hits.push(i);
    if (hits.length >= 2) break;
  }
  if (hits.length >= 2) return { leftIdx: hits[0], rightIdx: hits[1] };
  return null;
}

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface MiniCalProps {
  month: Date;
  milestones: ProposalMilestoneRow[];
  phaseForDay?: (day: string) => string | null;
  dragState?: DragState;
  setDragState?: React.Dispatch<React.SetStateAction<DragState>>;
  deniedIdx?: number | null;
  goLiveDate?: string;
}

export function MiniCalendar({ month, milestones, phaseForDay, dragState, setDragState, deniedIdx, goLiveDate }: MiniCalProps) {
  const firstDay    = firstOfMonth(month);
  const totalDays   = daysInMonth(month);
  const startOffset = dayOfWeek(firstDay);
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

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

  function isInOriginalSpan(day: string, idx: number): boolean {
    const m = milestones[idx];
    const start = ymd(parseLocal(m.start_date));
    const end   = m.end_date ? ymd(parseLocal(m.end_date)) : start;
    return day >= start && day <= end;
  }

  function startDrag(e: React.PointerEvent, dateStr: string, dayInfo: DayInfo, type: DragType) {
    e.preventDefault();
    e.stopPropagation();
    if (!dayInfo || !setDragState) return;
    const m = milestones[dayInfo.idx];
    const originDate =
      type === 'resize-end'
        ? (m.end_date ? ymd(parseLocal(m.end_date)) : dateStr)
        : m.start_date;
    const prev = milestones[dayInfo.idx - 1];
    const next = milestones[dayInfo.idx + 1];
    setDragState({
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

          const dayInfo          = getDayInfo(dateStr, previewMilestones);
          const committedDayInfo = getDayInfo(dateStr, milestones);
          const overlap          = getOverlapInfo(dateStr, previewMilestones);
          const isToday          = dateStr === ymd(new Date());

          const isPreviewCell = dragState && dayInfo && dayInfo.idx === dragState.milestoneIdx
            && !isInOriginalSpan(dateStr, dragState.milestoneIdx);

          const isGoLiveCell       = !!dayInfo && milestones[dayInfo.idx]?.label === 'Go Live';
          const isProductionCell   = !!dayInfo && milestones[dayInfo.idx]?.label === 'Production';

          const hasGoLiveConflict = !!goLiveDate && milestones.some(s => s.label !== 'Go Live' && (s.start_date > goLiveDate || (s.end_date || s.start_date) > goLiveDate));
          const isRedCell = (di: DayInfo) => {
            if (!di) return false;
            const m = milestones[di.idx];
            if (!m) return false;
            // Red if after Go Live
            if (goLiveDate && m.label !== 'Go Live' && m.start_date > goLiveDate) return true;
            // Red if out of chronological order (date before a preceding milestone)
            if (di.idx > 0 && milestones.slice(0, di.idx).some(prev => (prev.end_date || prev.start_date) > m.start_date)) return true;
            // Red if Go Live has conflicts
            if (m.label === 'Go Live' && hasGoLiveConflict) return true;
            return false;
          };
          const isPastGoLive       = isRedCell(dayInfo);
          const milestoneColor     = isPastGoLive ? 'rgb(220,38,38)' : dayInfo ? getRainbowColor(dayInfo.idx, milestones.length) : undefined;
          const isDenied           = deniedIdx !== null && deniedIdx !== undefined && committedDayInfo?.idx === deniedIdx;
          const isInvalidPreview   = isPreviewCell && dragState?.isInvalid;
          const displayColor       = isInvalidPreview ? 'rgba(220,38,38,0.9)' : milestoneColor;
          const inPhase            = !dayInfo && phaseForDay ? phaseForDay(dateStr) !== null : false;

          // Overlap split colors
          const overlapLeftColor = overlap
            ? (isRedCell({ idx: overlap.leftIdx, role: 'end' }) ? 'rgb(220,38,38)' : getRainbowColor(overlap.leftIdx, milestones.length))
            : undefined;
          const overlapRightColor = overlap
            ? (isRedCell({ idx: overlap.rightIdx, role: 'start' }) ? 'rgb(220,38,38)' : getRainbowColor(overlap.rightIdx, milestones.length))
            : undefined;

          const roundingClass =
            overlap ? '' :
            dayInfo?.role === 'start' ? 'rounded-l-[2px]' :
            dayInfo?.role === 'end'   ? 'rounded-r-[2px]' :
            dayInfo?.role === 'span'  ? '' :
            'rounded-[2px]';

          const bgOpacity = overlap ? 0.9 : (dayInfo?.role === 'span') ? 0.45 : 0.9;

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
              style={overlap ? {
                background: `linear-gradient(to top right, ${overlapLeftColor} 50%, ${overlapRightColor} 50%)`,
                opacity: bgOpacity,
              } : displayColor ? {
                backgroundColor: displayColor,
                opacity: isPreviewCell ? 0.45 : bgOpacity,
              } : undefined}
            >
              {showLeftHandle && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-[32%] z-10 cursor-w-resize"
                  onPointerDown={(e) => startDrag(e, dateStr, committedDayInfo!, 'resize-start')}
                />
              )}
              {showRightHandle && (
                <div
                  className="absolute right-0 top-0 bottom-0 w-[32%] z-10 cursor-e-resize"
                  onPointerDown={(e) => startDrag(e, dateStr, committedDayInfo!, 'resize-end')}
                />
              )}
              {showBodyHandle && (
                <div
                  className="absolute inset-0 z-0 cursor-grab"
                  onPointerDown={(e) => startDrag(e, dateStr, committedDayInfo!, 'move')}
                />
              )}
              {isPastGoLive && (
                <div
                  className="absolute inset-0 pointer-events-none z-[3]"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
                  }}
                />
              )}
              <span className={[
                'text-[11px] leading-none relative z-[5] pointer-events-none',
                dayInfo ? (isPreviewCell ? 'text-white/60' : isPastGoLive ? 'text-white font-bold' : 'text-black font-bold') : 'text-white/25',
              ].join(' ')}>
                {isProductionCell ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                ) : day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
