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
  draft:         'bg-white/10 text-[#808080]',
  sent:          'bg-blue-500/20 text-blue-300',
  viewed:        'bg-yellow-500/20 text-yellow-300',
  accepted:      'bg-green-500/20 text-green-300',
  // Projects
  published:     'bg-green-500/20 text-green-400',
  hidden:        'bg-red-500/20 text-red-400',
  featured:      'bg-amber-500/20 text-amber-400',
  // Companies
  active:        'bg-green-500/20 text-green-400',
  prospect:      'bg-amber-500/20 text-amber-400',
  'on hold':     'bg-slate-500/20 text-slate-400',
  past:          'bg-white/5 text-[#4d4d4d]',
  // Meetings
  upcoming:       'bg-sky-500/20 text-sky-300',
  bot_scheduled:  'bg-indigo-500/20 text-indigo-300',
  in_progress:    'bg-green-500/20 text-green-300',
  completed:      'bg-emerald-500/20 text-emerald-300',
  failed:         'bg-red-500/20 text-red-300',
  no_video_link:  'bg-white/5 text-[#4d4d4d]',
  cancelled:      'bg-white/5 text-[#4d4d4d]',
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[value] ?? 'bg-white/10 text-[#808080]'}`}
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
        className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
        {description && <div className="text-sm text-[#808080] mb-6">{description}</div>}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-[#999] hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
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
        <p className="text-sm text-[#4d4d4d]">{emptyMessage}</p>
        {emptyAction && (
          <button
            onClick={emptyAction.onClick}
            className="flex items-center gap-1.5 text-xs text-[#808080] hover:text-white transition-colors"
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
        <div className="absolute top-0 right-0 w-3 bg-[#0f0f0f] z-20 pointer-events-none border-b border-[#1f1f1f]" style={{ height: headerHeight - 0.5 }} />
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
                  'px-4 py-3 text-xs font-mono text-[#404040] uppercase tracking-widest font-normal whitespace-nowrap bg-[#0f0f0f] border-b border-[#1f1f1f]',
                  isLast ? '' : 'border-r',
                  alignClass(col.align),
                  col.width ?? '',
                  col.sortable && onSort
                    ? 'cursor-pointer select-none group/th hover:text-[#666] transition-colors'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && onSort && (
                    <span className="inline-flex text-[#333]">
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
              <th className="px-4 py-3 w-20 text-xs font-mono text-[#404040] uppercase tracking-widest font-normal bg-[#0f0f0f] border-b border-[#1f1f1f]" />
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={[
                'border-b border-[#2a2a2a] transition-colors group',
                isClickable ? 'cursor-pointer' : '',
                selectedId === row.id
                  ? 'bg-white/[0.04]'
                  : 'hover:bg-white/[0.03]',
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
                            ? 'text-[#666] hover:text-red-400 hover:bg-red-500/10'
                            : 'text-[#666] hover:text-white hover:bg-white/10'
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
