'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTransition } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminTable, type ColumnDef } from './AdminTable';
import { type ClientRow, createClientRecord, updateContact, updateTestimonial, updateProject } from '../actions';
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

interface Props {
  initialPartners: ClientRow[];
  projects: ClientProject[];
  testimonials: ClientTestimonial[];
  contacts: ContactRow[];
}

export function PartnersTable({ initialPartners, projects, testimonials, contacts: initialContacts }: Props) {
  const [partners, setPartners] = useState(initialPartners);
  const [localContacts, setLocalContacts] = useState(initialContacts);
  const [localTestimonials, setLocalTestimonials] = useState(testimonials);
  const [localProjects, setLocalProjects] = useState(projects);
  const [, startSave] = useTransition();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

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
        company_types: ['partner'],
        status: 'active',
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
    () => partners.filter((c) => (c.company_types ?? []).includes('partner')),
    [partners],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return partnersOnly;
    const q = search.toLowerCase();
    return partnersOnly.filter(
      (c) => c.name.toLowerCase().includes(q) || c.notes?.toLowerCase().includes(q),
    );
  }, [partnersOnly, search]);

  const columns: ColumnDef<ClientRow>[] = [
    {
      key: 'logo_url',
      label: '',
      width: 'w-10',
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
      render: (row) => (
        <span className="font-medium text-foreground/80">{row.name}</span>
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
                className={`w-2 h-2 rounded-full ${TYPE_CONFIG[type].dotBg}`}
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
        const count = projects.filter((p) => p.client_id === row.id).length;
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
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Partners"
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
      />

      <AdminTable
        data={filtered}
        columns={columns}
        onRowClick={(row) => setActiveId(row.id)}
        selectedId={activeId ?? undefined}
        emptyMessage="No partners yet."
        emptyAction={{ label: 'Add your first partner', onClick: handleCreate }}
      />

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
