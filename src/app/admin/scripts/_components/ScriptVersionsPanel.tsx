'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import { X, Check, Pencil, Eye, EyeOff, Table2, StickyNote, CopyPlus, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { TwoStateDeleteButton } from '@/app/admin/_components/TwoStateDeleteButton';
import {
  getScriptVersions,
  updateScript,
  createScriptVersion,
  publishScriptVersion,
  unpublishScriptVersion,
  deleteScriptVersion,
  reorderScriptVersions,
} from '@/app/admin/actions';
import { formatScriptVersion, versionColor } from '@/types/scripts';

// ── Types ────────────────────────────────────────────────────────────────

interface VersionRow {
  id: string;
  title: string;
  version: number;
  status: string;
  created_at: string;
  content_mode: string;
  major_version: number;
  minor_version: number;
  is_published: boolean;
  display_order: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  scriptId: string;
  scriptGroupId: string;
  onNavigate: (versionId: string) => void;
}

// ── Sortable Card ────────────────────────────────────────────────────────

function SortableVersionCard({
  v,
  isCurrent,
  isEditing,
  editTitle,
  editMajor,
  editMinor,
  confirmDeleteId,
  duplicatingId,
  versionsCount,
  onEditTitleChange,
  onEditMajorChange,
  onEditMinorChange,
  onEditKeyDown,
  onStartEditing,
  onCancelEditing,
  onSaveEdits,
  onDuplicate,
  onTogglePublish,
  onRequestDeleteConfirm,
  onConfirmDelete,
  onCancelDelete,
  onNavigate,
}: {
  v: VersionRow;
  isCurrent: boolean;
  isEditing: boolean;
  editTitle: string;
  editMajor: string;
  editMinor: string;
  confirmDeleteId: string | null;
  duplicatingId: string | null;
  versionsCount: number;
  onEditTitleChange: (val: string) => void;
  onEditMajorChange: (val: string) => void;
  onEditMinorChange: (val: string) => void;
  onEditKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onStartEditing: (v: VersionRow) => void;
  onCancelEditing: () => void;
  onSaveEdits: (id: string) => void;
  onDuplicate: (id: string) => void;
  onTogglePublish: (v: VersionRow) => void;
  onRequestDeleteConfirm: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onNavigate: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: v.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };
  const color = versionColor(v.major_version);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-admin-lg border transition-colors cursor-grab active:cursor-grabbing ${
        isCurrent
          ? 'bg-admin-bg-active border-admin-border'
          : 'bg-admin-bg-overlay border-admin-border-subtle hover:border-admin-border hover:bg-admin-bg-hover'
      }`}
      onClick={() => {
        if (isEditing) return;
        onNavigate(v.id);
      }}
    >
      {/* Row 1: Pill + Title + Status */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-1">
        {/* Version pill */}
        <span
          className="font-admin-mono font-bold px-2.5 py-0.5 rounded-full text-admin-sm flex-shrink-0"
          style={{ backgroundColor: color + '20', color }}
        >
          {isEditing ? (
            <span className="flex items-center gap-0.5" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
              <input
                value={editMajor}
                onChange={e => onEditMajorChange(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => onEditKeyDown(e, v.id)}
                className="w-6 bg-transparent border-b border-current text-center outline-none"
              />
              <span>.</span>
              <input
                value={editMinor}
                onChange={e => onEditMinorChange(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => onEditKeyDown(e, v.id)}
                className="w-6 bg-transparent border-b border-current text-center outline-none"
              />
            </span>
          ) : (
            formatScriptVersion(v.major_version, v.minor_version, v.is_published)
          )}
        </span>

        {/* Title */}
        <div className="flex-1 min-w-0" onClick={e => isEditing && e.stopPropagation()} onPointerDown={e => isEditing && e.stopPropagation()}>
          {isEditing ? (
            <input
              value={editTitle}
              onChange={e => onEditTitleChange(e.target.value)}
              onKeyDown={e => onEditKeyDown(e, v.id)}
              className="admin-input w-full text-admin-sm py-1"
              autoFocus
            />
          ) : (
            <span className="text-admin-sm text-admin-text-primary font-medium truncate block">
              {v.title}
            </span>
          )}
        </div>

        {/* Status badge */}
        {v.is_published ? (
          <span className="text-admin-sm font-medium text-admin-success flex-shrink-0">Published</span>
        ) : (
          <span className="text-admin-sm text-admin-text-faint flex-shrink-0">Draft</span>
        )}
      </div>

      {/* Row 2: Meta + Actions */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-1">
        {/* Meta info */}
        <div className="flex items-center gap-3 text-admin-sm text-admin-text-ghost flex-1">
          <span className="flex items-center gap-1.5 font-admin-mono">
            <Calendar size={12} />
            {new Date(v.created_at).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1.5">
            {v.content_mode === 'scratchpad' ? <StickyNote size={12} /> : <Table2 size={12} />}
            {v.content_mode === 'scratchpad' ? 'Scratch' : 'Table'}
          </span>
          {isCurrent && (
            <span className="text-admin-text-faint">Current</span>
          )}
        </div>

        {/* Action buttons — always visible */}
        <div
          className="flex items-center gap-1 flex-shrink-0"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          {isEditing ? (
            <>
              <button
                onClick={() => onSaveEdits(v.id)}
                className="w-8 h-8 flex items-center justify-center text-admin-success hover:text-green-300 transition-colors"
                title="Save"
              >
                <Check size={14} />
              </button>
              <button
                onClick={onCancelEditing}
                className="w-8 h-8 flex items-center justify-center text-admin-text-faint hover:text-admin-text-primary transition-colors"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onDuplicate(v.id)}
                disabled={duplicatingId !== null}
                className="w-8 h-8 flex items-center justify-center text-admin-text-ghost hover:text-admin-text-primary transition-colors"
                title="New version from this"
              >
                <CopyPlus size={14} />
              </button>
              <button
                onClick={() => onStartEditing(v)}
                className="w-8 h-8 flex items-center justify-center text-admin-text-ghost hover:text-admin-text-primary transition-colors"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onTogglePublish(v)}
                className="w-8 h-8 flex items-center justify-center text-admin-text-ghost hover:text-admin-text-faint transition-colors"
                title={v.is_published ? 'Unpublish' : 'Publish'}
              >
                {v.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <TwoStateDeleteButton
                itemId={v.id}
                confirmId={confirmDeleteId}
                onRequestConfirm={onRequestDeleteConfirm}
                onConfirmDelete={onConfirmDelete}
                onCancel={onCancelDelete}
                disabled={isCurrent || versionsCount <= 1}
                size={14}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────

export function ScriptVersionsPanel({
  open,
  onClose,
  scriptId,
  scriptGroupId,
  onNavigate,
}: Props) {
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMajor, setEditMajor] = useState('');
  const [editMinor, setEditMinor] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const router = useRouter();
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor));

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getScriptVersions(scriptGroupId);
      setVersions(data as unknown as VersionRow[]);
    } finally {
      setLoading(false);
    }
  }, [scriptGroupId]);

  useEffect(() => {
    if (open) {
      loadVersions();
      setEditingId(null);
      setConfirmDeleteId(null);
    }
  }, [open, loadVersions]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = versions.findIndex(v => v.id === active.id);
    const newIndex = versions.findIndex(v => v.id === over.id);
    const reordered = arrayMove(versions, oldIndex, newIndex).map((v, i) => ({
      ...v,
      display_order: i,
    }));

    setVersions(reordered);
    await reorderScriptVersions(reordered.map(v => v.id));
  }, [versions]);

  const handleTogglePublish = async (v: VersionRow) => {
    if (v.is_published) {
      await unpublishScriptVersion(v.id);
    } else {
      await publishScriptVersion(v.id);
    }
    await loadVersions();
  };

  const handleDelete = async (id: string) => {
    await deleteScriptVersion(id);
    setVersions(prev => prev.filter(v => v.id !== id));
    setConfirmDeleteId(null);
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const newId = await createScriptVersion(id);
      onClose();
      router.push(`/admin/scripts/${newId}`);
    } finally {
      setDuplicatingId(null);
    }
  };

  const startEditing = (v: VersionRow) => {
    setEditingId(v.id);
    setEditTitle(v.title);
    setEditMajor(String(v.major_version));
    setEditMinor(String(v.minor_version));
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEdits = async (id: string) => {
    const major = parseInt(editMajor, 10);
    const minor = parseInt(editMinor, 10);
    if (isNaN(major) || isNaN(minor)) return;
    await updateScript(id, {
      title: editTitle,
      major_version: major,
      minor_version: minor,
    });
    setVersions(prev => prev.map(v =>
      v.id === id ? { ...v, title: editTitle, major_version: major, minor_version: minor } : v
    ));
    setEditingId(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') saveEdits(id);
    if (e.key === 'Escape') cancelEditing();
  };

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[480px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border bg-admin-bg-sidebar">
          <h2 className="text-admin-lg font-bold text-admin-text-primary">Versions</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto admin-scrollbar px-6 py-4 space-y-3">
          {loading && versions.length === 0 && (
            <p className="py-6 text-admin-sm text-admin-text-faint text-center">Loading...</p>
          )}

          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={versions.map(v => v.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {versions.map(v => (
                  <SortableVersionCard
                    key={v.id}
                    v={v}
                    isCurrent={v.id === scriptId}
                    isEditing={editingId === v.id}
                    editTitle={editTitle}
                    editMajor={editMajor}
                    editMinor={editMinor}
                    confirmDeleteId={confirmDeleteId}
                    duplicatingId={duplicatingId}
                    versionsCount={versions.length}
                    onEditTitleChange={setEditTitle}
                    onEditMajorChange={setEditMajor}
                    onEditMinorChange={setEditMinor}
                    onEditKeyDown={handleEditKeyDown}
                    onStartEditing={startEditing}
                    onCancelEditing={cancelEditing}
                    onSaveEdits={saveEdits}
                    onDuplicate={handleDuplicate}
                    onTogglePublish={handleTogglePublish}
                    onRequestDeleteConfirm={setConfirmDeleteId}
                    onConfirmDelete={(id) => handleDelete(id)}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {versions.length === 0 && !loading && (
            <p className="py-6 text-admin-sm text-admin-text-faint text-center">No versions found.</p>
          )}
        </div>
      </div>
    </PanelDrawer>
  );
}
