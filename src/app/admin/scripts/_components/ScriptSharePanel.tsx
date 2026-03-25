'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Plus, ExternalLink, Trash2, Play, Table2 } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { getScriptShares, getNextShareVersion, createScriptShare, updateScriptShare, deleteScriptShare } from '@/app/admin/actions';
import { ViewSwitcher } from '@/app/admin/_components/ViewSwitcher';
import type { ScriptShareRow, SharePreferences } from '@/types/scripts';
import { resolveSharePreferences } from '@/types/scripts';

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
  onVersionChanged?: () => void;
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

export function ScriptSharePanel({ open, onClose, scriptId, onVersionChanged }: Props) {
  const [shares, setShares] = useState<ShareWithViews[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [nextMajor, setNextMajor] = useState<number>(1);

  const loadShares = useCallback(async () => {
    setLoading(true);
    try {
      const [data, nextVer] = await Promise.all([
        getScriptShares(scriptId),
        getNextShareVersion(scriptId),
      ]);
      setShares(data as unknown as ShareWithViews[]);
      setNextMajor(nextVer);
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
      const id = await createScriptShare(scriptId);
      await loadShares();
      setSelectedId(id);
      onVersionChanged?.();
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (shareId: string, updates: { notes?: string; access_code?: string; share_mode?: string; share_preferences?: Record<string, unknown> }) => {
    await updateScriptShare(shareId, updates);
    setShares(prev => prev.map(s => s.id === shareId ? { ...s, ...updates } as ShareWithViews : s));
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
                  }`}
                >
                  <button onClick={() => setSelectedId(share.id)} className="flex-1 flex items-center gap-2.5 min-w-0">
                    <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-admin-success" />
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-admin-base font-bold text-admin-cream">
                        {share.snapshot_major_version ? `v${share.snapshot_major_version}` : 'Legacy'}
                      </span>
                      <span className="text-admin-sm text-admin-text-faint">
                        {new Date(share.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </button>
                  <span className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
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
                <p className="px-4 py-3 text-admin-sm text-admin-text-faint">No shareable versions created yet.</p>
              )}
            </div>
          </div>

          {/* Right detail pane */}
          <div className="flex-1 min-w-0 flex flex-col">
            {selected ? (
              <ShareDetail
                share={selected}
                copiedId={copiedId}
                copiedCode={copiedCode}
                onCopyLink={copyLink}
                onCopyCode={copyCode}
                onUpdate={handleUpdate}
              />
            ) : (
              <div className="flex items-center justify-center flex-1 text-admin-sm text-admin-text-faint">
                {shares.length === 0 ? 'Create a shareable version to get started.' : 'Select a link to edit.'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-admin-border flex-shrink-0 bg-admin-bg-wash">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Plus size={14} />
            {creating ? 'Creating...' : `Create v${nextMajor}`}
          </button>
          {selected ? (
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
          <button
            onClick={onClose}
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </PanelDrawer>
  );
}

// ── Share Preferences Controls ───────────────────────────────────────────

function SharePreferencesControls({
  share,
  onUpdate,
}: {
  share: ShareWithViews;
  onUpdate: (shareId: string, updates: { share_mode?: string; share_preferences?: Record<string, unknown> }) => void;
}) {
  const prefs = resolveSharePreferences(share.share_preferences, share.share_mode);

  const update = (patch: Partial<SharePreferences>) => {
    const next = { ...prefs, ...patch };
    onUpdate(share.id, {
      share_preferences: next as unknown as Record<string, unknown>,
      share_mode: next.default_view === 'table' ? 'table' : 'presentation',
    });
  };

  const TABLE_COLUMNS: { key: string; label: string }[] = [
    { key: 'audio', label: 'Audio' },
    { key: 'visual', label: 'Visual' },
    { key: 'notes', label: 'Notes' },
    { key: 'reference', label: 'Reference' },
    { key: 'storyboard', label: 'Storyboard' },
    { key: 'comments', label: 'Comments' },
  ];

  const PRESENTATION_COLUMNS: { key: string; label: string }[] = [
    { key: 'visual', label: 'Visual' },
    { key: 'notes', label: 'Notes' },
    { key: 'reference', label: 'Reference' },
    { key: 'comments', label: 'Comments' },
  ];

  return (
    <div className="space-y-5">
      {/* Default View */}
      <div className="space-y-1.5">
        <label className="admin-label">Default View</label>
        <div className="flex">
          <ViewSwitcher
            views={[
              { key: 'story' as const, icon: Play, label: 'Story' },
              { key: 'table' as const, icon: Table2, label: 'Table' },
            ]}
            activeView={prefs.default_view}
            onChange={(view) => update({ default_view: view })}
            showLabels
          />
        </div>
      </div>

      {/* Allowed Views */}
      <div className="space-y-2">
        <label className="admin-label">Allowed Views</label>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.allow_story_view}
              onChange={() => {
                if (prefs.allow_story_view && !prefs.allow_table_view) return;
                const next = !prefs.allow_story_view;
                const patch: Partial<SharePreferences> = { allow_story_view: next };
                if (!next) patch.allow_table_view = true;
                if (!next && prefs.default_view === 'story') patch.default_view = 'table';
                update(patch);
              }}
              className="w-4 h-4 rounded border-admin-border bg-transparent accent-white"
            />
            <span className="text-admin-sm text-admin-text-primary">Allow Story View</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.allow_table_view}
              onChange={() => {
                if (prefs.allow_table_view && !prefs.allow_story_view) return;
                const next = !prefs.allow_table_view;
                const patch: Partial<SharePreferences> = { allow_table_view: next };
                if (!next) patch.allow_story_view = true;
                if (!next && prefs.default_view === 'table') patch.default_view = 'story';
                update(patch);
              }}
              className="w-4 h-4 rounded border-admin-border bg-transparent accent-white"
            />
            <span className="text-admin-sm text-admin-text-primary">Allow Table View</span>
          </label>
        </div>
      </div>

      {/* Table Column Visibility */}
      <div className="space-y-2">
        <label className="admin-label">Table Column Visibility</label>
        <div className="grid grid-cols-2 gap-1.5">
          {TABLE_COLUMNS.map(({ key, label }) => {
            const checked = prefs.table_columns?.[key as keyof typeof prefs.table_columns] !== false;
            return (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => update({ table_columns: { ...prefs.table_columns, [key]: !checked } })}
                  className="w-4 h-4 rounded border-admin-border bg-transparent accent-white"
                />
                <span className="text-admin-sm text-admin-text-primary">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Presentation Panel Visibility */}
      <div className="space-y-2">
        <label className="admin-label">Story View Panel Visibility</label>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESENTATION_COLUMNS.map(({ key, label }) => {
            const checked = prefs.presentation_columns?.[key as keyof typeof prefs.presentation_columns] !== false;
            return (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => update({ presentation_columns: { ...prefs.presentation_columns, [key]: !checked } })}
                  className="w-4 h-4 rounded border-admin-border bg-transparent accent-white"
                />
                <span className="text-admin-sm text-admin-text-primary">{label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
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
}: {
  share: ShareWithViews;
  copiedId: string | null;
  copiedCode: string | null;
  onCopyLink: (token: string, id: string) => void;
  onCopyCode: (code: string, id: string) => void;
  onUpdate: (shareId: string, updates: { notes?: string; access_code?: string; share_mode?: string; share_preferences?: Record<string, unknown> }) => void;
}) {
  const [accessCode, setAccessCode] = useState(share.access_code);
  const [notes, setNotes] = useState(share.notes ?? '');
  const [activeTab, setActiveTab] = useState<'details' | 'views'>('details');

  useEffect(() => {
    setAccessCode(share.access_code);
    setNotes(share.notes ?? '');
  }, [share.id, share.access_code, share.notes]);

  const fullUrl = `fna.wtf/s/${share.token}`;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tab strip */}
      <div className="flex items-center gap-1 border-b border-admin-border px-6 py-2 flex-shrink-0 bg-admin-bg-wash">
        {(['details', 'views'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-admin-sm font-medium rounded-admin-sm transition-colors ${
              activeTab === tab
                ? 'bg-admin-bg-active text-admin-text-primary'
                : 'text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover'
            }`}
          >
            {tab === 'details' ? 'Details' : 'Views'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto admin-scrollbar-auto">
        {activeTab === 'details' ? (
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

            {/* Access code */}
            <div className="space-y-1.5">
              <label className="admin-label">Access Code</label>
              <div className="flex items-center gap-2">
                <input
                  value={accessCode}
                  onChange={e => setAccessCode(e.target.value)}
                  onBlur={() => { if (accessCode !== share.access_code) onUpdate(share.id, { access_code: accessCode }); }}
                  className="admin-input flex-1 font-admin-mono"
                />
                <button
                  onClick={() => onCopyCode(share.access_code, share.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-admin-md text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0 border border-admin-border-subtle"
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

            {/* Share preferences / settings */}
            <SharePreferencesControls share={share} onUpdate={onUpdate} />
          </div>
        ) : (
          <div className="p-6 space-y-3">
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
        )}
      </div>
    </div>
  );
}
