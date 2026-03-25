'use client';

import { useState, useTransition, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus, Download, X,
  Building2, Image as ImageIcon,
  Wrench, Sparkles, Contact, Star, HeartHandshake, Users, LayoutGrid, Tag,
  User, ListFilter, Layers, ArrowUpAZ, Palette, Rows, Snowflake, Eye, Table2,
  GitMerge, Trash2,
} from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { MergeDialog } from './MergeDialog';
import { ViewSwitcher, type ViewDef } from './ViewSwitcher';
import { useViewMode } from '../_hooks/useViewMode';
import { ToolbarButton } from './table/TableToolbar';
import { AdminDataTable, FilterDropdown, type ColDef } from './table';
import { PersonPanel, TYPE_COLORS } from './PersonPanel';
import { contactFullName } from '@/lib/contacts';
import {
  createContact,
  updateContact,
  deleteContact,
  type ClientRow,
  batchDeleteContacts,
  mergeContacts,
} from '../actions';
import type { ContactRow, ContactType } from '@/types/proposal';

const TYPE_ICON_COLORS: Record<string, string> = {
  all: 'text-admin-text-dim',
  crew: 'text-purple-400',
  cast: 'text-pink-400',
  contact: 'text-admin-success',
  staff: 'text-admin-warning',
  vendor: 'text-orange-400',
};

const TYPE_ACTIVE_CLASSES: Record<string, string> = {
  all: 'bg-admin-bg-active text-admin-text-primary border-admin-border-emphasis',
  crew: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  cast: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  contact: 'bg-admin-success-bg text-admin-success border-admin-success-border',
  staff: 'bg-admin-warning-bg text-admin-warning border-admin-warning-border',
  vendor: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
};

const TYPE_CIRCLE_BG: Record<ContactType, string> = {
  crew: 'bg-purple-500/10',
  cast: 'bg-pink-500/10',
  contact: 'bg-admin-success-bg',
  staff: 'bg-admin-warning-bg',
  vendor: 'bg-orange-500/10',
};

