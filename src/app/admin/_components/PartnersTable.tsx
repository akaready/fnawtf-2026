'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTransition } from 'react';
import { Plus, Building2, GitFork, GitMerge, Trash2 } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminDataTable, type ColDef } from './table';
import { type ClientRow, createClientRecord, updateContact, updateTestimonial, updateProject, batchDeleteClients, mergeCompanies } from '../actions';
import { MergeDialog } from './MergeDialog';
import type { ContactRow } from '@/types/proposal';
import { CompanyPanel } from './CompanyPanel';
import {
  type ClientProject,
  type ClientTestimonial,
  type CompanyType,
  type CompanyStatus,
  STATUS_CONFIG,
  TYPE_CONFIG,
} from './companyUtils';

interface CompanyProposal {
  id: string;
  title: string;
  contact_company: string | null;
}

interface Props {
  initialPartners: ClientRow[];
  projects: ClientProject[];
  testimonials: ClientTestimonial[];
  contacts: ContactRow[];
  proposals: CompanyProposal[];
}

export function PartnersTable({ initialPartners, projects, testimonials, contacts: initialContacts, proposals }: Props) {
  const [partners, setPartners] = useState(initialPartners);
  const [localContacts, setLocalContacts] = useState(initialContacts);
  const [localTestimonials, setLocalTestimonials] = useState(testimonials);
  const [localProjects, setLocalProjects] = useState(projects);
  const [, startSave] = useTransition();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mergeState, setMergeState] = useState<{ sourceIds: string[] } | null>(null);

  const activeCompany = partners.find((c) => c.id === activeId) ?? null;

  const handleCreate = () => {
    startSave(async () => {
      setCreating(true);
      const id = await createClientRecord({ name: 'New Partner', email: '' });
      const newRecord: ClientRow = {
        id,
        name: 'New Partner',
        company: null,
        email: '',
        notes: null,
        logo_url: null,
        company_types: ['vendor'],
        status: 'active',
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
      setPartners((prev) => [...prev, newRecord]);
      setCreating(false);
      setActiveId(id);
    });
  };

  const handleCompanyUpdated = useCallback((updated: ClientRow) => {
    setPartners((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const handleCompanyDeleted = useCallback((id: string) => {
    setPartners((prev) => prev.filter((c) => c.id !== id));
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

  const partnersOnly = useMemo(
    () => partners.filter((c) => (c.company_types ?? []).includes('vendor')),
    [partners],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return partnersOnly;
    const q = search.toLowerCase();
    return partnersOnly.filter(
      (c) => c.name.toLowerCase().includes(q) || c.notes?.toLowerCase().includes(q),
    );
  }, [partnersOnly, search]);

  const columns: ColDef<ClientRow>[] = [
    {
      key: 'logo_url',
      label: '',
      type: 'thumbnail',
      defaultWidth: 44,
      render: (row) =>
        row.logo_url ? (
          <img src={row.logo_url} alt="" className="w-8 h-8 rounded-md object-contain" />
        ) : (
          <div className="w-8 h-8 rounded-md bg-admin-bg-selected flex items-center justify-center">
            <Building2 size={12} className="text-admin-text-placeholder" />
          </div>
        ),
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-admin-text-primary/80">{row.name}</span>
      ),
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
      key: 'company_types',
      label: 'Types',
      render: (row) => {
        const types = (row.company_types ?? []) as CompanyType[];
        return (
          <div className="flex items-center gap-1">
            {types.map((type) => (
              <span
                key={type}
                className={`w-2.5 h-2.5 rounded-full ${TYPE_CONFIG[type].dotBg}`}
                title={TYPE_CONFIG[type].label}
              />
            ))}
          </div>
        );
      },
    },
    {
      key: '_contacts',
      label: 'Contacts',
      render: (row) => {
        const count = localContacts.filter((ct) => ct.client_id === row.id).length;
        return count > 0 ? (
          <span className="text-xs text-admin-text-faint">{count}</span>
        ) : (
          <span className="text-xs text-admin-text-placeholder">—</span>
        );
      },
    },
    {
      key: '_projects',
      label: 'Projects',
      render: (row) => {
        const count = projects.filter((p) => p.client_id === row.id).length;
        return count > 0 ? (
          <span className="text-xs text-admin-text-faint">{count}</span>
        ) : (
          <span className="text-xs text-admin-text-placeholder">—</span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Added',
      render: (row) => (
        <span className="text-xs text-admin-text-ghost">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Partners"
        icon={GitFork}
        subtitle={`${partnersOnly.length} total`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search partners…"
        actions={
          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            <Plus size={16} />
            Add Partner
          </button>
        }
        mobileActions={
          <button onClick={handleCreate} disabled={creating} className="btn-primary p-2.5 text-sm" title="Add Partner">
            <Plus size={16} />
          </button>
        }
      />

      <AdminDataTable
        data={filtered}
        columns={columns}
        storageKey="fna-table-partners"
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
            onClick: (ids: string[]) => { if (ids.length >= 2) setMergeState({ sourceIds: ids }); },
          },
          {
            label: 'Delete',
            icon: <Trash2 size={13} />,
            variant: 'danger' as const,
            requireConfirm: true,
            onClick: async (ids: string[]) => {
              await batchDeleteClients(ids);
              setPartners((prev) => prev.filter((p) => !ids.includes(p.id)));
            },
          },
        ]}
        onRowClick={(row) => setActiveId(row.id)}
        selectedId={activeId ?? undefined}
        emptyMessage="No partners yet."
        emptyAction={{ label: 'Add your first partner', onClick: handleCreate }}
      />

      {mergeState && (() => {
        const sources = partners.filter((c) => mergeState.sourceIds.includes(c.id));
        return (
          <MergeDialog
            items={sources.map((c) => ({
              id: c.id,
              label: c.name,
              detail: (() => {
                const parts = [
                  localContacts.filter((ct) => ct.client_id === c.id).length > 0 && `${localContacts.filter((ct) => ct.client_id === c.id).length} contacts`,
                  localProjects.filter((p) => p.client_id === c.id).length > 0 && `${localProjects.filter((p) => p.client_id === c.id).length} projects`,
                  localTestimonials.filter((t) => t.client_id === c.id).length > 0 && `${localTestimonials.filter((t) => t.client_id === c.id).length} testimonials`,
                  proposals.filter((p) => p.contact_company === c.name).length > 0 && `${proposals.filter((p) => p.contact_company === c.name).length} proposals`,
                ].filter(Boolean);
                return parts.join(', ') || undefined;
              })(),
              createdAt: c.created_at,
            }))}
            title="Merge Companies"
            consequenceText="All contacts, projects, testimonials, and proposals will be transferred to the kept company."
            onClose={() => setMergeState(null)}
            onMerge={async (sourceIds, targetId) => {
              await mergeCompanies(sourceIds, targetId);
              setPartners((prev) => prev.filter((c) => !sourceIds.includes(c.id)));
              setMergeState(null);
            }}
          />
        );
      })()}

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
