'use client';

import type { ScriptColumnConfig } from '@/types/scripts';

interface Props {
  config: ScriptColumnConfig;
  onChange: (config: ScriptColumnConfig) => void;
  /** Show only colored dots without labels */
  compact?: boolean;
}

const columns: { key: keyof ScriptColumnConfig; label: string; color: string }[] = [
  { key: 'audio', label: 'Audio', color: 'bg-[var(--admin-accent)]' },
  { key: 'visual', label: 'Visual', color: 'bg-[var(--admin-info)]' },
  { key: 'notes', label: 'Notes', color: 'bg-[var(--admin-warning)]' },
  { key: 'reference', label: 'Reference', color: 'bg-[var(--admin-success)]' },
];

export function ScriptColumnToggle({ config, onChange, compact }: Props) {
  const toggle = (key: keyof ScriptColumnConfig) => {
    // Prevent disabling all columns
    const next = { ...config, [key]: !config[key] };
    if (!next.audio && !next.visual && !next.notes && !next.reference) return;
    onChange(next);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {columns.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-lg transition-all duration-200 hover:bg-admin-bg-hover"
            title={label}
          >
            <span className={`block w-2.5 h-2.5 rounded-full transition-colors ${config[key] ? color : 'bg-admin-text-ghost'}`} />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {columns.map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            config[key]
              ? 'bg-admin-bg-active text-admin-text-primary'
              : 'text-admin-text-ghost hover:text-admin-text-muted'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${config[key] ? color : 'bg-admin-text-ghost'}`} />
          {label}
        </button>
      ))}
    </div>
  );
}