const CONTACT_COLUMNS: ColDef<ContactRow>[] = [
  {
    key: 'first_name', label: 'First Name', sortable: true,
    sortValue: (c) => c.first_name.toLowerCase(),
    render: (c) => (
      <div className="flex items-center gap-2.5">
        {c.headshot_url ? (
          <img src={c.headshot_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className={`w-7 h-7 rounded-full ${TYPE_CIRCLE_BG[c.type]} flex items-center justify-center flex-shrink-0`}>
            <User size={14} className={TYPE_ICON_COLORS[c.type]} />
          </div>
        )}
        <span className="font-medium text-admin-text-primary">{c.first_name}</span>
      </div>
    ),
  },
  {
    key: 'last_name', label: 'Last Name', sortable: true,
    sortValue: (c) => c.last_name.toLowerCase(),
    render: (c) => <span className="text-admin-text-primary">{c.last_name}</span>,
  },
  { key: 'type', label: 'Type', sortable: true, sortValue: (c) => c.type, render: (c) => (
    <span className={`inline-flex px-2 py-0.5 text-xs rounded border capitalize ${TYPE_COLORS[c.type]}`}>{c.type}</span>
  )},
  { key: 'email', label: 'Email', sortable: true, sortValue: (c) => (c.email ?? '').toLowerCase(), render: (c) => <span className="text-admin-text-muted">{c.email || '—'}</span> },
  { key: 'phone', label: 'Phone', defaultVisible: false, render: (c) => <span className="text-admin-text-muted">{c.phone || '—'}</span> },
  { key: 'company', label: 'Company', sortable: true, sortValue: (c) => (c.company ?? '').toLowerCase(), render: (c) => <span className="text-admin-text-muted">{c.company || '—'}</span> },
  { key: 'title', label: 'Title', sortable: true, sortValue: (c) => (c.role ?? '').toLowerCase(), render: (c) => <span className="text-admin-text-muted">{c.role || '—'}</span> },
  { key: 'website_url', label: 'Website', defaultVisible: false, render: (c) => c.website_url ? (
    <a href={c.website_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-accent hover:underline truncate block">{new URL(c.website_url).hostname}</a>
  ) : <span className="text-admin-text-muted">—</span> },
  { key: 'linkedin_url', label: 'LinkedIn', defaultVisible: false, render: (c) => c.linkedin_url ? (
    <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-accent hover:underline truncate block">Profile</a>
  ) : <span className="text-admin-text-muted">—</span> },
  { key: 'instagram_url', label: 'Instagram', defaultVisible: false, render: (c) => c.instagram_url ? (
    <a href={c.instagram_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-accent hover:underline truncate block">@{c.instagram_url.split('/').filter(Boolean).pop()}</a>
  ) : <span className="text-admin-text-muted">—</span> },
  { key: 'imdb_url', label: 'IMDB', defaultVisible: false, render: (c) => c.imdb_url ? (
    <a href={c.imdb_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-accent hover:underline truncate block">Page</a>
  ) : <span className="text-admin-text-muted">—</span> },
  { key: 'notes', label: 'Notes', defaultVisible: false, render: (c) => c.notes ? (
    <span className="truncate block max-w-[200px] text-admin-text-muted" title={c.notes}>{c.notes}</span>
  ) : <span className="text-admin-text-muted">—</span> },
  { key: 'created_at', label: 'Added', align: 'right', sortable: true, sortValue: (c) => new Date(c.created_at).getTime(), render: (c) => <span className="text-xs text-admin-text-faint">{new Date(c.created_at).toLocaleDateString()}</span> },
  { key: 'updated_at', label: 'Updated', defaultVisible: false, align: 'right', sortable: true, sortValue: (c) => new Date(c.updated_at).getTime(), render: (c) => <span className="text-xs text-admin-text-faint">{new Date(c.updated_at).toLocaleDateString()}</span> },
];

const TYPE_ICONS: Record<string, typeof Users> = {
  all: Users,
  crew: Wrench,
  cast: Sparkles,
  contact: Contact,
  staff: Star,
  vendor: HeartHandshake,
};

type ContactViewMode = 'table' | 'gallery';

const CONTACT_VIEWS: ViewDef<ContactViewMode>[] = [
  { key: 'table', icon: Table2, label: 'Table view' },
  { key: 'gallery', icon: LayoutGrid, label: 'Cast gallery' },
];

interface Props {
  initialContacts: ContactRow[];
  companies: ClientRow[];
  projects: Array<{ id: string; title: string; client_name: string }>;
  contactProjectMap: Record<string, string[]>;
  roles: Array<{ id: string; name: string }>;
  contactRoleMap: Record<string, string[]>;
}


export function ContactsManager({ initialContacts, companies, projects, contactProjectMap, roles, contactRoleMap }: Props) {
  const [contacts, setContacts] = useState(initialContacts);
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useViewMode<ContactViewMode>('fna-contacts-viewMode', 'table');
  const [typeFilter, setTypeFilter] = useState<ContactType | 'all'>('all');
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [mergeState, setMergeState] = useState<{ sourceIds: string[] } | null>(null);
  const [, startMerge] = useTransition();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('open');
    if (id) {
      setActiveId(id);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => { setContacts(initialContacts); }, [initialContacts]);

  const filtered = useMemo(() => {
    let result = contacts;
    if (typeFilter !== 'all') result = result.filter((c) => c.type === typeFilter);
    if (companyFilter) result = result.filter((c) => c.client_id === companyFilter);
    if (projectFilter) {
      const contactIds = new Set(
        Object.entries(contactProjectMap)
          .filter(([, pIds]) => pIds.includes(projectFilter))
          .map(([cId]) => cId)
      );
      result = result.filter((c) => contactIds.has(c.id));
    }
    if (roleFilter) {
      const contactIds = new Set(
        Object.entries(contactRoleMap)
          .filter(([, rIds]) => rIds.includes(roleFilter))
          .map(([cId]) => cId)
      );
      result = result.filter((c) => contactIds.has(c.id));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          contactFullName(c).toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.role?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [contacts, search, typeFilter, companyFilter, projectFilter, contactProjectMap, roleFilter, contactRoleMap]);

  const activePerson = activeId ? contacts.find((c) => c.id === activeId) ?? null : null;

  const handleCreate = (type: ContactType = typeFilter === 'all' ? 'contact' : typeFilter) => {
    void (async () => {
      setCreating(true);
      const id = await createContact({ first_name: 'New', last_name: 'Person', type });
      const newContact: ContactRow = {
        id,
        first_name: 'New',
        last_name: 'Person',
        email: null,
        phone: null,
        role: null,
        company: null,
        client_id: null,
        notes: null,
        type,
        headshot_url: null,
        website_url: null,
        linkedin_url: null,
        instagram_url: null,
        imdb_url: null,
        appearance_prompt: null,
        admin_role: null,
        supabase_user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setContacts((prev) => [...prev, newContact]);
      setActiveId(id);
      setCreating(false);
    })();
  };

  const handleSave = async (row: ContactRow): Promise<void> => {
    setContacts((prev) => prev.map((c) => (c.id === row.id ? row : c)));
    await updateContact(row.id, {
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      company: row.company,
      client_id: row.client_id ?? null,
      notes: row.notes,
      type: row.type,
      headshot_url: row.headshot_url,
      website_url: row.website_url,
      linkedin_url: row.linkedin_url,
      instagram_url: row.instagram_url,
      imdb_url: row.imdb_url,
    });
  };

  const handleDelete = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
    void deleteContact(id);
  };

  const handleMerge = useCallback((sourceIds: string[], targetId: string) => {
    setContacts((prev) => prev.filter((c) => !sourceIds.includes(c.id)));
    setMergeState(null);
    startMerge(async () => {
      try {
        await mergeContacts(sourceIds, targetId);
      } catch (e) {
        console.error(e);
        setContacts(initialContacts);
      }
    });
  }, [initialContacts, startMerge]);

  const handleExportCsv = () => {
    const header = ['First Name', 'Last Name', 'Type', 'Email', 'Phone', 'Role', 'Company', 'Notes', 'Created'];
    const rows = filtered.map((c) => [
      c.first_name, c.last_name, c.type, c.email ?? '', c.phone ?? '', c.role ?? '', c.company ?? '', c.notes ?? '',
      new Date(c.created_at).toLocaleDateString(),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `people-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  // Count per type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: contacts.length };
    for (const c of contacts) counts[c.type] = (counts[c.type] ?? 0) + 1;
    return counts;
  }, [contacts]);

  // Cast gallery view
  const isCastView = viewMode === 'gallery';

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <AdminPageHeader
        title="People"
        icon={Users}
        subtitle={`${contacts.length} total`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search people..."
        actions={
          <>
            <button onClick={handleExportCsv} className="btn-secondary px-4 py-2.5 text-sm" title="Export as CSV">
              <Download size={14} /> CSV
            </button>
            <button onClick={() => handleCreate()} disabled={creating} className="btn-primary px-5 py-2.5 text-sm">
              <Plus size={16} /> Add Person
            </button>
          </>
        }
        mobileActions={
          <>
            <button onClick={handleExportCsv} className="btn-secondary p-2.5 text-sm" title="Export CSV">
              <Download size={14} />
            </button>
            <button onClick={() => handleCreate()} disabled={creating} className="btn-primary p-2.5 text-sm" title="Add Person">
              <Plus size={16} />
            </button>
          </>
        }
      />

      {/* Content area */}
      {isCastView ? (
        <>
          {/* Cast gallery toolbar — matches AdminDataTable toolbar style */}
          <div className="@container relative z-20 flex items-center gap-1 px-6 @md:px-8 h-[3rem] border-b border-admin-border flex-shrink-0 bg-admin-bg-inset">
            <ViewSwitcher views={CONTACT_VIEWS} activeView={viewMode} onChange={setViewMode} />
            {/* Type tabs — full buttons on lg+, dropdown on smaller */}
            <div className="hidden 2xl:flex items-center gap-1 flex-shrink-0">
              {(['all', 'crew', 'cast', 'contact', 'staff', 'vendor'] as const).map((t) => {
                const Icon = TYPE_ICONS[t];
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`flex items-center gap-1.5 px-[15px] py-[4px] rounded-lg text-sm font-medium transition-colors border ${
                      typeFilter === t
                        ? (TYPE_ACTIVE_CLASSES[t] ?? 'bg-admin-bg-active text-admin-text-primary border-transparent')
                        : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover border-transparent'
                    }`}
                  >
                    <Icon size={14} strokeWidth={1.75} />
                    {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${
                      typeFilter === t ? 'bg-admin-bg-active' : 'bg-admin-bg-hover text-admin-text-faint'
                    }`}>{typeCounts[t] ?? 0}</span>
                  </button>
                );
              })}
            </div>
            <div className="2xl:hidden">
              <FilterDropdown
                label="Type"
                icon={<Users size={13} />}
                items={[
                  { id: 'all', name: 'All' },
                  { id: 'crew', name: 'Crew' },
                  { id: 'cast', name: 'Cast' },
                  { id: 'contact', name: 'Contact' },
                  { id: 'staff', name: 'Staff' },
                  { id: 'vendor', name: 'Partner' },
                ]}
                value={typeFilter as string === 'all' ? null : typeFilter}
                onChange={(v) => setTypeFilter((v as ContactType) ?? 'all')}
                allowClear
                clearLabel="All types"
              />
            </div>

            <div className="w-px bg-admin-bg-active mx-1.5 self-stretch" />

            {/* Filter dropdowns */}
            <FilterDropdown
              label="Company"
              searchPlural="companies"
              icon={<Building2 size={13} />}
              items={companies.map((co) => ({ id: co.id, name: co.name }))}
              value={companyFilter}
              onChange={setCompanyFilter}
            />
            <FilterDropdown
              label="Project"
              icon={<LayoutGrid size={13} />}
              items={projects.map((p) => ({ id: p.id, name: p.title, subtitle: p.client_name }))}
              value={projectFilter}
              onChange={setProjectFilter}
            />
            <FilterDropdown
              label="Role"
              icon={<Tag size={13} />}
              items={roles}
              value={roleFilter}
              onChange={setRoleFilter}
            />

            {/* Active filter chips */}
            {(companyFilter || projectFilter || roleFilter) && (
              <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-admin-border">
                {companyFilter && (() => {
                  const name = companies.find((co) => co.id === companyFilter)?.name;
                  return name ? (
                    <span className="flex items-center gap-1.5 px-3 py-[4px] rounded-lg text-sm font-medium bg-admin-bg-hover text-admin-text-secondary border border-admin-border">
                      <Building2 size={13} className="text-admin-text-dim" />
                      <span className="truncate max-w-[160px]">{name}</span>
                      <button onClick={() => setCompanyFilter(null)} className="p-0.5 rounded hover:bg-admin-bg-hover-strong text-admin-text-dim hover:text-admin-text-secondary transition-colors"><X size={12} /></button>
                    </span>
                  ) : null;
                })()}
                {projectFilter && (() => {
                  const proj = projects.find((p) => p.id === projectFilter);
                  return proj ? (
                    <span className="flex items-center gap-1.5 px-3 py-[4px] rounded-lg text-sm font-medium bg-admin-bg-hover text-admin-text-secondary border border-admin-border">
                      <LayoutGrid size={13} className="text-admin-text-dim" />
                      <span className="truncate max-w-[160px]">{proj.title}</span>
                      <button onClick={() => setProjectFilter(null)} className="p-0.5 rounded hover:bg-admin-bg-hover-strong text-admin-text-dim hover:text-admin-text-secondary transition-colors"><X size={12} /></button>
                    </span>
                  ) : null;
                })()}
                {roleFilter && (() => {
                  const name = roles.find((r) => r.id === roleFilter)?.name;
                  return name ? (
                    <span className="flex items-center gap-1.5 px-3 py-[4px] rounded-lg text-sm font-medium bg-admin-bg-hover text-admin-text-secondary border border-admin-border">
                      <Tag size={13} className="text-admin-text-dim" />
                      <span className="truncate max-w-[160px]">{name}</span>
                      <button onClick={() => setRoleFilter(null)} className="p-0.5 rounded hover:bg-admin-bg-hover-strong text-admin-text-dim hover:text-admin-text-secondary transition-colors"><X size={12} /></button>
                    </span>
                  ) : null;
                })()}
              </div>
            )}

            {/* Right-aligned feature buttons (disabled in gallery view) */}
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

          {/* Cast gallery grid */}
          <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-admin-text-ghost text-sm">
                {contacts.length === 0 ? 'No people yet.' : 'No matching cast members.'}
              </div>
            ) : (
              <div className="px-8 py-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`group cursor-pointer rounded-xl overflow-hidden border transition-colors ${
                      activeId === c.id ? 'border-admin-border-emphasis' : 'border-admin-border hover:border-admin-border-muted'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-admin-bg-subtle flex items-center justify-center">
                      {c.headshot_url ? (
                        <img src={c.headshot_url} alt={contactFullName(c)} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={24} className="text-admin-text-placeholder" />
                      )}
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-sm font-medium text-admin-text-primary truncate">{contactFullName(c)}</p>
                      <p className="text-xs text-admin-text-faint truncate">{c.role || 'Cast'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <AdminDataTable
          columns={CONTACT_COLUMNS}
          data={filtered}
          storageKey="fna-table-contacts"
          toolbar
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
                await batchDeleteContacts(ids);
                setContacts((prev) => prev.filter((c) => !ids.includes(c.id)));
              },
            },
          ]}
          onRowClick={(row) => setActiveId(row.id)}
          selectedId={activeId ?? undefined}
          emptyMessage={contacts.length === 0 ? 'No people yet.' : 'No matching people.'}
          toolbarSlot={
            <>
              <ViewSwitcher views={CONTACT_VIEWS} activeView={viewMode} onChange={setViewMode} />
              {/* Type tabs — full buttons on lg+, dropdown on smaller */}
              <div className="hidden 2xl:flex items-center gap-1">
                {(['all', 'crew', 'cast', 'contact', 'staff', 'vendor'] as const).map((t) => {
                  const Icon = TYPE_ICONS[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`flex items-center gap-1.5 px-[15px] py-[4px] rounded-lg text-sm font-medium transition-colors border ${
                        typeFilter === t
                          ? (TYPE_ACTIVE_CLASSES[t] ?? 'bg-admin-bg-active text-admin-text-primary border-transparent')
                          : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover border-transparent'
                      }`}
                    >
                      <Icon size={14} strokeWidth={1.75} />
                      {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${
                        typeFilter === t ? 'bg-admin-bg-active' : 'bg-admin-bg-hover text-admin-text-faint'
                      }`}>{typeCounts[t] ?? 0}</span>
                    </button>
                  );
                })}
              </div>
              <div className="2xl:hidden">
                <FilterDropdown
                  label="Type"
                  icon={<Users size={13} />}
                  items={[
                    { id: 'all', name: 'All' },
                    { id: 'crew', name: 'Crew' },
                    { id: 'cast', name: 'Cast' },
                    { id: 'contact', name: 'Contact' },
                    { id: 'staff', name: 'Staff' },
                    { id: 'vendor', name: 'Partner' },
                  ]}
                  value={typeFilter === 'all' ? null : typeFilter}
                  onChange={(v) => setTypeFilter((v as ContactType) ?? 'all')}
                  allowClear
                  clearLabel="All types"
                />
              </div>

              <div className="w-px bg-admin-bg-active mx-1.5 self-stretch" />

              {/* Filter dropdowns */}
              <FilterDropdown
                label="Company"
                searchPlural="companies"
                icon={<Building2 size={13} />}
                items={companies.map((co) => ({ id: co.id, name: co.name }))}
                value={companyFilter}
                onChange={setCompanyFilter}
              />
              <FilterDropdown
                label="Project"
                icon={<LayoutGrid size={13} />}
                items={projects.map((p) => ({ id: p.id, name: p.title, subtitle: p.client_name }))}
                value={projectFilter}
                onChange={setProjectFilter}
              />
              <FilterDropdown
                label="Role"
                icon={<Tag size={13} />}
                items={roles}
                value={roleFilter}
                onChange={setRoleFilter}
              />

              {/* Active filter chips */}
              {(companyFilter || projectFilter || roleFilter) && (
                <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-admin-border">
                  {companyFilter && (() => {
                    const name = companies.find((co) => co.id === companyFilter)?.name;
                    return name ? (
                      <span className="flex items-center gap-1.5 px-3 py-[4px] rounded-lg text-sm font-medium bg-admin-bg-hover text-admin-text-secondary border border-admin-border">
                        <Building2 size={13} className="text-admin-text-dim" />
                        <span className="truncate max-w-[160px]">{name}</span>
                        <button onClick={() => setCompanyFilter(null)} className="p-0.5 rounded hover:bg-admin-bg-hover-strong text-admin-text-dim hover:text-admin-text-secondary transition-colors"><X size={12} /></button>
                      </span>
                    ) : null;
                  })()}
                  {projectFilter && (() => {
                    const proj = projects.find((p) => p.id === projectFilter);
                    return proj ? (
                      <span className="flex items-center gap-1.5 px-3 py-[4px] rounded-lg text-sm font-medium bg-admin-bg-hover text-admin-text-secondary border border-admin-border">
                        <LayoutGrid size={13} className="text-admin-text-dim" />
                        <span className="truncate max-w-[160px]">{proj.title}</span>
                        <button onClick={() => setProjectFilter(null)} className="p-0.5 rounded hover:bg-admin-bg-hover-strong text-admin-text-dim hover:text-admin-text-secondary transition-colors"><X size={12} /></button>
                      </span>
                    ) : null;
                  })()}
                  {roleFilter && (() => {
                    const name = roles.find((r) => r.id === roleFilter)?.name;
                    return name ? (
                      <span className="flex items-center gap-1.5 px-3 py-[4px] rounded-lg text-sm font-medium bg-admin-bg-hover text-admin-text-secondary border border-admin-border">
                        <Tag size={13} className="text-admin-text-dim" />
                        <span className="truncate max-w-[160px]">{name}</span>
                        <button onClick={() => setRoleFilter(null)} className="p-0.5 rounded hover:bg-admin-bg-hover-strong text-admin-text-dim hover:text-admin-text-secondary transition-colors"><X size={12} /></button>
                      </span>
                    ) : null;
                  })()}
                </div>
              )}
            </>
          }
        />
      )}

      {/* Side Panel */}
      <PersonPanel
        person={activePerson}
        open={activeId !== null}
        onClose={() => setActiveId(null)}
        companies={companies}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {mergeState && (() => {
        const sourceContacts = contacts.filter((c) => mergeState.sourceIds.includes(c.id));
        return (
          <MergeDialog
            items={sourceContacts.map((c) => {
              const parts = [
                c.company,
                c.role,
                c.email,
                c.type,
              ].filter(Boolean);
              return { id: c.id, label: contactFullName(c), detail: parts.join(' · ') || undefined, createdAt: c.created_at };
            })}
            title="Merge People"
            consequenceText="All project credits, roles, and proposal associations will be transferred to the kept person."
            onClose={() => setMergeState(null)}
            onMerge={handleMerge}
          />
        );
      })()}
    </div>
  );
}
