'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ToolbarPopover } from './TableToolbar';
import type { ColDef } from './types';

interface Props<T extends { id: string }> {
  columns: ColDef<T>[];
  visibleCols: Set<string>;
  onToggle: (key: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onClose: () => void;
}

export function FieldsPanel<T extends { id: string }>({
  columns,
  visibleCols,
  onToggle,
  onShowAll,
  onHideAll,
  onClose,
}: Props<T>) {
  const [fieldSearch, setFieldSearch] = useState('');

  const filteredCols = useMemo(() => {
    if (!fieldSearch) return columns;
    const q = fieldSearch.toLowerCase();
    return columns.filter((c) => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q));
  }, [columns, fieldSearch]);

  const groups = useMemo(() => {
    const customGrouped = new Map<string, ColDef<T>[]>();
    const ungrouped = {
      text: [] as ColDef<T>[],
      toggle: [] as ColDef<T>[],
      number: [] as ColDef<T>[],
      tags: [] as ColDef<T>[],
      other: [] as ColDef<T>[],
    };

    for (const c of filteredCols) {
      if (c.group) {
        const list = customGrouped.get(c.group) ?? [];
        list.push(c);
        customGrouped.set(c.group, list);
      } else {
        const t = c.type ?? 'text';
        if (t === 'text' || t === 'thumbnail') ungrouped.text.push(c);
        else if (t === 'toggle') ungrouped.toggle.push(c);
        else if (t === 'number') ungrouped.number.push(c);
        else if (t === 'tags') ungrouped.tags.push(c);
        else ungrouped.other.push(c);
      }
    }

    const result: { label: string; cols: ColDef<T>[] }[] = [];
    if (ungrouped.text.length) result.push({ label: 'Text', cols: ungrouped.text });
    if (ungrouped.toggle.length) result.push({ label: 'Toggles', cols: ungrouped.toggle });
    if (ungrouped.number.length) result.push({ label: 'Numbers', cols: ungrouped.number });
    if (ungrouped.tags.length) result.push({ label: 'Tags', cols: ungrouped.tags });
    for (const [label, cols] of customGrouped) result.push({ label, cols });
    if (ungrouped.other.length) result.push({ label: 'Other', cols: ungrouped.other });
    return result;
  }, [filteredCols]);

  return (
    <ToolbarPopover onClose={onClose} width="w-64" align="right">
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-[10px] -mx-3 -mt-3 mb-1 border-b border-admin-border bg-admin-bg-base rounded-t-xl">
          <Search size={13} className="text-admin-text-dim flex-shrink-0" />
          <input
            type="text"
            value={fieldSearch}
            onChange={(e) => setFieldSearch(e.target.value)}
            placeholder="Search fields…"
            className="flex-1 bg-transparent text-sm text-admin-text-primary outline-none placeholder:text-admin-text-faint"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2 pb-1 border-b border-admin-border">
          <button onClick={onShowAll} className="text-[11px] text-admin-text-secondary hover:text-admin-text-primary transition-colors">
            Show all
          </button>
          <span className="text-admin-text-ghost">·</span>
          <button onClick={onHideAll} className="text-[11px] text-admin-text-secondary hover:text-admin-text-primary transition-colors">
            Hide all
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto admin-scrollbar space-y-3">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="text-[10px] text-admin-text-dim uppercase tracking-wider font-medium px-2.5 mb-1">
                {g.label}
              </div>
              {g.cols.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2.5 px-2.5 py-1 rounded-lg text-sm cursor-pointer hover:bg-admin-bg-hover transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={visibleCols.has(col.key)}
                    onChange={() => onToggle(col.key)}
                    className="accent-white rounded"
                  />
                  <span className={visibleCols.has(col.key) ? 'text-admin-text-primary' : 'text-admin-text-secondary'}>
                    {col.label}
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>
    </ToolbarPopover>
  );
}
