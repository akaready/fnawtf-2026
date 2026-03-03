'use client';

import { Check, Minus } from 'lucide-react';

interface AdminCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function AdminCheckbox({ checked, indeterminate, onChange, disabled, className = '' }: AdminCheckboxProps) {
  return (
    <label className={`relative inline-flex items-center justify-center cursor-pointer ${disabled ? 'opacity-40 cursor-default' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
        aria-checked={indeterminate ? 'mixed' : checked}
      />
      {indeterminate ? (
        <div className="w-4 h-4 rounded bg-white/50 flex items-center justify-center transition-colors">
          <Minus size={11} strokeWidth={3} className="text-black" />
        </div>
      ) : checked ? (
        <div className="w-4 h-4 rounded bg-white flex items-center justify-center transition-colors">
          <Check size={11} strokeWidth={3} className="text-black" />
        </div>
      ) : (
        <div className="w-4 h-4 rounded border border-admin-border hover:border-admin-border-emphasis transition-colors" />
      )}
    </label>
  );
}
