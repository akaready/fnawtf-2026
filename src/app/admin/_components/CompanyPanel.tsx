'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import {
  Check, Loader2, Upload, Film,
  Trash2, X, UserPlus, Building2, Target, Link2,
  Globe, Linkedin, Search, MapPin, Calendar, Users as UsersIcon, Tag, RefreshCw,
} from 'lucide-react';
import { SaveButton } from './SaveButton';
import { useSaveState } from '@/app/admin/_hooks/useSaveState';
import {
  type ClientRow,
  updateClientRecord,
  deleteClientRecord,
  getProjectById,
  scrapeCompanyInfo,
  uploadLogo,
} from '../actions';
import { ProjectPanel } from './ProjectPanel';
import type { ContactRow } from '@/types/proposal';
import { PanelDrawer } from './PanelDrawer';
import { DiscardChangesDialog } from './DiscardChangesDialog';

type ClientProject = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  client_id: string | null;
  category: string | null;
};

type ClientTestimonial = {
  id: string;
  quote: string;
  person_name: string | null;
  person_title: string | null;
  client_id: string | null;
};

type CompanyType = 'client' | 'lead' | 'partner';
type TabName = 'info' | 'contacts' | 'projects' | 'testimonials';
type CompanyStatus = 'active' | 'prospect' | 'on hold' | 'past';
type PipelineStage = 'new' | 'qualified' | 'proposal' | 'negotiating' | 'closed';

const ALL_STATUSES: CompanyStatus[] = ['active', 'prospect', 'on hold', 'past'];

const STATUS_CONFIG: Record<CompanyStatus, { label: string; color: string; dot: string }> = {
  active:    { label: 'Active',   color: 'text-admin-success',            dot: 'bg-emerald-500' },
  prospect:  { label: 'Prospect', color: 'text-admin-warning',              dot: 'bg-amber-500' },
  'on hold': { label: 'On Hold',  color: 'text-slate-400',              dot: 'bg-slate-500' },
  past:      { label: 'Past',     color: 'text-admin-text-ghost',    dot: 'bg-white/20' },
};

const TYPE_CONFIG: Record<CompanyType, {
  label: string;
  Icon: React.ElementType;
  activeBg: string;
  activeText: string;
  activeBorder: string;
}> = {
  client: {
    label: 'Client', Icon: Building2,
    activeBg: 'bg-admin-success-bg', activeText: 'text-admin-success', activeBorder: 'border-admin-success-border',
  },
  lead: {
    label: 'Lead', Icon: Target,
    activeBg: 'bg-admin-warning-bg', activeText: 'text-admin-warning', activeBorder: 'border-admin-warning-border',
  },
  partner: {
    label: 'Partner', Icon: Link2,
    activeBg: 'bg-admin-info-bg', activeText: 'text-admin-info', activeBorder: 'border-admin-info-border',
  },
};

const PIPELINE_STAGES: { value: PipelineStage; label: string; color: string }[] = [
  { value: 'new',         label: 'New',         color: 'text-admin-text-dim' },
  { value: 'qualified',   label: 'Qualified',   color: 'text-admin-warning' },
  { value: 'proposal',    label: 'Proposal',    color: 'text-admin-info' },
  { value: 'negotiating', label: 'Negotiating', color: 'text-violet-400' },
  { value: 'closed',      label: 'Won',         color: 'text-admin-success' },
];

const ALL_TYPES: CompanyType[] = ['client', 'lead', 'partner'];

export interface CompanyPanelProps {
  company: ClientRow | null;
  contacts: ContactRow[];
  projects: ClientProject[];
  testimonials: ClientTestimonial[];
  onClose: () => void;
  onCompanyUpdated: (updated: ClientRow) => void;
  onCompanyDeleted: (id: string) => void;
  onContactLinked: (contactId: string, companyId: string, companyName: string) => void;
  onContactUnlinked: (contactId: string) => void;
  onTestimonialLinked?: (testimonialId: string, companyId: string) => void;
  onTestimonialUnlinked?: (testimonialId: string) => void;
  onProjectLinked?: (projectId: string, companyId: string) => void;
  onProjectUnlinked?: (projectId: string) => void;
}

