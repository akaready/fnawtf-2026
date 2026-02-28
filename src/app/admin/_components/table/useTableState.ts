import { useState, useMemo, useEffect, useCallback } from 'react';
import type { ColDef, SortRule, FilterRule } from './types';
import { loadTableState, saveTableState } from './tableUtils';

export function useTableState<T extends { id: string }>(
  columns: ColDef<T>[],
  storageKey?: string,
) {
  const allKeys = useMemo(() => columns.map((c) => c.key), [columns]);

  const defaultVisibleCols = useMemo(
    () => new Set(columns.filter((c) => c.defaultVisible !== false).map((c) => c.key)),
    [columns],
  );

  const [sorts, setSorts] = useState<SortRule[]>([]);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [groupField, setGroupField] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<Set<string>>(defaultVisibleCols);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [colOrder, setColOrder] = useState<string[]>(allKeys);
  const [freezeCount, setFreezeCount] = useState(-1);
  const [openPanel, setOpenPanel] = useState<'sort' | 'filter' | 'group' | 'fields' | null>(null);
  const [hydrated, setHydrated] = useState(!storageKey); // no storage key = already hydrated

  // ── Restore from localStorage ──────────────────────────────────────────
  useEffect(() => {
    if (!storageKey) return;
    const saved = loadTableState(storageKey);
    if (saved) {
      if (saved.sorts) setSorts(saved.sorts);
      if (saved.filters) setFilters(saved.filters);
      if (saved.groupField !== undefined) setGroupField(saved.groupField);
      if (saved.collapsedGroups) setCollapsedGroups(new Set(saved.collapsedGroups));
      if (saved.visibleCols && saved.visibleCols.length > 0) setVisibleCols(new Set(saved.visibleCols));
      if (saved.colWidths) setColWidths(saved.colWidths);
      if (saved.freezeCount != null) {
        // -1 = off, 0 = just checkbox, 1+ = checkbox + N data cols
        // Migrate old 0 (was "off") to -1
        const fc = saved.freezeCount === 0 ? -1 : saved.freezeCount;
        setFreezeCount(Math.min(fc, (saved.visibleCols ?? []).length));
      }
      if (saved.colOrder && saved.colOrder.length > 0) {
        // Merge: use saved order but append any new columns not in saved state
        const savedSet = new Set(saved.colOrder);
        const merged = [
          ...saved.colOrder.filter((k) => allKeys.includes(k)),
          ...allKeys.filter((k) => !savedSet.has(k)),
        ];
        setColOrder(merged);
      }
    }
    setHydrated(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist to localStorage on change ──────────────────────────────────
  useEffect(() => {
    if (!hydrated || !storageKey) return;
    saveTableState(storageKey, {
      sorts,
      filters,
      groupField,
      collapsedGroups: Array.from(collapsedGroups),
      visibleCols: Array.from(visibleCols),
      colWidths,
      colOrder,
      freezeCount,
    });
  }, [hydrated, storageKey, sorts, filters, groupField, collapsedGroups, visibleCols, colWidths, colOrder, freezeCount]);

  // ── Derived: ordered visible columns ───────────────────────────────────
  const orderedVisibleCols = useMemo(() => {
    const colMap = new Map(columns.map((c) => [c.key, c]));
    return colOrder
      .filter((k) => visibleCols.has(k) && colMap.has(k))
      .map((k) => colMap.get(k)!);
  }, [columns, colOrder, visibleCols]);

  // ── Convenience setters ────────────────────────────────────────────────
  const togglePanel = useCallback((panel: typeof openPanel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  }, []);

  const closePanel = useCallback(() => setOpenPanel(null), []);

  const toggleColVisibility = useCallback((key: string) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const showAllCols = useCallback(() => {
    setVisibleCols(new Set(allKeys));
  }, [allKeys]);

  const hideAllCols = useCallback(() => {
    setVisibleCols(new Set());
  }, []);

  const toggleCollapsedGroup = useCallback((label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }, []);

  const handleHeaderSort = useCallback((key: string) => {
    setSorts((prev) => {
      if (prev.length === 1 && prev[0].key === key) {
        return [{ key, dir: prev[0].dir === 'asc' ? 'desc' : 'asc' }];
      }
      return [{ key, dir: 'asc' }];
    });
  }, []);

  const fieldsModified = visibleCols.size < columns.length;

  return {
    // State
    sorts,
    filters,
    groupField,
    collapsedGroups,
    visibleCols,
    colWidths,
    colOrder,
    freezeCount,
    openPanel,
    hydrated,
    fieldsModified,

    // Setters
    setSorts,
    setFilters,
    setGroupField,
    setCollapsedGroups,
    setVisibleCols,
    setColWidths,
    setColOrder,
    setFreezeCount,

    // Actions
    togglePanel,
    closePanel,
    toggleColVisibility,
    showAllCols,
    hideAllCols,
    toggleCollapsedGroup,
    handleHeaderSort,

    // Derived
    orderedVisibleCols,
  };
}
