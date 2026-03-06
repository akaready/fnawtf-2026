import type { CrewMember } from './types';

/* ── Section label ─────────────────────────────────────────── */
function SectionLabel({ children, count }: { children: React.ReactNode; count: number }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--muted-foreground)] pb-2 border-b border-[var(--accent)] inline-block">
        {children}
      </h2>
      <span className="text-xs text-[var(--muted-foreground)]">
        {count} Crew
      </span>
    </div>
  );
}

/* ── Desktop rows ──────────────────────────────────────────── */
function CrewTable({ crew }: { crew: CrewMember[] }) {
  return (
    <div className="hidden md:block rounded-xl border border-[var(--border)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--muted)] text-[var(--muted-foreground)] text-[10px] uppercase tracking-[0.15em]">
            <th className="px-4 py-3 text-left font-semibold">Name</th>
            <th className="px-4 py-3 text-left font-semibold">Title</th>
            <th className="px-4 py-3 text-left font-semibold">Phone</th>
            <th className="px-4 py-3 text-left font-semibold">Email</th>
            <th className="px-4 py-3 text-right font-semibold">Call</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {crew.map((c, i) => (
            <tr key={i} className="bg-[var(--surface-elevated)] hover:bg-[var(--muted)] transition-colors">
              <td className="px-4 py-3 font-medium whitespace-nowrap">{c.name}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{c.title}</td>
              <td className="px-4 py-3">
                {c.phone ? (
                  <a
                    href={`tel:${c.phone}`}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors font-[family-name:var(--font-mono)] text-xs"
                  >
                    {c.phone}
                  </a>
                ) : (
                  <span className="text-[var(--muted-foreground)] opacity-30">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                {c.email ? (
                  <a
                    href={`mailto:${c.email}`}
                    className="text-[var(--accent)] hover:underline text-xs"
                  >
                    {c.email}
                  </a>
                ) : (
                  <span className="text-[var(--muted-foreground)] opacity-30">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-xs font-medium">
                {c.callTime}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Mobile cards ──────────────────────────────────────────── */
function CrewCards({ crew }: { crew: CrewMember[] }) {
  return (
    <div className="md:hidden space-y-3">
      {crew.map((c, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-[family-name:var(--font-display)] font-semibold">
                {c.name}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">{c.title}</p>
            </div>
            <span className="font-[family-name:var(--font-mono)] text-sm font-medium shrink-0">
              {c.callTime}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {c.phone && (
              <a
                href={`tel:${c.phone}`}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                {c.phone}
              </a>
            )}
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className="text-[var(--accent)] hover:underline"
              >
                {c.email}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Crew section ──────────────────────────────────────────── */
export function CallSheetCrew({ crew }: { crew: CrewMember[] }) {
  return (
    <section>
      <SectionLabel count={crew.length}>Crew</SectionLabel>
      <CrewTable crew={crew} />
      <CrewCards crew={crew} />
    </section>
  );
}
