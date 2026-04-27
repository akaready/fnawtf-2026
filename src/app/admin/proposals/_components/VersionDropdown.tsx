'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, GitBranch, Loader2 } from 'lucide-react';
import { getProposalVersions, setVersionPublished, createProposalVersion } from '@/app/admin/actions';
import type { ProposalRow } from '@/types/proposal';

interface Props {
  proposal: Pick<ProposalRow, 'id' | 'proposal_group_id' | 'version_number' | 'version_name' | 'is_published_version'>;
  onSwitchVersion: (versionId: string) => void;
  onNewVersionCreated: (versionId: string) => void;
}

export function VersionDropdown({ proposal, onSwitchVersion, onNewVersionCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<ProposalRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getProposalVersions(proposal.proposal_group_id)
      .then(setVersions)
      .finally(() => setLoading(false));
  }, [open, proposal.proposal_group_id, proposal.id]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowNameInput(false);
        setNewVersionName('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleTogglePublished = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      await setVersionPublished(id, !current);
      setVersions((prev) => prev?.map((v) => v.id === id ? { ...v, is_published_version: !current } : v) ?? null);
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateVersion = async () => {
    if (creatingVersion) return;
    setCreatingVersion(true);
    try {
      const newId = await createProposalVersion(proposal.id, newVersionName.trim() || null);
      setOpen(false);
      setShowNameInput(false);
      setNewVersionName('');
      onNewVersionCreated(newId);
    } finally {
      setCreatingVersion(false);
    }
  };

  const label = `v${proposal.version_number}${proposal.version_name ? ` · ${proposal.version_name}` : ''}`;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-admin-bg-selected text-admin-text-secondary border-admin-border hover:bg-admin-bg-hover hover:text-admin-text-primary transition-colors max-w-[220px]"
        title="Versions"
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={11} className={`transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-[320px] bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl py-1 z-50">
          {loading && (
            <div className="px-3 py-3 text-admin-sm text-admin-text-muted flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" /> Loading versions…
            </div>
          )}
          {!loading && versions && (
            <>
              <div className="px-3 py-1.5 text-admin-sm text-admin-text-faint uppercase tracking-wider">
                Versions
              </div>
              <div className="max-h-[260px] overflow-y-auto admin-scrollbar">
                {versions.map((v) => {
                  const isActive = v.id === proposal.id;
                  return (
                    <div
                      key={v.id}
                      className={`flex items-center gap-2 px-3 py-2 text-admin-sm transition-colors ${
                        isActive ? 'bg-admin-bg-active' : 'hover:bg-admin-bg-hover'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!isActive) onSwitchVersion(v.id);
                          setOpen(false);
                        }}
                        className="flex-1 text-left flex items-center gap-2 min-w-0"
                      >
                        <span className="font-mono text-admin-text-primary flex-shrink-0">v{v.version_number}</span>
                        <span className="text-admin-text-muted truncate">
                          {v.version_name || <span className="text-admin-text-faint">no name</span>}
                        </span>
                        {isActive && <Check size={12} className="text-admin-success flex-shrink-0" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTogglePublished(v.id, v.is_published_version)}
                        disabled={togglingId === v.id}
                        className={`flex-shrink-0 px-2 py-0.5 rounded-full text-admin-sm font-medium border transition-colors ${
                          v.is_published_version
                            ? 'bg-admin-success-bg text-admin-success border-admin-success-border'
                            : 'bg-admin-bg-selected text-admin-text-faint border-admin-border hover:text-admin-text-muted'
                        }`}
                        title={v.is_published_version ? 'Click to unpublish' : 'Click to publish'}
                      >
                        {togglingId === v.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : v.is_published_version ? 'Published' : 'Unpublished'}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-admin-border mt-1 pt-1">
                {!showNameInput ? (
                  <button
                    type="button"
                    onClick={() => setShowNameInput(true)}
                    className="w-full text-left px-3 py-2 text-admin-sm text-admin-text-secondary hover:bg-admin-bg-hover hover:text-admin-text-primary flex items-center gap-2 transition-colors"
                  >
                    <GitBranch size={12} />
                    + New version
                  </button>
                ) : (
                  <div className="px-3 py-2 space-y-2">
                    <input
                      type="text"
                      autoFocus
                      value={newVersionName}
                      onChange={(e) => setNewVersionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleCreateVersion();
                        if (e.key === 'Escape') { setShowNameInput(false); setNewVersionName(''); }
                      }}
                      placeholder="Version name (optional)"
                      className="admin-input w-full text-admin-sm"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCreateVersion()}
                        disabled={creatingVersion}
                        className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-admin-sm"
                      >
                        {creatingVersion ? <Loader2 size={12} className="animate-spin" /> : <GitBranch size={12} />}
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowNameInput(false); setNewVersionName(''); }}
                        className="btn-ghost px-3 py-1.5 text-admin-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
