'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import {
  ArrowUpDown, ChevronUp, ChevronDown, ChevronRight,
  ArrowUpAZ, ListFilter, Layers, Eye,
  GripVertical, MoreHorizontal, Plus, Check, Minus,
  Rows, Palette, Snowflake,
} from 'lucide-react';

import type { AdminDataTableProps, ColDef } from './types';
import { useTableState } from './useTableState';
import { sortData, filterData, searchData, generateCsvBlob, downloadCsv } from './tableUtils';

import { ToolbarButton } from './TableToolbar';
import { SortPanel } from './SortPanel';
import { FilterPanel } from './FilterPanel';
import { GroupPanel } from './GroupPanel';
import { FieldsPanel } from './FieldsPanel';

import { EditableTextCell } from './cells/EditableTextCell';
import { EditableNumberCell } from './cells/EditableNumberCell';
import { ToggleCell } from './cells/ToggleCell';
import { SelectCell } from './cells/SelectCell';
import { EditableTagsCell } from './cells/EditableTagsCell';

/* ── Default cell renderer (type-driven) ──────────────────────────────── */

function DefaultCell<T extends { id: string }>({ col, row }: { col: ColDef<T>; row: T }) {
  const record = row as unknown as Record<string, unknown>;
  const val = record[col.key];

  switch (col.type) {
    case 'text':
      return (
        <EditableTextCell
          value={String(val ?? '')}
          rowId={row.id}
          field={col.key}
          onEdit={col.onEdit}
          mono={col.mono}
        />
      );
    case 'number':
      return (
        <EditableNumberCell
          value={val as number | null}
          rowId={row.id}
          field={col.key}
          onEdit={col.onEdit}
        />
      );
    case 'toggle':
      return (
        <ToggleCell
          value={val as boolean}
          rowId={row.id}
          field={col.key}
          onEdit={col.onEdit}
          labelTrue={col.toggleLabels?.[0] ?? 'Yes'}
          labelFalse={col.toggleLabels?.[1] ?? 'No'}
          colorTrue={col.toggleColors?.[0] ?? 'bg-green-500/10 text-green-400'}
          colorFalse={col.toggleColors?.[1] ?? 'bg-white/5 text-[#515155]'}
        />
      );
    case 'select':
      return (
        <SelectCell
          value={String(val ?? '')}
          rowId={row.id}
          field={col.key}
          options={col.options ?? []}
          onEdit={col.onEdit}
        />
      );
    case 'tags':
      return (
        <EditableTagsCell
          tags={val as string[] | null}
          rowId={row.id}
          field={col.key}
          suggestions={col.tagSuggestions}
          onEdit={col.onEdit}
        />
      );
    case 'date': {
      if (!val) return <span className="text-[#303033]">—</span>;
      const d = new Date(val as string);
      return <span className="text-muted-foreground text-xs tabular-nums">{d.toLocaleDateString()}</span>;
    }
    case 'thumbnail': {
      if (!val) return <span className="text-[#303033]">—</span>;
      return (
        <img
          src={val as string}
          alt=""
          className="w-8 h-8 rounded object-cover"
        />
      );
    }
    default:
      return <span className="text-muted-foreground truncate">{val != null ? String(val) : ''}</span>;
  }
}

/* ── AdminDataTable ───────────────────────────────────────────────────── */

