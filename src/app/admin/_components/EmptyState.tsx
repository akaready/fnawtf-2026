'use client';

import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

/**
 * Standard empty state placeholder for lists, tables, and panels.
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon={FileText}
 *   title="No proposals yet"
 *   description="Create your first proposal to get started."
 *   action={{ label: 'Create Proposal', onClick: () => handleCreate() }}
 * />
 * ```
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="flex justify-center mb-3">
          <Icon size={32} strokeWidth={1.25} className="text-admin-text-ghost" />
        </div>
      )}
      <p className="text-sm text-admin-text-ghost">{title}</p>
      {description && (
        <p className="text-xs text-admin-text-faint mt-1">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-secondary px-4 py-2 text-xs mt-4"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
