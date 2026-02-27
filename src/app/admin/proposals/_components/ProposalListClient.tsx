'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ExternalLink, Trash2 } from 'lucide-react';
import { deleteProposal } from '@/app/admin/actions';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import type { ProposalRow, ProposalStatus } from '@/types/proposal';

interface ProposalListClientProps {
  proposals: ProposalRow[];
  viewCounts: Record<string, { views: number; lastViewed: string | null }>;
}

const STATUS_TABS: { value: ProposalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
];

const STATUS_BADGE: Record<ProposalStatus, string> = {
  draft: 'bg-white/10 text-white/50',
  sent: 'bg-blue-500/20 text-blue-300',
  viewed: 'bg-yellow-500/20 text-yellow-300',
  accepted: 'bg-green-500/20 text-green-300',
};

const TYPE_LABELS: Record<string, string> = {
  build: 'Build',
  launch: 'Launch',
  scale: 'Scale',
  'build-launch': 'Build + Launch',
  fundraising: 'Fundraising',
};

function relativeTime(isoString: string | null): string {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function ProposalListClient({ proposals: initialProposals, viewCounts }: ProposalListClientProps) {
  const router = useRouter();
  const [proposals, setProposals] = useState(initialProposals);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<ProposalRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = proposals.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    if (!matchesStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.contact_name ?? '').toLowerCase().includes(q) ||
      (p.contact_company ?? '').toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProposal(deleteTarget.id);
      setProposals((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Proposals"
        subtitle="Manage and send client proposals."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search proposals…"
        actions={
          <button
            onClick={() => router.push('/admin/proposals/new')}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            <Plus size={14} />
            New Proposal
          </button>
        }
      />

      {/* Status filter bar */}
      <div className="flex-shrink-0 flex items-center gap-1 px-8 py-3 border-b border-white/[0.08]">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="ml-1.5 text-white/25">
                {proposals.filter((p) => p.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
            <p className="text-sm">
              {search || statusFilter !== 'all' ? 'No proposals match your filters.' : 'No proposals yet.'}
            </p>
            {!search && statusFilter === 'all' && (
              <button
                onClick={() => router.push('/admin/proposals/new')}
                className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors"
              >
                <Plus size={12} /> Create your first proposal
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-black z-10">
              <tr className="border-b border-white/[0.08]">
                <th className="px-8 py-3 text-left text-xs font-mono text-white/25 uppercase tracking-widest w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-white/25 uppercase tracking-widest">Company</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-white/25 uppercase tracking-widest">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-white/25 uppercase tracking-widest">Type</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-white/25 uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-white/25 uppercase tracking-widest w-16">Views</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-white/25 uppercase tracking-widest">Last Viewed</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-white/25 uppercase tracking-widest w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((proposal) => {
                const vc = viewCounts[proposal.id];
                return (
                  <tr
                    key={proposal.id}
                    onClick={() => router.push(`/admin/proposals/${proposal.id}?tab=details`)}
                    className="border-b border-white/[0.05] hover:bg-white/[0.03] cursor-pointer transition-colors group"
                  >
                    <td className="px-8 py-3.5 text-white/25 font-mono text-xs">
                      {proposal.proposal_number}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-white">{proposal.contact_company}</span>
                    </td>
                    <td className="px-4 py-3.5 text-white/60">{proposal.contact_name}</td>
                    <td className="px-4 py-3.5 text-white/50 text-xs">
                      {TYPE_LABELS[proposal.proposal_type] ?? proposal.proposal_type}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[proposal.status]}`}
                      >
                        {proposal.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-white/40 text-xs font-mono">
                      {vc?.views ?? 0}
                    </td>
                    <td className="px-4 py-3.5 text-white/40 text-xs">
                      {relativeTime(vc?.lastViewed ?? null)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div
                        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={`/p/${proposal.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View proposal"
                          className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <ExternalLink size={13} />
                        </a>
                        <button
                          onClick={() => setDeleteTarget(proposal)}
                          title="Delete proposal"
                          className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-white mb-2">Delete proposal?</h3>
            <p className="text-sm text-white/50 mb-6">
              <span className="text-white/80">{deleteTarget.contact_company}</span> — this action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-40"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
