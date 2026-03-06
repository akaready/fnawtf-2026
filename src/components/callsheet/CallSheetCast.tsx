import type { CastMember } from './types';

/* ── Status label map ──────────────────────────────────────── */
const STATUS_LABELS: Record<CastMember['status'], string> = {
  W: 'W',
  SW: 'SW',
  SWF: 'SWF',
  H: 'Hold',
  D: 'Drop',
};

/* ── Section label ─────────────────────────────────────────── */
function SectionLabel({ children, count }: { children: React.ReactNode; count: number }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--muted-foreground)] pb-2 border-b border-[var(--accent)] inline-block">
        {children}
      </h2>
      <span className="text-xs text-[var(--muted-foreground)]">
        {count} Total Cast
      </span>
    </div>
  );
}

/* ── Desktop table ─────────────────────────────────────────── */
function CastTable({ cast }: { cast: CastMember[] }) {
  return (
    <div className="hidden md:block rounded-xl border border-[var(--border)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--muted)] text-[var(--muted-foreground)] text-[10px] uppercase tracking-[0.15em]">
            <th className="px-4 py-3 text-left font-semibold w-12">ID</th>
            <th className="px-4 py-3 text-left font-semibold">Name</th>
            <th className="px-4 py-3 text-left font-semibold">Role</th>
            <th className="px-4 py-3 text-center font-semibold w-16">Status</th>
            <th className="px-4 py-3 text-right font-semibold">Pickup</th>
            <th className="px-4 py-3 text-right font-semibold">Call</th>
            <th className="px-4 py-3 text-right font-semibold">H/MU</th>
            <th className="px-4 py-3 text-right font-semibold">On Set</th>
            <th className="px-4 py-3 text-right font-semibold">Wrap</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {cast.map((c) => (
            <tr key={c.id} className="bg-[var(--surface-elevated)] hover:bg-[var(--muted)] transition-colors">
              <td className="px-4 py-3 text-[var(--muted-foreground)]">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-[var(--border)] text-xs font-medium">
                  {c.id}
                </span>
              </td>
              <td className="px-4 py-3 font-medium">{c.name}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">&ldquo;{c.role}&rdquo;</td>
              <td className="px-4 py-3 text-center">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  {STATUS_LABELS[c.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-xs">
                {c.pickup || '—'}
              </td>
              <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-xs">
                {c.callTime}
              </td>
              <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-xs">
                {c.hmua || '—'}
              </td>
              <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-xs">
                {c.onSet || '—'}
              </td>
              <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-xs">
                {c.wrap || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Mobile cards ──────────────────────────────────────────── */
function CastCards({ cast }: { cast: CastMember[] }) {
  return (
    <div className="md:hidden space-y-3">
      {cast.map((c) => (
        <div
          key={c.id}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-[family-name:var(--font-display)] font-semibold">
                {c.name}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                &ldquo;{c.role}&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted-foreground)] font-medium">
                {STATUS_LABELS[c.status]}
              </span>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-[var(--border)] text-xs font-medium text-[var(--muted-foreground)]">
                #{c.id}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-y-2 gap-x-4 text-xs">
            {[
              { label: 'Pickup', time: c.pickup },
              { label: 'Call', time: c.callTime },
              { label: 'H/MU', time: c.hmua },
              { label: 'On Set', time: c.onSet },
              { label: 'Wrap', time: c.wrap },
            ]
              .filter((t) => t.time)
              .map((t) => (
                <div key={t.label}>
                  <p className="text-[var(--muted-foreground)] text-[10px] uppercase tracking-wider">
                    {t.label}
                  </p>
                  <p className="font-[family-name:var(--font-mono)] font-medium mt-0.5">
                    {t.time}
                  </p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Cast section ──────────────────────────────────────────── */
export function CallSheetCast({ cast }: { cast: CastMember[] }) {
  return (
    <section>
      <SectionLabel count={cast.length}>Cast</SectionLabel>
      <CastTable cast={cast} />
      <CastCards cast={cast} />
    </section>
  );
}
