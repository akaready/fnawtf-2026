'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus, Trash2, Save, Loader2, Download, X,
  Mail, Phone, Building2, Briefcase, StickyNote, Image as ImageIcon,
  Wrench, Sparkles, Contact, Star, HeartHandshake, Users, LayoutGrid, Tag,
  Globe, ExternalLink, Linkedin, Instagram, Film, RefreshCw,
  User, ListFilter, Layers, ArrowUpAZ, Palette, Rows, Snowflake, Eye, Table2,
} from 'lucide-react';
import { useSaveState } from '@/app/admin/_hooks/useSaveState';
import { SaveButton } from './SaveButton';
import { AdminPageHeader } from './AdminPageHeader';
import { ViewSwitcher, type ViewDef } from './ViewSwitcher';
import { useViewMode } from '../_hooks/useViewMode';
import { ToolbarButton } from './table/TableToolbar';
import { PanelDrawer } from './PanelDrawer';
import { DiscardChangesDialog } from './DiscardChangesDialog';
import { ProjectPanel } from './ProjectPanel';
import { AdminDataTable, FilterDropdown, type ColDef } from './table';
import { contactFullName } from '@/lib/contacts';
import {
  createContact,
  updateContact,
  deleteContact,
  getAllRoles,
  getContactRoles,
  setContactRoles,
  getContactProjects,
  getHeadshots,
  setFeaturedHeadshot,
  deleteHeadshot,
  type ClientRow,
  type HeadshotRow,
  batchDeleteContacts,
} from '../actions';
import type { ContactRow, ContactType } from '@/types/proposal';

