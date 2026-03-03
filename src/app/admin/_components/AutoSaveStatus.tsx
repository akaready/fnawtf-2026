'use client';

import { Loader2, Check, AlertCircle } from 'lucide-react';
import type { AutoSaveStatus as Status } from '@/app/admin/_hooks/useAutoSave';

export function AutoSaveStatus({ status }: { status: Status }) {
  if (status === 'idle') return null;

  if (status === 'pending') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-admin-text-faint">
        <span className="w-1.5 h-1.5 rounded-full bg-admin-text-faint animate-pulse" />
      </span>
    );
  }

  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-admin-text-muted">
        <Loader2 size={12} className="animate-spin" />
        <span>Saving…</span>
      </span>
    );
  }

  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-admin-success">
        <Check size={12} />
        <span>Saved</span>
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-admin-danger">
        <AlertCircle size={12} />
        <span>Save failed</span>
      </span>
    );
  }

  return null;
}
