'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { PanelFooter } from '@/app/admin/_components/PanelFooter';
import { TwoStateDeleteButton } from '@/app/admin/_components/TwoStateDeleteButton';
import { getScriptShares, createScriptShare, updateScriptShare, deleteScriptShare } from '@/app/admin/actions';
import type { ScriptShareRow } from '@/types/scripts';

interface ShareWithCount extends ScriptShareRow {
  view_count: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  scriptId: string;
  isPublished: boolean;
  /** Called when a share is created from an unpublished script — publishes first, returns true on success */
  onPublish: () => Promise<void>;
}

export function ScriptSharePanel({ open, onClose, scriptId, isPublished, onPublish }: Props) {
  const [shares, setShares] = useState<ShareWithCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadShares = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getScriptShares(scriptId);
      setShares(data as unknown as ShareWithCount[]);
    } finally {
      setLoading(false);
    }
  }, [scriptId]);

  useEffect(() => {
    if (open) loadShares();
  }, [open, loadShares]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      // Auto-publish if not yet published
      if (!isPublished) {
        await onPublish();
      }
      await createScriptShare(scriptId);
      await loadShares();
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (shareId: string, updates: { label?: string; notes?: string; access_code?: string; is_active?: boolean }) => {
    await updateScriptShare(shareId, updates);
    setShares(prev => prev.map(s => s.id === shareId ? { ...s, ...updates } as ShareWithCount : s));
  };

  const handleDelete = async (shareId: string) => {
    await deleteScriptShare(shareId);
    setShares(prev => prev.filter(s => s.id !== shareId));
    setConfirmDeleteId(null);
  };

  const copyLink = (token: string, shareId: string) => {
    navigator.clipboard.writeText(`https://fna.wtf/s/${token}`);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[420px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border bg-admin-bg-sidebar">
          <h2 className="text-admin-lg font-bold text-admin-text-primary">Share Links</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors" title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto admin-scrollbar p-6 space-y-4">
          {loading && shares.length === 0 && (
            <p className="text-admin-sm text-admin-text-faint">Loading...</p>
          )}

          {shares.map((share) => (
            <ShareRow
              key={share.id}
              share={share}
              copiedId={copiedId}
              confirmDeleteId={confirmDeleteId}
              onCopyLink={copyLink}
              onUpdate={handleUpdate}
              onRequestConfirm={setConfirmDeleteId}
              onConfirmDelete={handleDelete}
              onCancelDelete={() => setConfirmDeleteId(null)}
            />
          ))}

          {shares.length === 0 && !loading && (
            <div className="text-admin-sm text-admin-text-faint space-y-2">
              <p>No share links yet.</p>
              {!isPublished && (
                <p className="text-admin-text-muted">
                  Creating a share link will automatically publish this script as v1.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <PanelFooter
          onSave={handleCreate}
          saveLabel={creating ? 'Creating...' : (isPublished ? 'Create Share Link' : 'Publish & Share')}
          saveDisabled={creating}
          secondaryActions={
            <button
              onClick={() => window.open(`/s/preview/${scriptId}`, '_blank')}
              className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm"
            >
              <ExternalLink size={14} />
              Preview
            </button>
          }
        />
      </div>
    </PanelDrawer>
  );
}

// ── Individual share row ─────────────────────────────────────────────────

function ShareRow({
  share,
  copiedId,
  confirmDeleteId,
  onCopyLink,
  onUpdate,
  onRequestConfirm,
  onConfirmDelete,
  onCancelDelete,
}: {
  share: ShareWithCount;
  copiedId: string | null;
  confirmDeleteId: string | null;
  onCopyLink: (token: string, shareId: string) => void;
  onUpdate: (shareId: string, updates: { label?: string; notes?: string; access_code?: string; is_active?: boolean }) => void;
  onRequestConfirm: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}) {
  const [label, setLabel] = useState(share.label);
  const [accessCode, setAccessCode] = useState(share.access_code);
  const [notes, setNotes] = useState(share.notes ?? '');

  return (
    <div className={`border border-admin-border rounded-admin-md p-4 space-y-3 ${!share.is_active ? 'opacity-50' : ''}`}>
      {/* Top row: link + actions */}
      <div className="flex items-center justify-between gap-2">
        <code className="text-admin-sm text-admin-text-secondary font-admin-mono truncate">
          fna.wtf/s/{share.token}
        </code>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCopyLink(share.token, share.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
            title="Copy link"
          >
            {copiedId === share.id ? <Check size={14} className="text-admin-success" /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => onUpdate(share.id, { is_active: !share.is_active })}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
            title={share.is_active ? 'Deactivate' : 'Activate'}
          >
            {share.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <TwoStateDeleteButton
            itemId={share.id}
            confirmId={confirmDeleteId}
            onRequestConfirm={onRequestConfirm}
            onConfirmDelete={onConfirmDelete}
            onCancel={onCancelDelete}
          />
        </div>
      </div>

      {/* Label */}
      <div>
        <label className="admin-label">Label</label>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={() => { if (label !== share.label) onUpdate(share.id, { label }); }}
          placeholder="e.g. Client review round 1"
          className="admin-input w-full"
        />
      </div>

      {/* Access code */}
      <div>
        <label className="admin-label">Access Code</label>
        <input
          value={accessCode}
          onChange={e => setAccessCode(e.target.value)}
          onBlur={() => { if (accessCode !== share.access_code) onUpdate(share.id, { access_code: accessCode }); }}
          className="admin-input w-full font-admin-mono"
        />
      </div>

      {/* Notes — "What to look for" */}
      <div>
        <label className="admin-label">What to Look For</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => { if (notes !== (share.notes ?? '')) onUpdate(share.id, { notes: notes || undefined }); }}
          placeholder="Guidance for the reviewer..."
          rows={3}
          className="admin-input w-full resize-none"
        />
      </div>

      {/* Meta */}
      <div className="text-admin-sm text-admin-text-faint">
        {share.view_count} view{share.view_count !== 1 ? 's' : ''} · Created {new Date(share.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}
