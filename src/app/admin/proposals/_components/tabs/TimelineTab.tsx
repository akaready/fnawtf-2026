'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Camera, Scissors, Sparkles, Loader2, X, Plus } from 'lucide-react';
import { MiniCalendar, type DragState } from '@/components/proposal/MiniCalendar';
import {
  updateProposal, updateProposalMilestone,
  deleteAllProposalMilestones, batchCreateProposalMilestones,
} from '@/app/admin/actions';
import {
  getRainbowColor, groupByPhase, sortMilestones,
  parseLocal, ymd, firstOfMonth,
  addMonths, addBusinessDays, nextTuesday, countBusinessDays,
  formatDate,
} from '@/lib/proposal/milestoneColors';
import type { ProposalMilestoneRow, ProposalRow } from '@/types/proposal';

// ── Props ────────────────────────────────────────────────────────────────────

interface TimelineTabProps {
  proposalId: string;
  proposal: ProposalRow;
  initialMilestones: ProposalMilestoneRow[];
}

// ── Phase icon (matches ScheduleSlide) ───────────────────────────────────────

function PhaseIcon({ phase }: { phase: string }) {
  if (phase === 'pre-production')  return <Pencil  size={12} className="text-[#4d4d4d]" />;
  if (phase === 'production')      return <Camera  size={12} className="text-[#4d4d4d]" />;
  if (phase === 'post-production') return <Scissors size={12} className="text-[#4d4d4d]" />;
  return null;
}

// ── Display label (handles Production Day/Days pluralization) ────────────────

function displayLabel(m: ProposalMilestoneRow): string {
  if (m.label === 'Production Days' && m.start_date === m.end_date) return 'Production Day';
  return m.label;
}

// ── Month dropdown options ───────────────────────────────────────────────────

const dateInputCls =
  'text-xs bg-black/40 border border-[#2a2a2a] rounded px-3 py-1.5 text-[#b3b3b3] ' +
  'focus:outline-none focus:border-white/20 focus:text-white/90 transition-colors ' +
  '[color-scheme:dark]';

// ── Default timeline generation ──────────────────────────────────────────────

// Template milestones with default descriptions and business-day gaps
const TEMPLATE = [
  { label: 'Kickoff',        gap: 0, desc: 'Project kickoff meeting to align on creative direction.' },
  { label: 'Script Rev 1',   gap: 5, desc: 'First draft script delivered for client review and feedback.' },
  { label: 'Script Rev 2',   gap: 3, desc: 'Revised script incorporating client notes from the first round.' },
  { label: 'Final Script',   gap: 3, desc: 'Approved final script locked for production.' },
  { label: 'Location Scout', gap: 3, desc: 'Scouting and securing shoot locations based on creative direction.' },
  { label: 'Production',     gap: 5, desc: 'On-set filming of all planned scenes and coverage.' },
  { label: 'Edit Rev 1',     gap: 4, desc: 'First rough cut delivered for client review.' },
  { label: 'Edit Rev 2',     gap: 3, desc: 'Revised edit incorporating client feedback from the first cut.' },
  { label: 'Final Delivery', gap: 3, desc: 'Final polished deliverables exported and handed off.' },
  { label: 'Go Live',        gap: 0, desc: 'Content goes live across designated platforms.' },
];

const TEMPLATE_LABELS = TEMPLATE.map(t => t.label);
const BASE_GAPS = TEMPLATE.map(t => t.gap);
const DEFAULT_DESCRIPTIONS: Record<string, string> = Object.fromEntries(TEMPLATE.map(t => [t.label, t.desc]));

