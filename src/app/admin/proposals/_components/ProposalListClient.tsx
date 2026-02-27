'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { deleteProposal, createProposalDraft } from '@/app/admin/actions';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import {
  AdminTable,
  AdminDeleteModal,
  StatusBadge,
  relativeTime,
  type ColumnDef,
  type RowAction,
} from '@/app/admin/_components/AdminTable';
import { ProposalPanel } from './ProposalPanel';
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

const TYPE_LABELS: Record<string, string> = {
  build: 'Build',
  launch: 'Launch',
  scale: 'Scale',
  'build-launch': 'Build + Launch',
  fundraising: 'Fundraising',
};

export function ProposalListClient({ proposals: initialProposals, viewCounts }: ProposalListClientProps) {
  const [proposals, setProposals] = useState(initialProposals);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<ProposalRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('open');
    if (id) {
      setActiveId(id);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

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

  const columns: ColumnDef<ProposalRow>[] = [
    {
      key: 'proposal_number',
      label: '#',
      width: 'w-12',
      render: (row) => (
        <span className="text-white/25 font-mono text-xs">{row.proposal_number}</span>
      ),
    },
    {
      key: 'contact_company',
      label: 'Company',
      sortable: true,
      render: (row) => <span className="font-medium text-white">{row.contact_company}</span>,
    },
    {
      key: 'contact_name',
      label: 'Contact',
      render: (row) => <span className="text-white/60">{row.contact_name}</span>,
    },
    {
      key: 'proposal_type',
      label: 'Type',
      render: (row) => (
        <span className="text-white/50 text-xs">
          {TYPE_LABELS[row.proposal_type] ?? row.proposal_type}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: '_activity',
      label: 'Activity',
      width: 'w-36',
      render: (row) => {
        const vc = viewCounts[row.id];
        if (!vc?.views) return <span className="text-white/20 text-xs">—</span>;
        return (
          <span className="text-white/40 text-xs font-mono whitespace-nowrap">
            {vc.views} view{vc.views !== 1 ? 's' : ''} · {relativeTime(vc.lastViewed)}
          </span>
        );
      },
    },
  ];

  const rowActions: RowAction<ProposalRow>[] = [
    {
      icon: <ExternalLink size={13} />,
      label: 'View proposal',
      onClick: (row, e) => {
        e.stopPropagation();
        window.open(`/p/${row.slug}`, '_blank');
      },
    },
    {
      icon: <Trash2 size={13} />,
      label: 'Delete proposal',
      variant: 'danger',
      onClick: (row) => setDeleteTarget(row),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Proposals"
        subtitle={`${proposals.length} total`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search proposals…"
        actions={
          <button
            onClick={() => startCreate(async () => {
              const id = await createProposalDraft();
              setActiveId(id);
            })}
            disabled={isCreating}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            New Proposal
          </button>
        }
      />

      {/* Status filter bar */}
      <div className="flex-shrink-0 flex items-center gap-1 px-8 py-2 border-b border-[#2a2a2a]">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
        {(search || statusFilter !== 'all') && filtered.length !== proposals.length && (
          <span className="ml-auto text-xs text-white/25 font-mono pr-1">
            {filtered.length} of {proposals.length}
          </span>
        )}
      </div>

      <AdminTable
        data={filtered}
        columns={columns}
        rowActions={rowActions}
        onRowClick={(row) => setActiveId(row.id)}
        emptyMessage={
          search || statusFilter !== 'all'
            ? 'No proposals match your filters.'
            : 'No proposals yet.'
        }
        emptyAction={
          !search && statusFilter === 'all'
            ? { label: 'Create your first proposal', onClick: () => startCreate(async () => { const id = await createProposalDraft(); setActiveId(id); }) }
            : undefined
        }
      />

      {deleteTarget && (
        <AdminDeleteModal
          title="Delete proposal?"
          description={
            <>
              <span className="text-white/80">{deleteTarget.contact_company}</span> — this action
              cannot be undone.
            </>
          }
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <ProposalPanel
        proposalId={activeId}
        open={!!activeId}
        onClose={() => setActiveId(null)}
        onProposalUpdated={(updated) => setProposals((prev) => prev.map((p) => p.id === updated.id ? updated : p))}
        onProposalDeleted={(id) => {
          setProposals((prev) => prev.filter((p) => p.id !== id));
          setActiveId(null);
        }}
      />
    </div>
  );
}
