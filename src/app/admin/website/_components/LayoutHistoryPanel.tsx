'use client';

import { useState, useEffect } from 'react';
import { X, RotateCcw, Check, Loader2 } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { TwoStateDeleteButton } from '@/app/admin/_components/TwoStateDeleteButton';
import { getLayoutSnapshots, restoreLayoutSnapshot, updateSnapshotLabel, deleteLayoutSnapshot } from '@/app/admin/actions';
import type { LayoutSnapshot } from '@/types/placement';

interface LayoutHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  onRestore: () => void;
}

export function LayoutHistoryPanel({ open, onClose, onRestore }: LayoutHistoryPanelProps) {
  const [snapshots, setSnapshots] = useState<LayoutSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState('');

  useEffect(() => {
    if (open) {
      setLoading(true);
      getLayoutSnapshots()
        .then(setSnapshots)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleDelete = async (id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    setConfirmDeleteId(null);
    deleteLayoutSnapshot(id).catch(console.error);
  };

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    setConfirmRestoreId(null);
    try {
      await restoreLayoutSnapshot(id);
      onRestore();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setRestoringId(null);
    }
  };

  const handleLabelSave = async (id: string) => {
    const trimmed = editingLabelValue.trim();
    setSnapshots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, label: trimmed || null } : s)),
    );
    setEditingLabelId(null);
    updateSnapshotLabel(id, trimmed).catch(console.error);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[420px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border bg-admin-bg-sidebar">
          <h2 className="text-admin-lg font-semibold text-admin-text-primary">Layout History</h2>
          <button
            onClick={onClose}
            className="btn-ghost w-8 h-8"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto admin-scrollbar px-6 py-5 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-admin-text-muted" />
            </div>
          ) : snapshots.length === 0 ? (
            <p className="text-admin-sm text-admin-text-muted text-center py-12">
              No snapshots yet — save your current layout to create one.
            </p>
          ) : (
            snapshots.map((snap) => {
              const count = snap.placements.length;
              const isRestoring = restoringId === snap.id;

              return (
                <div
                  key={snap.id}
                  className="group/snap flex items-start gap-3 px-3 py-3 -mx-3 rounded-lg hover:bg-admin-bg-hover transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    {/* Timestamp */}
                    <p className="text-admin-sm text-admin-text-primary">
                      {formatDate(snap.created_at)}
                    </p>

                    {/* Label — click to edit */}
                    {editingLabelId === snap.id ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          autoFocus
                          value={editingLabelValue}
                          onChange={(e) => setEditingLabelValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleLabelSave(snap.id);
                            if (e.key === 'Escape') setEditingLabelId(null);
                          }}
                          placeholder="Add a label..."
                          className="flex-1 min-w-0 bg-transparent border-b border-admin-border text-admin-sm text-admin-text-primary placeholder:text-admin-text-faint focus:outline-none focus:border-admin-border-emphasis py-0.5"
                        />
                        <button
                          onClick={() => handleLabelSave(snap.id)}
                          className="btn-ghost w-6 h-6 text-admin-success"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingLabelId(null)}
                          className="btn-ghost w-6 h-6"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingLabelId(snap.id);
                          setEditingLabelValue(snap.label ?? '');
                        }}
                        className="text-admin-sm text-admin-text-muted hover:text-admin-text-primary transition-colors mt-0.5 text-left"
                      >
                        {snap.label || 'Add label...'}
                      </button>
                    )}

                    {/* Meta */}
                    <p className="text-admin-sm text-admin-text-faint mt-0.5">
                      {snap.created_by} &middot; {count} placement{count !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center flex-shrink-0 pt-0.5">
                    {/* Restore — two-state */}
                    {isRestoring ? (
                      <div className="w-8 h-8 flex items-center justify-center">
                        <Loader2 size={13} className="animate-spin text-admin-text-muted" />
                      </div>
                    ) : confirmRestoreId === snap.id ? (
                      <div className="flex items-center">
                        <button
                          onClick={() => handleRestore(snap.id)}
                          className="w-8 h-8 flex items-center justify-center text-admin-success hover:text-emerald-300 transition-colors"
                          title="Confirm restore"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmRestoreId(null)}
                          className="w-8 h-8 flex items-center justify-center text-admin-text-faint hover:text-admin-text-primary transition-colors"
                          title="Cancel"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmRestoreId(snap.id);
                          setConfirmDeleteId(null);
                        }}
                        className="btn-ghost w-8 h-8 opacity-0 group-hover/snap:opacity-100 transition-opacity"
                        title="Restore this layout"
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}

                    {/* Delete */}
                    <TwoStateDeleteButton
                      itemId={snap.id}
                      confirmId={confirmDeleteId}
                      onRequestConfirm={(id) => {
                        setConfirmDeleteId(id);
                        setConfirmRestoreId(null);
                      }}
                      onConfirmDelete={handleDelete}
                      onCancel={() => setConfirmDeleteId(null)}
                      hideUntilHover
                      groupName="snap"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PanelDrawer>
  );
}