function generateDefaultTimeline(
  kickoffDate: Date,
  goLiveDate: Date | null,
): Array<{ label: string; date: string }> {
  if (!goLiveDate) {
    // Only kickoff — use base gaps directly
    const dates: Array<{ label: string; date: string }> = [];
    let cursor = kickoffDate;
    for (let i = 0; i < TEMPLATE_LABELS.length; i++) {
      if (i === TEMPLATE_LABELS.length - 1) {
        // Go Live = next Tuesday after Final Delivery
        cursor = nextTuesday(addBusinessDays(cursor, 1));
      } else if (i > 0) {
        cursor = addBusinessDays(cursor, BASE_GAPS[i]);
      }
      dates.push({ label: TEMPLATE_LABELS[i], date: ymd(cursor) });
    }
    return dates;
  }

  // Both kickoff and go live — scale gaps to fit
  const totalBizDays = countBusinessDays(kickoffDate, goLiveDate);
  const baseTotal = BASE_GAPS.reduce((s, g) => s + g, 0); // 25
  // Reserve 2 biz days for Final Delivery → Go Live gap
  const availableForGaps = Math.max(TEMPLATE_LABELS.length - 1, totalBizDays - 2);
  const innerGapsTotal = baseTotal; // sum of gaps excluding the Go Live gap

  const dates: Array<{ label: string; date: string }> = [];
  let cursor = kickoffDate;

  for (let i = 0; i < TEMPLATE_LABELS.length; i++) {
    if (i === 0) {
      // Kickoff
      dates.push({ label: TEMPLATE_LABELS[i], date: ymd(cursor) });
    } else if (i === TEMPLATE_LABELS.length - 1) {
      // Go Live = the user-specified date
      dates.push({ label: TEMPLATE_LABELS[i], date: ymd(goLiveDate) });
    } else if (i === TEMPLATE_LABELS.length - 2) {
      // Final Delivery = 2 biz days before Go Live
      const d = new Date(goLiveDate);
      let count = 0;
      while (count < 2) {
        d.setDate(d.getDate() - 1);
        if (d.getDay() !== 0 && d.getDay() !== 6) count++;
      }
      cursor = d;
      dates.push({ label: TEMPLATE_LABELS[i], date: ymd(cursor) });
    } else {
      // Scale the gap proportionally
      const scaledGap = Math.max(1, Math.round(BASE_GAPS[i] * (availableForGaps - 2) / innerGapsTotal));
      cursor = addBusinessDays(cursor, scaledGap);
      dates.push({ label: TEMPLATE_LABELS[i], date: ymd(cursor) });
    }
  }
  return dates;
}

// ── Style constants ──────────────────────────────────────────────────────────

const resetBtnCls =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ' +
  'bg-white/[0.06] border border-[#2a2a2a] text-[#999] ' +
  'hover:text-white hover:bg-white/[0.10] transition-colors disabled:opacity-30';

// ── Component ────────────────────────────────────────────────────────────────

