import type { ColType, FilterRule, PersistedTableState, ColDef, SortRule } from './types';

/* ── Filter operators by column type ───────────────────────────────────── */

export const OPERATORS_BY_TYPE: Record<ColType, { value: string; label: string }[]> = {
  text:      [{ value: 'contains', label: 'contains' }, { value: 'equals', label: 'equals' }, { value: 'not_contains', label: 'does not contain' }, { value: 'is_empty', label: 'is empty' }, { value: 'is_not_empty', label: 'is not empty' }],
  toggle:    [{ value: 'is_true', label: 'is true' }, { value: 'is_false', label: 'is false' }],
  select:    [{ value: 'is', label: 'is' }, { value: 'is_not', label: 'is not' }],
  number:    [{ value: 'eq', label: '=' }, { value: 'neq', label: '≠' }, { value: 'gt', label: '>' }, { value: 'lt', label: '<' }, { value: 'gte', label: '≥' }, { value: 'lte', label: '≤' }, { value: 'is_empty', label: 'is empty' }],
  tags:      [{ value: 'contains', label: 'contains' }, { value: 'is_empty', label: 'is empty' }, { value: 'is_not_empty', label: 'is not empty' }],
  date:      [{ value: 'before', label: 'before' }, { value: 'after', label: 'after' }, { value: 'is_empty', label: 'is empty' }],
  thumbnail: [{ value: 'is_empty', label: 'is empty' }, { value: 'is_not_empty', label: 'is not empty' }],
};

export const NO_VALUE_OPS = new Set(['is_empty', 'is_not_empty', 'is_true', 'is_false']);

/* ── Filter evaluation ─────────────────────────────────────────────────── */

export function evaluateFilter(row: Record<string, unknown>, rule: FilterRule): boolean {
  const rawVal = row[rule.field];

  switch (rule.operator) {
    case 'is_empty':
      return rawVal == null || rawVal === '' || (Array.isArray(rawVal) && rawVal.length === 0);
    case 'is_not_empty':
      return rawVal != null && rawVal !== '' && !(Array.isArray(rawVal) && rawVal.length === 0);
    case 'is_true':
      return rawVal === true;
    case 'is_false':
      return rawVal === false || rawVal == null;
    case 'contains': {
      if (Array.isArray(rawVal)) {
        return rule.value ? rawVal.some((t) => String(t).toLowerCase().includes(rule.value.toLowerCase())) : true;
      }
      return String(rawVal ?? '').toLowerCase().includes(rule.value.toLowerCase());
    }
    case 'not_contains':
      return !String(rawVal ?? '').toLowerCase().includes(rule.value.toLowerCase());
    case 'equals':
      return String(rawVal ?? '').toLowerCase() === rule.value.toLowerCase();
    case 'is':
      return !rule.value || String(rawVal) === rule.value;
    case 'is_not':
      return !rule.value || String(rawVal) !== rule.value;
    case 'eq':
      return Number(rawVal) === Number(rule.value);
    case 'neq':
      return Number(rawVal) !== Number(rule.value);
    case 'gt':
      return Number(rawVal) > Number(rule.value);
    case 'lt':
      return Number(rawVal) < Number(rule.value);
    case 'gte':
      return Number(rawVal) >= Number(rule.value);
    case 'lte':
      return Number(rawVal) <= Number(rule.value);
    case 'before':
      return rule.value ? new Date(rawVal as string) < new Date(rule.value) : true;
    case 'after':
      return rule.value ? new Date(rawVal as string) > new Date(rule.value) : true;
    default:
      return true;
  }
}

/* ── Compare helper for multi-sort ─────────────────────────────────────── */

export function compareValues(aRaw: unknown, bRaw: unknown, dir: 'asc' | 'desc'): number {
  // Nulls always sort last
  if (aRaw == null && bRaw == null) return 0;
  if (aRaw == null) return 1;
  if (bRaw == null) return -1;

  let cmp = 0;
  if (typeof aRaw === 'string' && typeof bRaw === 'string') {
    cmp = aRaw.localeCompare(bRaw);
  } else if (typeof aRaw === 'boolean' && typeof bRaw === 'boolean') {
    cmp = Number(aRaw) - Number(bRaw);
  } else if (typeof aRaw === 'number' && typeof bRaw === 'number') {
    cmp = aRaw - bRaw;
  } else {
    cmp = String(aRaw ?? '').localeCompare(String(bRaw ?? ''));
  }
  return dir === 'asc' ? cmp : -cmp;
}

/* ── Sort and filter data ──────────────────────────────────────────────── */

export function sortData<T extends { id: string }>(
  data: T[],
  sorts: SortRule[],
  columns: ColDef<T>[],
): T[] {
  if (sorts.length === 0) return data;
  const colMap = new Map(columns.map((c) => [c.key, c]));

  return [...data].sort((a, b) => {
    for (const s of sorts) {
      const col = colMap.get(s.key);
      const aVal = col?.sortValue
        ? col.sortValue(a)
        : (a as unknown as Record<string, unknown>)[s.key];
      const bVal = col?.sortValue
        ? col.sortValue(b)
        : (b as unknown as Record<string, unknown>)[s.key];
      const cmp = compareValues(aVal, bVal, s.dir);
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

export function filterData<T extends { id: string }>(
  data: T[],
  filters: FilterRule[],
): T[] {
  let result = data;
  for (const f of filters) {
    result = result.filter((row) => evaluateFilter(row as unknown as Record<string, unknown>, f));
  }
  return result;
}

export function searchData<T extends { id: string }>(
  data: T[],
  search: string,
  columns: ColDef<T>[],
): T[] {
  if (!search.trim()) return data;
  const q = search.toLowerCase();

  // Columns eligible for search: those with searchable=true, or type='text' by default
  const searchCols = columns.filter((c) =>
    c.searchable === true || (c.searchable !== false && (c.type === 'text' || c.type === 'select'))
  );

  return data.filter((row) => {
    const record = row as unknown as Record<string, unknown>;
    return searchCols.some((col) => {
      const val = col.sortValue ? col.sortValue(row) : record[col.key];
      if (val == null) return false;
      if (Array.isArray(val)) return val.some((v) => String(v).toLowerCase().includes(q));
      return String(val).toLowerCase().includes(q);
    });
  });
}

/* ── localStorage persistence ──────────────────────────────────────────── */

export function loadTableState(storageKey: string): Partial<PersistedTableState> | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedTableState>;
  } catch {
    return null;
  }
}

export function saveTableState(storageKey: string, state: PersistedTableState) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch { /* quota exceeded */ }
}

/* ── CSV export ────────────────────────────────────────────────────────── */

export function generateCsvBlob<T extends { id: string }>(
  columns: ColDef<T>[],
  data: T[],
): Blob {
  const header = columns.map((c) => c.label);
  const rows = data.map((row) => {
    return columns.map((col) => {
      const val = (row as unknown as Record<string, unknown>)[col.key];
      if (val == null) return '';
      if (Array.isArray(val)) return val.join('; ');
      if (typeof val === 'boolean') return val ? 'Yes' : 'No';
      if (col.type === 'date') return new Date(val as string).toLocaleDateString();
      return String(val);
    });
  });
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  return new Blob([csv], { type: 'text/csv' });
}

export function downloadCsv(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
