import type { BulletinNote } from './types';

export function CallSheetBulletin({ bulletins }: { bulletins: BulletinNote[] }) {
  return (
    <div className="space-y-3">
      {bulletins.map((b) => (
        <div
          key={b.id}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-5 py-4 flex gap-4 items-start"
        >
          {/* Pin icon */}
          <div className="shrink-0 mt-0.5 w-9 h-9 rounded-full bg-[var(--muted)] flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-[var(--accent)]"
              fill="currentColor"
            >
              <path d="M16 2l-4 4-6 2-2 2 5 5-5 7 7-5 5 5 2-2 2-6 4-4-8-8z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--foreground)] leading-relaxed flex-1">
            {b.text}
          </p>
        </div>
      ))}
    </div>
  );
}
