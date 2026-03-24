'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Plus, ExternalLink, Trash2, ChevronDown } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { PanelFooter } from '@/app/admin/_components/PanelFooter';
import { getScriptShares, createScriptShare, updateScriptShare, archiveScriptShare, restoreScriptShare, deleteScriptShare } from '@/app/admin/actions';
import type { ScriptShareRow } from '@/types/scripts';

// ── Types ────────────────────────────────────────────────────────────────

interface ViewRecord {
  id: string;
  viewer_email: string | null;
  viewer_name: string | null;
  duration_seconds: number | null;
  viewed_at: string;
}

interface ShareWithViews extends ScriptShareRow {
  view_count: number;
  views: ViewRecord[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  scriptId: string;
  isPublished: boolean;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
}

// ── Helpers ──────────────────────────────────────────────────────────────

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

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ── Main Panel ───────────────────────────────────────────────────────────

export function ScriptSharePanel({ open, onClose, scriptId, isPublished, onPublish, onUnpublish }: Props) {
  const [shares, setShares] = useState<ShareWithViews[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const loadShares = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getScriptShares(scriptId);
      setShares(data as unknown as ShareWithViews[]);
    } finally {
      setLoading(false);
    }
  }, [scriptId]);

  useEffect(() => {
    if (open) loadShares();
  }, [open, loadShares]);

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

  const handleUpdate = async (shareId: string, updates: { notes?: string; access_code?: string; is_active?: boolean; share_mode?: string }) => {
    await updateScriptShare(shareId, updates);
    setShares(prev => prev.map(s => s.id === shareId ? { ...s, ...updates } as ShareWithViews : s));
  };

  const handleToggleActive = async (shareId: string, currentlyActive: boolean) => {
    if (currentlyActive) {
      await archiveScriptShare(shareId);
      setShares(prev => prev.map(s => s.id === shareId ? { ...s, is_active: false } as ShareWithViews : s));
    } else {
      await restoreScriptShare(shareId);
      setShares(prev => prev.map(s => s.id === shareId ? { ...s, is_active: true } as ShareWithViews : s));
    }
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

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handlePublishToggle = async (publish: boolean) => {
    setPublishing(true);
    setShowStatusDropdown(false);
    try {
      if (publish) await onPublish();
      else await onUnpublish();
    } finally {
      setPublishing(false);
    }
  };

  const selected = shares.find(s => s.id === selectedId) ?? null;

  // Determine view/preview button
  const canView = isPublished && selected?.is_active && selected?.token;

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[580px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="h-[4rem] flex items-center justify-between px-6 border-b border-admin-border bg-admin-bg-sidebar">
          <h2 className="text-admin-lg font-semibold text-admin-text-primary">Share Links</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors" title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex min-h-0">
          {/* Left sidebar */}
          <div className="w-[220px] flex-shrink-0 border-r border-admin-border flex flex-col">
            {/* Add button */}
            <div className="flex-shrink-0 border-b border-admin-border px-3 py-3">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full flex items-center gap-1.5 px-4 text-xs text-admin-text-muted hover:text-admin-text-primary bg-admin-bg-active hover:bg-admin-bg-hover-strong border border-transparent rounded-lg h-[36px] transition-colors disabled:opacity-40"
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
                  className={`group/row w-full flex items-center px-4 py-3 gap-2.5 transition-colors cursor-pointer ${
                    selectedId === share.id
                      ? 'bg-admin-bg-active text-admin-text-primary'
                      : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-secondary'
                  } ${!share.is_active ? 'opacity-40' : ''}`}
                >
                  <button onClick={() => setSelectedId(share.id)} className="flex-1 flex items-center gap-2.5 min-w-0">
                    <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${
                      share.is_active ? 'bg-admin-success' : 'border border-admin-success'
                    }`} />
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-admin-base font-bold text-admin-cream">
                        {share.snapshot_major_version ? `v${share.snapshot_major_version}` : 'Legacy'}
                      </span>
                      <span className="text-admin-sm text-admin-text-faint">
                        {share.view_count} view{share.view_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                  <span className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    {/* Delete */}
                    {confirmDeleteId === share.id ? (
                      <>
                        <button onClick={() => handleDelete(share.id)} className="text-admin-danger hover:text-red-300 p-1 transition-colors" title="Confirm delete">
                          <Check size={13} />
                        </button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-admin-text-faint hover:text-admin-text-primary p-1 transition-colors" title="Cancel">
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(share.id)}
                        className="text-admin-text-ghost hover:text-admin-danger p-1 transition-colors"
                        title="Delete permanently"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </span>
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
                copiedCode={copiedCode}
                onCopyLink={copyLink}
                onCopyCode={copyCode}
                onUpdate={handleUpdate}
                onToggleActive={handleToggleActive}
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
            <>
              {/* Published status dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(p => !p)}
                  disabled={publishing}
                  className={`${isPublished ? 'btn-success' : 'btn-secondary'} gap-1.5 px-4 py-2.5 text-sm font-medium`}
                >
                  {isPublished ? 'Published' : 'Internal Draft'}
                  <ChevronDown size={12} className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showStatusDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                    <div className="absolute left-0 bottom-full mb-1 z-50 bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl min-w-[160px] py-1">
                      <button
                        onClick={() => { if (isPublished) handlePublishToggle(false); }}
                        disabled={publishing || !isPublished}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          !isPublished ? 'text-admin-text-primary bg-admin-bg-active' : 'text-admin-text-muted hover:bg-admin-bg-hover disabled:opacity-40'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-admin-text-faint" />
                          Internal Draft
                        </span>
                        {!isPublished && <Check size={12} />}
                      </button>
                      <button
                        onClick={() => { if (!isPublished) handlePublishToggle(true); }}
                        disabled={publishing || isPublished}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          isPublished ? 'text-admin-success bg-admin-success-bg/30' : 'text-admin-text-muted hover:bg-admin-bg-hover disabled:opacity-40'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-admin-success" />
                          Published
                        </span>
                        {isPublished && <Check size={12} />}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* View / Preview button */}
              {canView ? (
                <button
                  onClick={() => window.open(`/s/${selected.token}`, '_blank')}
                  className="btn-info inline-flex items-center gap-2 px-4 py-2.5 text-sm"
                >
                  <ExternalLink size={14} />
                  View
                </button>
              ) : (
                <button
                  onClick={() => window.open(`/s/preview/${scriptId}`, '_blank')}
                  className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm"
                >
                  <ExternalLink size={14} />
                  Preview
                </button>
              )}
            </>
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
  copiedCode,
  onCopyLink,
  onCopyCode,
  onUpdate,
  onToggleActive,
}: {
  share: ShareWithViews;
  copiedId: string | null;
  copiedCode: string | null;
  onCopyLink: (token: string, id: string) => void;
  onCopyCode: (code: string, id: string) => void;
  onUpdate: (shareId: string, updates: { notes?: string; access_code?: string; is_active?: boolean; share_mode?: string }) => void;
  onToggleActive: (shareId: string, currentlyActive: boolean) => void;
}) {
  const [accessCode, setAccessCode] = useState(share.access_code);
  const [notes, setNotes] = useState(share.notes ?? '');

  useEffect(() => {
    setAccessCode(share.access_code);
    setNotes(share.notes ?? '');
  }, [share.id, share.access_code, share.notes]);

  const fullUrl = `fna.wtf/s/${share.token}`;

  return (
    <div className="p-6 space-y-6">
      {/* Link */}
      <div className="space-y-1.5">
        <label className="admin-label">Share URL</label>
        <div className="flex items-center gap-2 bg-admin-bg-inset border border-admin-border-subtle rounded-admin-md px-3 py-2.5">
          <code className="flex-1 text-admin-base font-admin-mono text-admin-text-secondary truncate">
            {fullUrl}
          </code>
          <button
            onClick={() => onCopyLink(share.token, share.id)}
            className="w-7 h-7 flex items-center justify-center rounded-admin-sm text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0"
            title="Copy link"
          >
            {copiedId === share.id ? <Check size={13} className="text-admin-success" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Share mode */}
      <div className="space-y-1.5">
        <label className="admin-label">View Mode</label>
        <div className="flex gap-0.5 bg-admin-bg-inset border border-admin-border rounded-admin-md p-0.5">
          {([['presentation', 'Presentation'], ['table', 'Script Table']] as const).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => { if (share.share_mode !== mode) onUpdate(share.id, { share_mode: mode }); }}
              className={`flex-1 py-1.5 text-admin-sm font-medium rounded-admin-sm transition-colors ${
                share.share_mode === mode
                  ? 'bg-admin-text-primary text-admin-bg-base'
                  : 'text-admin-text-ghost hover:text-admin-text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Version header + active toggle */}
      <div className="flex items-center gap-3 py-1">
        <span className="text-admin-lg font-bold text-admin-cream">
          {share.snapshot_major_version ? `v${share.snapshot_major_version}` : 'Legacy share'}
        </span>
        <span className="text-admin-sm text-admin-text-faint">
          Created {new Date(share.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <button
          onClick={() => onToggleActive(share.id, share.is_active)}
          className={`ml-auto text-admin-sm font-medium px-2.5 py-1 rounded-admin-sm transition-colors ${
            share.is_active
              ? 'text-admin-success bg-admin-success-bg/30 hover:bg-admin-success-bg/50'
              : 'text-admin-text-faint bg-admin-bg-active hover:bg-admin-bg-hover'
          }`}
        >
          {share.is_active ? 'Active' : 'Offline'}
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-admin-border-subtle" />

      {/* Access code */}
      <div className="space-y-1.5">
        <label className="admin-label">Access Code</label>
        <div className="flex items-center gap-2 bg-admin-bg-inset border border-admin-border-subtle rounded-admin-md px-3 py-2.5">
          <input
            value={accessCode}
            onChange={e => setAccessCode(e.target.value)}
            onBlur={() => { if (accessCode !== share.access_code) onUpdate(share.id, { access_code: accessCode }); }}
            className="flex-1 bg-transparent text-admin-base font-admin-mono text-admin-text-secondary outline-none"
          />
          <button
            onClick={() => onCopyCode(share.access_code, share.id)}
            className="w-7 h-7 flex items-center justify-center rounded-admin-sm text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0"
            title="Copy access code"
          >
            {copiedCode === share.id ? <Check size={13} className="text-admin-success" /> : <Copy size={13} />}
          </button>
        </div>
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

      {/* Divider */}
      <div className="border-t border-admin-border-subtle" />

      {/* Views */}
      <div className="space-y-3">
        <label className="admin-label">
          Views ({share.view_count})
        </label>
        {share.views.length === 0 ? (
          <p className="text-admin-sm text-admin-text-faint">No views yet</p>
        ) : (
          <div className="space-y-1">
            {share.views
              .sort((a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime())
              .map(view => (
                <div
                  key={view.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-admin-sm bg-admin-bg-inset text-admin-sm"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-admin-text-primary font-medium">
                      {view.viewer_name || 'Anonymous'}
                    </span>
                    {view.viewer_email && (
                      <span className="text-admin-text-faint ml-1.5">
                        {view.viewer_email}
                      </span>
                    )}
                  </div>
                  <span className="text-admin-text-ghost font-admin-mono text-xs flex-shrink-0">
                    {formatDuration(view.duration_seconds)}
                  </span>
                  <span className="text-admin-text-ghost text-xs flex-shrink-0">
                    {timeAgo(view.viewed_at)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

    </div>
  );
}
