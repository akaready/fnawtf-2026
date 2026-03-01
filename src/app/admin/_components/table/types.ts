import type { ReactNode } from 'react';

/* ── Column types ──────────────────────────────────────────────────────── */

export type ColType =
  | 'text'
  | 'number'
  | 'toggle'
  | 'select'
  | 'tags'
  | 'thumbnail'
  | 'date';

export interface ColDefOption {
  value: string;
  label: string;
}

/**
 * Column definition for AdminDataTable.
 *
 * Two rendering modes:
 *   1. `render` callback — caller owns the cell UI
 *   2. `type` without `render` — table renders a type-appropriate cell,
 *      with optional inline editing when `onEdit` is provided
 *
 * If both are set, `render` wins.
 */
export interface ColDef<T extends { id: string }> {
  /** Unique stable key — used for storage, sort, and filter field */
  key: string;
  /** Header label */
  label: string;
  /**
   * Column data type. Drives type-aware filtering (OPERATORS_BY_TYPE),
   * groupability, and the default cell renderer.
   * Required when `render` is omitted.
   */
  type?: ColType;
  /** Default pixel width. Omit to let column flex. */
  defaultWidth?: number;
  /** Hard max-width for truncation (pixels) */
  maxWidth?: number;
  /** Show this column by default (defaults to true) */
  defaultVisible?: boolean;
  /** Allow sorting via header click and SortPanel */
  sortable?: boolean;
  /**
   * Custom sort-value extractor. Overrides the default `row[key]`.
   * Use for computed columns (e.g. contact counts).
   */
  sortValue?: (row: T) => string | number | boolean | null | undefined;
  /** For type='select' — valid options */
  options?: ColDefOption[];
  /** For type='toggle' — [trueLabel, falseLabel] */
  toggleLabels?: [string, string];
  /** For type='toggle' — [trueTailwindClasses, falseTailwindClasses] */
  toggleColors?: [string, string];
  /** Render value in monospace */
  mono?: boolean;
  /** Group label in FieldsPanel. Columns sharing a group are listed together. */
  group?: string;
  /** Custom cell render function. Wins over type-driven rendering. */
  render?: (row: T) => ReactNode;
  /**
   * Enable inline editing. Called with the row id and new value after commit.
   * Table does NOT update local state — caller handles server action + refresh.
   */
  onEdit?: (rowId: string, newValue: unknown) => void | Promise<void>;
  /** Tag autocomplete suggestions (type='tags' + onEdit) */
  tagSuggestions?: string[];
  /** Whether this column is groupable in GroupPanel. Defaults to true for toggle/select. */
  groupable?: boolean;
  /** Text alignment (defaults to 'left') */
  align?: 'left' | 'right' | 'center';
  /**
   * Searchable fields for the global search. When provided, the table will search
   * this column's value for the search term. When omitted and type is 'text',
   * the column is automatically included in search.
   */
  searchable?: boolean;
}

/* ── Row actions ───────────────────────────────────────────────────────── */

export interface RowAction<T extends { id: string }> {
  icon: ReactNode;
  label: string;
  onClick: (row: T, e: React.MouseEvent) => void;
  variant?: 'default' | 'danger';
}

/* ── Batch actions ─────────────────────────────────────────────────────── */

export interface BatchAction<T extends { id: string }> {
  icon: ReactNode;
  label: string;
  onClick: (selectedIds: string[], rows: T[]) => void | Promise<void>;
  variant?: 'default' | 'danger';
  requireConfirm?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
}

/* ── Sort & Filter rules ───────────────────────────────────────────────── */

export interface SortRule {
  key: string;
  dir: 'asc' | 'desc';
}

export interface FilterRule {
  field: string;
  operator: string;
  value: string;
}

/* ── Persisted table state ─────────────────────────────────────────────── */

export interface PersistedTableState {
  sorts: SortRule[];
  filters: FilterRule[];
  groupField: string | null;
  collapsedGroups: string[];
  visibleCols: string[];
  colWidths: Record<string, number>;
  colOrder: string[];
  freezeCount: number;
}

/* ── AdminDataTable props ──────────────────────────────────────────────── */

export interface AdminDataTableProps<T extends { id: string }> {
  data: T[];
  columns: ColDef<T>[];

  /** Unique key for localStorage persistence. Omit to skip persistence. */
  storageKey?: string;

  /* Feature flags (all off by default) */
  toolbar?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  groupable?: boolean;
  columnVisibility?: boolean;
  columnReorder?: boolean;
  columnResize?: boolean;
  selectable?: boolean;
  freezePanes?: boolean;
  exportCsv?: boolean;

  /* Selection & batch actions */
  batchActions?: BatchAction<T>[];
  /** Toolbar-integrated bulk delete. When provided + rows selected, shows trash icon in toolbar. */
  onBatchDelete?: (ids: string[]) => void | Promise<void>;

  /* Row interaction */
  rowActions?: RowAction<T>[];
  onRowClick?: (row: T) => void;
  selectedId?: string;

  /* Empty state */
  emptyMessage?: string;
  emptyAction?: { label: string; onClick: () => void };

  /** Slot rendered at the start of the toolbar row (before Sort/Filter/Fields buttons) */
  toolbarSlot?: React.ReactNode;

  /* External controls */
  search?: string;
  exportRef?: React.MutableRefObject<(() => void) | null>;

  className?: string;
}
