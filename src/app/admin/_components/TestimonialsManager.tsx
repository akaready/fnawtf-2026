'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Trash2, LayoutGrid, User, Building2, ArrowUpDown, PenLine, Download,
  Table2, CreditCard, Snowflake, Eye, ListFilter, Layers, ArrowUpAZ, Palette, Rows,
} from 'lucide-react';
import { useSaveState } from '@/app/admin/_hooks/useSaveState';
import { SaveButton } from './SaveButton';
import { AdminPageHeader } from './AdminPageHeader';
import { ViewSwitcher, type ViewDef } from './ViewSwitcher';
import { useViewMode } from '../_hooks/useViewMode';
import { AdminDataTable, type ColDef } from './table';
import { ToolbarButton } from './table/TableToolbar';
import {
  type TestimonialRow,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  createContact,
  batchDeleteTestimonials,
} from '../actions';

/* ── Combobox ───────────────────────────────────────────────────────────── */

const inputClass =
  'w-full rounded-lg border border-admin-border-subtle bg-admin-bg-base px-3 py-2.5 text-sm text-admin-text-primary placeholder:text-admin-text-placeholder focus:outline-none focus:ring-1 focus:ring-admin-border-emphasis';

function Combobox({
  value,
  options,
  onChange,
  placeholder,
  createLabel,
  onCreate,
}: {
  value: string;
  options: Array<{ id: string; name: string }>;
  onChange: (name: string, id: string | null) => void;
  placeholder: string;
  createLabel: string;
  onCreate?: (name: string) => Promise<string>;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  const exactMatch = options.find((o) => o.name.toLowerCase() === query.trim().toLowerCase());

  const handleSelect = (option: { id: string; name: string }) => {
    setQuery(option.name);
    onChange(option.name, option.id);
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!onCreate || !query.trim()) return;
    setCreating(true);
    try {
      const id = await onCreate(query.trim());
      onChange(query.trim(), id);
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!ref.current?.contains(document.activeElement)) {
        setOpen(false);
        if (query.trim() && !exactMatch) {
          onChange(query.trim(), null);
        }
      }
    }, 150);
  };

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
          if (!e.target.value.trim()) onChange('', null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={inputClass}
      />
      {open && (filtered.length > 0 || (query.trim() && !exactMatch)) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto admin-scrollbar bg-admin-bg-raised border border-admin-border-muted rounded-lg shadow-xl">
          {filtered.slice(0, 20).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(opt)}
              className="w-full text-left px-3 py-2 text-sm text-admin-text-primary hover:bg-admin-bg-hover transition-colors truncate"
            >
              {opt.name}
            </button>
          ))}
          {query.trim() && !exactMatch && onCreate && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCreate}
              disabled={creating}
              className="w-full text-left px-3 py-2 text-sm text-admin-info hover:bg-admin-bg-hover transition-colors border-t border-admin-border"
            >
              {creating ? 'Creating…' : `${createLabel} "${query.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── View Types ────────────────────────────────────────────────────────── */

type TestimonialsView = 'table' | 'cards';

const TESTIMONIALS_VIEWS: ViewDef<TestimonialsView>[] = [
  { key: 'table', icon: Table2, label: 'Table view' },
  { key: 'cards', icon: CreditCard, label: 'Card view' },
];

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
  const { saving, saved, wrap: wrapSave } = useSaveState(2000);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useViewMode<TestimonialsView>('fna-testimonials-viewMode', 'table');

  const tableColumns: ColDef<TestimonialRow>[] = useMemo(() => [
    {
      key: 'quote', label: 'Quote', searchable: true, defaultWidth: 360,
      render: (row) => (
        <span className="text-sm text-admin-text-primary/80 truncate block max-w-[360px]" title={row.quote}>
          {row.quote.length > 80 ? row.quote.slice(0, 80) + '…' : row.quote}
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
      key: 'display_order', label: 'Order', type: 'number' as const, sortable: true, align: 'right' as const,
      render: (row) => <span className="text-xs text-admin-text-faint tabular-nums">{row.display_order}</span>,
    },
    {
      key: 'created_at', label: 'Created', sortable: true, defaultVisible: false, align: 'right' as const,
      sortValue: (row) => new Date(row.created_at).getTime(),
      render: (row) => <span className="text-xs text-admin-text-ghost">{new Date(row.created_at).toLocaleDateString()}</span>,
    },
  ], [clients, projects]);

  const handleChange = (id: string, field: string, value: unknown) => {
    setTestimonials((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, [field]: value };
        // When client changes, clear project if it doesn't belong to the new client
        if (field === 'client_id' && updated.project_id) {
          const proj = projects.find((p) => p.id === updated.project_id);
          if (proj && value && proj.client_id !== value) {
            updated.project_id = null;
          }
        }
        return updated;
      })
    );
  };

  const handleContactSelect = (testimonialId: string, contactName: string, contactId: string | null) => {
    const contact = contactId ? contacts.find((c) => c.id === contactId) : null;
    setTestimonials((prev) =>
      prev.map((t) => {
        if (t.id !== testimonialId) return t;
        return {
          ...t,
          contact_id: contactId,
          person_name: contactName || null,
          person_title: contact?.role ?? t.person_title,
          contact: contact ? { id: contact.id, first_name: contact.first_name, last_name: contact.last_name, role: contact.role, headshot_url: null } : null,
        };
      })
    );
  };

  const handleCreateContact = async (name: string): Promise<string> => {
    const parts = name.split(' ');
    const first_name = parts[0] || '';
    const last_name = parts.slice(1).join(' ') || '';
    const id = await createContact({ first_name, last_name, type: 'contact' });
    setContacts((prev) => [...prev, { id, first_name, last_name, role: null }]);
    return id;
  };

  const handleSave = (row: TestimonialRow) => {
    wrapSave(async () => {
      await updateTestimonial(row.id, {
        quote: row.quote,
        contact_id: row.contact_id,
        person_name: row.person_name,
        person_title: row.person_title,
        display_title: row.display_title,
        company: row.company,
        profile_picture_url: row.profile_picture_url,
        project_id: row.project_id,
        client_id: row.client_id,
        display_order: row.display_order,
      });
    });
  };

  const handleCreate = () => {
    void (async () => {
      setCreating(true);
      const id = await createTestimonial({
        quote: 'New testimonial…',
        display_order: testimonials.length,
      });
      setTestimonials((prev) => [
        ...prev,
        {
          id,
          quote: 'New testimonial…',
          person_name: null,
          person_title: null,
          display_title: null,
          company: null,
          profile_picture_url: null,
          project_id: null,
          client_id: null,
          contact_id: null,
          display_order: testimonials.length,
          created_at: new Date().toISOString(),
        },
      ]);
      setCreating(false);
    })();
  };

  const handleDelete = (id: string) => {
    void (async () => {
      await deleteTestimonial(id);
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      setConfirmDeleteId(null);
    })();
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
              disabled={creating}
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
            <button onClick={handleCreate} disabled={creating} className="btn-primary p-2.5 text-sm" title="Add Testimonial">
              <Plus size={16} />
            </button>
          </>
        }
      />

      {viewMode === 'table' ? (
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
          onBatchDelete={async (ids) => {
            await batchDeleteTestimonials(ids);
            setTestimonials((prev) => prev.filter((t) => !ids.includes(t.id)));
          }}
          onRowClick={(row) => { setActiveId(row.id); setViewMode('cards'); }}
          emptyMessage={testimonials.length === 0 ? 'No testimonials yet.' : 'No matching testimonials.'}
          emptyAction={{ label: 'Add Testimonial', onClick: handleCreate }}
          rowActions={[
            {
              label: 'Delete',
              icon: <Trash2 size={13} />,
              variant: 'danger' as const,
              onClick: (row) => setConfirmDeleteId(row.id),
            },
          ]}
        />
      ) : (
      <>
      {/* Disabled toolbar — matches table toolbar height */}
      <div className="@container relative z-20 flex items-center gap-1 px-6 @md:px-8 h-[3rem] border-b border-admin-border flex-shrink-0 bg-admin-bg-inset">
        <ViewSwitcher views={TESTIMONIALS_VIEWS} activeView={viewMode} onChange={setViewMode} />
        <div className="flex items-center gap-1 ml-auto flex-shrink-0">
          <ToolbarButton icon={Snowflake} label="" color="purple" disabled onClick={() => {}} />
          <ToolbarButton icon={Eye} label="" color="blue" disabled onClick={() => {}} />
          <ToolbarButton icon={ListFilter} label="" color="green" disabled onClick={() => {}} />
          <ToolbarButton icon={Layers} label="" color="red" disabled onClick={() => {}} />
          <ToolbarButton icon={ArrowUpAZ} label="" color="orange" disabled onClick={() => {}} />
          <ToolbarButton icon={Palette} label="" color="yellow" disabled onClick={() => {}} />
          <ToolbarButton icon={Rows} label="" color="neutral" disabled onClick={() => {}} />
        </div>
      </div>
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 pt-4 pb-8">
      <div className="space-y-4">
      {filteredTestimonials.map((t) => {
        const isUnattached = !t.client_id && !t.project_id;
        const borderColor = isUnattached ? 'border-admin-danger-border' : 'border-admin-border-subtle';

        // Filter projects by selected client — only show projects that match
        const filteredProjects = t.client_id
          ? projects.filter((p) => p.client_id === t.client_id)
          : projects;

        const isActive = activeId === t.id;

        return (
          <div
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`rounded-xl p-6 space-y-5 transition-colors cursor-pointer ${
              isActive
                ? `border border-admin-border-emphasis bg-admin-bg-raised ${isUnattached ? 'border-admin-danger-border' : ''}`
                : `border ${borderColor} bg-admin-bg-raised`
            }`}
          >
            {isUnattached && (
              <div className="text-[11px] text-admin-danger/70 bg-admin-danger-bg rounded-lg px-3 py-1.5 -mt-1">
                Not linked to a client or project
              </div>
            )}

            {/* Quote textarea — no label, just the textarea */}
            <textarea
              value={t.quote}
              onChange={(e) => {
                handleChange(t.id, 'quote', e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
              placeholder="Quote text…"
              className="w-full rounded-lg border border-admin-border-subtle bg-admin-bg-base px-4 py-3 text-base text-admin-text-primary placeholder:text-admin-text-placeholder focus:outline-none focus:ring-1 focus:ring-admin-border-emphasis resize-none overflow-hidden"
            />

            {/* Attribution row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-admin-text-muted">
                  <User size={12} /> Contact
                </label>
                <Combobox
                  value={t.contact ? `${t.contact.first_name} ${t.contact.last_name}`.trim() : t.person_name ?? ''}
                  options={contacts.map((c) => ({ id: c.id, name: `${c.first_name} ${c.last_name}`.trim() }))}
                  onChange={(name, id) => handleContactSelect(t.id, name, id)}
                  placeholder="Search contacts…"
                  createLabel="Add contact"
                  onCreate={handleCreateContact}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-admin-text-muted">
                  <PenLine size={12} /> Display Override
                </label>
                <input
                  type="text"
                  value={t.display_title ?? ''}
                  onChange={(e) => handleChange(t.id, 'display_title', e.target.value || null)}
                  placeholder="Optional override"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Relations row — all with icons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-admin-text-muted">
                  <Building2 size={12} /> Client
                </label>
                <select
                  value={t.client_id ?? ''}
                  onChange={(e) => handleChange(t.id, 'client_id', e.target.value || null)}
                  className={`w-full rounded-lg border ${!t.client_id ? 'border-admin-danger-border' : 'border-admin-border-subtle'} bg-admin-bg-base px-3 py-2.5 text-sm text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-border-emphasis`}
                >
                  <option value="">No client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-admin-text-muted">
                  <LayoutGrid size={12} /> Project
                </label>
                <select
                  value={t.project_id ?? ''}
                  onChange={(e) => handleChange(t.id, 'project_id', e.target.value || null)}
                  className={`w-full rounded-lg border ${!t.project_id ? 'border-admin-danger-border' : 'border-admin-border-subtle'} bg-admin-bg-base px-3 py-2.5 text-sm text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-border-emphasis`}
                >
                  <option value="">No project</option>
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-admin-text-muted">
                  <ArrowUpDown size={12} /> Order
                </label>
                <input
                  type="number"
                  value={t.display_order}
                  onChange={(e) => handleChange(t.id, 'display_order', parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-admin-border-subtle bg-admin-bg-base px-3 py-2.5 text-sm text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-border-emphasis"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-admin-border-subtle">
              <button
                onClick={() => setConfirmDeleteId(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-admin-danger/60 hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
              <SaveButton saving={saving} saved={saved} onClick={() => handleSave(t)} className="px-5 py-2.5 text-sm" />
            </div>
          </div>
        );
      })}

      {testimonials.length === 0 && (
        <div className="text-center py-12 text-admin-text-ghost text-sm">
          No testimonials yet. Click &quot;Add Testimonial&quot; to create one.
        </div>
      )}
      </div>
      </div>
      </>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-admin-bg-raised border border-admin-border-subtle rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-medium">Delete testimonial?</h3>
            <p className="text-sm text-admin-text-muted">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-5 py-2.5 rounded-lg text-sm text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-5 py-2.5 rounded-lg text-sm bg-red-600 text-admin-text-primary hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
