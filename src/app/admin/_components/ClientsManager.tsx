'use client';

import { useState, useTransition, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Download, Building2 } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import {
  type ClientRow,
  createClientRecord,
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
  TYPE_CONFIG,
  STATUS_CONFIG,
  getCardBorderBg,
} from './companyUtils';

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
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('open');
    if (id) {
      setActiveId(id);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

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
    if (!search.trim()) return clientOnly;
    const q = search.toLowerCase();
    return clientOnly.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (c.notes?.toLowerCase().includes(q)) return true;
      if (localProjects.some((p) => p.client_id === c.id && p.title.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [clientOnly, search, localProjects]);

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
      />

      {/* Compact grid */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 pt-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((c) => {
            const companyTypes = (c.company_types ?? []) as CompanyType[];
            const cContacts = localContacts.filter((ct) => ct.client_id === c.id);
            const cProjects = localProjects.filter((p) => p.client_id === c.id);
            const countParts = [
              cContacts.length > 0 && `${cContacts.length} contact${cContacts.length !== 1 ? 's' : ''}`,
              cProjects.length > 0 && `${cProjects.length} project${cProjects.length !== 1 ? 's' : ''}`,
            ].filter(Boolean) as string[];
            const isFocused = activeId === c.id;
            const statusCfg = STATUS_CONFIG[(c.status ?? 'active') as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG['active'];

            return (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`p-[1px] rounded-xl cursor-pointer transition-all ${getCardBorderBg(companyTypes, isFocused)}`}
              >
                <div className={`rounded-[11px] px-4 py-3.5 flex items-center gap-3 transition-colors ${isFocused ? 'bg-[#151515]' : 'bg-[#111] hover:bg-[#131313]'}`}>
                  {c.logo_url ? (
                    <img src={c.logo_url} alt="" className="w-9 h-9 rounded-lg object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                      <Building2 size={14} className="text-[#202022]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-xs mt-0.5 truncate flex items-center gap-1.5">
                      <span className={statusCfg.color}>{statusCfg.label}</span>
                      {countParts.length > 0 && <span className="text-muted-foreground/25">·</span>}
                      <span className="text-[#404044]">{countParts.join(' · ')}</span>
                    </p>
                  </div>
                  {companyTypes.length > 0 && (
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
