'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import {
  Save, Check, Loader2, Upload, Film, ChevronDown, ChevronUp,
  Trash2, X, UserPlus, Briefcase, Target, Link2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  type ClientRow,
  updateClientRecord,
  deleteClientRecord,
  updateTestimonial,
  getProjectById,
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
  active:    { label: 'Active',   color: 'text-emerald-400',            dot: 'bg-emerald-500' },
  prospect:  { label: 'Prospect', color: 'text-amber-400',              dot: 'bg-amber-500' },
  'on hold': { label: 'On Hold',  color: 'text-slate-400',              dot: 'bg-slate-500' },
  past:      { label: 'Past',     color: 'text-muted-foreground/40',    dot: 'bg-white/20' },
};

const TYPE_CONFIG: Record<CompanyType, {
  label: string;
  Icon: React.ElementType;
  activeBg: string;
  activeText: string;
  activeBorder: string;
}> = {
  client: {
    label: 'Client', Icon: Briefcase,
    activeBg: 'bg-emerald-500/15', activeText: 'text-emerald-400', activeBorder: 'border-emerald-500/30',
  },
  lead: {
    label: 'Lead', Icon: Target,
    activeBg: 'bg-amber-500/15', activeText: 'text-amber-400', activeBorder: 'border-amber-500/30',
  },
  partner: {
    label: 'Partner', Icon: Link2,
    activeBg: 'bg-sky-500/15', activeText: 'text-sky-400', activeBorder: 'border-sky-500/30',
  },
};

