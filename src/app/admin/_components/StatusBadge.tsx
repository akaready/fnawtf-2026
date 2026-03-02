'use client';

export interface StatusConfig {
  label: string;
  className: string;
}

interface StatusBadgeProps {
  status: string;
  config: Record<string, StatusConfig>;
  /** Fallback config when status isn't in the config map */
  fallback?: StatusConfig;
}

/**
 * Semantic status pill badge. Standard rendering:
 * `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium`
 *
 * Usage:
 * ```tsx
 * <StatusBadge status={client.status} config={COMPANY_STATUSES} />
 * ```
 */
export function StatusBadge({ status, config, fallback }: StatusBadgeProps) {
  const entry = config[status] ?? fallback ?? { label: status, className: 'bg-admin-bg-active text-admin-text-secondary' };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${entry.className}`}>
      {entry.label}
    </span>
  );
}
