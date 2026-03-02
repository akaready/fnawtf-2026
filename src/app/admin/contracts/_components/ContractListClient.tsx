'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, Table2, Columns, Clock, Eye, CheckCircle2, XCircle, AlertCircle, Send } from 'lucide-react';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import { AdminDataTable } from '@/app/admin/_components/table/AdminDataTable';
import type { ColDef, RowAction } from '@/app/admin/_components/table/types';
import { AdminDeleteModal } from '@/app/admin/_components/AdminTable';
import { ViewSwitcher, type ViewDef } from '@/app/admin/_components/ViewSwitcher';
import { useViewMode } from '@/app/admin/_hooks/useViewMode';
import type { ContractRow, ContractStatus, ContractType } from '@/types/contracts';
import { deleteContract, batchDeleteContracts } from '@/lib/contracts/actions';
import { ContractPanel } from './ContractPanel';
import { CreateContractModal } from './CreateContractModal';


const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Draft',
  pending_review: 'Review',
  sent: 'Sent',
  viewed: 'Viewed',
  signed: 'Signed',
  declined: 'Declined',
  expired: 'Expired',
  voided: 'Voided',
};

const STATUS_COLORS: Record<ContractStatus, string> = {
  draft: 'bg-admin-bg-active text-admin-text-dim',
  pending_review: 'bg-admin-warning-bg text-admin-warning',
  sent: 'bg-admin-info-bg text-admin-info',
  viewed: 'bg-admin-info-bg text-admin-info',
  signed: 'bg-admin-success-bg text-admin-success',
  declined: 'bg-admin-danger-bg text-admin-danger',
  expired: 'bg-admin-danger-bg text-admin-danger',
  voided: 'bg-admin-bg-hover text-admin-text-ghost',
};

const TYPE_LABELS: Record<ContractType, string> = {
  sow: 'SOW',
  msa: 'MSA',
  nda: 'NDA',
  amendment: 'Amendment',
  custom: 'Custom',
};

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'signed', label: 'Signed' },
  { value: 'expired', label: 'Expired' },
];

// Board view columns — styled like leads kanban with colored card backgrounds
const BOARD_COLUMNS: {
  status: ContractStatus;
  label: string;
  accent: string;
  headerColor: string;
  cardBg: string;
  cardBgFocused: string;
  cardBorder: string;
  cardBorderFocused: string;
}[] = [
  { status: 'draft',          label: 'Draft',     accent: 'border-admin-border',         headerColor: 'text-admin-text-dim',  cardBg: '#0e0e0e',   cardBgFocused: '#141414',   cardBorder: 'bg-[#2a2a2a]',          cardBorderFocused: 'bg-white/20' },
  { status: 'pending_review', label: 'Review',    accent: 'border-admin-warning-border', headerColor: 'text-admin-warning',   cardBg: '#1a1408',   cardBgFocused: '#251c0c',   cardBorder: 'bg-amber-800/50',       cardBorderFocused: 'bg-amber-600/70' },
  { status: 'sent',           label: 'Sent',      accent: 'border-admin-info-border',    headerColor: 'text-admin-info',      cardBg: '#0a1520',   cardBgFocused: '#0d1e2e',   cardBorder: 'bg-sky-800/50',         cardBorderFocused: 'bg-sky-600/70' },
  { status: 'viewed',         label: 'Viewed',    accent: 'border-admin-info-border',    headerColor: 'text-admin-info',      cardBg: '#0c1825',   cardBgFocused: '#102030',   cardBorder: 'bg-sky-800/50',         cardBorderFocused: 'bg-sky-600/70' },
  { status: 'signed',         label: 'Signed',    accent: 'border-admin-success-border', headerColor: 'text-admin-success',   cardBg: '#0a1810',   cardBgFocused: '#0e2018',   cardBorder: 'bg-emerald-800/50',     cardBorderFocused: 'bg-emerald-600/70' },
];

type ContractsView = 'table' | 'board';

const VIEWS: ViewDef<ContractsView>[] = [
  { key: 'table', icon: Table2, label: 'Table view' },
  { key: 'board', icon: Columns, label: 'Board view' },
];

interface Props {
  contracts: ContractRow[];
}

