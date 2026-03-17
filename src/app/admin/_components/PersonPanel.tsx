'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Trash2, Save, Loader2, X, Check,
  Mail, Phone, Building2, Briefcase, StickyNote, Image as ImageIcon,
  Star, Globe, ExternalLink, Linkedin, Instagram, Film, RefreshCw,
} from 'lucide-react';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { SaveDot } from './SaveDot';
import { PanelDrawer } from './PanelDrawer';
import { PanelFooter } from './PanelFooter';
import { DiscardChangesDialog } from './DiscardChangesDialog';
import { ProjectPanel } from './ProjectPanel';
import { AdminCombobox } from './AdminCombobox';
import { contactFullName } from '@/lib/contacts';
import { useChatContext } from '@/app/admin/_components/chat/ChatContext';
import {
  getAllRoles,
  getContactRoles,
  setContactRoles,
  getContactProjects,
  getHeadshots,
  setFeaturedHeadshot,
  deleteHeadshot,
  type ClientRow,
  type HeadshotRow,
} from '../actions';
import type { ContactRow, ContactType } from '@/types/proposal';

export const TYPE_COLORS: Record<ContactType, string> = {
  crew: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  cast: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  contact: 'bg-admin-success-bg text-admin-success border-admin-success-border',
  staff: 'bg-admin-warning-bg text-admin-warning border-admin-warning-border',
  vendor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export interface PersonPanelProps {
  person: ContactRow | null;
  open: boolean;
  onClose: () => void;
  companies: ClientRow[];
  onSave: (row: ContactRow) => Promise<void>;
  onDelete: (id: string) => void;
  /** Panel stacking level (default 1). Use 2 when rendering over another panel. */
  level?: 1 | 2;
}

export function PersonPanel({
  person,
  open,
  onClose,
  companies,
  onSave,
  onDelete,
  level = 1,
}: PersonPanelProps) {
  const [draft, setDraft] = useState<ContactRow | null>(person);
  const [confirmClose, setConfirmClose] = useState(false);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [personRoleIds, setPersonRoleIds] = useState<Set<string>>(new Set());
  const [projects, setProjects] = useState<Array<{ id: string; title: string; client_name: string; thumbnail_url: string | null }>>([]);
  const [openProject, setOpenProject] = useState<{ id: string; title: string; thumbnail_url: string | null } | null>(null);
  const [headshots, setHeadshots] = useState<HeadshotRow[]>([]);
  const [hsSearchResults, setHsSearchResults] = useState<Array<{ imageUrl: string; title: string; imageWidth: number; imageHeight: number }> | null>(null);
  const [hsSearching, setHsSearching] = useState(false);
  const [hsSelected, setHsSelected] = useState<Set<number>>(new Set());
  const [hsUploading, setHsUploading] = useState(false);
  const [confirmDeleteHsId, setConfirmDeleteHsId] = useState<string | null>(null);
  const [urlSearching, setUrlSearching] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'headshots' | 'roles' | 'projects'>('details');

  const { setPanelContext } = useChatContext();

  useEffect(() => {
    if (!draft?.id) return;
    const lines: string[] = [];
    lines.push(`Name: ${draft.first_name ?? ''} ${draft.last_name ?? ''}`.trim());
    if (draft.type) lines.push(`Type: ${draft.type}`);
    if (draft.role) lines.push(`Title: ${draft.role}`);
    if (draft.company) lines.push(`Company: ${draft.company}`);
    if (draft.email) lines.push(`Email: ${draft.email}`);
    if (draft.phone) lines.push(`Phone: ${draft.phone}`);
    if (draft.notes) lines.push(`Notes: ${draft.notes}`);
    if (draft.headshot_url) lines.push(`Headshot URL: ${draft.headshot_url}`);
    if (draft.linkedin_url) lines.push(`LinkedIn: ${draft.linkedin_url}`);
    if (draft.instagram_url) lines.push(`Instagram: ${draft.instagram_url}`);
    if (draft.imdb_url) lines.push(`IMDB: ${draft.imdb_url}`);
    if (draft.website_url) lines.push(`Website: ${draft.website_url}`);
    if (draft.client_id) {
      const co = companies.find((c) => c.id === draft.client_id);
      if (co) lines.push(`Linked Company: ${co.name}`);
    }
    if (roles.length > 0 && personRoleIds.size > 0) {
      const roleNames = roles.filter((r) => personRoleIds.has(r.id)).map((r) => r.name);
      if (roleNames.length > 0) lines.push(`Roles: ${roleNames.join(', ')}`);
    }
    if (projects.length > 0) {
      lines.push(`Projects: ${projects.map((p) => `${p.title}${p.client_name ? ` (${p.client_name})` : ''}`).join(', ')}`);
    }
    setPanelContext({
      recordType: 'contact',
      recordId: draft.id,
      recordLabel: `${draft.first_name ?? ''} ${draft.last_name ?? ''}`.trim() || 'Untitled',
      summary: lines.join('\n'),
    });
    return () => setPanelContext(null);
  }, [draft, roles, personRoleIds, projects, companies, setPanelContext]);

  const autoSave = useAutoSave(async () => {
    if (!draft) return;
    await onSave(draft);
    await setContactRoles(draft.id, [...personRoleIds]);
  });
  const handleDirty = useCallback(() => autoSave.trigger(), [autoSave]);

  // Sync draft when parent row updates (e.g. after autoSave round-trips)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!person) { setDraft(person); return; }
    // Auto-link company if name matches but client_id is missing
    if (!person.client_id && person.company) {
      const match = companies.find((co) => co.name.toLowerCase() === person.company!.toLowerCase());
      if (match) {
        setDraft({ ...person, client_id: match.id });
        handleDirty();
        return;
      }
    }
    setDraft(person);
  }, [person]);

  // Reset UI + fetch related data only when switching to a different person
  const personId = person?.id;
  useEffect(() => {
    autoSave.reset();
    setConfirmClose(false);
    setConfirmDeleteHsId(null);
    setOpenProject(null);
    setActiveTab('details');
    setHsSearchResults(null);
    setHsSelected(new Set());
    setHsUploading(false);
    setUrlSearching(false);
    if (personId) {
      setLoadingMeta(true);
      Promise.all([
        getAllRoles(),
        getContactRoles(personId),
        getContactProjects(personId),
        getHeadshots(personId),
      ]).then(([allRoles, contactRoles, contactProjects, contactHeadshots]) => {
        setRoles(allRoles);
        setPersonRoleIds(new Set(contactRoles.map((r) => r.id)));
        setProjects(contactProjects);
        setHeadshots(contactHeadshots);
      }).finally(() => setLoadingMeta(false));
    } else {
      setRoles([]);
      setPersonRoleIds(new Set());
      setProjects([]);
      setHeadshots([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  if (!draft) return <PanelDrawer open={open} onClose={onClose} width="w-[520px]" level={level}><div /></PanelDrawer>;

  const handleChange = (field: string, value: unknown) => {
    setDraft((prev) => prev ? { ...prev, [field]: value } : prev);
    handleDirty();
  };

  const handleClose = () => {
    if (autoSave.hasPending) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  };

  const toggleRole = (roleId: string) => {
    const next = new Set(personRoleIds);
    if (next.has(roleId)) next.delete(roleId); else next.add(roleId);
    setPersonRoleIds(next);
    handleDirty();
  };

  const searchHeadshots = async () => {
    if (!draft?.first_name) return;
    setHsSearching(true);
    setHsSearchResults(null);
    setHsSelected(new Set());
    try {
      const res = await fetch('/api/admin/firecrawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search-headshots', name: contactFullName(draft) }),
      });
      const data = await res.json();
      setHsSearchResults(data.images || []);
    } catch { setHsSearchResults([]); }
    finally { setHsSearching(false); }
  };

  const saveSelectedHeadshots = async () => {
    if (!draft || !hsSearchResults) return;
    setHsUploading(true);
    const startIndex = headshots.length;
    const hasFeatured = headshots.some(h => h.featured);
    for (const idx of Array.from(hsSelected).sort()) {
      const img = hsSearchResults[idx];
      try {
        const res = await fetch('/api/admin/firecrawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save-headshot',
            contactId: draft.id,
            imageUrl: img.imageUrl,
            index: startIndex + idx,
            featured: !hasFeatured && idx === Math.min(...hsSelected),
          }),
        });
        const data = await res.json();
        if (data.headshot) {
          setHeadshots(prev => [...prev, data.headshot as HeadshotRow]);
          if (data.headshot.featured) handleChange('headshot_url', data.headshot.url);
        }
      } catch { /* skip failed */ }
    }
    setHsUploading(false);
    setHsSearchResults(null);
    setHsSelected(new Set());
  };

  const searchUrls = async (): Promise<Record<string, string>> => {
    if (!draft?.first_name) return {};
    setUrlSearching(true);
    try {
      const res = await fetch('/api/admin/firecrawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search-urls', name: contactFullName(draft) }),
      });
      const data = await res.json();
      const urls = data.urls || {};
      for (const key of ['linkedin_url', 'instagram_url', 'imdb_url', 'website_url'] as const) {
        if (urls[key] && !draft[key]) {
          handleChange(key, urls[key]);
        }
      }
      return urls;
    } catch { return {}; }
    finally { setUrlSearching(false); }
  };

  const searchEmails = async (urls: Record<string, string>) => {
    if (!draft?.first_name || draft.email) return;
    try {
      const res = await fetch('/api/admin/firecrawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search-emails', name: contactFullName(draft), urls }),
      });
      const data = await res.json();
      if (data.email && !draft.email) {
        handleChange('email', data.email);
      }
    } catch { /* ignore */ }
  };

  const fetching = hsSearching || urlSearching;
  const fetchAllData = async () => {
    if (!draft?.first_name) return;
    // Run headshots + URLs in parallel
    const [, urls] = await Promise.all([searchHeadshots(), searchUrls()]);
    // Merge existing URLs with newly found ones for email search
    const allUrls: Record<string, string> = {};
    for (const key of ['linkedin_url', 'instagram_url', 'imdb_url', 'website_url'] as const) {
      if (draft[key]) allUrls[key] = draft[key]!;
    }
    Object.assign(allUrls, urls);
    // Then search for emails using confirmed URLs
    await searchEmails(allUrls);
  };

  const inputClass = 'w-full rounded-lg border border-admin-border-subtle bg-admin-bg-base px-3 py-2.5 text-sm text-admin-text-primary placeholder:text-admin-text-placeholder focus:outline-none focus:ring-1 focus:ring-admin-border-emphasis';

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[520px]" level={level}>
      <DiscardChangesDialog
        open={confirmClose}
        onKeepEditing={() => setConfirmClose(false)}
        onDiscard={() => { setConfirmClose(false); autoSave.reset(); onClose(); }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-admin-border bg-admin-bg-sidebar flex-shrink-0">
        {draft.headshot_url ? (
          <img src={draft.headshot_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-admin-bg-hover flex items-center justify-center flex-shrink-0 text-admin-text-ghost">
            <ImageIcon size={16} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-admin-text-primary truncate">
            {person ? `${draft.first_name} ${draft.last_name}`.trim() || 'Untitled' : 'New Contact'}
          </h2>
        </div>
        <div className="flex items-center flex-shrink-0">
          <SaveDot status={autoSave.status} />
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex items-center gap-1 border-b border-admin-border px-6 py-2 flex-shrink-0 bg-admin-bg-wash">
        {([
          { id: 'details' as const, label: 'Details', show: true, count: 0 },
          { id: 'projects' as const, label: 'Projects', show: projects.length > 0, count: projects.length },
          { id: 'roles' as const, label: 'Roles', show: draft.type === 'cast' || draft.type === 'crew', count: personRoleIds.size },
          { id: 'headshots' as const, label: 'Headshots', show: draft.type === 'cast', count: headshots.length },
        ] as const).filter(t => t.show).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-admin-bg-active text-admin-text-primary'
                : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 text-xs text-admin-text-faint">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-6 py-5 space-y-5">
        {/* ── Details Tab ── */}
        {activeTab === 'details' && (
          <>
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="admin-label">First Name</label>
                <input type="text" value={draft.first_name ?? ''} onChange={(e) => handleChange('first_name', e.target.value)} placeholder="First name" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="admin-label">Last Name</label>
                <input type="text" value={draft.last_name ?? ''} onChange={(e) => handleChange('last_name', e.target.value)} placeholder="Last name" className={inputClass} />
              </div>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-admin-text-muted">Type</label>
              <div className="flex gap-1.5 flex-wrap">
                {(['contact', 'crew', 'cast', 'staff', 'vendor'] as ContactType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleChange('type', t)}
                    className={`px-3 py-1.5 text-xs rounded-lg border capitalize transition-colors ${
                      draft.type === t ? TYPE_COLORS[t] : 'border-admin-border text-admin-text-faint hover:text-admin-text-primary hover:border-admin-border-emphasis'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-admin-text-muted">
                <Briefcase size={12} /> Title
              </label>
              <input type="text" value={draft.role ?? ''} onChange={(e) => handleChange('role', e.target.value || null)} placeholder="CEO, Founder, Marketing Director..." className={inputClass} />
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-admin-text-muted">
                <Building2 size={12} /> Company
              </label>
              <AdminCombobox
                value={draft.client_id ?? null}
                options={companies.map((co) => ({ id: co.id, label: co.name }))}
                onChange={(v) => {
                  const selectedCompany = companies.find((co) => co.id === v);
                  handleChange('client_id', v);
                  handleChange('company', selectedCompany?.name ?? null);
                }}
                placeholder="None"
              />
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-admin-text-muted">
                  <Mail size={12} /> Email
                </label>
                <input type="email" value={draft.email ?? ''} onChange={(e) => handleChange('email', e.target.value || null)} placeholder="john@acme.com" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-admin-text-muted">
                  <Phone size={12} /> Phone
                </label>
                <input type="tel" value={draft.phone ?? ''} onChange={(e) => handleChange('phone', e.target.value || null)} placeholder="(555) 123-4567" className={inputClass} />
              </div>
            </div>

            {/* Links */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-admin-text-muted">
                <Globe size={12} /> Links
              </label>
              <div className="space-y-2">
                {([
                  { key: 'linkedin_url' as const, Icon: Linkedin, placeholder: 'LinkedIn URL' },
                  { key: 'instagram_url' as const, Icon: Instagram, placeholder: 'Instagram URL' },
                  { key: 'imdb_url' as const, Icon: Film, placeholder: 'IMDB URL' },
                  { key: 'website_url' as const, Icon: Globe, placeholder: 'Website URL' },
                ] as const).map(({ key, Icon, placeholder }) => (
                  <div key={key} className="relative">
                    <input
                      type="url"
                      value={draft[key] ?? ''}
                      onChange={(e) => handleChange(key, e.target.value || null)}
                      placeholder={placeholder}
                      className={`${inputClass} pl-8 pr-8`}
                    />
                    <Icon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-text-placeholder" />
                    {draft[key] && (
                      <a href={draft[key]!} target="_blank" rel="noopener noreferrer" className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-admin-text-placeholder hover:text-admin-text-primary hover:bg-admin-bg-hover-strong transition-colors">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-admin-text-muted">
                <StickyNote size={12} /> Notes
              </label>
              <textarea
                value={draft.notes ?? ''}
                onChange={(e) => handleChange('notes', e.target.value || null)}
                placeholder="Notes..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
          </>
        )}

        {/* ── Headshots Tab (cast only) ── */}
        {activeTab === 'headshots' && (
          <>
            {/* Existing headshots */}
            {headshots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {headshots.map((hs) => (
                  <div
                    key={hs.id}
                    className={`rounded-lg overflow-hidden border transition-colors ${
                      hs.featured ? 'border-admin-warning-border ring-1 ring-admin-warning-bg' : 'border-admin-border'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-admin-bg-subtle">
                      <img src={hs.url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center justify-between px-1.5 py-1">
                      <span className="text-xs text-admin-text-faint">{hs.width}×{hs.height}</span>
                      <div className="flex items-center gap-0.5">
                        {confirmDeleteHsId === hs.id ? (
                          <>
                            <button
                              onClick={() => {
                                deleteHeadshot(hs.id).then(() => {
                                  setHeadshots(prev => prev.filter(h => h.id !== hs.id));
                                  if (hs.featured) handleChange('headshot_url', null);
                                  setConfirmDeleteHsId(null);
                                });
                              }}
                              className="p-1 rounded text-admin-danger hover:bg-admin-danger-bg transition-colors"
                              title="Confirm delete"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteHsId(null)}
                              className="p-1 rounded text-admin-text-placeholder hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setFeaturedHeadshot(hs.id, draft.id).then(() => {
                                  setHeadshots(prev => prev.map(h => ({ ...h, featured: h.id === hs.id })));
                                  handleChange('headshot_url', hs.url);
                                });
                              }}
                              className={`p-1 rounded transition-colors ${
                                hs.featured
                                  ? 'text-admin-warning'
                                  : 'text-admin-text-placeholder hover:text-admin-warning hover:bg-admin-warning-bg'
                              }`}
                              title={hs.featured ? 'Featured' : 'Set as featured'}
                            >
                              <Star size={12} fill={hs.featured ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteHsId(hs.id)}
                              className="p-1 rounded text-admin-text-placeholder hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
                              title="Delete headshot"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !hsSearchResults && (
              <p className="text-sm text-admin-text-ghost">No headshots yet. Use Fetch Data to search.</p>
            )}
            {/* Search results */}
            {hsSearchResults && hsSearchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] text-admin-text-faint">Search results — select to save:</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {hsSearchResults.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setHsSelected(prev => {
                        const next = new Set(prev);
                        next.has(i) ? next.delete(i) : next.add(i);
                        return next;
                      })}
                      className={`rounded-lg overflow-hidden border-2 transition-colors ${
                        hsSelected.has(i) ? 'border-accent' : 'border-transparent hover:border-admin-border-emphasis'
                      }`}
                    >
                      <div className="aspect-[3/4] bg-admin-bg-subtle">
                        <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveSelectedHeadshots}
                    disabled={hsSelected.size === 0 || hsUploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-30"
                  >
                    {hsUploading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    {hsUploading ? 'Saving...' : `Save ${hsSelected.size} selected`}
                  </button>
                  <button
                    onClick={() => { setHsSearchResults(null); setHsSelected(new Set()); }}
                    className="px-3 py-1.5 text-xs rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {hsSearchResults && hsSearchResults.length === 0 && (
              <p className="text-xs text-admin-text-ghost">No headshots found for &ldquo;{contactFullName(draft)}&rdquo;</p>
            )}
          </>
        )}

        {/* ── Roles Tab (cast & crew) ── */}
        {activeTab === 'roles' && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-admin-text-muted">Production Roles</label>
              {loadingMeta ? (
                <p className="text-xs text-admin-text-ghost">Loading...</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => toggleRole(r.id)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                        personRoleIds.has(r.id)
                          ? 'bg-admin-bg-active border-admin-border-emphasis text-admin-text-primary'
                          : 'border-admin-border text-admin-text-faint hover:text-admin-text-primary hover:border-admin-border-muted'
                      }`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Projects Tab ── */}
        {activeTab === 'projects' && (
          <>
            {projects.length > 0 ? (
              <div className="space-y-1.5">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setOpenProject(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-admin-border hover:border-admin-border-muted hover:bg-admin-bg-selected transition-colors group text-left"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-admin-bg-selected">
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-admin-text-secondary group-hover:text-admin-text-secondary truncate">{p.title}</p>
                      {p.client_name && (
                        <p className="text-xs text-admin-text-ghost truncate">{p.client_name}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-admin-text-ghost">No linked projects.</p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <PanelFooter
        onSave={() => void autoSave.flush()}
        onDelete={() => { onDelete(draft.id); onClose(); }}
        secondaryActions={
          <button
            onClick={fetchAllData}
            disabled={fetching}
            className="flex items-center gap-2 px-4 py-[9px] rounded-lg border border-admin-border text-sm text-admin-text-muted hover:text-admin-text-primary hover:border-admin-border-emphasis hover:bg-admin-bg-hover transition-colors disabled:opacity-40"
          >
            {fetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {fetching ? 'Fetching...' : 'Fetch Data'}
          </button>
        }
      />

      {/* Nested Project Panel — backdrop click closes everything */}
      <ProjectPanel
        project={openProject ? { id: openProject.id, title: openProject.title, thumbnail_url: openProject.thumbnail_url } : null}
        open={!!openProject}
        onClose={() => { setOpenProject(null); onClose(); }}
        onProjectUpdated={() => {}}
        onProjectDeleted={() => {}}
        onProjectCreated={() => {}}
      />
    </PanelDrawer>
  );
}
