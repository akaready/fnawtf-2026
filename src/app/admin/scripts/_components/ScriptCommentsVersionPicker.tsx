'use client';

import { AdminCombobox } from '@/app/admin/_components/AdminCombobox';
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
  if (shares.length === 0) {
    return (
      <span className="text-admin-sm text-admin-text-faint px-2">
        No versions shared yet
      </span>
    );
  }

  const options = shares.map((s) => ({
    id: s.id,
    label: s.snapshot_major_version
      ? `v${s.snapshot_major_version}${s.label ? ` · ${s.label}` : ''}`
      : s.label || 'Unversioned share',
  }));

  const selectedShare = shares.find(s => s.id === selectedShareId) ?? null;
  const isHistorical = selectedShare !== null
    && selectedShare.snapshot_major_version !== null
    && selectedShare.snapshot_major_version !== currentMajorVersion;

  return (
    <div
      className={`flex items-center gap-2 px-2 rounded transition-colors ${
        isHistorical ? 'bg-admin-cream' : ''
      }`}
    >
      {isHistorical && (
        <span
          className="text-admin-sm font-semibold uppercase tracking-wider flex-shrink-0"
          style={{ color: 'var(--admin-cream-label)' }}
        >
          Historical
        </span>
      )}
      <div style={isHistorical ? { color: 'var(--admin-cream-text)' } : undefined}>
        <AdminCombobox
          options={options}
          value={selectedShareId}
          onChange={(val) => { if (val) onSelect(val); }}
          searchable={false}
          nullable={false}
          placeholder="Select version"
        />
      </div>
    </div>
  );
}