const PIPELINE_STAGES: { value: PipelineStage; label: string; color: string }[] = [
  { value: 'new',         label: 'New',         color: 'text-white/40' },
  { value: 'qualified',   label: 'Qualified',   color: 'text-amber-400' },
  { value: 'proposal',    label: 'Proposal',    color: 'text-sky-400' },
  { value: 'negotiating', label: 'Negotiating', color: 'text-violet-400' },
  { value: 'closed',      label: 'Won',         color: 'text-emerald-400' },
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
}: CompanyPanelProps) {
  const [localCompany, setLocalCompany] = useState<ClientRow | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('info');
  const [expandedTestimonialId, setExpandedTestimonialId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [savingTestimonialId, setSavingTestimonialId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectRow, setActiveProjectRow] = useState<(Record<string, unknown> & { id: string }) | null>(null);

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
      setExpandedTestimonialId(null);
      setSavedId(null);
      setDirty(false);
      setConfirmClose(false);
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
          const supabase = createClient();
          const ext = file.name.split('.').pop() ?? 'png';
          const path = `${id}.${ext}`;
          const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
          if (error) throw error;
          const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);
          setLocalCompany((p) => p ? { ...p, logo_url: publicUrl } : p);
          await updateClientRecord(id, { logo_url: publicUrl });
          setSavedId(id);
          setTimeout(() => setSavedId(null), 2000);
        } catch (err) {
          console.error('Logo upload failed:', err);
        } finally {
          setUploadingId(null);
        }
      })();
      return current;
    });
  }, []);

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
  const unlinkableContacts = contacts.filter((ct) => ct.client_id !== localCompany.id);
  const clientProjects = projects.filter((p) => p.client_id === localCompany.id);
  const seenQuotes = new Set<string>();
  const clientTestimonials = testimonials.filter((t) => {
    if (t.client_id !== localCompany.id) return false;
    if (seenQuotes.has(t.quote)) return false;
    seenQuotes.add(t.quote);
    return true;
  });
  const hasLinks = clientProjects.length > 0 || clientTestimonials.length > 0;

  const toggleCompanyType = (type: CompanyType) => {
    const types = localCompany.company_types ?? [];
    const next = types.includes(type) ? types.filter((t) => t !== type) : [...types, type];
    handleChange('company_types', next);
  };

  const handleSave = () => {
    startSave(async () => {
      await updateClientRecord(localCompany.id, {
        name: localCompany.name,
        company: localCompany.company,
        notes: localCompany.notes,
        logo_url: localCompany.logo_url,
        company_types: localCompany.company_types ?? [],
        status: localCompany.status ?? 'active',
        pipeline_stage: localCompany.pipeline_stage ?? 'new',
      });
      setDirty(false);
      setSavedId(localCompany.id);
      setTimeout(() => setSavedId(null), 2000);
      onCompanyUpdated(localCompany);
    });
  };

  const handleDelete = () => {
    startSave(async () => {
      await deleteClientRecord(localCompany.id);
      setConfirmDeleteId(null);
      onCompanyDeleted(localCompany.id);
      onClose();
    });
  };

  const handleTestimonialSave = async (t: ClientTestimonial) => {
    setSavingTestimonialId(t.id);
    await updateTestimonial(t.id, {
      quote: t.quote,
      person_name: t.person_name,
      person_title: t.person_title,
    });
    setSavingTestimonialId(null);
    setSavedId(t.id);
    setTimeout(() => setSavedId(null), 2000);
  };

  const status = (localCompany.status ?? 'active') as CompanyStatus;
  const pipelineStage = (localCompany.pipeline_stage ?? 'new') as PipelineStage;

  return (
    <>
      <PanelDrawer open={!!company} onClose={handleClose}>
        <DiscardChangesDialog
          open={confirmClose}
          onKeepEditing={() => setConfirmClose(false)}
          onDiscard={() => { setConfirmClose(false); setDirty(false); onClose(); }}
        />

        {/* Header: logo + name + close */}
        <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-white/[0.08]">
          <LogoDropzone
            logoUrl={localCompany.logo_url}
            uploading={uploadingId === localCompany.id}
            onDrop={handleLogoDrop}
          />
          <input
            type="text"
            value={localCompany.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Company name"
            className="flex-1 bg-transparent text-lg font-medium text-foreground placeholder:text-muted-foreground/30 focus:outline-none border-b border-transparent focus:border-white/20 pb-1"
          />
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-white/5 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab strip (pill style, right under header) */}
        <div className="flex items-center gap-1 border-b border-white/[0.08] px-6 py-2 flex-shrink-0">
          {([
            { id: 'info',         label: 'Info',         count: null },
            { id: 'contacts',     label: 'Contacts',     count: clientContacts.length },
            { id: 'projects',     label: 'Projects',     count: clientProjects.length },
            { id: 'testimonials', label: 'Testimonials', count: clientTestimonials.length },
          ] as { id: TabName; label: string; count: number | null }[]).map(({ id: tabId, label, count }) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tabId
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {label}
              {count !== null && count > 0 && (
                <span className="text-[10px] text-white/30 ml-0.5">{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-6 py-4">
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
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                          isActive
                            ? `${cfg.activeBg} ${cfg.activeText} ${cfg.activeBorder}`
                            : 'border-border/30 bg-transparent text-muted-foreground/30 hover:text-muted-foreground/60 hover:border-border/50'
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
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                            isActive
                              ? `bg-white/8 border-white/20 ${scfg.color}`
                              : 'border-border/20 bg-transparent text-muted-foreground/25 hover:text-muted-foreground/50 hover:border-border/40'
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
                    <span className="text-xs text-muted-foreground/30 mr-1">Stage</span>
                    {PIPELINE_STAGES.map((stage) => {
                      const isActive = pipelineStage === stage.value;
                      return (
                        <button
                          key={stage.value}
                          type="button"
                          onClick={() => handleChange('pipeline_stage', stage.value)}
                          className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                            isActive
                              ? `bg-white/8 border-white/20 ${stage.color}`
                              : 'border-border/20 bg-transparent text-muted-foreground/25 hover:text-muted-foreground/50 hover:border-border/40'
                          }`}
                        >
                          {stage.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <textarea
                value={localCompany.notes ?? ''}
                onChange={(e) => handleChange('notes', e.target.value || null)}
                placeholder="Notes…"
                rows={5}
                className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-muted-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
              />
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-2">
              {clientContacts.length === 0 && (
                <p className="text-xs text-muted-foreground/30 py-1">No contacts linked yet.</p>
              )}
              {clientContacts.map((ct) => (
                <div key={ct.id} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ct.name}</p>
                    {(ct.role || ct.email) && (
                      <p className="text-xs text-muted-foreground/50 truncate">
                        {[ct.role, ct.email].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onContactUnlinked(ct.id)}
                    className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/30 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                    title="Unlink contact"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {unlinkableContacts.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <UserPlus size={12} className="text-muted-foreground/30 flex-shrink-0" />
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        onContactLinked(e.target.value, localCompany.id, localCompany.name);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 rounded-lg border border-border/40 bg-black/50 px-2 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-white/20"
                  >
                    <option value="">Link a contact…</option>
                    {unlinkableContacts.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}{ct.role ? ` — ${ct.role}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-1.5">
              {clientProjects.length === 0 && (
                <p className="text-xs text-muted-foreground/30 py-1">No projects linked.</p>
              )}
              {clientProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openProject(p.id)}
                  className="flex items-center gap-2.5 rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 transition-colors group w-full text-left"
                >
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt="" className="w-14 h-9 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-9 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Film size={14} className="text-muted-foreground/30" />
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground group-hover:text-foreground truncate">{p.title}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div className="space-y-2">
              {clientTestimonials.length === 0 && (
                <p className="text-xs text-muted-foreground/30 py-1">No testimonials linked.</p>
              )}
              {clientTestimonials.map((t) => {
                const isExpanded = expandedTestimonialId === t.id;
                return (
                  <div key={t.id} className="rounded-lg bg-white/5 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedTestimonialId(isExpanded ? null : t.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground/60 truncate">
                          &ldquo;{t.quote.slice(0, 80)}{t.quote.length > 80 ? '…' : ''}&rdquo;
                        </p>
                        {t.person_name && (
                          <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                            — {t.person_name}{t.person_title ? `, ${t.person_title}` : ''}
                          </p>
                        )}
                      </div>
                      {isExpanded
                        ? <ChevronUp size={12} className="text-muted-foreground/30 flex-shrink-0" />
                        : <ChevronDown size={12} className="text-muted-foreground/30 flex-shrink-0" />}
                    </button>
                    {isExpanded && (
                      <TestimonialEditor
                        testimonial={t}
                        savedId={savedId}
                        savingId={savingTestimonialId}
                        onSave={handleTestimonialSave}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: save (left) | delete (right) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-40"
          >
            {savedId === localCompany.id ? (
              <Check size={14} className="text-green-600" />
            ) : saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {savedId === localCompany.id ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={() => { !hasLinks && setConfirmDeleteId(localCompany.id); }}
            disabled={hasLinks}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              hasLinks
                ? 'text-muted-foreground/20 cursor-not-allowed'
                : 'text-red-400/60 hover:text-red-400 hover:bg-red-500/10'
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
          <div className="bg-[#111] border border-border/40 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-medium text-base">Delete company?</h3>
            <p className="text-sm text-muted-foreground">
              Projects and testimonials linked to this company will have their reference cleared.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
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

/* ── Testimonial editor (inline) ─────────────────────────────────────── */

function TestimonialEditor({
  testimonial: t,
  savedId,
  savingId,
  onSave,
}: {
  testimonial: ClientTestimonial;
  savedId: string | null;
  savingId: string | null;
  onSave: (t: ClientTestimonial) => void;
}) {
  const [local, setLocal] = useState(t);
  return (
    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/20">
      <textarea
        value={local.quote}
        onChange={(e) => {
          setLocal((p) => ({ ...p, quote: e.target.value }));
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
        className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none overflow-hidden"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={local.person_name ?? ''}
          onChange={(e) => setLocal((p) => ({ ...p, person_name: e.target.value || null }))}
          placeholder="Person name"
          className="rounded-lg border border-border/40 bg-black/50 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        <input
          type="text"
          value={local.person_title ?? ''}
          onChange={(e) => setLocal((p) => ({ ...p, person_title: e.target.value || null }))}
          placeholder="Title / role"
          className="rounded-lg border border-border/40 bg-black/50 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onSave(local)}
          disabled={savingId === t.id}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-border-subtle border border-border-subtle hover:bg-[#0a0a0a] text-xs font-medium transition-colors disabled:opacity-50"
        >
          {savedId === t.id ? (
            <Check size={10} className="text-green-400" />
          ) : savingId === t.id ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <Save size={10} />
          )}
          {savedId === t.id ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}

/* ── Logo Dropzone ────────────────────────────────────────────────────── */

function LogoDropzone({
  logoUrl,
  uploading,
  onDrop,
}: {
  logoUrl: string | null;
  uploading: boolean;
  onDrop: (file: File) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

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

  return (
    <div
      onClick={handleClick}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer transition-colors border-2 border-dashed ${
        dragOver
          ? 'border-white/40 bg-white/10'
          : logoUrl
          ? 'border-transparent'
          : 'border-border/40 bg-white/[0.02] hover:border-white/20'
      }`}
      title="Drop logo or click to upload"
    >
      {uploading ? (
        <Loader2 size={16} className="animate-spin text-muted-foreground/50" />
      ) : logoUrl ? (
        <img src={logoUrl} alt="" className="w-full h-full object-contain p-1" />
      ) : (
        <Upload size={16} className="text-muted-foreground/30" />
      )}
    </div>
  );
}
