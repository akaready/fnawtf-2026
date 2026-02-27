// Shared milestone color utility — used by both admin Timeline tab and customer-facing ScheduleSlide.
// Both must use the same function on the same ordered array for colors to sync.

import type { ProposalMilestoneRow } from '@/types/proposal';

export function getRainbowColor(index: number, total: number): string {
  if (total <= 1) return 'hsl(0, 85%, 65%)';
  const hue = Math.round((index / (total - 1)) * 280);
  return `hsl(${hue}, 85%, 65%)`;
}

// ── Phase grouping ─────────────────────────────────────────────────────────

export type PhaseGroup = { phase: string | null; milestones: ProposalMilestoneRow[] };

export function groupByPhase(milestones: ProposalMilestoneRow[]): PhaseGroup[] {
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

// ── Canonical sort — Final Delivery always second-to-last, Go Live always last

export function sortMilestones(milestones: ProposalMilestoneRow[]): ProposalMilestoneRow[] {
  return [...milestones].sort((a, b) => {
    const rank = (m: ProposalMilestoneRow) =>
      m.label === 'Go Live' ? 2 : m.label === 'Final Delivery' ? 1 : 0;
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    return a.start_date.localeCompare(b.start_date);
  });
}

// ── Business-day helpers ───────────────────────────────────────────────────

/** Add N business days (Mon–Fri) to a date */
export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

/** Count business days between two dates (exclusive of start, inclusive of end) */
export function countBusinessDays(from: Date, to: Date): number {
  let count = 0;
  const d = new Date(from);
  while (d < to) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

/** Find the next Tuesday on or after a date */
export function nextTuesday(from: Date): Date {
  const result = new Date(from);
  while (result.getDay() !== 2) { // 2 = Tuesday
    result.setDate(result.getDate() + 1);
  }
  return result;
}

// ── Shared date helpers ────────────────────────────────────────────────────

export function parseLocal(d: string) { return new Date(d + 'T00:00:00'); }
export function ymd(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function firstOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
export function daysInMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }
export function dayOfWeek(d: Date) { return (d.getDay() + 6) % 7; } // 0 = Mon
export function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
export function formatMonthYear(d: Date) { return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
export function formatDate(d: string) {
  const dt = parseLocal(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
