'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTransition } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { type ClientRow, createClientRecord, updateContact } from '../actions';
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

  // Filter to partner-type companies only
  const partnersOnly = useMemo(() =>
    partners.filter((c) => (c.company_types ?? []).includes('partner')),
    [partners]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return partnersOnly;
    const q = search.toLowerCase();
    return partnersOnly.filter((c) =>
      c.name.toLowerCase().includes(q) || c.notes?.toLowerCase().includes(q)
    );
  }, [partnersOnly, search]);

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

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 pt-4 pb-8">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground/40 text-sm">
            No partners yet. Click &quot;Add Partner&quot; to create one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="pb-2 text-left text-xs font-medium text-muted-foreground/40 w-10" />
                <th className="pb-2 text-left text-xs font-medium text-muted-foreground/40">Name</th>
                <th className="pb-2 text-left text-xs font-medium text-muted-foreground/40">Status</th>
                <th className="pb-2 text-left text-xs font-medium text-muted-foreground/40">Types</th>
                <th className="pb-2 text-left text-xs font-medium text-muted-foreground/40">Contacts</th>
                <th className="pb-2 text-left text-xs font-medium text-muted-foreground/40">Projects</th>
                <th className="pb-2 text-left text-xs font-medium text-muted-foreground/40">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((c) => {
                const companyTypes = (c.company_types ?? []) as CompanyType[];
                const contactCount = localContacts.filter((ct) => ct.client_id === c.id).length;
                const projectCount = projects.filter((p) => p.client_id === c.id).length;
                const statusCfg = STATUS_CONFIG[(c.status ?? 'active') as CompanyStatus] ?? STATUS_CONFIG['active'];
                const isFocused = activeId === c.id;

                return (
                  <tr
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`cursor-pointer transition-colors ${
                      isFocused ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Logo */}
                    <td className="py-2.5 pr-3">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt="" className="w-8 h-8 rounded-md object-contain" />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-white/[0.04] flex items-center justify-center">
                          <Building2 size={12} className="text-muted-foreground/20" />
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="py-2.5 pr-4">
                      <span className={`font-medium ${isFocused ? 'text-foreground' : 'text-foreground/80'}`}>
                        {c.name}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs ${statusCfg.color}`}>{statusCfg.label}</span>
                    </td>

                    {/* Types */}
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1">
                        {companyTypes.map((type) => (
                          <span
                            key={type}
                            className={`w-2 h-2 rounded-full ${TYPE_CONFIG[type].dotBg}`}
                            title={TYPE_CONFIG[type].label}
                          />
                        ))}
                      </div>
                    </td>

                    {/* Contacts */}
                    <td className="py-2.5 pr-4">
                      <span className="text-xs text-muted-foreground/50">
                        {contactCount > 0 ? contactCount : <span className="text-muted-foreground/20">—</span>}
                      </span>
                    </td>

                    {/* Projects */}
                    <td className="py-2.5 pr-4">
                      <span className="text-xs text-muted-foreground/50">
                        {projectCount > 0 ? projectCount : <span className="text-muted-foreground/20">—</span>}
                      </span>
                    </td>

                    {/* Added */}
                    <td className="py-2.5">
                      <span className="text-xs text-muted-foreground/40">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <CompanyPanel
        company={activeCompany}
        contacts={localContacts}
        projects={projects}
        testimonials={testimonials}
        onClose={() => setActiveId(null)}
        onCompanyUpdated={handleCompanyUpdated}
        onCompanyDeleted={handleCompanyDeleted}
        onContactLinked={handleContactLinked}
        onContactUnlinked={handleContactUnlinked}
      />
    </div>
  );
}
