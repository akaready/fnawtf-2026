'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { deleteProposal, createProposalDraft } from '@/app/admin/actions';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import {
  AdminDeleteModal,
  StatusBadge,
  relativeTime,
} from '@/app/admin/_components/AdminTable';
import { AdminDataTable, type ColDef, type RowAction } from '@/app/admin/_components/table';
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

  const columns: ColDef<ProposalRow>[] = [
    {
      key: 'proposal_number',
      label: '#',
      type: 'number',
      defaultWidth: 52,
      sortable: true,
      render: (row) => (
        <span className="text-[#404040] font-mono text-xs">{row.proposal_number}</span>
      ),
    },
    {
      key: 'contact_company',
      label: 'Company',
      type: 'text',
      sortable: true,
      render: (row) => <span className="font-medium text-white">{row.contact_company}</span>,
    },
    {
      key: 'contact_name',
      label: 'Contact',
      type: 'text',
      sortable: true,
      render: (row) => <span className="text-[#999]">{row.contact_name}</span>,
    },
    {
      key: 'title',
      label: 'Title',
      type: 'text',
      sortable: true,
      defaultVisible: false,
    },
    {
      key: 'subtitle',
      label: 'Subtitle',
      type: 'text',
      defaultVisible: false,
      maxWidth: 250,
    },
    {
      key: 'contact_email',
      label: 'Email',
      type: 'text',
      defaultVisible: false,
      mono: true,
    },
    {
      key: 'proposal_type',
      label: 'Type',
      type: 'select',
      sortable: true,
      options: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
      render: (row) => (
        <span className="text-[#808080] text-xs">
          {TYPE_LABELS[row.proposal_type] ?? row.proposal_type}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      sortable: true,
      options: STATUS_TABS.filter((t) => t.value !== 'all').map((t) => ({ value: t.value, label: t.label })),
      render: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: 'slug',
      label: 'Slug',
      type: 'text',
      sortable: true,
      defaultVisible: false,
      mono: true,
    },
    {
      key: 'proposal_password',
      label: 'Password',
      type: 'text',
      defaultVisible: false,
      mono: true,
    },
    {
      key: 'schedule_start_date',
      label: 'Start Date',
      type: 'date',
      sortable: true,
      defaultVisible: false,
    },
    {
      key: 'schedule_end_date',
      label: 'End Date',
      type: 'date',
      sortable: true,
      defaultVisible: false,
    },
    {
      key: 'crowdfunding_approved',
      label: 'CF Approved',
      type: 'toggle',
      defaultVisible: false,
      toggleLabels: ['Yes', 'No'],
      toggleColors: ['bg-green-500/10 text-green-400', 'bg-white/5 text-[#515155]'],
    },
    {
      key: 'crowdfunding_deferred',
      label: 'CF Deferred',
      type: 'toggle',
      defaultVisible: false,
      toggleLabels: ['Yes', 'No'],
      toggleColors: ['bg-yellow-500/10 text-yellow-400', 'bg-white/5 text-[#515155]'],
    },
    {
      key: '_activity',
      label: 'Activity',
      defaultWidth: 144,
      render: (row) => {
        const vc = viewCounts[row.id];
        if (!vc?.views) return <span className="text-[#333] text-xs">—</span>;
        return (
          <span className="text-[#666] text-xs font-mono whitespace-nowrap">
            {vc.views} view{vc.views !== 1 ? 's' : ''} · {relativeTime(vc.lastViewed)}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      type: 'date',
      sortable: true,
      defaultVisible: false,
    },
    {
      key: 'updated_at',
      label: 'Updated',
      type: 'date',
      sortable: true,
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
        mobileActions={
          <button
            onClick={() => startCreate(async () => {
              const id = await createProposalDraft();
              setActiveId(id);
            })}
            disabled={isCreating}
            className="btn-primary p-2.5 text-sm"
            title="New Proposal"
          >
            {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          </button>
        }
      />

      <AdminDataTable
        data={filtered}
        columns={columns}
        storageKey="fna-table-proposals"
        toolbar
        sortable
        filterable
        columnVisibility
        columnReorder
        columnResize
        selectable
        freezePanes
        exportCsv
        rowActions={rowActions}
        onRowClick={(row) => setActiveId(row.id)}
        toolbarSlot={
          <>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-1.5 px-[15px] py-[4px] rounded-lg text-sm font-medium transition-colors border ${
                  statusFilter === tab.value
                    ? 'bg-white/10 text-white border-transparent'
                    : 'text-[#666] hover:text-[#b3b3b3] hover:bg-white/5 border-transparent'
                }`}
              >
                {tab.label}
                {tab.value !== 'all' && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${
                    statusFilter === tab.value ? 'bg-white/10' : 'bg-white/5 text-[#515155]'
                  }`}>
                    {proposals.filter((p) => p.status === tab.value).length}
                  </span>
                )}
              </button>
            ))}
          </>
        }
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
              <span className="text-[#ccc]">{deleteTarget.contact_company}</span> — this action
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
