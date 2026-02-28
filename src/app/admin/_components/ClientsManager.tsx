'use client';

import { useState, useTransition, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus, Download, Building2, LayoutGrid, Table2,
  Eye, ListFilter, ArrowUpAZ, Rows,
  Loader2, Trash2, Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AdminPageHeader } from './AdminPageHeader';
import { ToolbarButton, ToolbarPopover } from './table/TableToolbar';
import { AdminDataTable, type ColDef, type SortRule, type FilterRule } from './table';
import { FilterPanel } from './table/FilterPanel';
import { SortPanel } from './table/SortPanel';
import { FieldsPanel } from './table/FieldsPanel';
import { filterData, sortData } from './table/tableUtils';
import {
  type ClientRow,
  createClientRecord,
  updateClientRecord,
  updateContact,
  updateTestimonial,
  updateProject,
} from '../actions';
import type { ContactRow } from '@/types/proposal';
import { CompanyPanel } from './CompanyPanel';
import {
  type ClientProject,
  type ClientTestimonial,
  type CompanyType,
  type CompanyStatus,
  TYPE_CONFIG,
  STATUS_CONFIG,
  getCardBorderBg,
} from './companyUtils';

type ViewMode = 'cards' | 'table';

const CARD_SIZE_CONFIG = {
  1: { logoSize: 36, padding: 'px-3 py-2.5', nameSize: 'text-xs', gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5' },
  2: { logoSize: 54, padding: 'px-4 py-3.5', nameSize: 'text-sm', gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' },
  3: { logoSize: 72, padding: 'px-5 py-4', nameSize: 'text-sm', gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' },
  4: { logoSize: 96, padding: 'px-6 py-5', nameSize: 'text-base', gridCols: 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2' },
} as const;

interface Props {
  initialClients: ClientRow[];
  projects: ClientProject[];
  testimonials: ClientTestimonial[];
  contacts: ContactRow[];
}

export function ClientsManager({ initialClients, projects, testimonials, contacts: initialContacts }: Props) {
  const [clients, setClients] = useState(initialClients);
  const [localContacts, setLocalContacts] = useState(initialContacts);
  const [localTestimonials, setLocalTestimonials] = useState(testimonials);
  const [localProjects, setLocalProjects] = useState(projects);
  const [, startSave] = useTransition();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'cards';
    return (localStorage.getItem('fna-clients-viewMode') as ViewMode) || 'cards';
  });
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // ── Card view state (persisted) ─────────────────────────────────────────
  type CardSize = 1 | 2 | 3 | 4;
  type CardPanel = 'fields' | 'filter' | 'sort' | 'size' | null;
  const [cardPanel, setCardPanel] = useState<CardPanel>(null);
  const [cardSorts, setCardSorts] = useState<SortRule[]>([]);
  const [cardFilters, setCardFilters] = useState<FilterRule[]>([]);
  const [cardVisibleFields, setCardVisibleFields] = useState<Set<string>>(
    () => new Set(['logo_url', 'name', 'status', '_contacts', '_projects', 'company_types']),
  );
  const [cardSize, setCardSize] = useState<CardSize>(2);
  const [cardHydrated, setCardHydrated] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('open');
    if (id) {
      setActiveId(id);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    localStorage.setItem('fna-clients-viewMode', viewMode);
  }, [viewMode]);

  // ── Card columns (for filter/sort/fields panels) ────────────────────────
  const cardColumns: ColDef<ClientRow>[] = useMemo(() => [
    { key: 'logo_url', label: 'Logo', type: 'thumbnail' },
    { key: 'name', label: 'Name', type: 'text', sortable: true },
    {
      key: 'status', label: 'Status', type: 'select', sortable: true,
      options: Object.entries(STATUS_CONFIG).map(([v, cfg]) => ({ value: v, label: cfg.label })),
    },
    { key: 'industry', label: 'Industry', type: 'text', sortable: true },
    {
      key: '_contacts', label: 'Contacts', type: 'number', sortable: true,
      sortValue: (row) => localContacts.filter((ct) => ct.client_id === row.id).length,
    },
    {
      key: '_projects', label: 'Projects', type: 'number', sortable: true,
      sortValue: (row) => localProjects.filter((p) => p.client_id === row.id).length,
    },
    { key: 'company_types', label: 'Types', type: 'tags' },
    { key: 'created_at', label: 'Added', type: 'date', sortable: true },
  ], [localContacts, localProjects]);

  // ── Card state persistence ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fna-cards-clients');
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.sorts) setCardSorts(saved.sorts);
        if (saved.filters) setCardFilters(saved.filters);
        if (saved.visibleFields?.length) setCardVisibleFields(new Set(saved.visibleFields));
        if (saved.size) setCardSize(saved.size);
      }
    } catch { /* ignore */ }
    setCardHydrated(true);
  }, []);

  useEffect(() => {
    if (!cardHydrated) return;
    try {
      localStorage.setItem('fna-cards-clients', JSON.stringify({
        sorts: cardSorts,
        filters: cardFilters,
        visibleFields: Array.from(cardVisibleFields),
        size: cardSize,
      }));
    } catch { /* quota */ }
  }, [cardHydrated, cardSorts, cardFilters, cardVisibleFields, cardSize]);

  const toggleCardField = useCallback((key: string) => {
    setCardVisibleFields((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleGalleryLogoDrop = useCallback(async (clientId: string, file: File) => {
    setUploadingId(clientId);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `${clientId}.${ext}`;
      const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);
      setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, logo_url: publicUrl } : c));
      await updateClientRecord(clientId, { logo_url: publicUrl });
    } catch (err) {
      console.error('Logo upload failed:', err);
    } finally {
      setUploadingId(null);
    }
  }, []);

  const handleGalleryLogoRemove = useCallback(async (clientId: string) => {
    setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, logo_url: null } : c));
    await updateClientRecord(clientId, { logo_url: null });
  }, []);

  const activeCompany = clients.find((c) => c.id === activeId) ?? null;

  const handleCreate = () => {
    startSave(async () => {
      setCreating(true);
      const id = await createClientRecord({ name: 'New Company', email: '' });
      const newRecord: ClientRow = {
        id,
        name: 'New Company',
        company: null,
        email: '',
        notes: null,
        logo_url: null,
        company_types: ['client'],
        status: 'prospect',
        pipeline_stage: 'new',
        website_url: null,
        linkedin_url: null,
        description: null,
        industry: null,
        location: null,
        founded_year: null,
        company_size: null,
        twitter_url: null,
        instagram_url: null,
        created_at: new Date().toISOString(),
      };
      setClients((prev) => [...prev, newRecord]);
      setCreating(false);
      setActiveId(id);
    });
  };

  const handleCompanyUpdated = useCallback((updated: ClientRow) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const handleCompanyDeleted = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const handleContactLinked = useCallback(async (contactId: string, companyId: string, companyName: string) => {
    await updateContact(contactId, { client_id: companyId, company: companyName });
    setLocalContacts((prev) =>
      prev.map((ct) => ct.id === contactId ? { ...ct, client_id: companyId, company: companyName } : ct)
    );
  }, []);

  const handleContactUnlinked = useCallback(async (contactId: string) => {
    await updateContact(contactId, { client_id: null });
    setLocalContacts((prev) =>
      prev.map((ct) => ct.id === contactId ? { ...ct, client_id: null } : ct)
    );
  }, []);

  const handleTestimonialLinked = useCallback(async (testimonialId: string, companyId: string) => {
    await updateTestimonial(testimonialId, { client_id: companyId });
    setLocalTestimonials((prev) =>
      prev.map((t) => t.id === testimonialId ? { ...t, client_id: companyId } : t)
    );
  }, []);

  const handleTestimonialUnlinked = useCallback(async (testimonialId: string) => {
    await updateTestimonial(testimonialId, { client_id: null });
    setLocalTestimonials((prev) =>
      prev.map((t) => t.id === testimonialId ? { ...t, client_id: null } : t)
    );
  }, []);

  const handleProjectLinked = useCallback(async (projectId: string, companyId: string) => {
    await updateProject(projectId, { client_id: companyId });
    setLocalProjects((prev) =>
      prev.map((p) => p.id === projectId ? { ...p, client_id: companyId } : p)
    );
  }, []);

  const handleProjectUnlinked = useCallback(async (projectId: string) => {
    await updateProject(projectId, { client_id: null });
    setLocalProjects((prev) =>
      prev.map((p) => p.id === projectId ? { ...p, client_id: null } : p)
    );
  }, []);

  // Filter to client-type companies only
  const clientOnly = useMemo(() =>
    clients.filter((c) => (c.company_types ?? []).includes('client')),
    [clients]
  );

  const filtered = useMemo(() => {
    let result = clientOnly;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        if (c.name.toLowerCase().includes(q)) return true;
        if (c.notes?.toLowerCase().includes(q)) return true;
        if (localProjects.some((p) => p.client_id === c.id && p.title.toLowerCase().includes(q))) return true;
        return false;
      });
    }
    // Apply card-view filters & sorts when in card mode
    if (viewMode === 'cards') {
      if (cardFilters.length > 0) result = filterData(result, cardFilters);
      if (cardSorts.length > 0) result = sortData(result, cardSorts, cardColumns);
    }
    return result;
  }, [clientOnly, search, localProjects, viewMode, cardFilters, cardSorts, cardColumns]);

  // ── Table columns ────────────────────────────────────────────────────────────
  const tableColumns: ColDef<ClientRow>[] = useMemo(() => [
    {
      key: 'logo_url',
      label: '',
      type: 'thumbnail',
      defaultWidth: 44,
      render: (row) =>
        row.logo_url ? (
          <img src={row.logo_url} alt="" className="w-8 h-8 rounded-md object-contain" />
        ) : (
          <div className="w-8 h-8 rounded-md bg-white/[0.04] flex items-center justify-center">
            <Building2 size={12} className="text-[#202022]" />
          </div>
        ),
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => <span className="font-medium text-foreground/80">{row.name}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const cfg = STATUS_CONFIG[(row.status ?? 'active') as CompanyStatus] ?? STATUS_CONFIG['active'];
        return <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>;
      },
    },
    {
      key: 'industry',
      label: 'Industry',
      render: (row) =>
        row.industry ? (
          <span className="text-xs text-[#515155]">{row.industry}</span>
        ) : (
          <span className="text-xs text-[#202022]">—</span>
        ),
    },
    {
      key: '_contacts',
      label: 'Contacts',
      render: (row) => {
        const count = localContacts.filter((ct) => ct.client_id === row.id).length;
        return count > 0 ? (
          <span className="text-xs text-[#515155]">{count}</span>
        ) : (
          <span className="text-xs text-[#202022]">—</span>
        );
      },
    },
    {
      key: '_projects',
      label: 'Projects',
      render: (row) => {
        const count = localProjects.filter((p) => p.client_id === row.id).length;
        return count > 0 ? (
          <span className="text-xs text-[#515155]">{count}</span>
        ) : (
          <span className="text-xs text-[#202022]">—</span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Added',
      render: (row) => (
        <span className="text-xs text-[#404044]">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ], [localContacts, localProjects]);

  const handleExportCsv = useCallback(() => {
    const header = ['Name', 'Types', 'Status', 'Notes', 'Logo URL', 'Projects', 'Testimonials', 'Created'];
    const rows = filtered.map((c) => {
      const cProjects = localProjects.filter((p) => p.client_id === c.id).map((p) => p.title).join('; ');
      const cTestimonials = testimonials.filter((t) => t.client_id === c.id).map((t) => t.person_name ?? 'Unknown').join('; ');
      return [c.name, (c.company_types ?? []).join('; '), c.status ?? 'active', c.notes ?? '', c.logo_url ?? '', cProjects, cTestimonials, new Date(c.created_at).toLocaleDateString()];
    });
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, localProjects, testimonials]);

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <AdminPageHeader
        title="Clients"
        subtitle={`${clientOnly.length} total`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search clients…"
        rightContent={
          <div className="flex items-center rounded-lg border border-yellow-500/30 overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-[9px] transition-colors ${viewMode === 'cards' ? 'bg-yellow-500/20 text-yellow-400' : 'text-yellow-500/50 hover:text-yellow-400 hover:bg-yellow-500/10'}`}
              title="Card view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-[9px] transition-colors ${viewMode === 'table' ? 'bg-yellow-500/20 text-yellow-400' : 'text-yellow-500/50 hover:text-yellow-400 hover:bg-yellow-500/10'}`}
              title="Table view"
            >
              <Table2 size={14} />
            </button>
          </div>
        }
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
              Add Client
            </button>
          </>
        }
        mobileActions={
          <>
            <button onClick={handleExportCsv} className="btn-secondary p-2.5 text-sm" title="Export CSV">
              <Download size={14} />
            </button>
            <button onClick={handleCreate} disabled={creating} className="btn-primary p-2.5 text-sm" title="Add Client">
              <Plus size={16} />
            </button>
          </>
        }
      />

      {viewMode === 'cards' ? (
        <>
        {/* Toolbar */}
        <div className="@container relative z-20 flex items-center gap-1 px-6 @md:px-8 h-[3rem] border-b border-[#2a2a2a] flex-shrink-0 bg-[#010101]">
          <div className="flex items-center gap-1 ml-auto flex-shrink-0">
            {/* Fields */}
            <div className="relative">
              <ToolbarButton
                icon={Eye}
                label=""
                color="blue"
                active={cardPanel === 'fields'}
                onClick={() => setCardPanel((p) => p === 'fields' ? null : 'fields')}
              />
              {cardPanel === 'fields' && (
                <FieldsPanel
                  columns={cardColumns}
                  visibleCols={cardVisibleFields}
                  onToggle={toggleCardField}
                  onShowAll={() => setCardVisibleFields(new Set(cardColumns.map((c) => c.key)))}
                  onHideAll={() => setCardVisibleFields(new Set(['name']))}
                  onClose={() => setCardPanel(null)}
                />
              )}
            </div>
            {/* Filter */}
            <div className="relative">
              <ToolbarButton
                icon={ListFilter}
                label=""
                color="green"
                active={cardPanel === 'filter' || cardFilters.length > 0}
                badge={cardFilters.length || undefined}
                onClick={() => setCardPanel((p) => p === 'filter' ? null : 'filter')}
              />
              {cardPanel === 'filter' && (
                <FilterPanel
                  columns={cardColumns}
                  filters={cardFilters}
                  onChange={setCardFilters}
                  onClose={() => setCardPanel(null)}
                />
              )}
            </div>
            {/* Sort */}
            <div className="relative">
              <ToolbarButton
                icon={ArrowUpAZ}
                label=""
                color="orange"
                active={cardPanel === 'sort' || cardSorts.length > 0}
                badge={cardSorts.length || undefined}
                onClick={() => setCardPanel((p) => p === 'sort' ? null : 'sort')}
              />
              {cardPanel === 'sort' && (
                <SortPanel
                  columns={cardColumns}
                  sorts={cardSorts}
                  onChange={setCardSorts}
                  onClose={() => setCardPanel(null)}
                />
              )}
            </div>
            {/* Card size */}
            <div className="relative">
              <ToolbarButton
                icon={Rows}
                label=""
                color="neutral"
                active={cardPanel === 'size'}
                onClick={() => setCardPanel((p) => p === 'size' ? null : 'size')}
              />
              {cardPanel === 'size' && (
                <ToolbarPopover onClose={() => setCardPanel(null)} width="w-44" align="right">
                  <div className="text-xs text-[#888] uppercase tracking-wider font-medium mb-2">Card size</div>
                  <div className="flex items-end gap-2 justify-center py-1">
                    {([1, 2, 3, 4] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setCardSize(s); setCardPanel(null); }}
                        className={`rounded-md border-2 transition-colors ${
                          cardSize === s
                            ? 'border-white/40 bg-white/10'
                            : 'border-[#2a2a2a] bg-[#151515] hover:border-white/20'
                        }`}
                        style={{ width: 12 + s * 6, height: 12 + s * 6 }}
                        title={`Size ${s}`}
                      />
                    ))}
                  </div>
                </ToolbarPopover>
              )}
            </div>
          </div>
        </div>
        {/* Card grid */}
        <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 pt-4 pb-8">
          <div className={`grid gap-3 ${CARD_SIZE_CONFIG[cardSize].gridCols}`}>
            {filtered.map((c) => {
              const companyTypes = (c.company_types ?? []) as CompanyType[];
              const cContacts = localContacts.filter((ct) => ct.client_id === c.id);
              const cProjects = localProjects.filter((p) => p.client_id === c.id);
              const countParts = [
                cardVisibleFields.has('_contacts') && cContacts.length > 0 && `${cContacts.length} contact${cContacts.length !== 1 ? 's' : ''}`,
                cardVisibleFields.has('_projects') && cProjects.length > 0 && `${cProjects.length} project${cProjects.length !== 1 ? 's' : ''}`,
              ].filter(Boolean) as string[];
              const isFocused = activeId === c.id;
              const statusCfg = STATUS_CONFIG[(c.status ?? 'active') as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG['active'];
              const sz = CARD_SIZE_CONFIG[cardSize];

              return (
                <div
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`p-[1px] rounded-xl cursor-pointer transition-all ${getCardBorderBg(companyTypes, isFocused)}`}
                >
                  <div className={`rounded-[11px] ${sz.padding} flex items-center gap-3 transition-colors ${isFocused ? 'bg-[#151515]' : 'bg-[#111] hover:bg-[#131313]'}`}>
                    {cardVisibleFields.has('logo_url') && (
                      <GalleryLogoDropzone
                        logoUrl={c.logo_url}
                        uploading={uploadingId === c.id}
                        onDrop={(file) => handleGalleryLogoDrop(c.id, file)}
                        onRemove={() => handleGalleryLogoRemove(c.id)}
                        size={sz.logoSize}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`${sz.nameSize} font-medium text-foreground truncate`}>{c.name}</p>
                      {(cardVisibleFields.has('status') || countParts.length > 0) && (
                        <p className="text-xs mt-0.5 truncate flex items-center gap-1.5">
                          {cardVisibleFields.has('status') && <span className={statusCfg.color}>{statusCfg.label}</span>}
                          {cardVisibleFields.has('status') && countParts.length > 0 && <span className="text-muted-foreground/25">·</span>}
                          <span className="text-[#404044]">{countParts.join(' · ')}</span>
                        </p>
                      )}
                      {cardSize >= 3 && (
                        <>
                          {cardVisibleFields.has('industry') && c.industry && (
                            <p className="text-xs mt-1 text-[#515155] truncate">{c.industry}</p>
                          )}
                          {cardVisibleFields.has('created_at') && (
                            <p className="text-[10px] mt-0.5 text-[#404044]">{new Date(c.created_at).toLocaleDateString()}</p>
                          )}
                        </>
                      )}
                    </div>
                    {cardVisibleFields.has('company_types') && companyTypes.length > 0 && (
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {companyTypes.map((type) => (
                          <span
                            key={type}
                            className={`w-2 h-2 rounded-full ${TYPE_CONFIG[type].dotBg}`}
                            title={TYPE_CONFIG[type].label}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {clientOnly.length === 0 && (
            <div className="text-center py-12 text-[#404044] text-sm">
              No clients yet. Click &quot;Add Client&quot; to create one.
            </div>
          )}
        </div>
        </>
      ) : (
        /* Table view */
        <AdminDataTable
          data={filtered}
          columns={tableColumns}
          storageKey="fna-table-clients"
          toolbar
          sortable
          filterable
          columnVisibility
          columnReorder
          columnResize
          selectable
          freezePanes
          exportCsv
          onRowClick={(row) => setActiveId(row.id)}
          selectedId={activeId ?? undefined}
          emptyMessage="No clients yet."
          emptyAction={{ label: 'Add your first client', onClick: handleCreate }}
        />
      )}

      <CompanyPanel
        company={activeCompany}
        contacts={localContacts}
        projects={localProjects}
        testimonials={localTestimonials}
        onClose={() => setActiveId(null)}
        onCompanyUpdated={handleCompanyUpdated}
        onCompanyDeleted={handleCompanyDeleted}
        onContactLinked={handleContactLinked}
        onContactUnlinked={handleContactUnlinked}
        onTestimonialLinked={handleTestimonialLinked}
        onTestimonialUnlinked={handleTestimonialUnlinked}
        onProjectLinked={handleProjectLinked}
        onProjectUnlinked={handleProjectUnlinked}
      />
    </div>
  );
}

/* ── Inline logo dropzone for gallery cards ──────────────────────────────── */

function GalleryLogoDropzone({
  logoUrl,
  uploading,
  onDrop,
  onRemove,
  size = 54,
}: {
  logoUrl: string | null;
  uploading: boolean;
  onDrop: (file: File) => void;
  onRemove: () => void;
  size?: number;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) onDrop(file);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (file) onDrop(file);
    };
    input.click();
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirming) {
      onRemove();
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  };

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <div className="relative group/logo flex-shrink-0">
      <div
        onClick={handleClick}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
        onDragLeave={(e) => { e.stopPropagation(); setDragOver(false); }}
        onDrop={handleDrop}
        style={{ width: size, height: size }}
        className={`rounded-xl flex items-center justify-center overflow-hidden cursor-pointer transition-colors border-2 border-dashed ${
          dragOver
            ? 'border-white/40 bg-white/10'
            : logoUrl
            ? 'border-transparent'
            : 'border-border/40 bg-white/[0.02] hover:border-white/20'
        }`}
        title="Drop logo or click to upload"
      >
        {uploading ? (
          <Loader2 size={Math.max(14, size * 0.3)} className="animate-spin text-[#515155]" />
        ) : logoUrl ? (
          <img src={logoUrl} alt="" className="w-full h-full object-contain p-1" />
        ) : (
          <Building2 size={Math.max(14, size * 0.35)} className="text-[#202022]" />
        )}
      </div>
      {logoUrl && !uploading && (
        <button
          onClick={handleRemoveClick}
          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover/logo:opacity-100 ${
            confirming
              ? 'opacity-100 bg-red-500 border border-red-400'
              : 'bg-[#2a2a2a] border border-[#3a3a3a] hover:bg-red-500/30 hover:border-red-500/40'
          }`}
          title={confirming ? 'Click again to confirm' : 'Remove logo'}
        >
          {confirming ? (
            <Check size={9} className="text-white" />
          ) : (
            <Trash2 size={9} className="text-[#808080]" />
          )}
        </button>
      )}
    </div>
  );
}
