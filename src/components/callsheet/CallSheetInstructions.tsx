import type { SpecialInstruction } from './types';

export function CallSheetInstructions({
  instructions,
}: {
  instructions: SpecialInstruction[];
}) {
  return (
    <section>
      <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--muted-foreground)] mb-4 pb-2 border-b border-[var(--accent)] inline-block">
        Special Instructions
      </h2>

      {/* Desktop: table */}
      <div className="hidden md:block rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--muted)] text-[var(--muted-foreground)] text-[10px] uppercase tracking-[0.15em]">
              <th className="px-4 py-3 text-left font-semibold w-48">Department</th>
              <th className="px-4 py-3 text-left font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {instructions.map((inst, i) => (
              <tr key={i} className="bg-[var(--surface-elevated)]">
                <td className="px-4 py-3 font-[family-name:var(--font-display)] font-semibold text-xs uppercase tracking-wider align-top">
                  {inst.category}
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)] leading-relaxed">
                  {inst.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden space-y-3">
        {instructions.map((inst, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
          >
            <p className="font-[family-name:var(--font-display)] font-semibold text-xs uppercase tracking-wider mb-2">
              {inst.category}
            </p>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              {inst.notes}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
