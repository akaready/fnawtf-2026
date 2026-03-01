'use client';

import { useTransition } from 'react';

interface Props {
  value: boolean;
  rowId: string;
  field: string;
  labelTrue: string;
  labelFalse: string;
  colorTrue: string;
  colorFalse: string;
  onEdit?: (rowId: string, newValue: unknown) => void | Promise<void>;
}

export function ToggleCell({ value, rowId, field: _field, labelTrue, labelFalse, colorTrue, colorFalse, onEdit }: Props) {
  const [, startTransition] = useTransition();

  const toggle = () => {
    if (!onEdit) return;
    startTransition(async () => {
      await onEdit(rowId, !value);
    });
  };

  if (!onEdit) {
    return (
      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${value ? colorTrue : colorFalse}`}>
        {value ? labelTrue : labelFalse}
      </span>
    );
  }

  return (
    <button onClick={(e) => { e.stopPropagation(); toggle(); }} className="group">
      <span
        className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
          value ? colorTrue : colorFalse
        } group-hover:ring-1 group-hover:ring-admin-border-emphasis`}
      >
        {value ? labelTrue : labelFalse}
      </span>
    </button>
  );
}
