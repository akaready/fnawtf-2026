'use client';

import { useState, useMemo } from 'react';
import {
  Plus, Trash2, Download,
  Table2, CreditCard,
  MessageSquare, GitMerge, X,
} from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { ViewSwitcher, type ViewDef } from './ViewSwitcher';
import { useViewMode } from '../_hooks/useViewMode';
import { AdminDataTable, type ColDef } from './table';
import { TestimonialPanel } from './TestimonialPanel';
import {
  type TestimonialRow,
  batchDeleteTestimonials,
  mergeTestimonials,
} from '../actions';

/* ── View Types ────────────────────────────────────────────────────────── */

type TestimonialsView = 'table' | 'cards';

const TESTIMONIALS_VIEWS: ViewDef<TestimonialsView>[] = [
  { key: 'table', icon: Table2, label: 'Table view' },
  { key: 'cards', icon: CreditCard, label: 'Card view' },
];

/* ── Merge Dialog ──────────────────────────────────────────────────────── */

function MergeTestimonialsDialog({
  testimonials,
  onClose,
  onMerge,
  isPending,
}: {
  testimonials: TestimonialRow[];
  onClose: () => void;
  onMerge: (sourceIds: string[], targetId: string) => void;
  isPending: boolean;
}) {
  const [targetId, setTargetId] = useState<string>(testimonials[0]?.id ?? '');

  const getName = (t: TestimonialRow) =>
    t.contact ? `${t.contact.first_name} ${t.contact.last_name}`.trim() : t.person_name ?? 'Anonymous';

  return (
    <div className="relative z-10 bg-[#0f0f0f] border border-admin-border rounded-xl w-full max-w-md mx-4 shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border-subtle">
        <h2 className="text-lg font-semibold text-admin-text-primary">Merge Testimonials</h2>
        <button onClick={onClose} className="text-admin-text-muted hover:text-admin-text-primary transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="px-6 py-5 space-y-5">
        <div>
          <p className="text-xs text-admin-text-faint uppercase tracking-wider mb-2">Merging</p>
          <div className="flex flex-wrap gap-1.5">
            {testimonials.map((t) => (
              <span key={t.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-admin-bg-hover border border-admin-border text-sm text-admin-text-primary">
                {getName(t)}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-admin-text-faint uppercase tracking-wider mb-2">Keep as</p>
          <div className="space-y-1.5">
            {testimonials.map((t) => (
              <label key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-admin-bg-hover transition-colors">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${targetId === t.id ? 'border-admin-text-primary bg-admin-text-primary' : 'border-admin-border'}`}>
                  {targetId === t.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
                <input type="radio" className="sr-only" value={t.id} checked={targetId === t.id} onChange={() => setTargetId(t.id)} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-admin-text-primary block">{getName(t)}</span>
                  <span className="text-xs text-admin-text-muted block truncate">{t.quote.length > 60 ? t.quote.slice(0, 60) + '...' : t.quote}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <p className="text-xs text-admin-text-muted px-3 py-2 rounded-lg bg-admin-bg-subtle border border-admin-border">
          The kept testimonial will be preserved. All others will be deleted.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-admin-border-subtle">
        <button onClick={onClose} disabled={isPending} className="btn-secondary px-4 py-2 text-sm font-medium">
          Cancel
        </button>
        <button
          disabled={isPending || !targetId}
          onClick={() => onMerge(testimonials.map((t) => t.id).filter((id) => id !== targetId), targetId)}
          className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed"
        >
          <GitMerge size={13} />
          {isPending ? 'Merging...' : 'Merge'}
        </button>
      </div>
    </div>
  );
}

/* ── TestimonialsManager ────────────────────────────────────────────────── */

interface Props {
  initialTestimonials: TestimonialRow[];
  clients: { id: string; name: string; logo_url: string | null }[];
  projects: { id: string; title: string; client_id?: string | null }[];
  contacts: { id: string; first_name: string; last_name: string; role: string | null }[];
}

export function TestimonialsManager({ initialTestimonials, clients, projects, contacts: initialContacts }: Props) {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [contacts, setContacts] = useState(initialContacts);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mergeState, setMergeState] = useState<{ sourceIds: string[] } | null>(null);
  const [merging, setMerging] = useState(false);
  const [viewMode, setViewMode] = useViewMode<TestimonialsView>('fna-testimonials-viewMode', 'table');

  const tableColumns: ColDef<TestimonialRow>[] = useMemo(() => [
    {
      key: 'quote', label: 'Quote', searchable: true, defaultWidth: 360,
      render: (row) => (
        <span className="text-sm text-admin-text-primary/80 truncate block" title={row.quote}>
          {row.quote}
        </span>
      ),
    },
    {
      key: 'person_name', label: 'Person', sortable: true, searchable: true,
      render: (row) => {
        const name = row.contact
          ? `${row.contact.first_name} ${row.contact.last_name}`.trim()
          : row.person_name;
        return name
          ? <span className="text-sm text-admin-text-primary">{name}</span>
          : <span className="text-xs text-admin-text-placeholder">—</span>;
      },
    },
    {
      key: 'client_id', label: 'Client', sortable: true,
      sortValue: (row) => (row.client_id ? clients.find((c) => c.id === row.client_id)?.name ?? '' : ''),
      render: (row) => {
        const client = row.client_id ? clients.find((c) => c.id === row.client_id) : null;
        return client
          ? <span className="text-sm text-admin-text-faint">{client.name}</span>
          : <span className="text-xs text-admin-text-placeholder">—</span>;
      },
    },
    {
      key: 'project_id', label: 'Project', sortable: true, defaultVisible: false,
      sortValue: (row) => (row.project_id ? projects.find((p) => p.id === row.project_id)?.title ?? '' : ''),
      render: (row) => {
        const proj = row.project_id ? projects.find((p) => p.id === row.project_id) : null;
        return proj
          ? <span className="text-sm text-admin-text-faint">{proj.title}</span>
          : <span className="text-xs text-admin-text-placeholder">—</span>;
      },
    },
    {
      key: 'created_at', label: 'Created', sortable: true, defaultVisible: false, align: 'right' as const,
      sortValue: (row) => new Date(row.created_at).getTime(),
      render: (row) => <span className="text-xs text-admin-text-ghost">{new Date(row.created_at).toLocaleDateString()}</span>,
    },
  ], [clients, projects]);

  const handleCreate = () => {
    setActiveId('__new__');
  };

  const filteredTestimonials = useMemo(() => {
    if (!search.trim()) return testimonials;
    const q = search.toLowerCase();
    return testimonials.filter((t) => {
      if (t.quote.toLowerCase().includes(q)) return true;
      if (t.person_name?.toLowerCase().includes(q)) return true;
      if (t.person_title?.toLowerCase().includes(q)) return true;
      if (t.contact && `${t.contact.first_name} ${t.contact.last_name}`.toLowerCase().includes(q)) return true;
      if (t.company?.toLowerCase().includes(q)) return true;
      if (t.client_id) {
        const client = clients.find((c) => c.id === t.client_id);
        if (client?.name.toLowerCase().includes(q)) return true;
      }
      if (t.project_id) {
        const project = projects.find((p) => p.id === t.project_id);
        if (project?.title.toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [testimonials, search, clients, projects]);

  const handleExportCsv = () => {
    const header = ['Quote', 'Person Name', 'Person Title', 'Display Title', 'Company', 'Client', 'Project', 'Order', 'Created'];
    const rows = filteredTestimonials.map((t) => {
      const clientName = t.client_id ? clients.find((c) => c.id === t.client_id)?.name ?? '' : '';
      const projectTitle = t.project_id ? projects.find((p) => p.id === t.project_id)?.title ?? '' : '';
      return [t.quote, t.person_name ?? '', t.person_title ?? '', t.display_title ?? '', t.company ?? '', clientName, projectTitle, t.display_order, new Date(t.created_at).toLocaleDateString()];
    });
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `testimonials-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Testimonials"
        icon={MessageSquare}
        subtitle={`${testimonials.length} total — Manage client quotes displayed on the site.`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search testimonials…"
        actions={
          <>
            <button
              onClick={handleExportCsv}
              className="btn-secondary px-4 py-2.5 text-sm"
              title="Export filtered list as CSV"
            >
              <Download size={14} />
              CSV
            </button>
            <button
              onClick={handleCreate}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              <Plus size={16} />
              Add Testimonial
            </button>
          </>
        }
        mobileActions={
          <>
            <button onClick={handleExportCsv} className="btn-secondary p-2.5 text-sm" title="Export CSV">
              <Download size={14} />
            </button>
            <button onClick={handleCreate} className="btn-primary p-2.5 text-sm" title="Add Testimonial">
              <Plus size={16} />
            </button>
          </>
        }
      />

      <AdminDataTable
        columns={tableColumns}
        data={filteredTestimonials}
        storageKey="fna-table-testimonials"
        toolbar
        toolbarSlot={<ViewSwitcher views={TESTIMONIALS_VIEWS} activeView={viewMode} onChange={setViewMode} />}
        sortable
        filterable
        columnVisibility
        columnReorder
        columnResize
        selectable
        freezePanes
        exportCsv
        batchActions={[
          {
            label: 'Merge',
            icon: <GitMerge size={13} />,
            onClick: (ids: string[]) => {
              if (ids.length < 2) return;
              setMergeState({ sourceIds: ids });
            },
          },
          {
            label: 'Delete',
            icon: <Trash2 size={13} />,
            variant: 'danger' as const,
            onClick: async (ids: string[]) => {
              await batchDeleteTestimonials(ids);
              setTestimonials((prev) => prev.filter((t) => !ids.includes(t.id)));
            },
          },
        ]}
        onRowClick={(row) => setActiveId(row.id)}
        emptyMessage={testimonials.length === 0 ? 'No testimonials yet.' : 'No matching testimonials.'}
        emptyAction={{ label: 'Add Testimonial', onClick: handleCreate }}
      />

      {mergeState && (() => {
        const sourceTestimonials = testimonials.filter((t) => mergeState.sourceIds.includes(t.id));
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMergeState(null)} />
            <MergeTestimonialsDialog
              testimonials={sourceTestimonials}
              onClose={() => setMergeState(null)}
              onMerge={async (sourceIds, targetId) => {
                setMerging(true);
                try {
                  await mergeTestimonials(sourceIds, targetId);
                  setTestimonials((prev) => prev.filter((t) => !sourceIds.includes(t.id)));
                  setMergeState(null);
                } finally {
                  setMerging(false);
                }
              }}
              isPending={merging}
            />
          </div>
        );
      })()}

      <TestimonialPanel
        testimonial={activeId && activeId !== '__new__' ? testimonials.find((t) => t.id === activeId) ?? null : null}
        open={activeId !== null}
        onClose={() => setActiveId(null)}
        onCreated={(row) => {
          setTestimonials((prev) => [...prev, row]);
          setActiveId(row.id);
        }}
        onUpdated={(row) => {
          setTestimonials((prev) => prev.map((t) => (t.id === row.id ? row : t)));
        }}
        onDeleted={(id) => {
          setTestimonials((prev) => prev.filter((t) => t.id !== id));
          setActiveId(null);
        }}
        clients={clients}
        projects={projects}
        contacts={contacts}
        onContactCreated={(c) => setContacts((prev) => [...prev, c])}
      />
    </div>
  );
}
