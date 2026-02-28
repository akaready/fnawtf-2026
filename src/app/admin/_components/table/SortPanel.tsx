'use client';

import { ChevronUp, ChevronDown, X, Plus } from 'lucide-react';
import { ToolbarPopover } from './TableToolbar';
import { InlineSelect } from './InlineSelect';
import type { ColDef, SortRule } from './types';

interface Props<T extends { id: string }> {
  columns: ColDef<T>[];
  sorts: SortRule[];
  onChange: (s: SortRule[]) => void;
  onClose: () => void;
}

export function SortPanel<T extends { id: string }>({ columns, sorts, onChange, onClose }: Props<T>) {
  const sortableCols = columns.filter((c) => c.sortable !== false);

  const addSort = () => {
    const used = new Set(sorts.map((s) => s.key));
    const next = sortableCols.find((c) => !used.has(c.key));
    if (next) onChange([...sorts, { key: next.key, dir: 'asc' }]);
  };

  const updateSort = (idx: number, patch: Partial<SortRule>) => {
    const next = sorts.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onChange(next);
  };

  const removeSort = (idx: number) => {
    onChange(sorts.filter((_, i) => i !== idx));
  };

  return (
    <ToolbarPopover onClose={onClose} width="w-96" align="right">
      <div className="space-y-2">
        <div className="text-xs text-[#888] uppercase tracking-wider font-medium mb-2">Sort by</div>
        {sorts.length === 0 && (
          <p className="text-sm text-[#777] py-2">No sorts applied. Showing default order.</p>
        )}
        {sorts.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <InlineSelect
              className="flex-1"
              value={s.key}
              onChange={(v) => updateSort(i, { key: v })}
              options={sortableCols.map((c) => ({ value: c.key, label: c.label }))}
            />
            <button
              onClick={() => updateSort(i, { dir: s.dir === 'asc' ? 'desc' : 'asc' })}
              className="flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors whitespace-nowrap"
            >
              {s.dir === 'asc' ? (
                <><ChevronUp size={12} /> A→Z</>
              ) : (
                <><ChevronDown size={12} /> Z→A</>
              )}
            </button>
            <button
              onClick={() => removeSort(i)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#555] hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={addSort}
          disabled={sorts.length >= sortableCols.length}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1 disabled:opacity-30"
        >
          <Plus size={14} /> Add sort
        </button>
      </div>
    </ToolbarPopover>
  );
}
