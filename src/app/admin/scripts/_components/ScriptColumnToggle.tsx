'use client';

import type { ScriptColumnConfig } from '@/types/scripts';

interface Props {
  config: ScriptColumnConfig;
  onChange: (config: ScriptColumnConfig) => void;
  /** Show only colored dots without labels */
  compact?: boolean;
  /** Keys to hide from the toggle (e.g. ['storyboard'] in presentation mode) */
  exclude?: (keyof ScriptColumnConfig)[];
}

const columns: { key: keyof ScriptColumnConfig; label: string; color: string }[] = [
  { key: 'audio',      label: 'Audio',      color: 'bg-[var(--admin-accent)]' },
  { key: 'visual',     label: 'Visual',     color: 'bg-[var(--admin-info)]' },
  { key: 'notes',      label: 'Notes',      color: 'bg-[var(--admin-warning)]' },
  { key: 'reference',  label: 'Reference',  color: 'bg-[var(--admin-danger)]' },
  { key: 'storyboard', label: 'Storyboard', color: 'bg-[var(--admin-success)]' },
  { key: 'comments',   label: 'Comments',   color: 'bg-[var(--admin-cream)]' },
];

export function ScriptColumnToggle({ config, onChange, compact, exclude }: Props) {
  const visibleColumns = exclude ? columns.filter(c => !exclude.includes(c.key)) : columns;

  const toggle = (key: keyof ScriptColumnConfig) => {
    const next = { ...config, [key]: !config[key] };
    // Prevent disabling all columns
    const anyOn = (Object.keys(next) as (keyof ScriptColumnConfig)[]).some(k => next[k]);
    if (!anyOn) return;
    onChange(next);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {visibleColumns.map(({ key, label, color }) => (
          <div key={key} className="relative group/dot">
            <button
              onClick={() => toggle(key)}
              className="flex items-center justify-center w-[30px] h-[30px] rounded-lg transition-all duration-200 hover:bg-admin-bg-hover"
            >
              <span className={`block w-2.5 h-2.5 rounded-full transition-colors ${config[key] ? color : 'bg-admin-text-ghost'}`} />
            </button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-admin-sm font-medium text-admin-text-primary bg-admin-bg-overlay border border-admin-border rounded whitespace-nowrap opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none">
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {visibleColumns.map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-admin-sm font-medium transition-colors ${
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