const TYPE_COLORS: Record<ContactType, string> = {
  crew: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  cast: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  contact: 'bg-admin-success-bg text-admin-success border-admin-success-border',
  staff: 'bg-admin-warning-bg text-admin-warning border-admin-warning-border',
  partner: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const TYPE_ICON_COLORS: Record<string, string> = {
  all: 'text-admin-text-dim',
  crew: 'text-purple-400',
  cast: 'text-pink-400',
  contact: 'text-admin-success',
  staff: 'text-admin-warning',
  partner: 'text-orange-400',
};

const TYPE_ACTIVE_CLASSES: Record<string, string> = {
  all: 'bg-admin-bg-active text-admin-text-primary border-admin-border-emphasis',
  crew: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  cast: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  contact: 'bg-admin-success-bg text-admin-success border-admin-success-border',
  staff: 'bg-admin-warning-bg text-admin-warning border-admin-warning-border',
  partner: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
};

const TYPE_CIRCLE_BG: Record<ContactType, string> = {
  crew: 'bg-purple-500/10',
  cast: 'bg-pink-500/10',
  contact: 'bg-admin-success-bg',
  staff: 'bg-admin-warning-bg',
  partner: 'bg-orange-500/10',
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
  partner: HeartHandshake,
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

/* ── Person Panel ───────────────────────────────────────────────────────── */

function PersonPanel({
  person,
  open,
  onClose,
  companies,
  onSave,
  onDelete,
}: {
  person: ContactRow | null;
  open: boolean;
  onClose: () => void;
  companies: ClientRow[];
  onSave: (row: ContactRow) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const { saving, saved, wrap: wrapSave } = useSaveState(2000);
  const [draft, setDraft] = useState<ContactRow | null>(person);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [personRoleIds, setPersonRoleIds] = useState<Set<string>>(new Set());
  const [projects, setProjects] = useState<Array<{ id: string; title: string; client_name: string; thumbnail_url: string | null }>>([]);
  const [openProject, setOpenProject] = useState<{ id: string; title: string; thumbnail_url: string | null } | null>(null);
  const [headshots, setHeadshots] = useState<HeadshotRow[]>([]);
  const [hsSearchResults, setHsSearchResults] = useState<Array<{ imageUrl: string; title: string; imageWidth: number; imageHeight: number }> | null>(null);
  const [hsSearching, setHsSearching] = useState(false);
  const [hsSelected, setHsSelected] = useState<Set<number>>(new Set());
  const [hsUploading, setHsUploading] = useState(false);
  const [urlSearching, setUrlSearching] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'headshots' | 'roles' | 'projects'>('details');

  useEffect(() => {
    // Auto-link company if name matches but client_id is missing
    if (person && !person.client_id && person.company) {
      const match = companies.find((co) => co.name.toLowerCase() === person.company!.toLowerCase());
      if (match) {
        setDraft({ ...person, client_id: match.id });
        setDirty(true);
      } else {
        setDraft(person);
        setDirty(false);
      }
    } else {
      setDraft(person);
      setDirty(false);
    }
    setConfirmClose(false);
    setConfirmDelete(false);
    setOpenProject(null);
    setActiveTab('details');
    setHsSearchResults(null);
    setHsSelected(new Set());
    setHsUploading(false);
    setUrlSearching(false);
    if (person) {
      setLoadingMeta(true);
      Promise.all([
        getAllRoles(),
        getContactRoles(person.id),
        getContactProjects(person.id),
        getHeadshots(person.id),
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
  }, [person]);

  if (!draft) return <PanelDrawer open={open} onClose={onClose} width="w-[520px]"><div /></PanelDrawer>;

  const handleChange = (field: string, value: unknown) => {
    setDraft((prev) => prev ? { ...prev, [field]: value } : prev);
    setDirty(true);
  };

  const handleSave = () => {
    if (!draft) return;
    setDirty(false);
    wrapSave(async () => {
      await onSave(draft);
      await setContactRoles(draft.id, [...personRoleIds]);
    });
  };

  const handleClose = () => {
    if (dirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  };

  const toggleRole = (roleId: string) => {
    const next = new Set(personRoleIds);
    if (next.has(roleId)) next.delete(roleId); else next.add(roleId);
    setPersonRoleIds(next);
    setDirty(true);
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
    <PanelDrawer open={open} onClose={handleClose} width="w-[520px]">
      <DiscardChangesDialog
        open={confirmClose}
        onKeepEditing={() => setConfirmClose(false)}
        onDiscard={() => { setConfirmClose(false); setDirty(false); onClose(); }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-admin-border bg-admin-bg-wash flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {draft.headshot_url ? (
            <img src={draft.headshot_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-admin-bg-hover flex items-center justify-center flex-shrink-0 text-admin-text-ghost">
              <ImageIcon size={16} />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex gap-2 w-full">
              <input
                type="text"
                value={draft.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className="bg-transparent text-lg font-semibold text-admin-text-primary placeholder:text-admin-text-placeholder focus:outline-none flex-1 min-w-0"
                placeholder="First"
              />
              <input
                type="text"
                value={draft.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className="bg-transparent text-lg font-semibold text-admin-text-primary placeholder:text-admin-text-placeholder focus:outline-none flex-1 min-w-0"
                placeholder="Last"
              />
            </div>
            <span className={`inline-flex px-2 py-0.5 text-xs rounded border capitalize ${TYPE_COLORS[draft.type]}`}>
              {draft.type}
            </span>
          </div>
        </div>
        <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0">
          <X size={16} />
        </button>
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
            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-admin-text-muted">Type</label>
              <div className="flex gap-1.5 flex-wrap">
                {(['contact', 'crew', 'cast', 'staff', 'partner'] as ContactType[]).map((t) => (
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
              <select
                value={draft.client_id ?? ''}
                onChange={(e) => {
                  const selectedId = e.target.value || null;
                  const selectedCompany = companies.find((co) => co.id === selectedId);
                  handleChange('client_id', selectedId);
                  handleChange('company', selectedCompany?.name ?? null);
                }}
                className={inputClass}
              >
                <option value="">None</option>
                {companies.map((co) => (
                  <option key={co.id} value={co.id}>{co.name}</option>
                ))}
              </select>
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
                          onClick={() => {
                            if (!confirm('Delete this headshot?')) return;
                            deleteHeadshot(hs.id).then(() => {
                              setHeadshots(prev => prev.filter(h => h.id !== hs.id));
                            });
                          }}
                          className="p-1 rounded text-admin-text-placeholder hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
                          title="Delete headshot"
                        >
                          <Trash2 size={12} />
                        </button>
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
      <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border bg-admin-bg-wash flex-shrink-0">
        <div className="flex items-center gap-2">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} className="px-5 py-2.5 text-sm" />
          <button
            onClick={fetchAllData}
            disabled={fetching}
            className="flex items-center gap-2 px-4 py-[9px] rounded-lg border border-admin-border text-sm text-admin-text-muted hover:text-admin-text-primary hover:border-admin-border-emphasis hover:bg-admin-bg-hover transition-colors disabled:opacity-40"
          >
            {fetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {fetching ? 'Fetching...' : 'Fetch Data'}
          </button>
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button onClick={() => { onDelete(draft.id); onClose(); }} className="px-3 py-1.5 text-xs rounded bg-red-600 text-admin-text-primary hover:bg-red-700 transition-colors">Delete</button>
            <button onClick={() => setConfirmDelete(false)} className="p-2 rounded-lg text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg text-admin-danger/60 hover:text-admin-danger hover:bg-admin-danger-bg transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>

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

/* ── Main People Page ───────────────────────────────────────────────────── */

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
              {(['all', 'crew', 'cast', 'contact', 'staff', 'partner'] as const).map((t) => {
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
                  { id: 'partner', name: 'Partner' },
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
          onBatchDelete={async (ids) => {
            await batchDeleteContacts(ids);
            setContacts((prev) => prev.filter((c) => !ids.includes(c.id)));
          }}
          onRowClick={(row) => setActiveId(row.id)}
          selectedId={activeId ?? undefined}
          emptyMessage={contacts.length === 0 ? 'No people yet.' : 'No matching people.'}
          toolbarSlot={
            <>
              <ViewSwitcher views={CONTACT_VIEWS} activeView={viewMode} onChange={setViewMode} />
              {/* Type tabs — full buttons on lg+, dropdown on smaller */}
              <div className="hidden 2xl:flex items-center gap-1">
                {(['all', 'crew', 'cast', 'contact', 'staff', 'partner'] as const).map((t) => {
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
                    { id: 'partner', name: 'Partner' },
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
    </div>
  );
}
