'use client';

import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { ArrowUpDown, ChevronUp, ChevronDown, Plus } from 'lucide-react';

// ── Column & Row Action Types ──────────────────────────────────────────────────

export interface ColumnDef<T> {
  /** Unique key — matched against row data for sorting */
  key: string;
  /** Header label text */
  label: string;
  /** Fixed Tailwind width class, e.g. 'w-12', 'w-24'. Omit to flex-grow. */
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  /** Render the cell content for a given row */
  render: (row: T) => ReactNode;
}

export interface RowAction<T> {
  icon: ReactNode;
  label: string;
  onClick: (row: T, e: React.MouseEvent) => void;
  variant?: 'default' | 'danger';
}

interface AdminTableProps<T extends { id: string }> {
  data: T[];
  columns: ColumnDef<T>[];

  /** Hover-reveal icon buttons on the right of each row */
  rowActions?: RowAction<T>[];

  /** Click entire row — adds cursor-pointer */
  onRowClick?: (row: T) => void;

  /** Highlight the row matching this id (e.g. for side-panel selection) */
  selectedId?: string;

  /** Header-click sort controls */
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;

  /** Shown when data is empty */
  emptyMessage?: string;
  emptyAction?: { label: string; onClick: () => void };

  className?: string;
}

// ── Status Badge ───────────────────────────────────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
  // Proposals
  draft:         'bg-admin-bg-active text-admin-text-secondary',
  sent:          'bg-admin-info-bg text-admin-info',
  viewed:        'bg-admin-warning-bg text-admin-warning',
  accepted:      'bg-admin-success-bg text-admin-success',
  // Projects
  published:     'bg-admin-success-bg text-admin-success',
  hidden:        'bg-admin-danger-bg-strong text-admin-danger',
  featured:      'bg-amber-500/20 text-admin-warning',
  // Companies
  active:        'bg-admin-success-bg text-admin-success',
  prospect:      'bg-amber-500/20 text-admin-warning',
  'on hold':     'bg-slate-500/20 text-slate-400',
  past:          'bg-admin-bg-hover text-admin-text-faint',
  // Meetings
  upcoming:       'bg-admin-info-bg text-admin-info',
  bot_scheduled:  'bg-indigo-500/20 text-indigo-300',
  in_progress:    'bg-admin-success-bg text-admin-success',
  completed:      'bg-admin-success-bg text-admin-success',
  failed:         'bg-admin-danger-bg-strong text-admin-danger',
  no_video_link:  'bg-admin-bg-hover text-admin-text-faint',
  cancelled:      'bg-admin-bg-hover text-admin-text-faint',
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[value] ?? 'bg-admin-bg-active text-admin-text-secondary'}`}
    >
      {value}
    </span>
  );
}

// ── Relative Time Helper ───────────────────────────────────────────────────────

export function relativeTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ── Sort Hook ──────────────────────────────────────────────────────────────────

export function useTableSort(defaultKey: string, defaultDir: 'asc' | 'desc' = 'desc') {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultDir);

  const handleSort = useCallback(
    (key: string) => {
      if (key === sortKey) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey],
  );

  return { sortKey, sortDir, handleSort };
}

// ── Delete Confirmation Modal ──────────────────────────────────────────────────

interface AdminDeleteModalProps {
  title: string;
  description?: ReactNode;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdminDeleteModal({
  title,
  description,
  isDeleting,
  onConfirm,
  onCancel,
}: AdminDeleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={() => !isDeleting && onCancel()}
    >
      <div
        className="bg-admin-bg-raised border border-admin-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-admin-text-primary mb-2">{title}</h3>
        {description && <div className="text-sm text-admin-text-secondary mb-6">{description}</div>}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-admin-border text-sm text-admin-text-secondary hover:text-admin-text-primary hover:border-admin-border-emphasis transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn-danger px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AdminTable ─────────────────────────────────────────────────────────────────

export function AdminTable<T extends { id: string }>({
  data,
  columns,
  rowActions,
  onRowClick,
  selectedId,
  sortKey,
  sortDir,
  onSort,
  emptyMessage = 'No items found.',
  emptyAction,
  className,
}: AdminTableProps<T>) {
  const hasActions = !!rowActions?.length;
  const isClickable = !!onRowClick;

  const alignClass = (align?: 'left' | 'right' | 'center') =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  if (data.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center flex-1 min-h-[240px] gap-3 ${className ?? ''}`}
      >
        <p className="text-sm text-admin-text-faint">{emptyMessage}</p>
        {emptyAction && (
          <button
            onClick={emptyAction.onClick}
            className="flex items-center gap-1.5 text-xs text-admin-text-secondary hover:text-admin-text-primary transition-colors"
          >
            <Plus size={12} />
            {emptyAction.label}
          </button>
        )}
      </div>
    );
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (!scrollRef.current) return;
    const row = scrollRef.current.querySelector('thead tr');
    if (!row) return;
    const h = row.getBoundingClientRect().height;
    if (Math.abs(h - headerHeight) > 0.5) setHeaderHeight(h);
  });

  return (
    <div className={`flex-1 min-h-0 relative ${className ?? ''}`}>
      {headerHeight > 0 && (
        <div className="absolute top-0 right-0 w-3 bg-admin-bg-sidebar z-20 pointer-events-none border-b border-admin-border-subtle" style={{ height: headerHeight - 0.5 }} />
      )}
      <div ref={scrollRef} className="h-full overflow-y-auto admin-scrollbar">
      <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
        <thead className="sticky top-0 z-10">
          <tr>
            {columns.map((col, idx) => {
              const isLast = idx === columns.length - 1 && !hasActions;
              return (
              <th
                key={col.key}
                className={[
                  'px-4 py-3 text-xs font-mono text-admin-text-ghost uppercase tracking-widest font-normal whitespace-nowrap bg-admin-bg-sidebar border-b border-admin-border-subtle',
                  isLast ? '' : 'border-r',
                  alignClass(col.align),
                  col.width ?? '',
                  col.sortable && onSort
                    ? 'cursor-pointer select-none group/th hover:text-admin-text-dim transition-colors'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && onSort && (
                    <span className="inline-flex text-admin-text-ghost">
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ChevronUp size={10} />
                        ) : (
                          <ChevronDown size={10} />
                        )
                      ) : (
                        <ArrowUpDown
                          size={10}
                          className="opacity-0 group-hover/th:opacity-100 transition-opacity"
                        />
                      )}
                    </span>
                  )}
                </span>
              </th>
              );
            })}
            {hasActions && (
              <th className="px-4 py-3 w-20 text-xs font-mono text-admin-text-ghost uppercase tracking-widest font-normal bg-admin-bg-sidebar border-b border-admin-border-subtle" />
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={[
                'border-b border-admin-border transition-colors group',
                isClickable ? 'cursor-pointer' : '',
                selectedId === row.id
                  ? 'bg-admin-bg-selected'
                  : 'hover:bg-admin-bg-subtle',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3.5 ${alignClass(col.align)}`}
                >
                  {col.render(row)}
                </td>
              ))}
              {hasActions && (
                <td className="px-4 py-3.5 w-20">
                  <div
                    className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {rowActions!.map((action) => (
                      <button
                        key={action.label}
                        onClick={(e) => action.onClick(row, e)}
                        title={action.label}
                        className={`p-1.5 rounded transition-colors ${
                          action.variant === 'danger'
                            ? 'text-admin-text-dim hover:text-admin-danger hover:bg-admin-danger-bg'
                            : 'text-admin-text-dim hover:text-admin-text-primary hover:bg-admin-bg-active'
                        }`}
                      >
                        {action.icon}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