export function AdminDataTable<T extends { id: string }>({
  data,
  columns,
  storageKey,
  toolbar: showToolbar,
  sortable,
  filterable,
  groupable: groupableFlag,
  columnVisibility,
  columnReorder,
  columnResize,
  selectable,
  freezePanes,
  exportCsv: _exportCsv,
  toolbarSlot,
  batchActions,
  rowActions,
  onRowClick,
  selectedId,
  emptyMessage = 'No items.',
  emptyAction,
  search,
  exportRef,
  className,
}: AdminDataTableProps<T>) {
  const state = useTableState(columns, storageKey);
  const {
    sorts, filters, groupField, collapsedGroups,
    colWidths, freezeCount, openPanel, hydrated,
    orderedVisibleCols, fieldsModified,
    setSorts, setFilters, setGroupField, setColWidths, setColOrder, setFreezeCount,
    togglePanel, closePanel,
    toggleColVisibility, showAllCols, hideAllCols,
    toggleCollapsedGroup, handleHeaderSort,
  } = state;

  /* ── Selection ───────────────────────────────────────────────────────── */

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Clear selection when data changes
  useEffect(() => { setSelected(new Set()); }, [data]);

  /* ── Processed data ──────────────────────────────────────────────────── */

  const searched = useMemo(() => searchData(data, search ?? '', columns), [data, search, columns]);
  const filtered = useMemo(() => filterData(searched, filters), [searched, filters]);
  const sorted = useMemo(() => sortData(filtered, sorts, columns), [filtered, sorts, columns]);

  const allSelected = sorted.length > 0 && selected.size === sorted.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(sorted.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  /* ── Grouping ────────────────────────────────────────────────────────── */

  const groups = useMemo(() => {
    if (!groupField) return null;
    const map = new Map<string, T[]>();
    for (const row of sorted) {
      const val = (row as unknown as Record<string, unknown>)[groupField];
      const label = val == null ? '(empty)' : typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val);
      const list = map.get(label) ?? [];
      list.push(row);
      map.set(label, list);
    }
    return map;
  }, [sorted, groupField]);

  /* ── Column resize ───────────────────────────────────────────────────── */

  const resizingRef = useRef(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const handleColResize = useCallback(
    (colKey: string, nextColKey: string | null, startX: number, startWidth: number, nextStartWidth: number) => {
      let didMove = false;
      const onMouseMove = (e: MouseEvent) => {
        didMove = true;
        resizingRef.current = true;
        const delta = e.clientX - startX;
        const newWidth = Math.max(40, startWidth + delta);
        setColWidths((prev) => {
          const next = { ...prev, [colKey]: newWidth };
          if (nextColKey) next[nextColKey] = Math.max(40, nextStartWidth - delta);
          return next;
        });
      };
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (didMove) setTimeout(() => { resizingRef.current = false; }, 0);
      };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [],
  );

  /* ── Column drag-and-drop ────────────────────────────────────────────── */

  const dragColRef = useRef<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);

  const handleColDragStart = useCallback((e: React.DragEvent, key: string) => {
    dragColRef.current = key;
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).style.opacity = '0.4';
  }, []);

  const handleColDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '';
    setDragOverColKey(null);
  }, []);

  const handleColDragOver = useCallback((e: React.DragEvent, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColKey(key);
  }, []);

  const handleColDrop = useCallback(
    (e: React.DragEvent, targetKey: string) => {
      e.preventDefault();
      setDragOverColKey(null);
      const sourceKey = dragColRef.current;
      if (!sourceKey || sourceKey === targetKey) return;

      // Capture widths before reorder
      const tableEl = tableRef.current;
      if (tableEl) {
        const headerRow = tableEl.querySelector('thead tr');
        if (headerRow) {
          const ths = Array.from(headerRow.querySelectorAll('th'));
          const offset = selectable ? 1 : 0;
          setColWidths((prev) => {
            const next = { ...prev };
            for (let i = offset; i < ths.length - (rowActions ? 1 : 0); i++) {
              const colIdx = i - offset;
              if (colIdx < orderedVisibleCols.length) {
                const key = orderedVisibleCols[colIdx].key;
                if (!next[key]) next[key] = ths[i].getBoundingClientRect().width;
              }
            }
            return next;
          });
        }
      }

      setColOrder((prev) => {
        const next = [...prev];
        const fromIdx = next.indexOf(sourceKey);
        const toIdx = next.indexOf(targetKey);
        if (fromIdx === -1 || toIdx === -1) return prev;
        next.splice(fromIdx, 1);
        next.splice(toIdx, 0, sourceKey);
        return next;
      });
    },
    [orderedVisibleCols, selectable, rowActions],
  );

  /* ── Freeze panes ────────────────────────────────────────────────────── */

  const [frozenOffsets, setFrozenOffsets] = useState<number[]>([]);
  const [freezeLineLeft, setFreezeLineLeft] = useState(0);

  // freezeCount semantics: -1 = off, 0 = just checkbox, 1+ = checkbox + N data cols
  const freezeActive = freezePanes && freezeCount >= 0;

  // Measure freeze offsets AND line position from the actual DOM after layout
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!freezeActive || !tableRef.current) {
      setFrozenOffsets((prev) => (prev.length === 0 ? prev : []));
      setFreezeLineLeft((prev) => (prev === 0 ? prev : 0));
      return;
    }
    const thead = tableRef.current.querySelector('thead tr');
    if (!thead) return;
    const ths = Array.from(thead.querySelectorAll('th'));
    const dataOffset = selectable ? 1 : 0;

    const offsets: number[] = [];
    let cumLeft = 0;

    // Checkbox column
    if (selectable && ths.length > 0) {
      offsets.push(0); // checkbox sticks at left=0
      cumLeft = ths[0].getBoundingClientRect().width;
    }

    // Data columns
    for (let i = 0; i < freezeCount && i < orderedVisibleCols.length; i++) {
      offsets.push(cumLeft);
      const thIdx = dataOffset + i;
      if (thIdx < ths.length) {
        cumLeft += ths[thIdx].getBoundingClientRect().width;
      }
    }

    // Only update state if values actually changed to avoid re-render loops
    setFrozenOffsets((prev) => {
      if (prev.length === offsets.length && prev.every((v, i) => v === offsets[i])) return prev;
      return offsets;
    });
    setFreezeLineLeft((prev) => (prev === cumLeft ? prev : cumLeft));
  }, [freezeActive, freezeCount, selectable, orderedVisibleCols, colWidths]);

  const thStickyBase: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    backgroundColor: '#141414',
    borderBottom: '1px solid #2a2a2a',
  };

  const stickyStyle = (offsetIdx: number, isHeader?: boolean): React.CSSProperties | undefined => {
    if (freezePanes && offsetIdx < frozenOffsets.length) {
      if (isHeader) {
        return { ...thStickyBase, left: frozenOffsets[offsetIdx], zIndex: 30, willChange: 'transform' };
      }
      return { position: 'sticky', left: frozenOffsets[offsetIdx], zIndex: 20, willChange: 'transform', backgroundColor: 'rgba(3, 3, 3, 0.25)' };
    }
    return isHeader ? thStickyBase : undefined;
  };

  const handleFreezeDrag = useCallback(
    (_startX: number) => {
      const onMouseMove = (e: MouseEvent) => {
        if (!tableRef.current) return;
        const thead = tableRef.current.querySelector('thead tr');
        if (!thead) return;
        const ths = Array.from(thead.querySelectorAll('th'));
        const scrollRect = tableRef.current.getBoundingClientRect();
        const relativeX = e.clientX - scrollRect.left;
        const dataOffset = selectable ? 1 : 0;
        let bestCount = 0;
        for (let i = 0; i < orderedVisibleCols.length; i++) {
          const thIdx = dataOffset + i;
          if (thIdx >= ths.length) break;
          const thRect = ths[thIdx].getBoundingClientRect();
          const thMid = (thRect.left - scrollRect.left) + thRect.width / 2;
          if (relativeX > thMid) bestCount = i + 1;
        }
        setFreezeCount(bestCount);
      };
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [orderedVisibleCols, selectable],
  );

  /* ── Measure header height (for scrollbar cover) ─────────────────────── */

  useLayoutEffect(() => {
    if (!tableRef.current) return;
    const thead = tableRef.current.querySelector('thead');
    if (thead) {
      const h = thead.getBoundingClientRect().height;
      setHeaderHeight((prev) => (prev === h ? prev : h));
    }
  }, [orderedVisibleCols]);

  /* ── CSV export ──────────────────────────────────────────────────────── */

  const handleExportCsv = useCallback(() => {
    const blob = generateCsvBlob(orderedVisibleCols, sorted);
    downloadCsv(blob, `export-${new Date().toISOString().slice(0, 10)}.csv`);
  }, [sorted, orderedVisibleCols]);

  useEffect(() => {
    if (exportRef) exportRef.current = handleExportCsv;
  }, [exportRef, handleExportCsv]);

  /* ── Col count ───────────────────────────────────────────────────────── */

  const visibleColCount = orderedVisibleCols.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  /* ── Don't render until hydrated (prevents flash) ────────────────────── */

  if (!hydrated) return null;

  /* ── Sort icon helper ────────────────────────────────────────────────── */

  const SortIcon = ({ colKey }: { colKey: string }) => {
    const rule = sorts.find((s) => s.key === colKey);
    if (!rule) return <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-40 transition-opacity" />;
    return rule.dir === 'asc'
      ? <ChevronUp size={10} className="text-accent" />
      : <ChevronDown size={10} className="text-accent" />;
  };

  /* ── Render cell ─────────────────────────────────────────────────────── */

  const renderCell = (col: ColDef<T>, row: T) => {
    if (col.render) return col.render(row);
    return <DefaultCell col={col} row={row} />;
  };

  /* ── Render row ──────────────────────────────────────────────────────── */

  const renderRow = (row: T) => (
    <tr
      key={row.id}
      onClick={() => onRowClick?.(row)}
      className={`border-b border-[#2a2a2a] transition-colors group ${
        onRowClick ? 'cursor-pointer' : ''
      } ${selectedId === row.id ? 'bg-white/[0.04]' : ''} ${
        selected.has(row.id) ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'
      }`}
    >
      {selectable && (
        <td className="w-10 px-4 py-3 align-middle" style={stickyStyle(0)}>
          <button
            onClick={(e) => { e.stopPropagation(); toggleOne(row.id); }}
            className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {selected.has(row.id)
              ? <div className="w-4 h-4 rounded bg-accent flex items-center justify-center"><Check size={11} strokeWidth={3} className="text-black" /></div>
              : <div className="w-4 h-4 rounded border border-[#444] hover:border-[#666] transition-colors" />}
          </button>
        </td>
      )}
      {orderedVisibleCols.map((col, idx) => {
        const isFrozen = freezePanes && idx < freezeCount;
        const frozenIdx = selectable ? 1 + idx : idx;
        const frozenStyle = isFrozen ? stickyStyle(frozenIdx) : undefined;
        const widthStyle = colWidths[col.key]
          ? { width: colWidths[col.key], minWidth: colWidths[col.key], maxWidth: colWidths[col.key] }
          : col.maxWidth ? { maxWidth: col.maxWidth } : undefined;
        const mergedStyle = { ...widthStyle, ...frozenStyle };
        const alignCls = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';

        return (
          <td
            key={col.key}
            className={`${col.type === 'thumbnail' ? 'px-2 py-3' : 'px-3 py-3'} overflow-hidden ${alignCls}`}
            style={Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined}
          >
            {renderCell(col, row)}
          </td>
        );
      })}
      {rowActions && rowActions.length > 0 && (
        <td className="px-2 py-3 text-right">
          <RowActionsMenu actions={rowActions} row={row} />
        </td>
      )}
    </tr>
  );

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className={`flex flex-col h-full ${className ?? ''}`}>
      {/* ── Toolbar ────────────────────────────────────────────────── */}
      {showToolbar && (
        <div className="@container flex flex-wrap items-center gap-1 px-6 @md:px-8 min-h-[53px] py-3 border-b border-[#2a2a2a] flex-shrink-0">
          {toolbarSlot}

          {/* Right-aligned toolbar buttons — Freeze, Fields, Filter, Group, Sort, Color, Row Height */}
          <div className="flex items-center gap-1 ml-auto flex-shrink-0">
            <ToolbarButton
              icon={Snowflake}
              label=""
              color="purple"
              disabled={!freezePanes}
              active={freezeActive}
              onClick={() => setFreezeCount(freezeActive ? -1 : 1)}
            />
            <div className="relative">
              <ToolbarButton
                icon={Eye}
                label=""
                color="blue"
                disabled={!columnVisibility}
                active={openPanel === 'fields' || fieldsModified}
                onClick={() => togglePanel('fields')}
              />
              {columnVisibility && openPanel === 'fields' && (
                <FieldsPanel
                  columns={columns}
                  visibleCols={state.visibleCols}
                  onToggle={toggleColVisibility}
                  onShowAll={showAllCols}
                  onHideAll={hideAllCols}
                  onClose={closePanel}
                />
              )}
            </div>
            <div className="relative">
              <ToolbarButton
                icon={ListFilter}
                label=""
                color="green"
                disabled={!filterable}
                active={openPanel === 'filter' || filters.length > 0}
                onClick={() => togglePanel('filter')}
              />
              {filterable && openPanel === 'filter' && (
                <FilterPanel columns={columns} filters={filters} onChange={setFilters} onClose={closePanel} />
              )}
            </div>
            <div className="relative">
              <ToolbarButton
                icon={Layers}
                label=""
                color="red"
                disabled={!groupableFlag}
                active={openPanel === 'group' || !!groupField}
                onClick={() => togglePanel('group')}
              />
              {groupableFlag && openPanel === 'group' && (
                <GroupPanel columns={columns} groupField={groupField} onChange={setGroupField} onClose={closePanel} />
              )}
            </div>
            <div className="relative">
              <ToolbarButton
                icon={ArrowUpAZ}
                label=""
                color="orange"
                disabled={!sortable}
                active={openPanel === 'sort' || sorts.length > 0}
                onClick={() => togglePanel('sort')}
              />
              {sortable && openPanel === 'sort' && (
                <SortPanel columns={columns} sorts={sorts} onChange={setSorts} onClose={closePanel} />
              )}
            </div>
            <ToolbarButton
              icon={Palette}
              label=""
              color="yellow"
              disabled
              active={false}
              onClick={() => {}}
            />
            <ToolbarButton
              icon={Rows}
              label=""
              color="neutral"
              disabled
              active={false}
              onClick={() => {}}
            />
          </div>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0">
        {/* Scrollbar cover behind sticky header */}
        {headerHeight > 0 && (
          <div
            className="absolute top-0 right-0 w-3 bg-[#141414] z-40 pointer-events-none border-b border-[#2a2a2a]"
            style={{ height: headerHeight - 0.5 }}
          />
        )}

        {/* Freeze line */}
        {freezeActive && (
          <div
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleFreezeDrag(e.clientX); }}
            className="absolute top-0 bottom-0 z-[35] cursor-col-resize group/freeze"
            style={{ left: freezeLineLeft - 7, width: 15 }}
          >
            <div className="absolute top-0 bottom-0 left-[7px] w-px bg-purple-500/60 group-hover/freeze:bg-purple-400 transition-colors" />
            <div className="absolute top-[4px] left-[3px] w-[9px] h-[28px] rounded-full bg-purple-500 group-hover/freeze:bg-purple-400 transition-colors" />
          </div>
        )}

        <div ref={tableRef} className="h-full overflow-auto admin-scrollbar">
          <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
            <thead className="bg-[#141414]">
              <tr>
                {/* Checkbox header */}
                {selectable && (
                  <th
                    className="w-10 px-4 py-3 align-middle bg-[#141414] border-b border-r border-[#2a2a2a]"
                    style={stickyStyle(0, true)}
                  >
                    <button
                      onClick={toggleAll}
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                    >
                      {allSelected
                        ? <div className="w-4 h-4 rounded bg-accent flex items-center justify-center"><Check size={11} strokeWidth={3} className="text-black" /></div>
                        : someSelected
                          ? <div className="w-4 h-4 rounded bg-accent/50 flex items-center justify-center"><Minus size={11} strokeWidth={3} className="text-black" /></div>
                          : <div className="w-4 h-4 rounded border border-[#444] hover:border-[#666] transition-colors" />}
                    </button>
                  </th>
                )}

                {/* Data headers */}
                {orderedVisibleCols.map((col, idx) => {
                  const nextCol = idx < orderedVisibleCols.length - 1 ? orderedVisibleCols[idx + 1] : null;
                  const isDragOver = columnReorder && dragOverColKey === col.key;
                  const isLast = idx === orderedVisibleCols.length - 1;
                  const frozenIdx = selectable ? 1 + idx : idx;
                  const frozenStyle = stickyStyle(frozenIdx, true);

                  const widthStyle = colWidths[col.key]
                    ? { width: colWidths[col.key], minWidth: colWidths[col.key] }
                    : col.maxWidth ? { maxWidth: col.maxWidth } : undefined;
                  const mergedStyle = { ...widthStyle, ...frozenStyle };

                  const dropProps = columnReorder
                    ? {
                        onDragOver: (e: React.DragEvent) => handleColDragOver(e, col.key),
                        onDrop: (e: React.DragEvent) => handleColDrop(e, col.key),
                      }
                    : {};

                  const gripHandle = columnReorder ? (
                    <span
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); handleColDragStart(e, col.key); }}
                      onDragEnd={handleColDragEnd}
                      className="opacity-0 group-hover/th:opacity-30 cursor-grab flex-shrink-0 -ml-1"
                    >
                      <GripVertical size={10} />
                    </span>
                  ) : null;

                  const resizeHandle = columnResize ? (
                    <span
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const th = e.currentTarget.closest('th')!;
                        const nextTh = th.nextElementSibling as HTMLElement | null;
                        handleColResize(
                          col.key,
                          nextCol?.key ?? null,
                          e.clientX,
                          th.getBoundingClientRect().width,
                          nextTh ? nextTh.getBoundingClientRect().width : 0,
                        );
                      }}
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/20 transition-colors z-10"
                    />
                  ) : null;

                  const thBase = `relative px-3 py-3 text-left text-xs uppercase tracking-wider text-[#616166] font-medium whitespace-nowrap border-b border-r border-[#2a2a2a] group/th ${
                    isLast && !rowActions ? 'border-r-0' : ''
                  } ${isDragOver ? 'border-l-2 border-l-accent' : ''}`;

                  if (sortable && col.sortable !== false) {
                    return (
                      <th
                        key={col.key}
                        className={`${thBase} cursor-pointer hover:text-[#999] transition-colors`}
                        style={Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined}
                        onClick={() => { if (!resizingRef.current) handleHeaderSort(col.key); }}
                        {...dropProps}
                      >
                        <span className="inline-flex items-center gap-1">
                          {gripHandle}
                          {col.label}
                          <SortIcon colKey={col.key} />
                        </span>
                        {resizeHandle}
                      </th>
                    );
                  }

                  return (
                    <th
                      key={col.key}
                      className={thBase}
                      style={Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined}
                      {...dropProps}
                    >
                      <span className="inline-flex items-center gap-1">
                        {gripHandle}
                        {col.label}
                      </span>
                      {resizeHandle}
                    </th>
                  );
                })}

                {/* Actions header */}
                {rowActions && rowActions.length > 0 && (
                  <th
                    className="w-10 px-2 py-3 text-right border-b border-[#2a2a2a]"
                    style={thStickyBase}
                  />
                )}
              </tr>
            </thead>

            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={visibleColCount} className="px-4 py-12 text-center text-[#404044] text-sm">
                    {emptyMessage}
                    {emptyAction && (
                      <button
                        onClick={emptyAction.onClick}
                        className="flex items-center gap-1 mx-auto mt-2 text-xs text-[#808080] hover:text-white transition-colors"
                      >
                        <Plus size={13} /> {emptyAction.label}
                      </button>
                    )}
                  </td>
                </tr>
              ) : groups ? (
                Array.from(groups.entries()).map(([label, rows]) => (
                  <React.Fragment key={label}>
                    <tr
                      className="border-b border-[#2a2a2a]/30 cursor-pointer hover:bg-white/[0.05] transition-colors"
                      style={{ backgroundColor: '#0a0a0a' }}
                      onClick={() => toggleCollapsedGroup(label)}
                    >
                      <td
                        colSpan={visibleColCount}
                        className="px-4 py-2"
                        style={freezeActive ? { position: 'sticky', left: 0, zIndex: 20, backgroundColor: '#0a0a0a' } : undefined}
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight
                            size={14}
                            className={`text-[#515155] transition-transform ${
                              collapsedGroups.has(label) ? '' : 'rotate-90'
                            }`}
                          />
                          <span className="text-xs font-medium text-foreground uppercase tracking-wider">{label}</span>
                          <span className="text-[10px] text-[#404044] tabular-nums">{rows.length}</span>
                        </div>
                      </td>
                    </tr>
                    {!collapsedGroups.has(label) && rows.map(renderRow)}
                  </React.Fragment>
                ))
              ) : (
                sorted.map(renderRow)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Batch action bar ─────────────────────────────────────── */}
      {selectable && batchActions && selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 bg-black border border-[#2a2a2a] rounded-xl shadow-[0_10px_40px_10px_rgba(0,0,0,0.5)]">
          <span className="text-sm text-muted-foreground mr-2">{selected.size} selected</span>
          {batchActions.map((action, i) => (
            <React.Fragment key={i}>
              {i > 0 && action.variant === 'danger' && (
                <div className="w-px h-5 bg-[#2a2a2a] mx-1" />
              )}
              <button
                onClick={() => action.onClick(Array.from(selected), sorted.filter((r) => selected.has(r.id)))}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  action.variant === 'danger'
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                    : 'bg-white/[0.08] hover:bg-white/[0.12] text-foreground'
                }`}
              >
                {action.icon} <span className="hidden sm:inline">{action.label}</span>
              </button>
            </React.Fragment>
          ))}
          <button
            onClick={() => setSelected(new Set())}
            className="ml-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Row actions dropdown ──────────────────────────────────────────────── */

function RowActionsMenu<T extends { id: string }>({
  actions,
  row,
}: {
  actions: import('./types').RowAction<T>[];
  row: T;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (actions.length === 1) {
    const a = actions[0];
    return (
      <button
        onClick={(e) => { e.stopPropagation(); a.onClick(row, e); }}
        className={`p-1 rounded transition-colors ${
          a.variant === 'danger'
            ? 'text-[#404044] hover:text-red-400 hover:bg-red-500/10'
            : 'text-[#404044] hover:text-foreground hover:bg-white/5'
        }`}
        title={a.label}
      >
        {a.icon}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1 rounded text-[#404044] hover:text-foreground hover:bg-white/5 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border-2 border-[#2a2a2a] rounded-xl shadow-[0_10px_40px_10px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-dropdown-in min-w-[140px]">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); a.onClick(row, e); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                a.variant === 'danger'
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-[#999] hover:bg-white/[0.06] hover:text-white/90'
              }`}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
