'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import { Trash2, Plus } from 'lucide-react';
import {
  addProposalMilestone,
  updateProposalMilestone,
  deleteProposalMilestone,
} from '@/app/admin/actions';
import { getRainbowColor, parseLocal, ymd } from '@/lib/proposal/milestoneColors';
import type { ProposalMilestoneRow } from '@/types/proposal';

// ── Constants ────────────────────────────────────────────────────────────────

const PRESET_LABELS = [
  'Script Due',
  'Casting',
  'Location Scout',
  'Production Days',
  'Final Delivery',
  'Launch',
];

const PHASE_OPTIONS = [
  { value: 'none', label: 'No phase' },
  { value: 'pre-production', label: 'Pre-Production' },
  { value: 'production', label: 'Production' },
  { value: 'post-production', label: 'Post-Production' },
];

// ── Style constants ──────────────────────────────────────────────────────────

const inputCls =
  'bg-transparent text-sm text-white focus:outline-none min-w-0';

const dateInputCls =
  'text-xs bg-black/40 border border-[#2a2a2a] rounded px-2 py-1 text-white/60 ' +
  'focus:outline-none focus:border-white/20 focus:text-white/80 transition-colors ' +
  '[color-scheme:dark]';

const selectCls =
  'text-xs bg-black/40 border border-[#2a2a2a] rounded px-2 py-1 text-white/50 ' +
  'focus:outline-none focus:border-white/20 cursor-pointer [color-scheme:dark]';

// ── Props ────────────────────────────────────────────────────────────────────

interface MilestoneListProps {
  proposalId: string;
  milestones: ProposalMilestoneRow[];
  onChange: (milestones: ProposalMilestoneRow[]) => void;
}

// ── Helper: default dates for a new milestone ────────────────────────────────

function defaultDatesForNew(milestones: ProposalMilestoneRow[]): {
  start_date: string;
  end_date: string;
} {
  if (milestones.length === 0) {
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 7);
    return { start_date: ymd(today), end_date: ymd(end) };
  }
  // Find the milestone with the latest end_date
  const latest = milestones.reduce((best, m) => {
    const bestDate = best.end_date || best.start_date;
    const mDate = m.end_date || m.start_date;
    return mDate > bestDate ? m : best;
  }, milestones[0]);
  const startBase = parseLocal(latest.end_date || latest.start_date);
  const start = new Date(startBase);
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start_date: ymd(start), end_date: ymd(end) };
}

// ── Debounce hook ────────────────────────────────────────────────────────────

function useDebounced<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, delay],
  ) as T;
}

// ── Main component ───────────────────────────────────────────────────────────

