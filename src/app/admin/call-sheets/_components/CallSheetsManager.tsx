'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import { AdminDataTable } from '@/app/admin/_components/table/AdminDataTable';
import type { ColDef } from '@/app/admin/_components/table/types';
import type { CallSheetListRow } from '@/types/callsheet-admin';
import { batchDeleteCallSheets, createCallSheet } from '../../actions';
import { CallSheetPanel } from './CallSheetPanel';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-admin-bg-active text-admin-text-dim',
  published: 'bg-admin-success-bg text-admin-success',
};

interface Props {
  initialCallSheets: CallSheetListRow[];
}

export function CallSheetsManager({ initialCallSheets }: Props) {
  const [items, setItems] = useState(initialCallSheets);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = items.filter((cs) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (cs.project_title ?? '').toLowerCase().includes(q) ||
      (cs.location_name ?? '').toLowerCase().includes(q) ||
      cs.general_call_time.toLowerCase().includes(q) ||
      cs.date.includes(q)
    );
  });

  const columns: ColDef<CallSheetListRow>[] = [
    {
      key: 'project_title',
      label: 'Project',
      defaultWidth: 200,
      sortable: true,
      sortValue: (r) => r.project_title ?? '',
      render: (r) => (
        <span className="font-medium text-admin-text-primary truncate">
          {r.project_title || <span className="text-admin-text-ghost">No project</span>}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      type: 'date',
      defaultWidth: 120,
      sortable: true,
      sortValue: (r) => r.date,
      render: (r) => {
        const d = new Date(r.date + 'T00:00:00');
        return <span>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>;
      },
    },
    {
      key: 'shoot_day',
      label: 'Day',
      defaultWidth: 90,
      sortable: true,
      sortValue: (r) => r.shoot_day,
      render: (r) => <span>Day {r.shoot_day} of {r.total_days}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      defaultWidth: 100,
      sortable: true,
      sortValue: (r) => r.status,
      render: (r) => (
        <span className={`inline-flex px-2 py-0.5 rounded-admin-sm text-admin-xs font-medium ${STATUS_COLORS[r.status] ?? ''}`}>
          {STATUS_LABELS[r.status] ?? r.status}
        </span>
      ),
    },
    {
      key: 'general_call_time',
      label: 'Call Time',
      defaultWidth: 100,
      sortable: true,
      render: (r) => <span className="font-admin-mono">{r.general_call_time}</span>,
    },
    {
      key: 'location_name',
      label: 'Location',
      defaultWidth: 180,
      sortable: true,
      sortValue: (r) => r.location_name ?? '',
      render: (r) => (
        <span className="truncate">
          {r.location_name || <span className="text-admin-text-ghost">--</span>}
        </span>
      ),
    },
    {
      key: 'crew_count',
      label: 'Crew',
      defaultWidth: 70,
      sortable: true,
      sortValue: (r) => r.crew_count,
      align: 'center',
      render: (r) => <span className="font-admin-mono">{r.crew_count}</span>,
    },
  ];

  async function handleCreate() {
    const id = await createCallSheet({});
    setItems((prev) => [
      {
        id,
        project_id: null,
        script_id: null,
        slug: '',
        status: 'draft',
        date: new Date().toISOString().split('T')[0],
        shoot_day: 1,
        total_days: 1,
        general_call_time: '8:00 AM',
        crew_call: null,
        talent_call: null,
        shooting_call: null,
        lunch_time: null,
        estimated_wrap: null,
        doordash_enabled: false,
        doordash_link: null,
        set_contact: null,
        location_id: null,
        parking_address: null,
        parking_note: null,
        hospital_name: null,
        hospital_address: null,
        hospital_phone: null,
        vendors_visible: true,
        dept_notes_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
        updated_by: null,
        project_title: null,
        location_name: null,
        crew_count: 0,
      } as CallSheetListRow,
      ...prev,
    ]);
    setActiveId(id);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Call Sheets"
        subtitle={`${items.length} call sheet${items.length !== 1 ? 's' : ''}`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search call sheets..."
        actions={
          <button onClick={handleCreate} className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2">
            <Plus size={15} /> New Call Sheet
          </button>
        }
      />

      <AdminDataTable
        data={filtered}
        columns={columns}
        storageKey="fna-table-call-sheets"
        toolbar
        sortable
        filterable
        groupable
        columnVisibility
        columnReorder
        columnResize
        selectable
        freezePanes
        exportCsv
        onRowClick={(row) => setActiveId(row.id)}
        selectedId={activeId ?? undefined}
        batchActions={[
          {
            label: 'Delete',
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (ids) => {
              await batchDeleteCallSheets(ids);
              setItems((prev) => prev.filter((cs) => !ids.includes(cs.id)));
            },
          },
        ]}
        emptyMessage="No call sheets yet"
        emptyAction={{ label: 'New Call Sheet', onClick: handleCreate }}
      />

      <CallSheetPanel
        callSheetId={activeId}
        open={!!activeId}
        onClose={() => setActiveId(null)}
        onSaved={(updated) => {
          setItems((prev) =>
            prev.map((cs) => (cs.id === updated.id ? { ...cs, ...updated } : cs))
          );
        }}
        onDeleted={(id) => {
          setItems((prev) => prev.filter((cs) => cs.id !== id));
          setActiveId(null);
        }}
      />
    </div>
  );
}
