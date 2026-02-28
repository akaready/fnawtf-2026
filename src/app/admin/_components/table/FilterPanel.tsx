'use client';

import { X, Plus } from 'lucide-react';
import { ToolbarPopover } from './TableToolbar';
import { InlineSelect } from './InlineSelect';
import { OPERATORS_BY_TYPE, NO_VALUE_OPS } from './tableUtils';
import type { ColDef, FilterRule } from './types';

interface Props<T extends { id: string }> {
  columns: ColDef<T>[];
  filters: FilterRule[];
  onChange: (f: FilterRule[]) => void;
  onClose: () => void;
}

export function FilterPanel<T extends { id: string }>({ columns, filters, onChange, onClose }: Props<T>) {
  const filterableCols = columns.filter((c) => c.type !== 'thumbnail');

  const addFilter = () => {
    const col = filterableCols[0];
    if (!col) return;
    const ops = OPERATORS_BY_TYPE[col.type ?? 'text'];
    onChange([...filters, { field: col.key, operator: ops[0].value, value: '' }]);
  };

  const updateFilter = (idx: number, patch: Partial<FilterRule>) => {
    const next = filters.map((f, i) => {
      if (i !== idx) return f;
      const updated = { ...f, ...patch };
      if (patch.field && patch.field !== f.field) {
        const newCol = columns.find((c) => c.key === patch.field);
        const ops = OPERATORS_BY_TYPE[newCol?.type ?? 'text'];
        updated.operator = ops[0].value;
        updated.value = '';
      }
      if (patch.operator && NO_VALUE_OPS.has(patch.operator)) {
        updated.value = '';
      }
      return updated;
    });
    onChange(next);
  };

  const removeFilter = (idx: number) => {
    onChange(filters.filter((_, i) => i !== idx));
  };

  return (
    <ToolbarPopover onClose={onClose} width="w-[520px]" align="right">
      <div className="space-y-2">
        <div className="text-xs text-[#888] uppercase tracking-wider font-medium mb-2">Filter where</div>
        {filters.length === 0 && (
          <p className="text-sm text-[#777] py-2">No filters applied. Showing all rows.</p>
        )}
        {filters.map((f, i) => {
          const col = columns.find((c) => c.key === f.field) ?? filterableCols[0];
          const colType = col?.type ?? 'text';
          const ops = OPERATORS_BY_TYPE[colType];
          const needsValue = !NO_VALUE_OPS.has(f.operator);

          return (
            <div key={i} className="flex items-center gap-2">
              <InlineSelect
                className="w-32"
                value={f.field}
                onChange={(v) => updateFilter(i, { field: v })}
                options={filterableCols.map((c) => ({ value: c.key, label: c.label }))}
              />
              <InlineSelect
                className="w-36"
                value={f.operator}
                onChange={(v) => updateFilter(i, { operator: v })}
                options={ops.map((o) => ({ value: o.value, label: o.label }))}
              />
              {needsValue ? (
                col?.type === 'select' && col.options ? (
                  <InlineSelect
                    className="flex-1"
                    value={f.value}
                    onChange={(v) => updateFilter(i, { value: v })}
                    options={[{ value: '', label: 'Any' }, ...col.options.map((o) => ({ value: o.value, label: o.label }))]}
                  />
                ) : (
                  <input
                    type={colType === 'number' ? 'number' : colType === 'date' ? 'date' : 'text'}
                    value={f.value}
                    onChange={(e) => updateFilter(i, { value: e.target.value })}
                    placeholder={colType === 'tags' ? 'tag name…' : 'value…'}
                    className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-sm text-foreground placeholder:text-[#555] focus:outline-none focus:border-white/20"
                  />
                )
              ) : (
                <div className="flex-1" />
              )}
              <button
                onClick={() => removeFilter(i)}
                className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-[#555] hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
        <button
          onClick={addFilter}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
        >
          <Plus size={14} /> Add filter
        </button>
      </div>
    </ToolbarPopover>
  );
}
