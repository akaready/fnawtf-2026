'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Plus, ExternalLink, EyeOff, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { PanelFooter } from '@/app/admin/_components/PanelFooter';
import { getScriptShares, createScriptShare, updateScriptShare, archiveScriptShare, restoreScriptShare } from '@/app/admin/actions';
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

export function ScriptSharePanel({ open, onClose, scriptId, isPublished, onPublish }: Props) {
  const [shares, setShares] = useState<ShareWithViews[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

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

  // Auto-select first active or fix stale selection
  const activeShares = shares.filter(s => s.is_active);
  const archivedShares = shares.filter(s => !s.is_active);

  useEffect(() => {
    if (selectedId && !shares.find(s => s.id === selectedId)) {
      setSelectedId(activeShares[0]?.id ?? null);
    }
    if (!selectedId && activeShares.length > 0) {
      setSelectedId(activeShares[0].id);
    }
  }, [shares, selectedId, activeShares]);

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
    setShares(prev => prev.map(s => s.id === shareId ? { ...s, ...updates } as ShareWithViews : s));
  };

  const handleArchive = async (shareId: string) => {
    await archiveScriptShare(shareId);
    setShares(prev => prev.map(s => s.id === shareId ? { ...s, is_active: false } as ShareWithViews : s));
    // Select next active share
    const remaining = shares.filter(s => s.is_active && s.id !== shareId);
    setSelectedId(remaining[0]?.id ?? null);
  };

  const handleRestore = async (shareId: string) => {
    await restoreScriptShare(shareId);
    setShares(prev => prev.map(s => s.id === shareId ? { ...s, is_active: true } as ShareWithViews : s));
    setSelectedId(shareId);
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

              {/* Active shares */}
              {activeShares.map(share => (
                <SidebarItem
                  key={share.id}
                  share={share}
                  isSelected={selectedId === share.id}
                  onSelect={() => setSelectedId(share.id)}
                  onConfirmDelete={() => handleArchive(share.id)}
                />
              ))}

              {activeShares.length === 0 && !loading && (
                <p className="px-4 py-3 text-admin-sm text-admin-text-faint">No share links yet.</p>
              )}

              {/* Archived section */}
              {archivedShares.length > 0 && (
                <div className="mt-2 pt-2 border-t border-admin-border-subtle">
                  <button
                    onClick={() => setShowArchived(prev => !prev)}
                    className="w-full flex items-center gap-1.5 px-4 py-2 text-xs text-admin-text-ghost hover:text-admin-text-faint transition-colors"
                  >
                    {showArchived ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    Archived ({archivedShares.length})
                  </button>
                  {showArchived && archivedShares.map(share => (
                    <div
                      key={share.id}
                      className={`group/row w-full flex items-center px-4 py-2.5 gap-2.5 opacity-40 transition-colors cursor-pointer ${
                        selectedId === share.id ? 'bg-admin-bg-active' : 'hover:bg-admin-bg-hover'
                      }`}
                    >
                      <button onClick={() => setSelectedId(share.id)} className="flex-1 flex items-center gap-2.5 min-w-0">
                        <span className="flex-shrink-0 w-2 h-2 rounded-full border border-admin-text-ghost" />
                        <span className="text-admin-sm truncate text-admin-text-faint">{share.label || share.token}</span>
                      </button>
                      <button
                        onClick={() => handleRestore(share.id)}
                        className="opacity-0 group-hover/row:opacity-100 text-admin-text-ghost hover:text-admin-text-faint p-1 transition-all"
                        title="Restore"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  ))}
                </div>
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

// ── Sidebar item ─────────────────────────────────────────────────────────

function SidebarItem({
  share,
  isSelected,
  onSelect,
  onConfirmDelete,
}: {
  share: ShareWithViews;
  isSelected: boolean;
  onSelect: () => void;
  onConfirmDelete: () => void;
}) {
  return (
    <div
      className={`group/row w-full flex items-center px-4 py-3 gap-2.5 transition-colors cursor-pointer ${
        isSelected
          ? 'bg-admin-bg-active text-admin-text-primary'
          : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-secondary'
      }`}
    >
      <button onClick={onSelect} className="flex-1 flex items-center gap-2.5 min-w-0">
        <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-admin-success" />
        <div className="flex-1 min-w-0">
          <div className="text-admin-base font-medium truncate">
            {share.label || share.token}
          </div>
          <div className="text-xs text-admin-text-faint">
            {share.view_count} view{share.view_count !== 1 ? 's' : ''}
          </div>
        </div>
      </button>
      <button
        onClick={onConfirmDelete}
        className="opacity-0 group-hover/row:opacity-100 text-admin-text-ghost hover:text-admin-text-faint p-1 transition-all"
        title="Hide link"
      >
        <EyeOff size={14} />
      </button>
    </div>
  );
}

// ── Detail pane ──────────────────────────────────────────────────────────

function ShareDetail({
  share,
  copiedId,
  onCopyLink,
  onUpdate,
}: {
  share: ShareWithViews;
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

      {/* Divider */}
      <div className="border-t border-admin-border-subtle" />

      {/* Internal label */}
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

      {/* Meta */}
      <div className="text-xs text-admin-text-ghost">
        Created {new Date(share.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}
