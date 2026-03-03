'use client';

import type { AutoSaveStatus } from '@/app/admin/_hooks/useAutoSave';

const colorMap: Record<AutoSaveStatus, string> = {
  idle: 'bg-admin-success',
  pending: 'bg-admin-text-faint',
  saving: 'bg-admin-text-muted',
  saved: 'bg-admin-success',
  error: 'bg-admin-danger',
};

export function SaveDot({ status }: { status: AutoSaveStatus }) {
  const isPulsing = status === 'pending' || status === 'saving';
  return (
    <span className="inline-flex items-center ml-2 flex-shrink-0">
      <span
        className={`w-2.5 h-2.5 rounded-full transition-colors duration-700 ${colorMap[status]} ${isPulsing ? 'animate-pulse' : ''}`}
      />
    </span>
  );
}
