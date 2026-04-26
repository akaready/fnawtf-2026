'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, ExternalLink, Trash2, Loader2, FileText, Eye, GitMerge, Settings, Copy, GitBranch } from 'lucide-react';
import { createProposalDraft, batchDeleteProposals, mergeProposals, duplicateProposal, getProposal, createProposalVersion, deleteProposalGroup } from '@/app/admin/actions';
import { MergeDialog } from '@/app/admin/_components/MergeDialog';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import {
  AdminDeleteModal,
  relativeTime,
} from '@/app/admin/_components/AdminTable';
import { StatusBadge } from '../../_components/StatusBadge';
import { PROPOSAL_STATUSES } from '../../_components/statusConfigs';
import { AdminDataTable, type ColDef, type RowAction } from '@/app/admin/_components/table';
import { PipelineSettingsPanel } from './PipelineSettingsPanel';
import { ProposalPanel } from './ProposalPanel';
import { ProposalViewsPanel } from './ProposalViewsPanel';
import type { ProposalRow, ProposalStatus } from '@/types/proposal';

interface ProposalListClientProps {
  proposals: ProposalRow[];
  viewCounts: Record<string, { views: number; lastViewed: string | null }>;
}

// One row per proposal group. Rep is the latest version; _versions holds all versions.
type GroupedProposalRow = ProposalRow & { _versions: ProposalRow[] };

function groupProposals(rows: ProposalRow[]): GroupedProposalRow[] {
  const byGroup = new Map<string, ProposalRow[]>();
  for (const row of rows) {
    const key = row.proposal_group_id ?? row.id;
    const arr = byGroup.get(key);
    if (arr) arr.push(row); else byGroup.set(key, [row]);
  }
  return Array.from(byGroup.values()).map((versions) => {
    const sorted = [...versions].sort((a, b) => b.version_number - a.version_number);
    const rep = sorted[0];
    return { ...rep, _versions: sorted };
  });
}