export function TimelineTab({ proposalId, proposal, initialMilestones }: TimelineTabProps) {
  const [milestones, setMilestones] = useState<ProposalMilestoneRow[]>(initialMilestones);
  const [scheduleStart, setScheduleStart] = useState(proposal.schedule_start_date ?? '');
  const [scheduleEnd, setScheduleEnd] = useState(proposal.schedule_end_date ?? '');
  const [dragState, setDragState] = useState<DragState>(null);
  const [deniedIdx, setDeniedIdx] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);
  const [extraMonths, setExtraMonths] = useState(0);
  const [goLiveShake, setGoLiveShake] = useState(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Schedule date handlers ───────────────────────────────────────────────

  function handleScheduleStartChange(value: string) {
    setScheduleStart(value);
    void updateProposal(proposalId, { schedule_start_date: value || null });
  }

  function handleScheduleEndChange(value: string) {
    // Reject Go Live before Kickoff
    if (value && scheduleStart && value < scheduleStart) {
      setGoLiveShake(true);
      setTimeout(() => setGoLiveShake(false), 420);
      return;
    }
    setScheduleEnd(value);
    void updateProposal(proposalId, { schedule_end_date: value || null });
  }

  // ── Reset timeline handler ────────────────────────────────────────────────

  async function handleResetTimeline() {
    if (!scheduleStart) return; // need at least a kickoff date
    setResetting(true);
    try {
      const kickoff = parseLocal(scheduleStart);
      const goLive = scheduleEnd ? parseLocal(scheduleEnd) : null;

      const timeline = generateDefaultTimeline(kickoff, goLive);

      // Delete all existing milestones
      await deleteAllProposalMilestones(proposalId);

      // Batch create new ones with default descriptions
      const inputs = timeline.map((t, i) => ({
        proposal_id: proposalId,
        label: t.label,
        start_date: t.date,
        end_date: t.date, // single day
        sort_order: i,
        description: DEFAULT_DESCRIPTIONS[t.label] ?? null,
      }));

      const ids = await batchCreateProposalMilestones(inputs);

      // Update local state
      const newMilestones: ProposalMilestoneRow[] = inputs.map((inp, i) => ({
        id: ids[i],
        proposal_id: proposalId,
        label: inp.label,
        description: inp.description,
        start_date: inp.start_date,
        end_date: inp.end_date,
        sort_order: inp.sort_order,
        phase: null,
        created_at: new Date().toISOString(),
      }));
      setMilestones(newMilestones);
      setExtraMonths(0);
    } finally {
      setResetting(false);
    }
  }

  // ── Derive visible months ─────────────────────────────────────────────────

  const baseDate = (() => {
    if (milestones.length === 0) {
      if (scheduleStart) return parseLocal(scheduleStart);
      return new Date();
    }
    const earliest = milestones.reduce((best, m) =>
      m.start_date < best.start_date ? m : best, milestones[0]);
    return parseLocal(earliest.start_date);
  })();

  const visibleMonths: Date[] = (() => {
    const start = firstOfMonth(baseDate);
    if (milestones.length === 0) {
      return [start, addMonths(start, 1), addMonths(start, 2)];
    }
    const latest = milestones.reduce((best, m) => {
      const end = m.end_date || m.start_date;
      return end > (best.end_date || best.start_date) ? m : best;
    }, milestones[0]);
    const endMonth = firstOfMonth(parseLocal(latest.end_date || latest.start_date));
    const months: Date[] = [];
    let cursor = start;
    while (cursor <= endMonth) {
      months.push(cursor);
      cursor = addMonths(cursor, 1);
    }
    // Always show at least 2 months
    if (months.length < 2) months.push(addMonths(start, 1));
    // Append extra months added by the user
    for (let i = 0; i < extraMonths; i++) {
      const next = addMonths(months[months.length - 1], 1);
      months.push(next);
    }
    return months;
  })();

  // Which calendar months are "extra" (user-added) and have no milestones → removable
  const baseMonthCount = visibleMonths.length - extraMonths;
  const canRemoveMonthAt = (idx: number) => {
    if (idx < baseMonthCount) return false;
    const m = visibleMonths[idx];
    const mStr = ymd(m);
    const mEnd = ymd(new Date(m.getFullYear(), m.getMonth() + 1, 0));
    return !milestones.some(ms => ms.start_date <= mEnd && (ms.end_date || ms.start_date) >= mStr);
  };

  // ── Phase ranges for calendar outlines ────────────────────────────────────

  const phaseRanges = milestones
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

  // ── Drag-and-drop pointer handlers ────────────────────────────────────────

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const dateCell = el?.closest('[data-date]') as HTMLElement | null;
      const newDate = dateCell?.getAttribute('data-date') ?? dragState.currentDate;

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

    const handleUp = () => {
      const moved = dragState.currentDate && dragState.currentDate !== dragState.originDate;

      if (moved && dragState.isInvalid) {
        setDeniedIdx(dragState.milestoneIdx);
        setTimeout(() => setDeniedIdx(null), 420);
      } else if (moved) {
        const { dragType, milestoneIdx, currentDate } = dragState;
        // milestoneIdx refers to the sorted array — resolve to the milestone ID
        const draggedId = sorted[milestoneIdx]?.id;

        setMilestones(prev => prev.map((m) => {
          if (m.id !== draggedId) return m;

          let newStart = m.start_date;
          let newEnd = m.end_date;

          if (dragType === 'move') {
            const origStart  = parseLocal(m.start_date);
            const origEnd    = m.end_date ? parseLocal(m.end_date) : origStart;
            const durationMs = origEnd.getTime() - origStart.getTime();
            const ns         = parseLocal(currentDate!);
            const ne         = new Date(ns.getTime() + durationMs);
            newStart = currentDate!;
            newEnd   = m.end_date ? ymd(ne) : m.end_date;
          } else if (dragType === 'resize-start') {
            const end = m.end_date || m.start_date;
            if (currentDate! > end) return m;
            newStart = currentDate!;
          } else if (dragType === 'resize-end') {
            if (currentDate! < m.start_date) return m;
            newEnd = currentDate!;
          }

          // Persist to DB
          void updateProposalMilestone(m.id, { start_date: newStart, end_date: newEnd });

          // Sync schedule window dates when Kickoff or Go Live are dragged
          if (m.label === 'Kickoff') {
            setScheduleStart(newStart);
            void updateProposal(proposalId, { schedule_start_date: newStart });
          } else if (m.label === 'Go Live') {
            const finalEnd = newEnd ?? m.end_date;
            setScheduleEnd(finalEnd);
            void updateProposal(proposalId, { schedule_end_date: finalEnd });
          }

          return { ...m, start_date: newStart, end_date: newEnd ?? m.end_date };
        }));
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

  // ── Sorted milestones ─────────────────────────────────────────────────────

  const sorted = sortMilestones(milestones);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* Schedule window header */}
      <div className="px-8 h-[51px] border-b border-[#2a2a2a] flex items-center gap-6">
        <p className="text-xs font-mono text-[#404040] uppercase tracking-widest flex-shrink-0">
          Schedule window
        </p>
        <div className="flex items-center gap-3">
          <label className="text-xs text-[#666] flex-shrink-0">Kickoff</label>
          <input
            type="date"
            value={scheduleStart}
            onChange={(e) => handleScheduleStartChange(e.target.value)}
            className={dateInputCls}
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-[#666] flex-shrink-0">Go Live</label>
          <div className={`relative${goLiveShake ? ' animate-shake' : ''}`}>
            <input
              type="date"
              value={scheduleEnd}
              onChange={(e) => handleScheduleEndChange(e.target.value)}
              className={dateInputCls + (scheduleEnd ? ' pr-6' : '')}
            />
            {scheduleEnd && (
              <button
                onClick={() => handleScheduleEndChange('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-[#404040] hover:text-[#999] transition-colors"
                title="Clear Go Live date"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1" />
        <button
          onClick={handleResetTimeline}
          disabled={!scheduleStart || resetting}
          className={resetBtnCls}
        >
          {resetting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {resetting ? 'Generating…' : 'Generate Timeline'}
        </button>
      </div>

      {/* Two-panel body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left panel: mini calendars */}
        <div className="w-72 flex-shrink-0 overflow-y-auto admin-scrollbar p-6 flex flex-col gap-3">
          {visibleMonths.map((m, i) => (
            <div
              key={i}
              className="relative group border border-[#2a2a2a] rounded-xl p-1 bg-white/[0.05]"
            >
              {canRemoveMonthAt(i) && (
                <button
                  onClick={() => setExtraMonths(n => n - 1)}
                  className="absolute top-1.5 right-1.5 z-10 w-5 h-5 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 text-[#4d4d4d] hover:text-white hover:bg-white/10 transition-all"
                  title="Remove month"
                >
                  <X size={12} />
                </button>
              )}
              <MiniCalendar
                month={m}
                milestones={sorted}
                phaseForDay={phaseForDay}
                dragState={dragState}
                setDragState={setDragState}
                deniedIdx={deniedIdx}
                goLiveDate={scheduleEnd}
              />
            </div>
          ))}
          <div className="flex items-center justify-center py-2">
            <button
              onClick={() => setExtraMonths(n => n + 1)}
              className="flex items-center gap-1.5 text-xs text-[#4d4d4d] hover:text-[#999] transition-colors"
            >
              <Plus size={13} />
              Add month
            </button>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-px bg-white/[0.06] self-stretch flex-shrink-0" />

        {/* Right panel: phase-grouped milestone display */}
        <div className="flex-1 overflow-y-auto admin-scrollbar p-6">
          {sorted.length === 0 ? (
            <p className="text-xs text-[#404040] text-center mt-8">
              No milestones yet. Select a Kickoff month and click Generate Timeline.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {groupByPhase(sorted).map(({ phase, milestones: groupMils }, gi) => (
                <div key={gi} className="flex gap-3 mb-2">
                  {/* Phase column */}
                  {phase && (
                    <div className="flex-shrink-0 flex flex-col items-center w-8 select-none pt-1">
                      <PhaseIcon phase={phase} />
                      {phase !== 'production' && (
                        <span
                          className="text-[9px] font-mono text-[#404040] uppercase my-1"
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
                      const idx = sorted.indexOf(m);
                      const color = getRainbowColor(idx, sorted.length);
                      const hasSpan = m.end_date && m.end_date !== m.start_date;
                      const isRowDenied = deniedIdx === idx;
                      // Red if milestone starts after Go Live
                      const isPastGoLive = !!scheduleEnd && m.label !== 'Go Live' && m.start_date > scheduleEnd;
                      // Red if milestone is out of chronological order (date before a preceding milestone)
                      const isOutOfOrder = idx > 0 && sorted.slice(0, idx).some(prev => (prev.end_date || prev.start_date) > m.start_date);
                      // Red if Go Live itself has conflicts
                      const isGoLiveConflict = m.label === 'Go Live' && !!scheduleEnd && sorted.some(s => s.label !== 'Go Live' && (s.start_date > scheduleEnd || (s.end_date || s.start_date) > scheduleEnd));
                      const isRedRow = isPastGoLive || isOutOfOrder || isGoLiveConflict;
                      return (
                        <div
                          key={m.id}
                          className={[
                            'flex gap-4 items-start relative overflow-hidden rounded-lg',
                            isRowDenied ? 'animate-shake' : '',
                            isRedRow ? 'ring-1 ring-red-500/40' : '',
                          ].join(' ')}
                        >
                          {isRedRow && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(220,38,38,0.08) 4px, rgba(220,38,38,0.08) 8px)',
                              }}
                            />
                          )}
                          <div
                            className="flex-shrink-0 w-1 self-stretch rounded-full"
                            style={{ backgroundColor: isRedRow ? 'rgb(220,38,38)' : color, minHeight: 40, opacity: 0.7 }}
                          />
                          <div className="flex-1 py-1">
                            <div className="flex items-baseline gap-3 mb-1">
                              <p className={`font-semibold text-lg ${isRedRow ? 'text-red-400' : 'text-white'}`}>{displayLabel(m)}</p>
                              <p className="font-mono text-sm tracking-wider flex-shrink-0" style={{ color: isRedRow ? 'rgb(248,113,113)' : color }}>
                                {formatDate(m.start_date)}
                                {hasSpan && <> → {formatDate(m.end_date!)}</>}
                              </p>
                            </div>
                            {m.description && (
                              <p className={`text-sm leading-relaxed ${isRedRow ? 'text-red-400/50' : 'text-[#808080]'}`}>{m.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Floating drag preview — portal to body to escape panel transform */}
      {dragState && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
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
        </div>,
        document.body,
      )}
    </div>
  );
}
