'use client';

import { useState } from 'react';
import type { ScriptShareRow } from '@/types/scripts';

interface Props {
  shares: ScriptShareRow[];
  selectedShareId: string | null;
  currentMajorVersion: number;
  onSelect: (shareId: string) => void;
}

function versionLabel(share: ScriptShareRow): string {
  return share.snapshot_major_version ? `v${share.snapshot_major_version}` : '—';
}

export function ScriptCommentsVersionPicker({
  shares,
  selectedShareId,
  currentMajorVersion,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);

  if (shares.length === 0) {
    return (
      <span className="text-admin-sm text-admin-text-faint opacity-60 font-semibold uppercase tracking-widest">
        No shares
      </span>
    );
  }

  const selectedShare = shares.find(s => s.id === selectedShareId) ?? shares[0];
  const isHistorical = selectedShare.snapshot_major_version !== null
    && selectedShare.snapshot_major_version !== currentMajorVersion;

  const pillBase = 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold text-admin-sm transition-opacity';

  if (shares.length === 1) {
    return (
      <span
        className={`${pillBase} ${
          isHistorical
            ? 'bg-admin-cream text-admin-cream-text'
            : 'text-admin-cream opacity-80'
        }`}
      >
        {versionLabel(selectedShare)}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className={`${pillBase} ${
          isHistorical
            ? 'bg-admin-cream text-admin-cream-text'
            : 'text-admin-cream opacity-60 hover:opacity-100'
        }`}
      >
        {versionLabel(selectedShare)}
        <span className="opacity-50">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-30 bg-admin-bg-overlay border border-admin-border rounded-admin-md shadow-xl py-1 min-w-[96px]">
            {shares.map(s => (
              <button
                key={s.id}
                onClick={(e) => { e.stopPropagation(); onSelect(s.id); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-admin-sm transition-colors hover:bg-admin-bg-hover ${
                  s.id === selectedShare.id
                    ? 'text-admin-text-primary font-semibold'
                    : 'text-admin-text-muted'
                }`}
              >
                {versionLabel(s)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
