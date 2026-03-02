'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import { AdminDataTable } from '@/app/admin/_components/table/AdminDataTable';
import type { ColDef, RowAction } from '@/app/admin/_components/table/types';
import { AdminDeleteModal } from '@/app/admin/_components/AdminTable';
import type { ContractTemplateRow, ContractType } from '@/types/contracts';
import {
  createContractTemplate,
  deleteContractTemplate,
  updateContractTemplate,
} from '@/lib/contracts/actions';
import { TemplatePanel } from './TemplatePanel';

const TYPE_LABELS: Record<ContractType, string> = {
  sow: 'SOW',
  msa: 'MSA',
  nda: 'NDA',
  amendment: 'Amendment',
  custom: 'Custom',
};

const TYPE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'sow', label: 'SOW' },
  { value: 'msa', label: 'MSA' },
  { value: 'nda', label: 'NDA' },
  { value: 'amendment', label: 'Amendment' },
  { value: 'custom', label: 'Custom' },
];

interface Props {
  templates: ContractTemplateRow[];
}

export function TemplateListClient({ templates: initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContractTemplateRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, startCreate] = useTransition();

  const filtered = items.filter((t) => {
    if (typeFilter !== 'all' && t.contract_type !== typeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(s) ||
        (t.description || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  const handleCreate = () => {
    startCreate(async () => {
      const id = await createContractTemplate({
        name: 'Untitled Template',
        contract_type: 'sow',
      });
      router.refresh();
      setActiveId(id);
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteContractTemplate(deleteTarget.id);
      setItems((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColDef<ContractTemplateRow>[] = [
    {
      key: 'name',
      label: 'Name',
      defaultWidth: 280,
      render: (row) => (
        <span className="font-medium text-admin-text-primary">{row.name}</span>
      ),
    },
    {
      key: 'contract_type',
      label: 'Type',
      type: 'select',
      defaultWidth: 120,
      options: Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })),
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-admin-bg-hover text-admin-text-secondary">
          {TYPE_LABELS[row.contract_type] || row.contract_type}
        </span>
      ),
    },
    {
      key: 'merge_fields',
      label: 'Fields',
      defaultWidth: 80,
      align: 'center',
      render: (row) => (
        <span className="text-xs text-admin-text-muted">
          {Array.isArray(row.merge_fields) ? row.merge_fields.length : 0}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Active',
      type: 'toggle',
      defaultWidth: 80,
      toggleLabels: ['Active', 'Inactive'],
      toggleColors: ['text-admin-success', 'text-admin-text-faint'],
      onEdit: async (id, val) => {
        await updateContractTemplate(id, { is_active: val });
        setItems((prev) =>
          prev.map((t) => (t.id === id ? { ...t, is_active: val as boolean } : t))
        );
      },
    },
    {
      key: 'updated_at',
      label: 'Updated',
      type: 'date',
      defaultWidth: 140,
    },
  ];

  const rowActions: RowAction<ContractTemplateRow>[] = [
    {
      icon: <Trash2 size={14} />,
      label: 'Delete',
      variant: 'danger',
      onClick: (row) => setDeleteTarget(row),
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Contract Templates"
        subtitle={`${items.length} template${items.length !== 1 ? 's' : ''}`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search templates…"
        actions={
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
          >
            <Plus size={15} strokeWidth={2} />
            New Template
          </button>
        }
        mobileActions={
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="btn-primary p-2.5"
          >
            <Plus size={16} strokeWidth={2} />
          </button>
        }
      />
      <AdminDataTable
        data={filtered}
        columns={columns}
        storageKey="fna-table-contract-templates"
        toolbar
        sortable
        columnVisibility
        columnResize
        rowActions={rowActions}
        onRowClick={(row) => setActiveId(row.id)}
        selectedId={activeId ?? undefined}
        onBatchDelete={async (ids) => {
          for (const id of ids) await deleteContractTemplate(id);
          setItems((prev) => prev.filter((t) => !ids.includes(t.id)));
        }}
        selectable
        toolbarSlot={
          <>
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTypeFilter(tab.value)}
                className={`flex items-center gap-1.5 px-[15px] py-[4px] rounded-lg text-sm font-medium transition-colors border ${
                  typeFilter === tab.value
                    ? 'bg-admin-bg-active text-admin-text-primary border-transparent'
                    : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover border-transparent'
                }`}
              >
                {tab.label}
                {tab.value !== 'all' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${
                      typeFilter === tab.value
                        ? 'bg-admin-bg-active'
                        : 'bg-admin-bg-hover text-admin-text-faint'
                    }`}
                  >
                    {items.filter((t) => t.contract_type === tab.value).length}
                  </span>
                )}
              </button>
            ))}
          </>
        }
        emptyMessage="No contract templates yet"
        emptyAction={{ label: 'Create Template', onClick: handleCreate }}
      />
      {deleteTarget && (
        <AdminDeleteModal
          title={`Delete "${deleteTarget.name}"?`}
          description="This will permanently remove this template. Contracts already created from it will not be affected."
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <TemplatePanel
        templateId={activeId}
        open={!!activeId}
        onClose={() => setActiveId(null)}
        onUpdated={(updated) => {
          setItems((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        }}
        onDeleted={(id) => {
          setItems((prev) => prev.filter((t) => t.id !== id));
          setActiveId(null);
        }}
      />
    </div>
  );
}
