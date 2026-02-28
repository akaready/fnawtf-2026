'use client';

import { ToolbarPopover } from './TableToolbar';
import type { ColDef } from './types';

interface Props<T extends { id: string }> {
  columns: ColDef<T>[];
  groupField: string | null;
  onChange: (f: string | null) => void;
  onClose: () => void;
}

export function GroupPanel<T extends { id: string }>({ columns, groupField, onChange, onClose }: Props<T>) {
  const groupableCols = columns.filter((c) => c.groupable);

  return (
    <ToolbarPopover onClose={onClose} width="w-64" align="right">
      <div className="space-y-2">
        <div className="text-xs text-[#888] uppercase tracking-wider font-medium mb-2">Group by</div>
        <label
          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
            !groupField ? 'bg-white/5 text-foreground' : 'text-muted-foreground hover:bg-white/5'
          }`}
        >
          <input
            type="radio"
            name="group"
            checked={!groupField}
            onChange={() => onChange(null)}
            className="accent-white"
          />
          None
        </label>
        {groupableCols.map((col) => (
          <label
            key={col.key}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
              groupField === col.key ? 'bg-white/5 text-foreground' : 'text-muted-foreground hover:bg-white/5'
            }`}
          >
            <input
              type="radio"
              name="group"
              checked={groupField === col.key}
              onChange={() => onChange(col.key)}
              className="accent-white"
            />
            {col.label}
          </label>
        ))}
      </div>
    </ToolbarPopover>
  );
}
