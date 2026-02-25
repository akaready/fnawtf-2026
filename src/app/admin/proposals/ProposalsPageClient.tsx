'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, Copy, Check, ExternalLink, Loader2, Eye,
} from 'lucide-react';
import { AdminPageHeader } from '../_components/AdminPageHeader';
import {
  type ProposalRow,
  deleteProposal,
  updateProposal,
} from '../actions';
import type { ProposalStatus } from '@/types/proposal';

interface Props {
  initialProposals: ProposalRow[];
  viewCounts: Record<string, { views: number; lastViewed: string | null }>;
}

const STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: 'bg-zinc-500/20 text-zinc-400',
  sent: 'bg-blue-500/20 text-blue-400',
  viewed: 'bg-amber-500/20 text-amber-400',
  accepted: 'bg-green-500/20 text-green-400',
};

const TYPE_COLORS: Record<string, string> = {
  build: 'bg-purple-500/20 text-purple-400',
  launch: 'bg-orange-500/20 text-orange-400',
  scale: 'bg-cyan-500/20 text-cyan-400',
  'build-launch': 'bg-indigo-500/20 text-indigo-400',
  fundraising: 'bg-emerald-500/20 text-emerald-400',
};

export function ProposalsPageClient({ initialProposals, viewCounts }: Props) {
  const router = useRouter();
  const [proposals, setProposals] = useState(initialProposals);
  const [saving, startSave] = useTransition();
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return proposals;
    const q = search.toLowerCase();
    return proposals.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.contact_name.toLowerCase().includes(q) ||
        p.contact_company?.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [proposals, search]);

  const handleDelete = (id: string) => {
    startSave(async () => {
      await deleteProposal(id);
      setProposals((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
    });
  };

  const handleStatusChange = (id: string, status: ProposalStatus) => {
    startSave(async () => {
      await updateProposal(id, { status });
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
    });
  };

  const copyLink = (slug: string, id: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Proposals"
        subtitle={`${proposals.length} total — Create and manage client proposals.`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search proposals…"
        actions={
          <button
            onClick={() => router.push('/admin/proposals/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg border border-white hover:bg-black hover:text-white transition-colors"
          >
            <Plus size={16} />
            New Proposal
          </button>
        }
      />

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground/40 text-sm">
            {proposals.length === 0
              ? 'No proposals yet. Click "New Proposal" to create one.'
              : 'No matching proposals.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/[0.08]">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground/60">
                <th className="px-8 py-3 font-medium w-12">#</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium w-24">Type</th>
                <th className="px-4 py-3 font-medium w-28">Status</th>
                <th className="px-4 py-3 font-medium w-20">Views</th>
                <th className="px-4 py-3 font-medium w-32">Created</th>
                <th className="px-4 py-3 font-medium w-36 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/proposals/${p.id}`)}
                >
                  <td className="px-8 py-4 text-muted-foreground/40 font-mono text-xs">
                    {p.proposal_number}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-foreground">{p.title}</div>
                    <div className="text-xs text-muted-foreground/50 font-mono mt-0.5">/p/{p.slug}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-foreground">{p.contact_name}</div>
                    {p.contact_company && (
                      <div className="text-xs text-muted-foreground/50 mt-0.5">{p.contact_company}</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium capitalize ${TYPE_COLORS[p.proposal_type] ?? 'bg-white/10 text-muted-foreground'}`}>
                      {p.proposal_type}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={p.status}
                      onChange={(e) => { e.stopPropagation(); handleStatusChange(p.id, e.target.value as ProposalStatus); }}
                      onClick={(e) => e.stopPropagation()}
                      className={`appearance-none cursor-pointer px-2.5 py-1 rounded-full text-[11px] font-medium capitalize border-none outline-none ${STATUS_COLORS[p.status as ProposalStatus] ?? 'bg-white/10 text-muted-foreground'}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="viewed">Viewed</option>
                      <option value="accepted">Accepted</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    {viewCounts[p.id] ? (
                      <div className="flex items-center gap-1.5">
                        <Eye size={12} className="text-muted-foreground/40" />
                        <span className="text-xs text-muted-foreground">{viewCounts[p.id].views}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground/50 text-xs">
                    {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyLink(p.slug, p.id); }}
                        title="Copy proposal link"
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        {copiedId === p.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(`/admin/proposals/${p.id}/preview`, '_blank'); }}
                        title="Preview (no password)"
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(`/p/${p.slug}`, '_blank'); }}
                        title="Open proposal page"
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id); }}
                        title="Delete proposal"
                        className="p-2 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-border/40 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-medium">Delete proposal?</h3>
            <p className="text-sm text-muted-foreground">This will permanently delete the proposal and all its sections. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