export function ContractListClient({ contracts: initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContractRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useViewMode<ContractsView>('fna-contracts-viewMode', 'table');

  // Open panel from URL param
  useState(() => {
    const id = searchParams.get('open');
    if (id) {
      setActiveId(id);
      window.history.replaceState({}, '', '/admin/contracts');
    }
  });

  const filtered = items.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(s) ||
        (c.client?.name || '').toLowerCase().includes(s) ||
        (c.contact ? `${c.contact.first_name} ${c.contact.last_name}` : '').toLowerCase().includes(s) ||
        String(c.contract_number).includes(s)
      );
    }
    return true;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteContract(deleteTarget.id);
      setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      if (activeId === deleteTarget.id) setActiveId(null);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColDef<ContractRow>[] = [
    {
      key: 'contract_number',
      label: '#',
      defaultWidth: 60,
      mono: true,
      align: 'center',
      render: (row) => (
        <span className="text-admin-text-muted font-admin-mono text-xs">{row.contract_number}</span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      defaultWidth: 240,
      render: (row) => (
        <span className="font-medium text-admin-text-primary">{row.title}</span>
      ),
    },
    {
      key: 'client',
      label: 'Client',
      defaultWidth: 160,
      sortValue: (row) => row.client?.name || '',
      render: (row) => (
        <span className="text-sm text-admin-text-secondary">{row.client?.name || '—'}</span>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      defaultWidth: 140,
      defaultVisible: false,
      sortValue: (row) => row.contact ? `${row.contact.first_name} ${row.contact.last_name}` : '',
      render: (row) =>
        row.contact ? (
          <span className="text-sm text-admin-text-secondary">
            {row.contact.first_name} {row.contact.last_name}
          </span>
        ) : (
          <span className="text-admin-text-faint">—</span>
        ),
    },
    {
      key: 'contract_type',
      label: 'Type',
      type: 'select',
      defaultWidth: 90,
      options: Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })),
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-admin-bg-hover text-admin-text-secondary">
          {TYPE_LABELS[row.contract_type] || row.contract_type}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      defaultWidth: 100,
      options: Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[row.status] || ''}`}>
          {STATUS_LABELS[row.status] || row.status}
        </span>
      ),
    },
    {
      key: 'signers',
      label: 'Signers',
      defaultWidth: 100,
      align: 'center',
      render: (row) => {
        const total = row.signers?.length || 0;
        const signed = row.signers?.filter((s) => s.status === 'signed').length || 0;
        if (total === 0) return <span className="text-admin-text-faint">—</span>;
        return (
          <span className={`text-xs font-medium ${signed === total ? 'text-admin-success' : 'text-admin-text-muted'}`}>
            {signed}/{total} signed
          </span>
        );
      },
    },
    {
      key: 'proposal',
      label: 'Proposal',
      defaultWidth: 140,
      defaultVisible: false,
      sortValue: (row) => row.proposal?.title || '',
      render: (row) => (
        <span className="text-sm text-admin-text-secondary">{row.proposal?.title || '—'}</span>
      ),
    },
    {
      key: 'quote_amount',
      label: 'Amount',
      defaultWidth: 110,
      defaultVisible: false,
      align: 'right',
      sortValue: (row) => row.quote?.total_amount || 0,
      render: (row) =>
        row.quote?.total_amount != null ? (
          <span className="text-sm font-admin-mono text-admin-success">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row.quote.total_amount / 100)}
          </span>
        ) : (
          <span className="text-admin-text-faint">—</span>
        ),
    },
    {
      key: 'created_at',
      label: 'Created',
      type: 'date',
      defaultWidth: 120,
    },
  ];

  const rowActions: RowAction<ContractRow>[] = [
    {
      icon: <Trash2 size={14} />,
      label: 'Delete',
      variant: 'danger',
      onClick: (row) => setDeleteTarget(row),
    },
  ];

  const statusIcon = (status: ContractStatus) => {
    switch (status) {
      case 'draft': return <Clock size={11} />;
      case 'pending_review': return <AlertCircle size={11} />;
      case 'sent': return <Send size={11} />;
      case 'viewed': return <Eye size={11} />;
      case 'signed': return <CheckCircle2 size={11} />;
      case 'declined': return <XCircle size={11} />;
      case 'expired': return <AlertCircle size={11} />;
      case 'voided': return <XCircle size={11} />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Contracts"
        subtitle={`${items.length} contract${items.length !== 1 ? 's' : ''}`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search contracts…"
        rightContent={
          <ViewSwitcher views={VIEWS} activeView={viewMode} onChange={setViewMode} />
        }
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
          >
            <Plus size={15} strokeWidth={2} />
            New Contract
          </button>
        }
        mobileActions={
          <button onClick={() => setShowCreateModal(true)} className="btn-primary p-2.5">
            <Plus size={16} strokeWidth={2} />
          </button>
        }
      />

      {/* ── Table View ── */}
      {viewMode === 'table' && (
        <AdminDataTable
          data={filtered}
          columns={columns}
          storageKey="fna-table-contracts"
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
          selectedId={activeId ?? undefined}
          onBatchDelete={async (ids) => {
            await batchDeleteContracts(ids);
            setItems((prev) => prev.filter((c) => !ids.includes(c.id)));
          }}
          toolbarSlot={
            <>
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`flex items-center gap-1.5 px-[15px] py-[4px] rounded-lg text-sm font-medium transition-colors border ${
                    statusFilter === tab.value
                      ? 'bg-admin-bg-active text-admin-text-primary border-transparent'
                      : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover border-transparent'
                  }`}
                >
                  {tab.label}
                  {tab.value !== 'all' && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${
                        statusFilter === tab.value
                          ? 'bg-admin-bg-active'
                          : 'bg-admin-bg-hover text-admin-text-faint'
                      }`}
                    >
                      {items.filter((c) => c.status === tab.value).length}
                    </span>
                  )}
                </button>
              ))}
            </>
          }
          emptyMessage="No contracts yet"
          emptyAction={{ label: 'Create Contract', onClick: () => setShowCreateModal(true) }}
        />
      )}

      {/* -- Board View -- styled like leads kanban */}
      {viewMode === 'board' && (
        <div className="flex-1 min-h-0 overflow-y-hidden admin-scrollbar px-8 pt-4 pb-8">
          <div className="flex gap-4 h-full">
            {BOARD_COLUMNS.map((col) => {
              const colItems = filtered.filter((c) => c.status === col.status);
              return (
                <div
                  key={col.status}
                  className={`flex flex-col flex-1 min-w-0 h-full rounded-xl border transition-colors ${col.accent} bg-admin-bg-wash`}
                >
                  {/* Column header */}
                  <div className={`px-3 py-2.5 border-b flex items-center justify-between ${col.accent}`}>
                    <span className={`text-xs font-semibold ${col.headerColor}`}>{col.label}</span>
                    <span className="text-[10px] text-admin-text-placeholder bg-admin-bg-hover rounded px-1.5 py-0.5">
                      {colItems.length}
                    </span>
                  </div>
                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto admin-scrollbar p-2 space-y-2 min-h-[60px]">
                    {colItems.map((contract) => {
                      const isFocused = activeId === contract.id;
                      return (
                        <button
                          key={contract.id}
                          onClick={() => setActiveId(contract.id)}
                          className={`w-full text-left p-[1px] rounded-xl transition-all cursor-pointer ${isFocused ? col.cardBorderFocused : col.cardBorder}`}
                        >
                          <div
                            className="rounded-[11px] px-3 py-2.5 transition-colors"
                            style={{ backgroundColor: isFocused ? col.cardBgFocused : col.cardBg }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-xs font-medium text-admin-text-primary leading-tight line-clamp-2">
                                {contract.title}
                              </span>
                              <span className="text-[10px] font-admin-mono text-admin-text-faint flex-shrink-0">
                                #{contract.contract_number}
                              </span>
                            </div>
                            {contract.client && (
                              <div className="text-[10px] text-admin-text-muted mb-1.5">{contract.client.name}</div>
                            )}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-admin-bg-hover text-admin-text-dim">
                                {TYPE_LABELS[contract.contract_type]}
                              </span>
                              {(contract.signers?.length ?? 0) > 0 && (
                                <span className="text-[10px] text-admin-text-faint">
                                  {contract.signers!.filter((s) => s.status === 'signed').length}/{contract.signers!.length} signed
                                </span>
                              )}
                              {contract.quote?.total_amount != null && (
                                <span className="text-[10px] font-admin-mono text-admin-success ml-auto">
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(contract.quote.total_amount / 100)}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {/* Declined/Expired/Voided column */}
            {(() => {
              const terminalItems = filtered.filter(
                (c) => c.status === 'declined' || c.status === 'expired' || c.status === 'voided'
              );
              if (terminalItems.length === 0) return null;
              return (
                <div className="flex flex-col flex-1 min-w-0 h-full rounded-xl border border-admin-border bg-admin-bg-wash opacity-60">
                  <div className="px-3 py-2.5 border-b border-admin-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-admin-text-ghost">Closed</span>
                    <span className="text-[10px] text-admin-text-placeholder bg-admin-bg-hover rounded px-1.5 py-0.5">
                      {terminalItems.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto admin-scrollbar p-2 space-y-2 min-h-[60px]">
                    {terminalItems.map((contract) => (
                      <button
                        key={contract.id}
                        onClick={() => setActiveId(contract.id)}
                        className="w-full text-left p-[1px] rounded-xl bg-[#2a2a2a] cursor-pointer"
                      >
                        <div className="rounded-[11px] px-3 py-2.5" style={{ backgroundColor: '#0e0e0e' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`${STATUS_COLORS[contract.status]} inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium`}>
                              {statusIcon(contract.status)}
                              {STATUS_LABELS[contract.status]}
                            </span>
                          </div>
                          <span className="text-xs text-admin-text-secondary line-clamp-1">{contract.title}</span>
                          {contract.client && (
                            <div className="text-[10px] text-admin-text-faint mt-0.5">{contract.client.name}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {deleteTarget && (
        <AdminDeleteModal
          title={`Delete "${deleteTarget.title}"?`}
          description="This will permanently remove this contract and all associated signers and events."
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <ContractPanel
        contractId={activeId}
        open={!!activeId}
        onClose={() => setActiveId(null)}
        onUpdated={(updated) => {
          setItems((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        }}
        onDeleted={(id) => {
          setItems((prev) => prev.filter((c) => c.id !== id));
          setActiveId(null);
        }}
      />
      {showCreateModal && (
        <CreateContractModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => {
            setShowCreateModal(false);
            router.refresh();
            setActiveId(id);
          }}
        />
      )}
    </div>
  );
}
