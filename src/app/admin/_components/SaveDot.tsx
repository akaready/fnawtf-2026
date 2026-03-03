'use client';

import type { AutoSaveStatus } from '@/app/admin/_hooks/useAutoSave';

export function SaveDot({ status }: { status: AutoSaveStatus }) {
  return (
    <span className="inline-flex items-center ml-2 flex-shrink-0">
      {status === 'saving' ? (
        <span className="w-3 h-3 rounded-full border border-admin-text-muted/60 border-t-transparent animate-spin" />
      ) : status === 'saved' ? (
        <span className="w-2 h-2 rounded-full bg-admin-success" />
      ) : status === 'error' ? (
        <span className="w-2 h-2 rounded-full bg-admin-danger" />
      ) : status === 'pending' ? (
        <span className="w-2 h-2 rounded-full bg-admin-text-ghost/30 animate-pulse" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-admin-text-ghost/30" />
      )}
    </span>
  );
}
