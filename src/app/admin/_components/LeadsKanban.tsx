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
  getCardBorderBg,
} from './companyUtils';

type PipelineStage = 'new' | 'qualified' | 'proposal' | 'negotiating' | 'closed';

const PIPELINE_COLUMNS: { value: PipelineStage; label: string; accent: string; headerColor: string }[] = [
  { value: 'new',         label: 'New Lead',    accent: 'border-white/[0.12]',   headerColor: 'text-white/40' },
  { value: 'qualified',   label: 'Qualified',   accent: 'border-sky-500/30',     headerColor: 'text-sky-400' },
  { value: 'proposal',    label: 'Proposal',    accent: 'border-amber-500/30',   headerColor: 'text-amber-400' },
  { value: 'negotiating', label: 'Negotiating', accent: 'border-violet-500/30',  headerColor: 'text-violet-400' },
  { value: 'closed',      label: 'Closed',      accent: 'border-emerald-500/30', headerColor: 'text-emerald-400' },
];

interface Props {
  initialLeads: ClientRow[];
  projects: ClientProject[];
  testimonials: ClientTestimonial[];
  contacts: ContactRow[];
}

export function LeadsKanban({ initialLeads, projects, testimonials, contacts: initialContacts }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [localContacts, setLocalContacts] = useState(initialContacts);
  const [, startSave] = useTransition();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeCompany = leads.find((c) => c.id === activeId) ?? null;

  const handleCreate = () => {
    startSave(async () => {
      setCreating(true);
      const id = await createClientRecord({ name: 'New Lead', email: '' });
      const newRecord: ClientRow = {
        id,
        name: 'New Lead',
        company: null,
        email: '',
        notes: null,
        logo_url: null,
        company_types: ['lead'],
        status: 'prospect',
        pipeline_stage: 'new',
        created_at: new Date().toISOString(),
      };
      setLeads((prev) => [...prev, newRecord]);
      setCreating(false);
      setActiveId(id);
    });
  };

  const handleCompanyUpdated = useCallback((updated: ClientRow) => {
    setLeads((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const handleCompanyDeleted = useCallback((id: string) => {
    setLeads((prev) => prev.filter((c) => c.id !== id));
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

  // Filter to lead-type companies only
  const leadsOnly = useMemo(() =>
    leads.filter((c) => (c.company_types ?? []).includes('lead')),
    [leads]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return leadsOnly;
    const q = search.toLowerCase();
    return leadsOnly.filter((c) =>
      c.name.toLowerCase().includes(q) || c.notes?.toLowerCase().includes(q)
    );
  }, [leadsOnly, search]);

  const byStage = useMemo(() => {
    const map: Record<PipelineStage, ClientRow[]> = {
      new: [], qualified: [], proposal: [], negotiating: [], closed: [],
    };
    for (const lead of filtered) {
      const stage = (lead.pipeline_stage ?? 'new') as PipelineStage;
      (map[stage] ?? map.new).push(lead);
    }
    return map;
  }, [filtered]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Leads"
        subtitle={`${leadsOnly.length} total`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search leads…"
        actions={
          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            <Plus size={16} />
            Add Lead
          </button>
        }
      />

      {/* Kanban board — horizontal scroll */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden px-8 pt-4 pb-6">
        <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
          {PIPELINE_COLUMNS.map((col) => {
            const cards = byStage[col.value];
            return (
              <div
                key={col.value}
                className={`flex flex-col w-[220px] flex-shrink-0 rounded-xl border bg-white/[0.02] ${col.accent}`}
              >
                {/* Column header */}
                <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                  <span className={`text-xs font-semibold ${col.headerColor}`}>{col.label}</span>
                  <span className="text-[10px] text-muted-foreground/30 bg-white/5 rounded px-1.5 py-0.5">
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto admin-scrollbar p-2 space-y-2">
                  {cards.map((c) => (
                    <LeadCard
                      key={c.id}
                      company={c}
                      contacts={localContacts}
                      projects={projects}
                      isFocused={activeId === c.id}
                      onClick={() => setActiveId(c.id)}
                    />
                  ))}
                  {cards.length === 0 && (
                    <p className="text-[11px] text-muted-foreground/20 text-center py-4">Empty</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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

/* ── Lead card ────────────────────────────────────────────────────────── */

function LeadCard({
  company: c,
  contacts,
  projects,
  isFocused,
  onClick,
}: {
  company: ClientRow;
  contacts: ContactRow[];
  projects: ClientProject[];
  isFocused: boolean;
  onClick: () => void;
}) {
  const companyTypes = (c.company_types ?? []) as CompanyType[];
  const contactCount = contacts.filter((ct) => ct.client_id === c.id).length;
  const projectCount = projects.filter((p) => p.client_id === c.id).length;
  const statusCfg = STATUS_CONFIG[(c.status ?? 'prospect') as CompanyStatus] ?? STATUS_CONFIG['prospect'];

  return (
    <div
      onClick={onClick}
      className={`p-[1px] rounded-xl cursor-pointer transition-all ${getCardBorderBg(companyTypes, isFocused)}`}
    >
      <div className={`rounded-[11px] px-3 py-2.5 flex items-center gap-2.5 transition-colors ${isFocused ? 'bg-[#151515]' : 'bg-[#111] hover:bg-[#131313]'}`}>
        {c.logo_url ? (
          <img src={c.logo_url} alt="" className="w-7 h-7 rounded-md object-contain flex-shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-md bg-white/[0.04] flex items-center justify-center flex-shrink-0">
            <Building2 size={12} className="text-muted-foreground/20" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
          <p className="text-[10px] mt-0.5 flex items-center gap-1 truncate">
            <span className={statusCfg.color}>{statusCfg.label}</span>
            {(contactCount > 0 || projectCount > 0) && (
              <>
                <span className="text-muted-foreground/25">·</span>
                <span className="text-muted-foreground/40">
                  {[
                    contactCount > 0 && `${contactCount}c`,
                    projectCount > 0 && `${projectCount}p`,
                  ].filter(Boolean).join(' ')}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
