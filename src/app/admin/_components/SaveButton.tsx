'use client';

import { Save } from 'lucide-react';

interface SaveButtonProps {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
  disabled?: boolean;
  label?: string;     // idle label, default "Save"
  className?: string; // sizing / extra classes
}

export function SaveButton({
  saving,
  onClick,
  disabled,
  label = 'Save',
  className = '',
}: SaveButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled ?? saving}
      className={`btn-primary ${className}`}
    >
      <Save size={14} />
      {label}
    </button>
  );
}
