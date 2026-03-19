'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Plus, ExternalLink, Trash2 } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { PanelFooter } from '@/app/admin/_components/PanelFooter';
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
  onPublish: () => Promise<void>;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ScriptSharePanel({ open, onClose, scriptId, isPublished, onPublish }: Props) {
  const [shares, setShares] = useState<ShareWithCount[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Auto-select first or fix stale selection
  useEffect(() => {
    if (selectedId && !shares.find(s => s.id === selectedId)) {
      setSelectedId(shares[0]?.id ?? null);
    }
    if (!selectedId && shares.length > 0) {
      setSelectedId(shares[0].id);
    }
  }, [shares, selectedId]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      if (!isPublished) await onPublish();
      const id = await createScriptShare(scriptId);
      await loadShares();
      setSelectedId(id);
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

  const copyLink = (token: string, id: string) => {
    navigator.clipboard.writeText(`https://fna.wtf/s/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selected = shares.find(s => s.id === selectedId) ?? null;

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[580px]">
      <div className="flex flex-col h-full">
        {/* Header — h-[4rem], font-semibold, matches all other panels */}
        <div className="h-[4rem] flex items-center justify-between px-6 border-b border-admin-border bg-admin-bg-sidebar">
          <h2 className="text-admin-lg font-semibold text-admin-text-primary">Share Links</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors" title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body — sidebar + detail */}
        <div className="flex-1 flex min-h-0">
          {/* Left sidebar */}
          <div className="w-[220px] flex-shrink-0 border-r border-admin-border flex flex-col">
            {/* Add button */}
            <div className="flex-shrink-0 border-b border-admin-border px-3 py-3">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-admin-text-muted hover:text-admin-text-primary bg-admin-bg-active hover:bg-admin-bg-hover-strong border border-transparent rounded-lg h-[36px] transition-colors disabled:opacity-40"
              >
                <Plus size={12} />
                {creating ? 'Creating...' : (isPublished ? 'New Link' : 'Publish & Share')}
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto admin-scrollbar-auto py-2">
              {loading && shares.length === 0 && (
                <p className="px-4 py-3 text-admin-sm text-admin-text-faint">Loading...</p>
              )}
              {shares.map(share => (
                <div
                  key={share.id}
                  className={`group/row w-full flex items-center px-4 py-2.5 gap-2.5 transition-colors cursor-pointer ${
                    selectedId === share.id
                      ? 'bg-admin-bg-active text-admin-text-primary'
                      : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-secondary'
                  }`}
                >
                  <button onClick={() => setSelectedId(share.id)} className="flex-1 flex items-center gap-2.5 min-w-0">
                    {/* Status dot */}
                    <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
                      share.is_active ? 'bg-admin-success' : 'border border-admin-text-ghost'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-admin-sm font-medium truncate">
                        {share.label || share.token}
                      </div>
                      <div className="text-xs text-admin-text-faint">
                        {share.view_count} view{share.view_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>
                  {confirmDeleteId === share.id ? (
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => handleDelete(share.id)} className="text-admin-danger hover:text-red-300 p-1 transition-colors" title="Confirm delete">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-admin-text-faint hover:text-admin-text-primary p-1 transition-colors" title="Cancel">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(share.id)}
                      className="opacity-0 group-hover/row:opacity-100 text-admin-text-ghost hover:text-admin-danger p-1 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {shares.length === 0 && !loading && (
                <p className="px-4 py-3 text-admin-sm text-admin-text-faint">No share links yet.</p>
              )}
            </div>
          </div>

          {/* Right detail pane */}
          <div className="flex-1 min-w-0 overflow-y-auto admin-scrollbar-auto">
            {selected ? (
              <ShareDetail
                share={selected}
                copiedId={copiedId}
                onCopyLink={copyLink}
                onUpdate={handleUpdate}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-admin-sm text-admin-text-faint">
                {shares.length === 0 ? 'Create a share link to get started.' : 'Select a link to edit.'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <PanelFooter
          onSave={onClose}
          saveLabel="Done"
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

// ── Detail pane ──────────────────────────────────────────────────────────

function ShareDetail({
  share,
  copiedId,
  onCopyLink,
  onUpdate,
}: {
  share: ShareWithCount;
  copiedId: string | null;
  onCopyLink: (token: string, id: string) => void;
  onUpdate: (shareId: string, updates: { label?: string; notes?: string; access_code?: string; is_active?: boolean }) => void;
}) {
  const [label, setLabel] = useState(share.label);
  const [accessCode, setAccessCode] = useState(share.access_code);
  const [notes, setNotes] = useState(share.notes ?? '');

  useEffect(() => {
    setLabel(share.label);
    setAccessCode(share.access_code);
    setNotes(share.notes ?? '');
  }, [share.id, share.label, share.access_code, share.notes]);

  const fullUrl = `fna.wtf/s/${share.token}`;

  return (
    <div className="flex flex-col h-full">
      {/* Hero link bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-admin-bg-inset border-b border-admin-border">
        <code className="flex-1 text-admin-sm font-admin-mono text-admin-text-secondary truncate">
          {fullUrl}
        </code>
        <button
          onClick={() => onCopyLink(share.token, share.id)}
          className="w-8 h-8 flex items-center justify-center rounded-admin-sm text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
          title="Copy link"
        >
          {copiedId === share.id ? <Check size={14} className="text-admin-success" /> : <Copy size={14} />}
        </button>
        <a
          href={`https://${fullUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 flex items-center justify-center rounded-admin-sm text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
          title="Open in new tab"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto admin-scrollbar-auto p-6 space-y-5">
        {/* Status */}
        <div className="space-y-1.5">
          <label className="admin-label">Status</label>
          <button
            onClick={() => onUpdate(share.id, { is_active: !share.is_active })}
            className={`px-3 py-1.5 text-xs font-medium rounded-admin-md border transition-colors ${
              share.is_active
                ? 'text-admin-success border-admin-success/30 bg-admin-success-bg/20'
                : 'text-admin-text-faint border-admin-border bg-admin-bg-hover'
            }`}
          >
            {share.is_active ? 'Active' : 'Offline'}
          </button>
        </div>

        {/* Label */}
        <div className="space-y-1.5">
          <label className="admin-label">Internal Label</label>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            onBlur={() => { if (label !== share.label) onUpdate(share.id, { label }); }}
            placeholder="e.g. Client review round 1"
            className="admin-input w-full"
          />
        </div>

        {/* Access code */}
        <div className="space-y-1.5">
          <label className="admin-label">Access Code</label>
          <input
            value={accessCode}
            onChange={e => setAccessCode(e.target.value)}
            onBlur={() => { if (accessCode !== share.access_code) onUpdate(share.id, { access_code: accessCode }); }}
            className="admin-input w-full font-admin-mono"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="admin-label">What to Look For</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={() => { if (notes !== (share.notes ?? '')) onUpdate(share.id, { notes: notes || undefined }); }}
            placeholder="Guidance for the reviewer..."
            rows={4}
            className="admin-input w-full resize-none leading-relaxed"
          />
        </div>

        {/* Meta */}
        <div className="text-admin-sm text-admin-text-faint pt-2">
          {share.view_count} view{share.view_count !== 1 ? 's' : ''} · Created {new Date(share.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
