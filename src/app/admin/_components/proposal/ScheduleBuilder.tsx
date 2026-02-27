'use client';

import { useState } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import type { ProposalRow, ProposalMilestoneRow } from '@/types/proposal';

const PRESET_MILESTONES = [
  'Pre-Production',
  'Script Due',
  'Casting',
  'Location Scout',
  'Production Days',
  'Post-Production',
  'Rough Cut',
  'Final Delivery',
  'Launch',
];

interface Props {
  proposal: ProposalRow;
  milestones: ProposalMilestoneRow[];
  onAdd: (milestone: Omit<ProposalMilestoneRow, 'id' | 'created_at'>) => void;
  onUpdate: (id: string, data: Partial<ProposalMilestoneRow>) => void;
  onDelete: (id: string) => void;
}

function defaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function ScheduleBuilder({ proposal, milestones, onAdd, onUpdate, onDelete }: Props) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newStart, setNewStart] = useState(defaultStartDate());
  const [newEnd, setNewEnd] = useState(addDays(defaultStartDate(), 7));

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    onAdd({
      proposal_id: proposal.id,
      label: newLabel.trim(),
      description: null,
      start_date: newStart,
      end_date: newEnd,
      sort_order: milestones.length,
      phase: null,
    });
    setNewLabel('');
    setNewStart(newEnd);
    setNewEnd(addDays(newEnd, 7));
    setAdding(false);
  };

  const handlePresetClick = (label: string) => {
    const lastEnd = milestones.length > 0
      ? milestones[milestones.length - 1].end_date
      : defaultStartDate();
    const start = addDays(lastEnd, 1);
    const end = addDays(start, 7);
    onAdd({
      proposal_id: proposal.id,
      label,
      description: null,
      start_date: start,
      end_date: end,
      sort_order: milestones.length,
      phase: null,
    });
  };

  return (
    <div className="py-4 px-6 lg:px-16">
      <div className="max-w-4xl mx-auto">
        {/* Existing milestones */}
        {milestones.length > 0 && (
          <div className="space-y-2 mb-4">
            {milestones.map((ms) => (
              <div
                key={ms.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-border group"
              >
                <Calendar size={12} className="text-[#333] flex-shrink-0" />
                <input
                  type="text"
                  value={ms.label}
                  onChange={(e) => onUpdate(ms.id, { label: e.target.value })}
                  className="flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none"
                />
                <input
                  type="date"
                  value={ms.start_date}
                  onChange={(e) => onUpdate(ms.id, { start_date: e.target.value })}
                  className="bg-transparent text-xs text-[#666] outline-none [color-scheme:dark]"
                />
                <span className="text-[#333] text-xs">to</span>
                <input
                  type="date"
                  value={ms.end_date}
                  onChange={(e) => onUpdate(ms.id, { end_date: e.target.value })}
                  className="bg-transparent text-xs text-[#666] outline-none [color-scheme:dark]"
                />
                <button
                  onClick={() => onDelete(ms.id)}
                  className="p-1 text-red-400/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {adding ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-white/[0.02]">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Milestone name"
              autoFocus
              className="flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-white/15"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            />
            <input
              type="date"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="bg-transparent text-xs text-[#666] outline-none [color-scheme:dark]"
            />
            <span className="text-[#333] text-xs">to</span>
            <input
              type="date"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="bg-transparent text-xs text-[#666] outline-none [color-scheme:dark]"
            />
            <button onClick={handleAdd} className="px-2 py-1 text-xs bg-white/10 hover:bg-white/15 rounded font-medium transition-colors">
              Add
            </button>
            <button onClick={() => setAdding(false)} className="px-2 py-1 text-xs text-[#4d4d4d] hover:text-[#808080] transition-colors">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#333] hover:text-[#808080] border border-dashed border-border hover:border-white/20 transition-colors"
          >
            <Plus size={12} />
            Add Milestone
          </button>
        )}

        {/* Preset chips */}
        <div className="mt-3">
          <p className="text-[10px] text-white/15 mb-2">Quick add:</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_MILESTONES.filter((p) => !milestones.some((m) => m.label === p)).map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className="px-2 py-0.5 rounded text-[10px] text-[#404040] hover:text-[#808080] bg-white/[0.02] hover:bg-white/[0.05] border border-[#2a2a2a] transition-colors"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
