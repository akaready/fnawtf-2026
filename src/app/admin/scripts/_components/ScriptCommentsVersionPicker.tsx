'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import type { ScriptShareRow } from '@/types/scripts';

interface Props {
  shares: ScriptShareRow[];
  selectedShareId: string | null;
  currentMajorVersion: number;
  onSelect: (shareId: string) => void;
}

export function ScriptCommentsVersionPicker({
  shares,
  selectedShareId,
  currentMajorVersion,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);

  // Only render if there are multiple shares to choose from
  if (shares.length <= 1) return null;

  const selectedShare = shares.find(s => s.id === selectedShareId) ?? null;
  const isHistorical = selectedShare?.snapshot_major_version != null
    && selectedShare.snapshot_major_version !== currentMajorVersion;

  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className={`opacity-40 group-hover/colhdr:opacity-100 transition-opacity p-1 rounded hover:bg-admin-bg-hover ${
          isHistorical ? 'text-admin-cream opacity-100' : ''
        }`}
        title="Switch version"
      >
        <History size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-30 bg-admin-bg-overlay border border-admin-border rounded-admin-md shadow-xl py-1 min-w-[80px]">
            {shares.map(s => (
              <button
                key={s.id}
                onClick={(e) => { e.stopPropagation(); onSelect(s.id); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-admin-sm transition-colors hover:bg-admin-bg-hover ${
                  s.id === selectedShareId
                    ? 'text-admin-text-primary font-semibold'
                    : 'text-admin-text-muted'
                }`}
              >
                {s.snapshot_major_version ? `v${s.snapshot_major_version}` : '—'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
