'use client';

import type { ProposalViewRow } from '@/app/admin/actions';

interface Props {
  views: ProposalViewRow[];
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatViewedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function ViewsTab({ views }: Props) {
  if (views.length === 0) {
    return (
      <div className="px-8 py-12 text-center text-admin-text-faint text-sm">
        No views yet.
      </div>
    );
  }

  return (
    <div className="px-8 py-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-admin-text-faint text-xs uppercase tracking-wider">
            <th className="pb-3 font-medium">Email</th>
            <th className="pb-3 font-medium">Viewed (LA)</th>
            <th className="pb-3 font-medium text-right">Duration</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border-subtle">
          {views.map((v) => (
            <tr key={v.id} className="text-admin-text-secondary">
              <td className="py-2.5 pr-4 font-mono text-xs">{v.viewer_email ?? '—'}</td>
              <td className="py-2.5 pr-4">{formatViewedAt(v.viewed_at)}</td>
              <td className="py-2.5 text-right tabular-nums">{formatDuration(v.duration_seconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