export function MilestoneList({ proposalId, milestones, onChange }: MilestoneListProps) {
  const [isPending, startTransition] = useTransition();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // ── Sorted milestone list ──────────────────────────────────────────────────

  const sorted = [...milestones].sort((a, b) => a.sort_order - b.sort_order);
  const total = sorted.length;

  // ── Preset checklist ───────────────────────────────────────────────────────

  const checkedLabels = new Set(milestones.map((m) => m.label));

  function handlePresetClick(label: string) {
    if (checkedLabels.has(label)) return; // already added — delete from list below
    const { start_date, end_date } = defaultDatesForNew(milestones);
    startTransition(async () => {
      const id = await addProposalMilestone({
        proposal_id: proposalId,
        label,
        start_date,
        end_date,
        sort_order: milestones.length,
      });
      const newMilestone: ProposalMilestoneRow = {
        id,
        proposal_id: proposalId,
        label,
        description: null,
        start_date,
        end_date,
        sort_order: milestones.length,
        phase: null,
        created_at: new Date().toISOString(),
      };
      const next = [...milestones, newMilestone];
      onChange(next);
    });
  }

  // ── Field updates (debounced) ──────────────────────────────────────────────

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const persistLabel = useCallback(
    (id: string, label: string) => {
      startTransition(async () => {
        await updateProposalMilestone(id, { label });
      });
    },
    [],
  );
  const debouncedPersistLabel = useDebounced(persistLabel, 800);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const persistDates = useCallback(
    (id: string, updates: { start_date?: string; end_date?: string }) => {
      startTransition(async () => {
        await updateProposalMilestone(id, updates);
      });
    },
    [],
  );
  const debouncedPersistDates = useDebounced(persistDates, 800);

  function handleLabelChange(id: string, value: string) {
    const next = milestones.map((m) =>
      m.id === id ? { ...m, label: value } : m,
    );
    onChange(next);
    debouncedPersistLabel(id, value);
  }

  function handleStartDateChange(id: string, value: string) {
    const next = milestones.map((m) =>
      m.id === id ? { ...m, start_date: value } : m,
    );
    onChange(next);
    debouncedPersistDates(id, { start_date: value });
  }

  function handleEndDateChange(id: string, value: string) {
    const next = milestones.map((m) =>
      m.id === id ? { ...m, end_date: value } : m,
    );
    onChange(next);
    debouncedPersistDates(id, { end_date: value });
  }

  function handlePhaseChange(id: string, value: string) {
    const phase = value === 'none' ? null : value;
    const next = milestones.map((m) =>
      m.id === id ? { ...m, phase } : m,
    );
    onChange(next);
    startTransition(async () => {
      // updateProposalMilestone accepts a generic update — cast via unknown
      await (updateProposalMilestone as (
        id: string,
        updates: Record<string, unknown>,
      ) => Promise<void>)(id, { phase });
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  function handleDelete(id: string) {
    const next = milestones.filter((m) => m.id !== id);
    onChange(next);
    startTransition(async () => {
      await deleteProposalMilestone(id);
    });
  }

  // ── Add custom ─────────────────────────────────────────────────────────────

  function openCustomForm() {
    const { start_date, end_date } = defaultDatesForNew(milestones);
    setCustomLabel('');
    setCustomStart(start_date);
    setCustomEnd(end_date);
    setShowCustomForm(true);
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customLabel.trim()) return;
    const label = customLabel.trim();
    const start_date = customStart || ymd(new Date());
    const end_date = customEnd || start_date;
    setShowCustomForm(false);
    startTransition(async () => {
      const id = await addProposalMilestone({
        proposal_id: proposalId,
        label,
        start_date,
        end_date,
        sort_order: milestones.length,
      });
      const newMilestone: ProposalMilestoneRow = {
        id,
        proposal_id: proposalId,
        label,
        description: null,
        start_date,
        end_date,
        sort_order: milestones.length,
        phase: null,
        created_at: new Date().toISOString(),
      };
      onChange([...milestones, newMilestone]);
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Preset checklist */}
      <div>
        <p className="text-xs font-mono text-white/25 uppercase tracking-widest mb-3">
          Presets
        </p>
        <div className="space-y-1">
          {PRESET_LABELS.map((label) => {
            const checked = checkedLabels.has(label);
            return (
              <label
                key={label}
                className={[
                  'flex items-center gap-3 py-1 cursor-pointer group select-none',
                  checked ? 'opacity-40 cursor-default' : 'hover:opacity-80',
                ].join(' ')}
                onClick={() => handlePresetClick(label)}
              >
                <input
                  type="checkbox"
                  readOnly
                  checked={checked}
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-white pointer-events-none"
                />
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Milestone list */}
      {sorted.length > 0 && (
        <div>
          <p className="text-xs font-mono text-white/25 uppercase tracking-widest mb-3">
            Milestones
          </p>
          <div>
            {sorted.map((m, index) => {
              const color = getRainbowColor(index, total);
              const phaseValue = m.phase ?? 'none';
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 py-2 border-b border-[#2a2a2a]"
                >
                  {/* Color swatch */}
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />

                  {/* Label */}
                  <input
                    type="text"
                    value={m.label}
                    onChange={(e) => handleLabelChange(m.id, e.target.value)}
                    className={inputCls + ' flex-1'}
                    placeholder="Milestone label"
                  />

                  {/* Date range */}
                  <input
                    type="date"
                    value={m.start_date}
                    onChange={(e) => handleStartDateChange(m.id, e.target.value)}
                    className={dateInputCls}
                  />
                  <span className="text-white/20 text-xs flex-shrink-0">–</span>
                  <input
                    type="date"
                    value={m.end_date}
                    onChange={(e) => handleEndDateChange(m.id, e.target.value)}
                    className={dateInputCls}
                  />

                  {/* Phase selector */}
                  <select
                    value={phaseValue}
                    onChange={(e) => handlePhaseChange(m.id, e.target.value)}
                    className={selectCls}
                  >
                    {PHASE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={isPending}
                    className="flex-shrink-0 p-1 text-white/20 hover:text-red-400 transition-colors disabled:opacity-30"
                    title="Delete milestone"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom form */}
      {showCustomForm ? (
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-3 py-2">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-white/20" />
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Milestone name"
            autoFocus
            className={inputCls + ' flex-1'}
          />
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className={dateInputCls}
          />
          <span className="text-white/20 text-xs flex-shrink-0">–</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className={dateInputCls}
          />
          <button
            type="submit"
            disabled={!customLabel.trim() || isPending}
            className="text-xs px-3 py-1 bg-white/[0.08] border border-white/10 rounded text-white/70 hover:text-white hover:bg-white/[0.12] transition-colors disabled:opacity-30"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowCustomForm(false)}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={openCustomForm}
          className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          <Plus size={13} />
          Add custom
        </button>
      )}
    </div>
  );
}
