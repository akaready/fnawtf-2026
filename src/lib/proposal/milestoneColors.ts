// Shared milestone color utility — used by both admin Timeline tab and customer-facing ScheduleSlide.
// Both must use the same function on the same ordered array for colors to sync.

export function getRainbowColor(index: number, total: number): string {
  if (total <= 1) return 'hsl(0, 85%, 65%)';
  const hue = Math.round((index / (total - 1)) * 280);
  return `hsl(${hue}, 85%, 65%)`;
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
