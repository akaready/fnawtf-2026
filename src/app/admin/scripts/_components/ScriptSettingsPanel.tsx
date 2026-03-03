'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Trash2, Check, X, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { DiscardChangesDialog } from '@/app/admin/_components/DiscardChangesDialog';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import type { AutoSaveStatus } from '@/app/admin/_hooks/useAutoSave';
import { updateScript, deleteScript } from '@/app/admin/actions';
import { createClient } from '@/lib/supabase/client';
import { AdminCombobox } from '../../_components/AdminCombobox';
import type { ScriptRow, ScriptStatus } from '@/types/scripts';

interface Props {
  open: boolean;
  onClose: () => void;
  script: ScriptRow & { project?: { id: string; title: string } | null };
  onScriptChange: (script: ScriptRow & { project?: { id: string; title: string } | null }) => void;
}

const STATUS_OPTIONS: { id: string; label: string }[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'review', label: 'In Review' },
  { id: 'locked', label: 'Locked' },
];

export function ScriptSettingsPanel({ open, onClose, script, onScriptChange }: Props) {
  const [title, setTitle] = useState(script.title);
  const [status, setStatus] = useState(script.status);
  const [notes, setNotes] = useState(script.notes ?? '');
  const [projectSearch, setProjectSearch] = useState('');
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setTitle(script.title);
    setStatus(script.status);
    setNotes(script.notes ?? '');
    setConfirmDelete(false);
  }, [script]);

  // Dirty detection
  const isDirty = useMemo(() => {
    return (
      title !== script.title ||
      status !== script.status ||
      (notes ?? '') !== (script.notes ?? '')
    );
  }, [title, status, notes, script]);

  // Close guard
  const handleClose = useCallback(() => {
    if (isDirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleDiscard = useCallback(() => {
    setTitle(script.title);
    setStatus(script.status);
    setNotes(script.notes ?? '');
    setConfirmClose(false);
    onClose();
  }, [script, onClose]);

  // Search projects
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase
      .from('projects')
      .select('id, title')
      .order('title')
      .then(({ data }) => setProjects(data ?? []));
  }, [open]);

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const dotStatus: AutoSaveStatus = saving ? 'saving' : 'idle';

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateScript(script.id, { title, status, notes: notes || null });
      onScriptChange({ ...script, title, status, notes: notes || null });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleProjectAssign = async (projectId: string | null) => {
    const project = projectId ? projects.find(p => p.id === projectId) ?? null : null;
    await updateScript(script.id, { project_id: projectId });
    onScriptChange({ ...script, project_id: projectId, project });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteScript(script.id);
      router.push('/admin/scripts');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[420px]">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border bg-admin-bg-sidebar">
          <h2 className="text-admin-lg font-bold text-admin-text-primary">Script Settings</h2>
          <SaveDot status={dotStatus} />
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors" title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto admin-scrollbar p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="admin-label">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="admin-input w-full"
            />
          </div>

          {/* Status */}
          <div>
            <label className="admin-label">Status</label>
            <AdminCombobox
              value={status}
              options={STATUS_OPTIONS}
              onChange={(v) => { if (v) setStatus(v as ScriptStatus); }}
              nullable={false}
              placeholder="Select status"
              searchable={false}
            />
          </div>

          {/* Project assignment */}
          <div>
            <label className="admin-label">Project</label>
            {script.project_id ? (
              <div className="flex items-center gap-2">
                <span className="text-admin-base text-admin-text-primary">
                  {script.project?.title ?? 'Unknown project'}
                </span>
                <button
                  onClick={() => handleProjectAssign(null)}
                  className="w-6 h-6 flex items-center justify-center rounded text-admin-danger/60 hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
                  title="Unlink project"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ) : (
              <div>
                <input
                  value={projectSearch}
                  onChange={e => setProjectSearch(e.target.value)}
                  placeholder="Search projects…"
                  className="admin-input w-full mb-2"
                />
                <div className="max-h-40 overflow-y-auto admin-scrollbar border border-admin-border-subtle rounded-lg">
                  {filteredProjects.slice(0, 10).map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleProjectAssign(p.id)}
                      className="w-full text-left px-3 py-2 text-admin-base text-admin-text-secondary hover:bg-admin-bg-hover transition-colors border-b border-admin-border-subtle last:border-0"
                    >
                      {p.title}
                    </button>
                  ))}
                  {filteredProjects.length === 0 && (
                    <p className="px-3 py-2 text-admin-base text-admin-text-faint">No projects found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="admin-label">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Internal notes about this script…"
              rows={4}
              className="admin-input w-full resize-none"
            />
          </div>

          {/* Version info */}
          <div className="text-admin-sm text-admin-text-faint">
            Version {script.version} · Created {new Date(script.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Footer action bar — matches CompanyPanel pattern */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border bg-admin-bg-wash">
          <button onClick={handleSave} className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm">
            <Save size={14} />
            Save
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <span className="text-admin-sm text-admin-danger mr-1">Delete?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-danger hover:bg-admin-danger-bg transition-colors"
                title="Confirm delete"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-danger/60 hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
              title="Delete script"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Discard changes dialog */}
        <DiscardChangesDialog
          open={confirmClose}
          onKeepEditing={() => setConfirmClose(false)}
          onDiscard={handleDiscard}
        />
      </div>
    </PanelDrawer>
  );
}
