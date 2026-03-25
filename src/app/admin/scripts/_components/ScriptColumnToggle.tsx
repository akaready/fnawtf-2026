'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import type { ScriptColumnConfig } from '@/types/scripts';

interface Props {
  config: ScriptColumnConfig;
  onChange: (config: ScriptColumnConfig) => void;
  /** Show only colored dots without labels */
  compact?: boolean;
  /** Keys to hide from the toggle (e.g. ['storyboard'] in presentation mode) */
  exclude?: (keyof ScriptColumnConfig)[];
  /** Custom column order — enables drag-to-reorder when provided */
  columnOrder?: string[];
  /** Called when columns are reordered via drag */
  onColumnOrderChange?: (order: string[]) => void;
}

const columns: { key: keyof ScriptColumnConfig; label: string; color: string; rawColor: string }[] = [
  { key: 'audio',      label: 'Audio',      color: 'bg-[var(--admin-accent)]',  rawColor: 'var(--admin-accent)' },
  { key: 'visual',     label: 'Visual',     color: 'bg-[var(--admin-info)]',    rawColor: 'var(--admin-info)' },
  { key: 'notes',      label: 'Notes',      color: 'bg-[var(--admin-warning)]', rawColor: 'var(--admin-warning)' },
  { key: 'reference',  label: 'Reference',  color: 'bg-[var(--admin-danger)]',  rawColor: 'var(--admin-danger)' },
  { key: 'storyboard', label: 'Storyboard', color: 'bg-[var(--admin-success)]', rawColor: 'var(--admin-success)' },
  { key: 'comments',   label: 'Comments',   color: 'bg-[var(--admin-cream)]',   rawColor: 'var(--admin-cream)' },
];

const columnMap = Object.fromEntries(columns.map(c => [c.key, c]));

export function ScriptColumnToggle({ config, onChange, compact, exclude, columnOrder, onColumnOrderChange }: Props) {
  const isDraggable = !!columnOrder && !!onColumnOrderChange;

  // Order columns by columnOrder when provided, else default
  const orderedColumns = columnOrder
    ? columnOrder.map(k => columnMap[k]).filter(Boolean)
    : columns;

  const visibleColumns = exclude ? orderedColumns.filter(c => !exclude.includes(c.key)) : orderedColumns;

  const toggle = (key: keyof ScriptColumnConfig) => {
    const next = { ...config, [key]: !config[key] };
    const anyOn = (Object.keys(next) as (keyof ScriptColumnConfig)[]).some(k => next[k]);
    if (!anyOn) return;
    onChange(next);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && columnOrder && onColumnOrderChange) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      onColumnOrderChange(arrayMove(columnOrder, oldIndex, newIndex));
    }
  };

  if (compact) {
    const dotItems = visibleColumns.map(c => c.key);

    const inner = (
      <div className="flex items-center gap-0 md:gap-1 overflow-hidden min-w-0">
        {visibleColumns.map(({ key, label, color, rawColor }) =>
          isDraggable ? (
            <SortableDot
              key={key}
              id={key}
              rawColor={rawColor}
              isActive={config[key]}
              label={label}
              onClick={() => toggle(key)}
            />
          ) : (
            <div key={key} className="relative group/dot">
              <button
                onClick={() => toggle(key)}
                className="flex items-center justify-center w-6 h-6 md:w-[30px] md:h-[30px] rounded-lg transition-all duration-200 hover:bg-admin-bg-hover"
              >
                <span className={`block w-2.5 h-2.5 rounded-full transition-colors ${config[key] ? color : 'bg-admin-text-ghost'}`} />
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-admin-sm font-medium text-admin-text-primary bg-admin-bg-raised border border-admin-border rounded whitespace-nowrap opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none z-30">
                {label}
              </span>
            </div>
          )
        )}
      </div>
    );

    if (isDraggable) {
      return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToParentElement]}>
          <SortableContext items={dotItems} strategy={horizontalListSortingStrategy}>
            {inner}
          </SortableContext>
        </DndContext>
      );
    }

    return inner;
  }

  // Non-compact mode (labels visible)
  const labelItems = visibleColumns.map(c => c.key);

  const labelInner = (
    <div className="flex items-center gap-1 overflow-hidden">
      {visibleColumns.map(({ key, label, color }) =>
        isDraggable ? (
          <SortableLabel
            key={key}
            id={key}
            label={label}
            color={color}
            isActive={config[key]}
            onClick={() => toggle(key)}
          />
        ) : (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-admin-sm font-medium transition-colors ${
              config[key]
                ? 'bg-admin-bg-active text-admin-text-primary'
                : 'text-admin-text-ghost hover:text-admin-text-muted'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${config[key] ? color : 'bg-admin-text-ghost'}`} />
            {label}
          </button>
        )
      )}
    </div>
  );

  if (isDraggable) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToParentElement]}>
        <SortableContext items={labelItems} strategy={horizontalListSortingStrategy}>
          {labelInner}
        </SortableContext>
      </DndContext>
    );
  }

  return labelInner;
}

// ── Sortable dot (compact mode) ─────────────────────────────────────────

function SortableDot({ id, rawColor, isActive, label, onClick }: {
  id: string;
  rawColor: string;
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group/dot">
      <button
        onClick={onClick}
        className="flex items-center justify-center w-6 h-6 md:w-[30px] md:h-[30px] rounded-lg transition-all duration-200 hover:bg-admin-bg-hover cursor-grab active:cursor-grabbing"
      >
        <span
          className={`block w-2.5 h-2.5 rounded-full transition-opacity ${isActive ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
          style={{ backgroundColor: rawColor }}
        />
      </button>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-admin-sm font-medium text-admin-text-primary bg-admin-bg-raised border border-admin-border rounded whitespace-nowrap opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none z-30">
        {label}
      </span>
    </div>
  );
}

// ── Sortable label (non-compact mode) ───────────────────────────────────

function SortableLabel({ id, label, color, isActive, onClick }: {
  id: string;
  label: string;
  color: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-admin-sm font-medium transition-colors cursor-grab active:cursor-grabbing ${
        isActive
          ? 'bg-admin-bg-active text-admin-text-primary'
          : 'text-admin-text-ghost hover:text-admin-text-muted'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${isActive ? color : 'bg-admin-text-ghost'}`} />
      {label}
    </button>
  );
}