const STATUS_TABS: { value: ProposalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'generated', label: 'Generated' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'archived', label: 'Archived' },
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
  const [deleteTarget, setDeleteTarget] = useState<GroupedProposalRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewsPanelId, setViewsPanelId] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();
  const [mergeState, setMergeState] = useState<{ sourceIds: string[] } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [versioningId, setVersioningId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('open');
    if (id) {
      setActiveId(id);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  const grouped = useMemo(() => groupProposals(proposals), [proposals]);

  const groupedViewCounts = useMemo(() => {
    const out: Record<string, { views: number; lastViewed: string | null }> = {};
    for (const g of grouped) {
      let views = 0;
      let lastViewed: string | null = null;
      for (const v of g._versions) {
        const vc = viewCounts[v.id];
        if (!vc) continue;
        views += vc.views;
        if (vc.lastViewed && (!lastViewed || vc.lastViewed > lastViewed)) lastViewed = vc.lastViewed;
      }
      out[g.id] = { views, lastViewed };
    }
    return out;
  }, [grouped, viewCounts]);

  const filtered = grouped.filter((p) => {
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
      await deleteProposalGroup(deleteTarget.proposal_group_id);
      setProposals((prev) => prev.filter((p) => p.proposal_group_id !== deleteTarget.proposal_group_id));
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const columns: ColDef<GroupedProposalRow>[] = [
    {
      key: 'proposal_number',
      label: '#',
      type: 'number',
      defaultWidth: 52,
      sortable: true,
      render: (row) => (
        <span className="text-admin-text-ghost font-mono text-xs">{row.proposal_number}</span>
      ),
    },
    {
      key: 'version_number',
      label: 'Versions',
      type: 'number',
      defaultWidth: 96,
      sortable: true,
      render: (row) => {
        const sortedAsc = [...row._versions].sort((a, b) => a.version_number - b.version_number);
        return (
          <span className="text-admin-text-secondary font-mono text-xs">
            {sortedAsc.map((v) => `v${v.version_number}`).join(', ')}
          </span>
        );
      },
    },
    {
      key: 'version_name',
      label: 'Latest Version Name',
      type: 'text',
      sortable: true,
      defaultVisible: false,
      render: (row) => row.version_name
        ? <span className="text-admin-text-secondary">{row.version_name}</span>
        : <span className="text-admin-text-ghost">—</span>,
    },
    {
      key: 'is_published_version',
      label: 'Published',
      defaultWidth: 110,
      render: (row) => {
        const total = row._versions.length;
        const published = row._versions.filter((v) => v.is_published_version).length;
        const allPublished = published === total;
        const nonePublished = published === 0;
        const cls = nonePublished
          ? 'bg-admin-bg-hover text-admin-text-faint'
          : allPublished
            ? 'bg-admin-success-bg text-admin-success'
            : 'bg-admin-warning-bg text-admin-warning';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
            {published}/{total}
          </span>
        );
      },
    },
    {
      key: 'contact_company',
      label: 'Company',
      type: 'text',
      sortable: true,
      render: (row) => <span className="font-medium text-admin-text-primary">{row.contact_company}</span>,
    },
    {
      key: 'contact_name',
      label: 'Contact',
      type: 'text',
      sortable: true,
      render: (row) => <span className="text-admin-text-secondary">{row.contact_name}</span>,
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
        <span className="text-admin-text-secondary text-xs">
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
      render: (row) => <StatusBadge status={row.status} config={PROPOSAL_STATUSES} />,
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
      toggleColors: ['bg-admin-success-bg text-admin-success', 'bg-admin-bg-hover text-admin-text-faint'],
    },
    {
      key: 'crowdfunding_deferred',
      label: 'CF Deferred',
      type: 'toggle',
      defaultVisible: false,
      toggleLabels: ['Yes', 'No'],
      toggleColors: ['bg-admin-warning-bg text-admin-warning', 'bg-admin-bg-hover text-admin-text-faint'],
    },
    {
      key: '_activity',
      label: 'Activity',
      defaultWidth: 144,
      render: (row) => {
        const vc = groupedViewCounts[row.id];
        if (!vc?.views) return <span className="text-admin-text-ghost text-xs">—</span>;
        return (
          <span className="text-admin-text-dim text-xs font-mono whitespace-nowrap">
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

  const rowActions: RowAction<GroupedProposalRow>[] = [
    {
      icon: <Eye size={13} />,
      label: 'Views',
      onClick: (row, e) => {
        e.stopPropagation();
        setViewsPanelId(row.id);
      },
    },
    {
      icon: <ExternalLink size={13} />,
      label: 'Preview',
      onClick: (row, e) => {
        e.stopPropagation();
        window.open(`/p/${row.slug}`, '_blank'); // redirects to latest published
      },
    },
    {
      icon: duplicatingId ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />,
      label: 'Duplicate',
      onClick: async (row, e) => {
        e.stopPropagation();
        if (duplicatingId) return;
        setDuplicatingId(row.id);
        try {
          const newId = await duplicateProposal(row.id);
          const newProposal = await getProposal(newId);
          setProposals((prev) => [newProposal, ...prev]);
          setActiveId(newId);
        } finally {
          setDuplicatingId(null);
        }
      },
    },
    {
      icon: versioningId ? <Loader2 size={13} className="animate-spin" /> : <GitBranch size={13} />,
      label: 'New Version',
      onClick: async (row, e) => {
        e.stopPropagation();
        if (versioningId) return;
        setVersioningId(row.id);
        try {
          const newId = await createProposalVersion(row.id);
          const newProposal = await getProposal(newId);
          setProposals((prev) => [newProposal, ...prev]);
          setActiveId(newId);
        } finally {
          setVersioningId(null);
        }
      },
    },
    {
      icon: <Trash2 size={13} />,
      label: 'Delete',
      variant: 'danger',
      onClick: (row) => setDeleteTarget(row),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Proposals"
        icon={FileText}
        subtitle={`${grouped.length} total`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search proposals…"
        actions={
          <>
            <button
              onClick={() => setShowSettings(true)}
              className="btn-secondary px-2.5 py-2.5"
              title="Proposal Settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={() => startCreate(async () => {
                const id = await createProposalDraft();
                setActiveId(id);
              })}
              disabled={isCreating}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              New Proposal
            </button>
          </>
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
                className={`flex items-center gap-1 px-[15px] py-[4px] rounded-lg text-sm font-medium transition-colors border ${
                  statusFilter === tab.value
                    ? 'bg-admin-bg-active text-admin-text-primary border-transparent'
                    : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover border-transparent'
                }`}
              >
                {tab.label}
                {tab.value !== 'all' && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${
                    statusFilter === tab.value ? 'bg-admin-bg-active' : 'bg-admin-bg-hover text-admin-text-faint'
                  }`}>
                    {grouped.filter((p) => p.status === tab.value).length}
                  </span>
                )}
              </button>
            ))}
          </>
        }
        batchActions={[
          {
            label: 'Merge',
            icon: <GitMerge size={13} />,
            onClick: (ids: string[]) => { if (ids.length >= 2) setMergeState({ sourceIds: ids }); },
          },
          {
            label: 'Delete',
            icon: <Trash2 size={13} />,
            variant: 'danger' as const,
            requireConfirm: true,
            onClick: async (ids: string[]) => {
              // Selected ids are group reps; expand to ALL version ids in those groups
              const selectedGroups = new Set(
                grouped.filter((g) => ids.includes(g.id)).map((g) => g.proposal_group_id)
              );
              const allVersionIds = proposals
                .filter((p) => selectedGroups.has(p.proposal_group_id))
                .map((p) => p.id);
              await batchDeleteProposals(allVersionIds);
              setProposals((prev) => prev.filter((p) => !selectedGroups.has(p.proposal_group_id)));
            },
          },
        ]}
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

      {mergeState && (() => {
        const sources = grouped.filter((p) => mergeState.sourceIds.includes(p.id));
        return (
          <MergeDialog
            items={sources.map((p) => {
              const parts = [
                p.contact_company,
                p.contact_name,
                TYPE_LABELS[p.proposal_type] ?? p.proposal_type,
                p.status,
              ].filter(Boolean);
              return { id: p.id, label: p.title, detail: parts.join(' · ') || undefined, createdAt: p.created_at };
            })}
            title="Merge Proposals"
            consequenceText="All contacts, projects, sections, quotes, and milestones will be transferred to the kept proposal."
            onClose={() => setMergeState(null)}
            onMerge={async (sourceIds, targetId) => {
              await mergeProposals(sourceIds, targetId);
              setProposals((prev) => prev.filter((p) => !sourceIds.includes(p.id)));
              setMergeState(null);
            }}
          />
        );
      })()}

      {deleteTarget && (() => {
        const versionCount = grouped.find((g) => g.id === deleteTarget.id)?._versions.length ?? 1;
        return (
          <AdminDeleteModal
            title="Delete proposal?"
            description={
              <>
                <span className="text-admin-text-secondary">{deleteTarget.contact_company}</span>
                {' — deletes all '}
                {versionCount} version{versionCount !== 1 ? 's' : ''}
                {' of this proposal. This action cannot be undone.'}
              </>
            }
            isDeleting={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        );
      })()}


      <ProposalPanel
        proposalId={activeId}
        open={!!activeId}
        viewCount={activeId ? viewCounts[activeId]?.views ?? 0 : 0}
        onClose={() => setActiveId(null)}
        onProposalDeleted={(id) => {
          setProposals((prev) => prev.filter((p) => p.id !== id));
          setActiveId(null);
        }}
        onProposalUpdated={(updated) =>
          setProposals((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p))
        }
        onViewsClick={() => { if (activeId) setViewsPanelId(activeId); }}
        isDuplicating={duplicatingId === activeId}
        onDuplicate={activeId ? () => {
          const id = activeId;
          if (duplicatingId) return;
          setDuplicatingId(id);
          duplicateProposal(id)
            .then((newId) => getProposal(newId).then((newProposal) => {
              setProposals((prev) => [newProposal, ...prev]);
              setActiveId(newId);
            }))
            .finally(() => setDuplicatingId(null));
        } : undefined}
        onSwitchVersion={(versionId) => setActiveId(versionId)}
        onNewVersionCreated={(versionId) => {
          getProposal(versionId).then((newProposal) => {
            setProposals((prev) => [newProposal, ...prev]);
            setActiveId(versionId);
          });
        }}
      />

      <ProposalViewsPanel
        proposalId={viewsPanelId}
        proposalTitle={viewsPanelId ? proposals.find(p => p.id === viewsPanelId)?.title : undefined}
        open={viewsPanelId !== null}
        onClose={() => setViewsPanelId(null)}
      />

      <PipelineSettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
