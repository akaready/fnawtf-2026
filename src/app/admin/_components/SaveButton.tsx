'use client';

import { Loader2, Check, Save } from 'lucide-react';

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
  saved,
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
      {saving ? (
        <Loader2 size={14} className="animate-spin" />
      ) : saved ? (
        <Check size={14} className="text-green-600" />
      ) : (
        <Save size={14} />
      )}
      {saving ? 'Saving…' : saved ? 'Saved!' : label}
    </button>
  );
}