export function CompanyPanel({
  company,
  contacts,
  projects,
  testimonials,
  onClose,
  onCompanyUpdated,
  onCompanyDeleted,
  onContactLinked,
  onContactUnlinked,
  onTestimonialLinked,
  onTestimonialUnlinked,
  onProjectLinked,
  onProjectUnlinked,
}: CompanyPanelProps) {
  const [localCompany, setLocalCompany] = useState<ClientRow | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('info');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { saving, saved: companySaved, wrap: wrapSave } = useSaveState(2000);
  const [, startSave] = useTransition();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectRow, setActiveProjectRow] = useState<(Record<string, unknown> & { id: string }) | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [testimonialSearch, setTestimonialSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);

  const openProject = useCallback(async (id: string) => {
    setActiveProjectId(id);
    const row = await getProjectById(id);
    if (row) setActiveProjectRow(row as Record<string, unknown> & { id: string });
  }, []);

  // Sync localCompany when panel opens with a new company
  useEffect(() => {
    if (company) {
      setLocalCompany(company);
      setActiveTab('info');
      setDirty(false);
      setConfirmClose(false);
      setContactSearch('');
      setTestimonialSearch('');
      setProjectSearch('');
    }
  }, [company?.id]);

  // ALL hooks must be declared before any conditional return
  const handleChange = useCallback((field: string, value: unknown) => {
    setLocalCompany((prev) => prev ? { ...prev, [field]: value } : prev);
    setDirty(true);
  }, []);

  const handleLogoDrop = useCallback(async (file: File) => {
    setLocalCompany((current) => {
      if (!current) return current;
      setUploadingId(current.id);
      const id = current.id;
      (async () => {
        try {
          const fd = new FormData();
          fd.append('file', file);
          const publicUrl = await uploadLogo(id, fd);
          setLocalCompany((p) => p ? { ...p, logo_url: publicUrl } : p);
        } catch (err) {
          console.error('Logo upload failed:', err);
        } finally {
          setUploadingId(null);
        }
      })();
      return current;
    });
  }, []);

  const handleLogoRemove = useCallback(async () => {
    if (!localCompany) return;
    setLocalCompany((p) => p ? { ...p, logo_url: null } : p);
    await updateClientRecord(localCompany.id, { logo_url: null });
    onCompanyUpdated({ ...localCompany, logo_url: null });
  }, [localCompany, onCompanyUpdated]);

  const handleClose = useCallback(() => {
    if (dirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  }, [dirty, onClose]);

  if (!localCompany) return <PanelDrawer open={false} onClose={onClose}>{null}</PanelDrawer>;

  const companyTypes = (localCompany.company_types ?? []) as CompanyType[];
  const isLead = companyTypes.includes('lead');

  const clientContacts = contacts.filter((ct) => ct.client_id === localCompany.id);
  const clientProjects = projects.filter((p) => p.client_id === localCompany.id);
  const seenQuotes = new Set<string>();
  const clientTestimonials = testimonials.filter((t) => {
    if (t.client_id !== localCompany.id) return false;
    if (seenQuotes.has(t.quote)) return false;
    seenQuotes.add(t.quote);
    return true;
  });
  const hasLinks = clientProjects.length > 0 || clientTestimonials.length > 0;

  // Contacts search: filter unlinked contacts by search query
  const cq = contactSearch.toLowerCase();
  const filteredUnlinkedContacts = contacts.filter(
    (ct) => ct.client_id !== localCompany.id && (
      `${ct.first_name} ${ct.last_name}`.toLowerCase().includes(cq) ||
      (ct.role ?? '').toLowerCase().includes(cq) ||
      (ct.email ?? '').toLowerCase().includes(cq)
    )
  );

  // Testimonials search: filter unlinked testimonials by search query
  const tq = testimonialSearch.toLowerCase();
  const filteredUnlinkedTestimonials = testimonials.filter(
    (t) => t.client_id !== localCompany.id && (
      t.quote.toLowerCase().includes(tq) ||
      (t.person_name ?? '').toLowerCase().includes(tq)
    )
  );

  // Projects search: filter unlinked projects by search query
  const pq = projectSearch.toLowerCase();
  const filteredUnlinkedProjects = projects.filter(
    (p) => p.client_id === null && (
      p.title.toLowerCase().includes(pq) ||
      (p.category ?? '').toLowerCase().includes(pq)
    )
  );

  const toggleCompanyType = (type: CompanyType) => {
    const types = localCompany.company_types ?? [];
    const next = types.includes(type) ? types.filter((t) => t !== type) : [...types, type];
    handleChange('company_types', next);
  };

  const handleSave = () => wrapSave(async () => {
    await updateClientRecord(localCompany.id, {
      name: localCompany.name,
      company: localCompany.company,
      notes: localCompany.notes,
      logo_url: localCompany.logo_url,
      company_types: localCompany.company_types ?? [],
      status: localCompany.status ?? 'active',
      pipeline_stage: localCompany.pipeline_stage ?? 'new',
      website_url: localCompany.website_url,
      linkedin_url: localCompany.linkedin_url,
      description: localCompany.description,
      industry: localCompany.industry,
      location: localCompany.location,
      founded_year: localCompany.founded_year,
      company_size: localCompany.company_size,
      twitter_url: localCompany.twitter_url,
      instagram_url: localCompany.instagram_url,
    });
    setDirty(false);
    onCompanyUpdated(localCompany);
  });

  const handleDelete = () => {
    startSave(async () => {
      await deleteClientRecord(localCompany.id);
      setConfirmDeleteId(null);
      onCompanyDeleted(localCompany.id);
      onClose();
    });
  };

  const handleFetchInfo = async () => {
    setFetching(true);
    setFetchDone(false);
    try {
      const info = await scrapeCompanyInfo(localCompany.name, localCompany.website_url);
      setLocalCompany((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        if (!updated.description && info.description) updated.description = info.description;
        if (!updated.website_url && info.website_url) updated.website_url = info.website_url;
        if (!updated.linkedin_url && info.linkedin_url) updated.linkedin_url = info.linkedin_url;
        if (!updated.twitter_url && info.twitter_url) updated.twitter_url = info.twitter_url;
        if (!updated.instagram_url && info.instagram_url) updated.instagram_url = info.instagram_url;
        if (!updated.industry && info.industry) updated.industry = info.industry;
        if (!updated.location && info.location) updated.location = info.location;
        if (!updated.founded_year && info.founded_year) updated.founded_year = info.founded_year;
        if (!updated.company_size && info.company_size) updated.company_size = info.company_size;
        return updated;
      });
      setDirty(true);
      setFetchDone(true);
      setTimeout(() => setFetchDone(false), 2000);
    } catch (err) {
      console.error('Failed to fetch company info:', err);
    } finally {
      setFetching(false);
    }
  };

  const status = (localCompany.status ?? 'active') as CompanyStatus;
  const pipelineStage = (localCompany.pipeline_stage ?? 'new') as PipelineStage;
  const statusCfg = STATUS_CONFIG[status];

  const inputCls = 'flex-1 rounded-lg border border-admin-border-subtle bg-admin-bg-base px-3 py-2 text-sm text-admin-text-muted placeholder:text-admin-text-placeholder focus:outline-none focus:ring-1 focus:ring-admin-border-emphasis';

  const showSearchBar = activeTab === 'contacts' || activeTab === 'testimonials' || activeTab === 'projects';

  return (
    <>
      <PanelDrawer open={!!company} onClose={handleClose}>
        <DiscardChangesDialog
          open={confirmClose}
          onKeepEditing={() => setConfirmClose(false)}
          onDiscard={() => { setConfirmClose(false); setDirty(false); onClose(); }}
        />

        {/* Header: logo + name + project count + status pill + close */}
        <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-admin-border">
          <LogoDropzone
            logoUrl={localCompany.logo_url}
            uploading={uploadingId === localCompany.id}
            onDrop={handleLogoDrop}
            onRemove={handleLogoRemove}
          />
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={localCompany.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Company name"
              className="w-full bg-transparent text-lg font-semibold text-admin-text-primary placeholder:text-admin-text-placeholder focus:outline-none border-b border-transparent focus:border-admin-border-emphasis pb-1"
            />
            {clientProjects.length > 0 && (
              <p className="text-xs text-admin-text-ghost mt-0.5">
                {clientProjects.length} project{clientProjects.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {/* Status pill — read-only */}
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap bg-admin-bg-selected flex-shrink-0 ${statusCfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-ghost hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab strip */}
        <div className="flex items-center gap-1 border-b border-admin-border px-6 py-2 flex-shrink-0 bg-admin-bg-wash">
          {([
            { id: 'info',         label: 'Info',         count: null },
            { id: 'projects',     label: 'Projects',     count: clientProjects.length },
            { id: 'contacts',     label: 'Contacts',     count: clientContacts.length },
            { id: 'testimonials', label: 'Testimonials', count: clientTestimonials.length },
          ] as { id: TabName; label: string; count: number | null }[]).map(({ id: tabId, label, count }) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tabId
                  ? 'bg-admin-bg-active text-admin-text-primary'
                  : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover'
              }`}
            >
              {label}
              {count !== null && count > 0 && (
                <span className="text-xs text-admin-text-faint ml-0.5">{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Action bar — search for contacts/testimonials tabs */}
        {showSearchBar && (
          <div className="flex items-center gap-2 px-6 py-2.5 border-b border-admin-border bg-admin-bg-wash flex-shrink-0">
            <Search size={14} className="text-admin-text-ghost flex-shrink-0" />
            <input
              type="text"
              value={activeTab === 'contacts' ? contactSearch : activeTab === 'projects' ? projectSearch : testimonialSearch}
              onChange={(e) => {
                if (activeTab === 'contacts') setContactSearch(e.target.value);
                else if (activeTab === 'projects') setProjectSearch(e.target.value);
                else setTestimonialSearch(e.target.value);
              }}
              placeholder={activeTab === 'contacts' ? 'Search contacts to link…' : activeTab === 'projects' ? 'Search projects to link…' : 'Search testimonials to link…'}
              className="flex-1 rounded-lg bg-admin-bg-base border border-admin-border-subtle px-3 py-1.5 text-sm text-admin-text-primary placeholder:text-admin-text-placeholder focus:outline-none focus:ring-1 focus:ring-admin-border-emphasis"
            />
          </div>
        )}

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-6 py-5">
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Type + status controls */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ALL_TYPES.map((type) => {
                    const cfg = TYPE_CONFIG[type];
                    const isActive = companyTypes.includes(type);
                    const { Icon } = cfg;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleCompanyType(type)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                          isActive
                            ? `${cfg.activeBg} ${cfg.activeText} ${cfg.activeBorder}`
                            : 'border-admin-border-subtle bg-transparent text-admin-text-placeholder hover:text-admin-text-faint hover:border-admin-border'
                        }`}
                      >
                        <Icon size={11} />
                        {cfg.label}
                      </button>
                    );
                  })}
                  <div className="ml-auto flex items-center gap-1.5">
                    {ALL_STATUSES.map((s) => {
                      const scfg = STATUS_CONFIG[s];
                      const isActive = status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleChange('status', s)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                            isActive
                              ? `bg-admin-bg-hover border-admin-border-emphasis ${scfg.color}`
                              : 'border-admin-border-subtle bg-transparent text-admin-text-muted/25 hover:text-admin-text-faint hover:border-admin-border'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? scfg.dot : 'bg-white/20'}`} />
                          {scfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {isLead && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-admin-text-placeholder mr-1">Stage</span>
                    {PIPELINE_STAGES.map((stage) => {
                      const isActive = pipelineStage === stage.value;
                      return (
                        <button
                          key={stage.value}
                          type="button"
                          onClick={() => handleChange('pipeline_stage', stage.value)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                            isActive
                              ? `bg-admin-bg-hover border-admin-border-emphasis ${stage.color}`
                              : 'border-admin-border-subtle bg-transparent text-admin-text-muted/25 hover:text-admin-text-faint hover:border-admin-border'
                          }`}
                        >
                          {stage.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Description */}
              <textarea
                value={localCompany.description ?? ''}
                onChange={(e) => handleChange('description', e.target.value || null)}
                placeholder="Company description…"
                rows={2}
                className="w-full rounded-lg border border-admin-border-subtle bg-admin-bg-base px-3 py-2.5 text-sm text-admin-text-muted placeholder:text-admin-text-placeholder focus:outline-none focus:ring-1 focus:ring-admin-border-emphasis resize-none"
                style={{ fieldSizing: 'content' } as React.CSSProperties}
              />

              {/* URLs + Company details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-admin-text-placeholder flex-shrink-0" />
                  <input type="url" value={localCompany.website_url ?? ''} onChange={(e) => handleChange('website_url', e.target.value || null)} placeholder="Website URL" className={inputCls} />
                </div>
                <div className="flex items-center gap-2">
                  <Linkedin size={14} className="text-admin-text-placeholder flex-shrink-0" />
                  <input type="url" value={localCompany.linkedin_url ?? ''} onChange={(e) => handleChange('linkedin_url', e.target.value || null)} placeholder="LinkedIn URL" className={inputCls} />
                </div>
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-admin-text-placeholder flex-shrink-0 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  <input type="url" value={localCompany.twitter_url ?? ''} onChange={(e) => handleChange('twitter_url', e.target.value || null)} placeholder="X / Twitter URL" className={inputCls} />
                </div>
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-admin-text-placeholder flex-shrink-0 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                  <input type="url" value={localCompany.instagram_url ?? ''} onChange={(e) => handleChange('instagram_url', e.target.value || null)} placeholder="Instagram URL" className={inputCls} />
                </div>
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-admin-text-placeholder flex-shrink-0" />
                  <input type="text" value={localCompany.industry ?? ''} onChange={(e) => handleChange('industry', e.target.value || null)} placeholder="Industry" className={inputCls} />
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-admin-text-placeholder flex-shrink-0" />
                  <input type="text" value={localCompany.location ?? ''} onChange={(e) => handleChange('location', e.target.value || null)} placeholder="Location" className={inputCls} />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-admin-text-placeholder flex-shrink-0" />
                  <input type="number" value={localCompany.founded_year ?? ''} onChange={(e) => handleChange('founded_year', e.target.value ? parseInt(e.target.value, 10) : null)} placeholder="Founded year" className={inputCls} />
                </div>
                <div className="flex items-center gap-2">
                  <UsersIcon size={14} className="text-admin-text-placeholder flex-shrink-0" />
                  <input type="text" value={localCompany.company_size ?? ''} onChange={(e) => handleChange('company_size', e.target.value || null)} placeholder="Company size" className={inputCls} />
                </div>
              </div>

              {/* Notes */}
              <textarea
                value={localCompany.notes ?? ''}
                onChange={(e) => handleChange('notes', e.target.value || null)}
                placeholder="Notes…"
                rows={3}
                className="w-full rounded-lg border border-admin-border-subtle bg-admin-bg-base px-3 py-2.5 text-sm text-admin-text-muted placeholder:text-admin-text-placeholder focus:outline-none focus:ring-1 focus:ring-admin-border-emphasis resize-none"
                style={{ fieldSizing: 'content' } as React.CSSProperties}
              />
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-2">
              {/* Search results — unlinked contacts matching search */}
              {contactSearch && filteredUnlinkedContacts.length > 0 && (
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-admin-text-placeholder mb-1.5">Link a contact</p>
                  {filteredUnlinkedContacts.slice(0, 8).map((ct) => (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => {
                        onContactLinked(ct.id, localCompany.id, localCompany.name);
                        setContactSearch('');
                      }}
                      className="w-full text-left flex items-center gap-2 rounded-lg bg-admin-bg-subtle hover:bg-admin-bg-hover border border-admin-border hover:border-admin-border-muted px-3 py-2 transition-colors"
                    >
                      <UserPlus size={12} className="text-admin-text-placeholder flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-admin-text-faint truncate">{ct.first_name} {ct.last_name}</p>
                        {(ct.role || ct.email) && (
                          <p className="text-xs text-admin-text-placeholder truncate">
                            {[ct.role, ct.email].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {contactSearch && filteredUnlinkedContacts.length === 0 && (
                <p className="text-xs text-admin-text-placeholder px-1 mb-3">No matching unlinked contacts.</p>
              )}

              {/* Linked contacts */}
              {clientContacts.length === 0 && !contactSearch && (
                <p className="text-sm text-admin-text-placeholder py-1">No contacts linked yet.</p>
              )}
              {clientContacts.map((ct) => (
                <div key={ct.id} className="flex items-center gap-2 rounded-lg bg-admin-bg-hover border border-admin-border px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-admin-text-primary truncate">{ct.first_name} {ct.last_name}</p>
                    {(ct.role || ct.email) && (
                      <p className="text-xs text-admin-text-faint truncate">
                        {[ct.role, ct.email].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onContactUnlinked(ct.id)}
                    className="w-6 h-6 flex items-center justify-center rounded text-admin-text-placeholder hover:text-admin-danger hover:bg-admin-danger-bg transition-colors flex-shrink-0"
                    title="Unlink contact"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-1.5">
              {/* Search results — unlinked projects matching search */}
              {onProjectLinked && projectSearch && filteredUnlinkedProjects.length > 0 && (
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-admin-text-placeholder mb-1.5">Link a project</p>
                  {filteredUnlinkedProjects.slice(0, 8).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onProjectLinked(p.id, localCompany.id);
                        setProjectSearch('');
                      }}
                      className="flex items-center gap-2.5 w-full text-left rounded-lg bg-admin-bg-subtle hover:bg-admin-bg-hover border border-admin-border hover:border-admin-border-muted px-3 py-2 transition-colors"
                    >
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt="" className="w-14 h-9 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-9 rounded bg-admin-bg-hover flex items-center justify-center flex-shrink-0">
                          <Film size={14} className="text-admin-text-placeholder" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-admin-text-faint truncate">{p.title}</p>
                        {p.category && (
                          <p className="text-xs text-admin-text-placeholder truncate">{p.category}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {projectSearch && filteredUnlinkedProjects.length === 0 && (
                <p className="text-xs text-admin-text-placeholder px-1 mb-3">No matching unlinked projects.</p>
              )}

              {/* Linked projects */}
              {clientProjects.length === 0 && !projectSearch && (
                <p className="text-sm text-admin-text-placeholder py-1">No projects linked.</p>
              )}
              {clientProjects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 rounded-lg bg-admin-bg-hover hover:bg-admin-bg-active px-3 py-2 transition-colors group border border-admin-border hover:border-admin-border-emphasis"
                >
                  <button
                    type="button"
                    onClick={() => openProject(p.id)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                  >
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt="" className="w-14 h-9 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-9 rounded bg-admin-bg-hover flex items-center justify-center flex-shrink-0">
                        <Film size={14} className="text-admin-text-placeholder" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-admin-text-primary group-hover:text-admin-text-primary truncate">{p.title}</p>
                      {p.category && (
                        <p className="text-xs text-admin-text-ghost truncate">{p.category}</p>
                      )}
                    </div>
                  </button>
                  {onProjectUnlinked && (
                    <button
                      type="button"
                      onClick={() => onProjectUnlinked(p.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-admin-text-placeholder hover:text-admin-danger hover:bg-admin-danger-bg transition-colors flex-shrink-0"
                      title="Unlink project"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div className="space-y-2">
              {/* Search results — unlinked testimonials matching search */}
              {onTestimonialLinked && testimonialSearch && filteredUnlinkedTestimonials.length > 0 && (
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-admin-text-placeholder mb-1.5">Link a testimonial</p>
                  {filteredUnlinkedTestimonials.slice(0, 10).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onTestimonialLinked(t.id, localCompany.id);
                        setTestimonialSearch('');
                      }}
                      className="w-full text-left rounded-lg bg-admin-bg-subtle hover:bg-admin-bg-hover border border-admin-border hover:border-admin-border-muted px-3 py-2.5 transition-colors"
                    >
                      <p className="text-sm text-admin-text-faint line-clamp-1">
                        &ldquo;{t.quote.slice(0, 100)}&rdquo;
                      </p>
                      {t.person_name && (
                        <p className="text-xs text-admin-text-placeholder mt-0.5">
                          — {t.person_name}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {testimonialSearch && filteredUnlinkedTestimonials.length === 0 && (
                <p className="text-xs text-admin-text-placeholder px-1 mb-3">No matching unlinked testimonials.</p>
              )}

              {/* Linked testimonials — read-only with unlink */}
              {clientTestimonials.length === 0 && !testimonialSearch && (
                <p className="text-sm text-admin-text-placeholder py-1">No testimonials linked yet.</p>
              )}
              {clientTestimonials.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg bg-admin-bg-hover border border-admin-border px-3 py-2.5 flex items-center gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-admin-text-faint line-clamp-2">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    {t.person_name && (
                      <p className="text-xs text-admin-text-ghost mt-1">
                        — {t.person_name}{t.person_title ? `, ${t.person_title}` : ''}
                      </p>
                    )}
                  </div>
                  {onTestimonialUnlinked && (
                    <button
                      type="button"
                      onClick={() => onTestimonialUnlinked(t.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-admin-text-placeholder hover:text-admin-danger hover:bg-admin-danger-bg transition-colors flex-shrink-0"
                      title="Unlink testimonial"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer action bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border bg-admin-bg-wash">
          <div className="flex items-center gap-2">
            <SaveButton saving={saving} saved={companySaved} onClick={handleSave} className="px-5 py-2.5 text-sm" />
            <button
              type="button"
              onClick={handleFetchInfo}
              disabled={fetching}
              className="flex items-center gap-2 px-4 py-[9px] rounded-lg border border-admin-border text-sm text-admin-text-muted hover:text-admin-text-primary hover:border-admin-border-emphasis hover:bg-admin-bg-hover transition-colors disabled:opacity-40"
              title="Scrape company info from the web"
            >
              {fetchDone ? (
                <Check size={14} className="text-admin-success" />
              ) : fetching ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              {fetchDone ? 'Fetched' : fetching ? 'Fetching…' : 'Fetch Data'}
            </button>
          </div>
          <button
            onClick={() => { !hasLinks && setConfirmDeleteId(localCompany.id); }}
            disabled={hasLinks}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              hasLinks
                ? 'text-admin-text-placeholder cursor-not-allowed'
                : 'text-admin-danger/60 hover:text-admin-danger hover:bg-admin-danger-bg'
            }`}
            title={hasLinks ? 'Unlink projects and testimonials to delete' : 'Delete company'}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </PanelDrawer>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-admin-bg-raised border border-admin-border-subtle rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-medium text-base">Delete company?</h3>
            <p className="text-sm text-admin-text-muted">
              Projects and testimonials linked to this company will have their reference cleared.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-5 py-2.5 rounded-lg text-sm text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-lg text-sm bg-red-600 text-admin-text-primary hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nested project panel */}
      <ProjectPanel
        project={activeProjectRow}
        open={activeProjectId !== null}
        onClose={() => { setActiveProjectId(null); setActiveProjectRow(null); }}
        onProjectUpdated={(updated) => setActiveProjectRow(updated)}
        onProjectDeleted={() => { setActiveProjectId(null); setActiveProjectRow(null); }}
        onProjectCreated={() => {}}
      />
    </>
  );
}

/* ── Logo Dropzone ────────────────────────────────────────────────────── */

function LogoDropzone({
  logoUrl,
  uploading,
  onDrop,
  onRemove,
}: {
  logoUrl: string | null;
  uploading: boolean;
  onDrop: (file: File) => void;
  onRemove?: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) onDrop(file);
  };

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onDrop(file);
    };
    input.click();
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirming) {
      onRemove?.();
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  };

  // Reset confirm state if user clicks away
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <div className="relative group/logo flex-shrink-0">
      <div
        onClick={handleClick}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer transition-colors border-2 border-dashed ${
          dragOver
            ? 'border-admin-border-emphasis bg-admin-bg-active'
            : logoUrl
            ? 'border-transparent'
            : 'border-admin-border-subtle bg-admin-bg-wash hover:border-admin-border-emphasis'
        }`}
        title="Drop logo or click to upload"
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin text-admin-text-faint" />
        ) : logoUrl ? (
          <img src={logoUrl} alt="" className="admin-logo w-full h-full object-contain p-1" />
        ) : (
          <Upload size={16} className="text-admin-text-placeholder" />
        )}
      </div>
      {logoUrl && onRemove && !uploading && (
        <button
          onClick={handleRemoveClick}
          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
            confirming
              ? 'bg-red-500 border border-red-400'
              : 'bg-admin-border border border-admin-border hover:bg-admin-danger-bg-strong hover:border-admin-danger-border'
          }`}
          title={confirming ? 'Click again to confirm' : 'Remove logo'}
        >
          {confirming ? (
            <Check size={9} className="text-admin-text-primary" />
          ) : (
            <Trash2 size={9} className="text-admin-text-secondary" />
          )}
        </button>
      )}
    </div>
  );
}
