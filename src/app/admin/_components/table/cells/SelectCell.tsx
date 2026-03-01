'use client';

import { useTransition } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  value: string;
  rowId: string;
  field: string;
  options: { value: string; label: string }[];
  onEdit?: (rowId: string, newValue: unknown) => void | Promise<void>;
}

export function SelectCell({ value, rowId, field: _field, options, onEdit }: Props) {
  const [, startTransition] = useTransition();

  const handleChange = (newVal: string) => {
    if (newVal === value || !onEdit) return;
    startTransition(async () => {
      await onEdit(rowId, newVal);
    });
  };

  if (!onEdit) {
    const label = options.find((o) => o.value === value)?.label ?? value;
    return <span className="text-admin-text-muted text-sm capitalize">{label}</span>;
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none bg-transparent text-admin-text-muted text-sm capitalize cursor-pointer hover:text-admin-text-primary focus:outline-none pr-5 transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-admin-text-placeholder pointer-events-none" />
    </div>
  );
}
