'use client';

import { useState } from 'react';
import { MiniCalendar } from '@/components/proposal/MiniCalendar';
import { MilestoneList } from '../shared/MilestoneList';
import { updateProposal } from '@/app/admin/actions';
import { parseLocal, firstOfMonth, addMonths } from '@/lib/proposal/milestoneColors';
import type { ProposalMilestoneRow, ProposalRow } from '@/types/proposal';

// ── Props ────────────────────────────────────────────────────────────────────

interface TimelineTabProps {
  proposalId: string;
  proposal: ProposalRow;
  initialMilestones: ProposalMilestoneRow[];
}

// ── Style constants ──────────────────────────────────────────────────────────

const dateInputCls =
  'text-xs bg-white/[0.04] border border-white/10 rounded px-3 py-1.5 text-white/70 ' +
  'focus:outline-none focus:border-white/20 focus:text-white/90 transition-colors ' +
  '[color-scheme:dark]';

// ── Component ────────────────────────────────────────────────────────────────

export function TimelineTab({ proposalId, proposal, initialMilestones }: TimelineTabProps) {
  const [milestones, setMilestones] = useState<ProposalMilestoneRow[]>(initialMilestones);
  const [scheduleStart, setScheduleStart] = useState(proposal.schedule_start_date ?? '');
  const [scheduleEnd, setScheduleEnd] = useState(proposal.schedule_end_date ?? '');

  // ── Schedule date handlers ─────────────────────────────────────────────────

  function handleScheduleStartChange(value: string) {
    setScheduleStart(value);
    void updateProposal(proposalId, { schedule_start_date: value || null });
  }

  function handleScheduleEndChange(value: string) {
    setScheduleEnd(value);
    void updateProposal(proposalId, { schedule_end_date: value || null });
  }

  // ── Derive visible months (3 months from earliest milestone or today) ──────

  const baseDate = (() => {
    if (milestones.length === 0) return new Date();
    const earliest = milestones.reduce((best, m) => {
      return m.start_date < best.start_date ? m : best;
    }, milestones[0]);
    return parseLocal(earliest.start_date);
  })();

  const visibleMonths: Date[] = [
    firstOfMonth(baseDate),
    addMonths(baseDate, 1),
    addMonths(baseDate, 2),
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* Schedule window header */}
      <div className="px-8 py-4 border-b border-white/[0.06] flex items-center gap-6">
        <p className="text-xs font-mono text-white/25 uppercase tracking-widest flex-shrink-0">
          Schedule window
        </p>
        <div className="flex items-center gap-3">
          <label className="text-xs text-white/40 flex-shrink-0">Start</label>
          <input
            type="date"
            value={scheduleStart}
            onChange={(e) => handleScheduleStartChange(e.target.value)}
            className={dateInputCls}
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-white/40 flex-shrink-0">End</label>
          <input
            type="date"
            value={scheduleEnd}
            onChange={(e) => handleScheduleEndChange(e.target.value)}
            className={dateInputCls}
          />
        </div>
      </div>

      {/* Two-panel body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left panel: mini calendars */}
        <div className="w-72 flex-shrink-0 overflow-y-auto p-6 flex flex-col gap-3">
          {visibleMonths.map((m, i) => (
            <div
              key={i}
              className="border border-white/[0.08] rounded-xl p-1 bg-white/[0.05]"
            >
              <MiniCalendar
                month={m}
                milestones={milestones}
              />
            </div>
          ))}
        </div>

        {/* Vertical divider */}
        <div className="w-px bg-white/[0.06] self-stretch flex-shrink-0" />

        {/* Right panel: milestone list */}
        <div className="flex-1 overflow-y-auto p-6">
          <MilestoneList
            proposalId={proposalId}
            milestones={milestones}
            onChange={setMilestones}
          />
        </div>

      </div>
    </div>
  );
}
