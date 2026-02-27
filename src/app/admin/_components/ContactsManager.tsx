'use client';

import { useState, useMemo, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus, Trash2, Save, Loader2, Download, X, Search, ChevronDown, ChevronUp, ArrowUpDown,
  Mail, Phone, Building2, Briefcase, StickyNote, Image as ImageIcon,
  Wrench, Sparkles, Contact, Star, HeartHandshake, Users, LayoutGrid, Tag,
  Globe, ExternalLink, Linkedin, Instagram, Film, RefreshCw,
  User, SlidersHorizontal, Columns, GripVertical,
} from 'lucide-react';
import { useSaveState } from '@/app/admin/_hooks/useSaveState';
import { SaveButton } from './SaveButton';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminTabBar } from './AdminTabBar';
import { PanelDrawer } from './PanelDrawer';
import { DiscardChangesDialog } from './DiscardChangesDialog';
import { ProjectPanel } from './ProjectPanel';
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
} from '../actions';
import type { ContactRow, ContactType } from '@/types/proposal';

const TYPE_COLORS: Record<ContactType, string> = {
  crew: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  cast: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  contact: 'bg-green-500/20 text-green-400 border-green-500/30',
  staff: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  partner: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const TYPE_ICON_COLORS: Record<string, string> = {
  all: 'text-[#666]',
  crew: 'text-purple-400',
  cast: 'text-pink-400',
  contact: 'text-green-400',
  staff: 'text-yellow-400',
  partner: 'text-orange-400',
};

const TYPE_ACTIVE_CLASSES: Record<string, string> = {
  all: 'bg-white/10 text-white border-white/20',
  crew: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  cast: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  contact: 'bg-green-500/15 text-green-300 border-green-500/30',
  staff: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  partner: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
};

const TYPE_CIRCLE_BG: Record<ContactType, string> = {
  crew: 'bg-purple-500/10',
  cast: 'bg-pink-500/10',
  contact: 'bg-green-500/10',
  staff: 'bg-yellow-500/10',
  partner: 'bg-orange-500/10',
};

interface ContactColDef {
  key: string;
  label: string;
  defaultVisible: boolean;
  align?: 'left' | 'right';
  render: (c: ContactRow) => ReactNode;
  sortValue?: (c: ContactRow) => string | number;
}

const CONTACT_COLUMNS: ContactColDef[] = [
  { key: 'type', label: 'Type', defaultVisible: true, sortValue: (c) => c.type, render: (c) => (
    <span className={`inline-flex px-2 py-0.5 text-xs rounded border capitalize ${TYPE_COLORS[c.type]}`}>{c.type}</span>
  )},
  { key: 'email', label: 'Email', defaultVisible: true, sortValue: (c) => (c.email ?? '').toLowerCase(), render: (c) => c.email || '—' },
  { key: 'phone', label: 'Phone', defaultVisible: false, render: (c) => c.phone || '—' },
  { key: 'company', label: 'Company', defaultVisible: true, sortValue: (c) => (c.company ?? '').toLowerCase(), render: (c) => c.company || '—' },
  { key: 'title', label: 'Title', defaultVisible: true, sortValue: (c) => (c.role ?? '').toLowerCase(), render: (c) => c.role || '—' },
  { key: 'website_url', label: 'Website', defaultVisible: false, render: (c) => c.website_url ? (
    <a href={c.website_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-accent hover:underline truncate block">{new URL(c.website_url).hostname}</a>
  ) : '—' },
  { key: 'linkedin_url', label: 'LinkedIn', defaultVisible: false, render: (c) => c.linkedin_url ? (
    <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-accent hover:underline truncate block">Profile</a>
  ) : '—' },
  { key: 'instagram_url', label: 'Instagram', defaultVisible: false, render: (c) => c.instagram_url ? (
    <a href={c.instagram_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-accent hover:underline truncate block">@{c.instagram_url.split('/').filter(Boolean).pop()}</a>
  ) : '—' },
  { key: 'imdb_url', label: 'IMDB', defaultVisible: false, render: (c) => c.imdb_url ? (
    <a href={c.imdb_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-accent hover:underline truncate block">Page</a>
  ) : '—' },
  { key: 'notes', label: 'Notes', defaultVisible: false, render: (c) => c.notes ? (
    <span className="truncate block max-w-[200px]" title={c.notes}>{c.notes}</span>
  ) : '—' },
  { key: 'created_at', label: 'Added', defaultVisible: true, align: 'right', sortValue: (c) => new Date(c.created_at).getTime(), render: (c) => new Date(c.created_at).toLocaleDateString() },
  { key: 'updated_at', label: 'Updated', defaultVisible: false, align: 'right', sortValue: (c) => new Date(c.updated_at).getTime(), render: (c) => new Date(c.updated_at).toLocaleDateString() },
];

/* Sort value getters for the built-in name columns */
const NAME_SORT: Record<string, (c: ContactRow) => string> = {
  first_name: (c) => c.first_name.toLowerCase(),
  last_name: (c) => c.last_name.toLowerCase(),
};

type ContactColKey = string;
const defaultVisibleCols = new Set<ContactColKey>(CONTACT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));

const TYPE_ICONS: Record<string, typeof Users> = {
  all: Users,
  crew: Wrench,
  cast: Sparkles,
  contact: Contact,
  staff: Star,
  partner: HeartHandshake,
};

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

  const inputClass = 'w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-foreground placeholder:text-[#303033] focus:outline-none focus:ring-1 focus:ring-white/20';

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[520px]">
      <DiscardChangesDialog
        open={confirmClose}
        onKeepEditing={() => setConfirmClose(false)}
        onDiscard={() => { setConfirmClose(false); setDirty(false); onClose(); }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2a2a2a] bg-white/[0.02] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {draft.headshot_url ? (
            <img src={draft.headshot_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 text-[#404044]">
              <ImageIcon size={16} />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex gap-2 w-full">
              <input
                type="text"
                value={draft.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className="bg-transparent text-lg font-semibold text-foreground placeholder:text-[#303033] focus:outline-none flex-1 min-w-0"
                placeholder="First"
              />
              <input
                type="text"
                value={draft.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className="bg-transparent text-lg font-semibold text-foreground placeholder:text-[#303033] focus:outline-none flex-1 min-w-0"
                placeholder="Last"
              />
            </div>
            <span className={`inline-flex px-2 py-0.5 text-xs rounded border capitalize ${TYPE_COLORS[draft.type]}`}>
              {draft.type}
            </span>
          </div>
        </div>
        <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors flex-shrink-0">
          <X size={16} />
        </button>
      </div>

      {/* Tab strip */}
      <div className="flex items-center gap-1 border-b border-[#2a2a2a] px-6 py-2 flex-shrink-0 bg-white/[0.02]">
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
                ? 'bg-white/10 text-white'
                : 'text-[#666] hover:text-[#b3b3b3] hover:bg-white/5'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 text-xs text-[#4d4d4d]">{tab.count}</span>
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
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <div className="flex gap-1.5 flex-wrap">
                {(['contact', 'crew', 'cast', 'staff', 'partner'] as ContactType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleChange('type', t)}
                    className={`px-3 py-1.5 text-xs rounded-lg border capitalize transition-colors ${
                      draft.type === t ? TYPE_COLORS[t] : 'border-[#2a2a2a] text-[#515155] hover:text-foreground hover:border-white/20'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Briefcase size={12} /> Title
              </label>
              <input type="text" value={draft.role ?? ''} onChange={(e) => handleChange('role', e.target.value || null)} placeholder="CEO, Founder, Marketing Director..." className={inputClass} />
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
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
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Mail size={12} /> Email
                </label>
                <input type="email" value={draft.email ?? ''} onChange={(e) => handleChange('email', e.target.value || null)} placeholder="john@acme.com" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Phone size={12} /> Phone
                </label>
                <input type="tel" value={draft.phone ?? ''} onChange={(e) => handleChange('phone', e.target.value || null)} placeholder="(555) 123-4567" className={inputClass} />
              </div>
            </div>

            {/* Links */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
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
                    <Icon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#303033]" />
                    {draft[key] && (
                      <a href={draft[key]!} target="_blank" rel="noopener noreferrer" className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-[#303033] hover:text-foreground hover:bg-white/10 transition-colors">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
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
                      hs.featured ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : 'border-[#2a2a2a]'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-white/[0.03]">
                      <img src={hs.url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center justify-between px-1.5 py-1">
                      <span className="text-xs text-[#515155]">{hs.width}×{hs.height}</span>
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
                              ? 'text-yellow-400'
                              : 'text-[#303033] hover:text-yellow-400 hover:bg-yellow-500/10'
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
                          className="p-1 rounded text-[#303033] hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
              <p className="text-sm text-[#404044]">No headshots yet. Use Fetch Data to search.</p>
            )}
            {/* Search results */}
            {hsSearchResults && hsSearchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] text-[#515155]">Search results — select to save:</p>
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
                        hsSelected.has(i) ? 'border-accent' : 'border-transparent hover:border-white/20'
                      }`}
                    >
                      <div className="aspect-[3/4] bg-white/[0.03]">
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
                    className="px-3 py-1.5 text-xs rounded-lg text-[#515155] hover:text-foreground hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {hsSearchResults && hsSearchResults.length === 0 && (
              <p className="text-xs text-[#404044]">No headshots found for &ldquo;{contactFullName(draft)}&rdquo;</p>
            )}
          </>
        )}

        {/* ── Roles Tab (cast & crew) ── */}
        {activeTab === 'roles' && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Production Roles</label>
              {loadingMeta ? (
                <p className="text-xs text-[#404044]">Loading...</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => toggleRole(r.id)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                        personRoleIds.has(r.id)
                          ? 'bg-white/10 border-white/20 text-foreground'
                          : 'border-[#2a2a2a] text-[#515155] hover:text-foreground hover:border-white/15'
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
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#2a2a2a] hover:border-white/[0.16] hover:bg-white/[0.04] transition-colors group text-left"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-white/[0.04]">
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#808080] group-hover:text-[#b3b3b3] truncate">{p.title}</p>
                      {p.client_name && (
                        <p className="text-xs text-[#404040] truncate">{p.client_name}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#404044]">No linked projects.</p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a2a2a] bg-white/[0.02] flex-shrink-0">
        <div className="flex items-center gap-2">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} className="px-5 py-2.5 text-sm" />
          <button
            onClick={fetchAllData}
            disabled={fetching}
            className="flex items-center gap-2 px-4 py-[9px] rounded-lg border border-[#2a2a2a] text-sm text-muted-foreground hover:text-foreground hover:border-white/20 hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            {fetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {fetching ? 'Fetching...' : 'Fetch Data'}
          </button>
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button onClick={() => { onDelete(draft.id); onClose(); }} className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition-colors">Delete</button>
            <button onClick={() => setConfirmDelete(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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

/* ── Filter Dropdown ───────────────────────────────────────────────────── */

function FilterDropdown({
  label,
  searchPlural,
  icon,
  items,
  value,
  onChange,
}: {
  label: string;
  searchPlural?: string;
  icon: ReactNode;
  items: Array<{ id: string; name: string; subtitle?: string }>;
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = query.trim()
    ? items.filter((i) => {
        const q = query.toLowerCase();
        return i.name.toLowerCase().includes(q) || i.subtitle?.toLowerCase().includes(q);
      })
    : items;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-sm text-[#666] hover:text-[#b3b3b3] hover:bg-white/5 hover:border-white/5 transition-colors border border-transparent"
      >
        {icon}
        {label}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-[5px] w-72 bg-[#1a1a1a] border-2 border-[#2a2a2a] rounded-xl shadow-[0_10px_40px_10px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-dropdown-in">
          <div className="flex items-center gap-2 px-3 py-[10px] border-b border-[#2a2a2a] bg-black/30">
            <Search size={13} className="text-[#4d4d4d] flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${searchPlural ?? `${label.toLowerCase()}s`}...`}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#404040]"
            />
          </div>
          <div className="max-h-56 overflow-y-auto admin-scrollbar py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-[#404040] text-center">No matches</div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onChange(item.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 transition-colors ${
                    value === item.id
                      ? 'bg-white/10 text-white'
                      : 'text-[#999] hover:bg-white/[0.06] hover:text-white/90'
                  }`}
                >
                  <span className="text-sm truncate block">{item.name}</span>
                  {item.subtitle && (
                    <span className="text-xs text-[#4d4d4d] truncate block">{item.subtitle}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Fields Picker Panel ───────────────────────────────────────────────── */

function FieldsPickerPanel({
  visibleCols,
  onToggle,
  onShowAll,
  onHideAll,
}: {
  visibleCols: Set<ContactColKey>;
  onToggle: (key: ContactColKey) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}) {
  const [fieldSearch, setFieldSearch] = useState('');

  const filteredCols = useMemo(() => {
    if (!fieldSearch) return CONTACT_COLUMNS;
    const q = fieldSearch.toLowerCase();
    return CONTACT_COLUMNS.filter((c) => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q));
  }, [fieldSearch]);

  return (
    <div className="absolute right-0 top-full mt-[5px] w-64 bg-[#1a1a1a] border-2 border-[#2a2a2a] rounded-xl shadow-[0_10px_40px_10px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-dropdown-in p-3">
      <div className="space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#404044]" />
          <input
            type="text"
            value={fieldSearch}
            onChange={(e) => setFieldSearch(e.target.value)}
            placeholder="Search fields…"
            className="w-full pl-8 pr-3 py-1.5 bg-black/30 border border-[#2a2a2a] rounded-lg text-sm text-foreground placeholder:text-[#303033] focus:outline-none focus:border-white/20"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2 pb-1 border-b border-[#2a2a2a]">
          <button onClick={onShowAll} className="text-[11px] text-[#515155] hover:text-foreground transition-colors">
            Show all
          </button>
          <span className="text-[#202022]">·</span>
          <button onClick={onHideAll} className="text-[11px] text-[#515155] hover:text-foreground transition-colors">
            Hide all
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto admin-scrollbar space-y-0.5">
          {filteredCols.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2.5 px-2.5 py-1 rounded-lg text-sm cursor-pointer hover:bg-white/5 transition-colors"
            >
              <input
                type="checkbox"
                checked={visibleCols.has(col.key)}
                onChange={() => onToggle(col.key)}
                className="accent-white rounded"
              />
              <span className={visibleCols.has(col.key) ? 'text-foreground' : 'text-[#515155]'}>
                {col.label}
              </span>
            </label>
          ))}
          {filteredCols.length === 0 && (
            <div className="px-2.5 py-3 text-xs text-[#303033] text-center">No matches</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main People Page ───────────────────────────────────────────────────── */

export function ContactsManager({ initialContacts, companies, projects, contactProjectMap, roles, contactRoleMap }: Props) {
  const [contacts, setContacts] = useState(initialContacts);
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContactType | 'all'>('all');
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<ContactColKey>>(defaultVisibleCols);
  const [sortKey, setSortKey] = useState('last_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [colOrder, setColOrder] = useState<string[]>(() => CONTACT_COLUMNS.map((c) => c.key));
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const fieldsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef(false);
  const dragColRef = useRef<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);
  const fieldsModified = visibleCols.size < CONTACT_COLUMNS.length;
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('open');
    if (id) {
      setActiveId(id);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => { setContacts(initialContacts); }, [initialContacts]);

  // Click-outside for fields panel
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fieldsRef.current && !fieldsRef.current.contains(e.target as Node)) setFieldsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const toggleCol = useCallback((key: ContactColKey) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  /* ── Ordered visible columns ────────────────────────────────────── */

  const orderedVisibleCols = useMemo(() => {
    const colMap = new Map(CONTACT_COLUMNS.map((c) => [c.key, c]));
    return colOrder.filter((k) => visibleCols.has(k) && colMap.has(k)).map((k) => colMap.get(k)!);
  }, [colOrder, visibleCols]);

  /* ── Column resize handler ────────────────────────────────────── */

  const handleColResize = useCallback((colKey: string, nextColKey: string | null, startX: number, startWidth: number, nextStartWidth: number) => {
    let didMove = false;
    const onMouseMove = (e: MouseEvent) => {
      didMove = true;
      resizingRef.current = true;
      const delta = e.clientX - startX;
      const newWidth = Math.max(40, startWidth + delta);
      setColWidths((prev) => {
        const next = { ...prev, [colKey]: newWidth };
        if (nextColKey) {
          next[nextColKey] = Math.max(40, nextStartWidth - delta);
        }
        return next;
      });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (didMove) {
        setTimeout(() => { resizingRef.current = false; }, 0);
      }
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  /* ── Column drag-and-drop ───────────────────────────────────────── */

  const handleColDragStart = useCallback((e: React.DragEvent, key: string) => {
    dragColRef.current = key;
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).style.opacity = '0.4';
  }, []);

  const handleColDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    dragColRef.current = null;
    setDragOverColKey(null);
  }, []);

  const handleColDragOver = useCallback((e: React.DragEvent, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColKey(key);
  }, []);

  const handleColDrop = useCallback((e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    setDragOverColKey(null);
    const sourceKey = dragColRef.current;
    if (!sourceKey || sourceKey === targetKey) return;

    // Capture widths before reorder
    const tableEl = tableRef.current;
    if (tableEl) {
      const headerRow = tableEl.querySelector('thead tr');
      if (headerRow) {
        const ths = Array.from(headerRow.querySelectorAll('th'));
        setColWidths((prev) => {
          const next = { ...prev };
          // First two ths are First Name & Last Name (always visible), data cols start at index 2
          for (let i = 2; i < ths.length; i++) {
            const colIdx = i - 2;
            if (colIdx < orderedVisibleCols.length) {
              const key = orderedVisibleCols[colIdx].key;
              if (!next[key]) {
                next[key] = ths[i].getBoundingClientRect().width;
              }
            }
          }
          return next;
        });
      }
    }

    setColOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(sourceKey);
      const toIdx = next.indexOf(targetKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, sourceKey);
      return next;
    });
  }, [orderedVisibleCols]);

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
    // Sort
    const nameSortFn = NAME_SORT[sortKey];
    const colSortFn = CONTACT_COLUMNS.find((col) => col.key === sortKey)?.sortValue;
    const getSortVal = nameSortFn ?? colSortFn;
    if (getSortVal) {
      result = [...result].sort((a, b) => {
        const va = getSortVal(a);
        const vb = getSortVal(b);
        const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [contacts, search, typeFilter, companyFilter, projectFilter, contactProjectMap, roleFilter, contactRoleMap, sortKey, sortDir]);

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
  const isCastView = typeFilter === 'cast';

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
      />

      {/* Type filter tabs */}
      <AdminTabBar
        tabs={(['all', 'crew', 'cast', 'contact', 'staff', 'partner'] as const).map((t) => {
          const Icon = TYPE_ICONS[t];
          return {
            value: t,
            label: t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1),
            icon: <Icon size={13} className={TYPE_ICON_COLORS[t]} />,
            badge: <span className="text-xs text-[#4d4d4d] ml-0.5">{typeCounts[t] ?? 0}</span>,
            activeClassName: TYPE_ACTIVE_CLASSES[t],
          };
        })}
        activeTab={typeFilter}
        onTabChange={(v) => setTypeFilter(v as ContactType | 'all')}
        dividerAfter="all"
      />

      {/* Filter row */}
      <div className="flex-shrink-0 flex items-center gap-1 px-8 py-1.5 border-b border-[#2a2a2a]">
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
          <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-[#2a2a2a]">
            {companyFilter && (() => {
              const name = companies.find((co) => co.id === companyFilter)?.name;
              return name ? (
                <span className="group flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-sm font-medium bg-white/[0.08] text-[#ccc] border border-[#2a2a2a]">
                  <Building2 size={13} className="text-[#666]" />
                  <span className="truncate max-w-[160px]">{name}</span>
                  <button
                    onClick={() => setCompanyFilter(null)}
                    className="p-0.5 rounded hover:bg-white/10 text-[#666] hover:text-[#b3b3b3] transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })()}
            {projectFilter && (() => {
              const p = projects.find((p) => p.id === projectFilter);
              return p ? (
                <span className="group flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-sm font-medium bg-white/[0.08] text-[#ccc] border border-[#2a2a2a]">
                  <LayoutGrid size={13} className="text-[#666]" />
                  <span className="truncate max-w-[160px]">{p.title}</span>
                  <button
                    onClick={() => setProjectFilter(null)}
                    className="p-0.5 rounded hover:bg-white/10 text-[#666] hover:text-[#b3b3b3] transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })()}
            {roleFilter && (() => {
              const name = roles.find((r) => r.id === roleFilter)?.name;
              return name ? (
                <span className="group flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-sm font-medium bg-white/[0.08] text-[#ccc] border border-[#2a2a2a]">
                  <Tag size={13} className="text-[#666]" />
                  <span className="truncate max-w-[160px]">{name}</span>
                  <button
                    onClick={() => setRoleFilter(null)}
                    className="p-0.5 rounded hover:bg-white/10 text-[#666] hover:text-[#b3b3b3] transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })()}
          </div>
        )}

        {/* Fields + Auto-fit (right side) */}
        <div className="ml-auto flex items-center gap-1">
          <div ref={fieldsRef} className="relative">
            <button
              onClick={() => setFieldsOpen(!fieldsOpen)}
              className={`flex items-center gap-1.5 px-[15px] py-[7px] text-sm font-medium rounded-lg transition-colors whitespace-nowrap border ${
                fieldsModified
                  ? 'bg-accent/10 text-accent border-accent/25'
                  : 'text-[#666] hover:text-[#b3b3b3] hover:bg-white/5 border-transparent'
              }`}
            >
              <SlidersHorizontal size={14} strokeWidth={1.75} />
              Fields
              {fieldsModified && (
                <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent leading-none">
                  {visibleCols.size}
                </span>
              )}
            </button>
            {fieldsOpen && (
              <FieldsPickerPanel
                visibleCols={visibleCols}
                onToggle={toggleCol}
                onShowAll={() => setVisibleCols(new Set(CONTACT_COLUMNS.map((c) => c.key)))}
                onHideAll={() => setVisibleCols(new Set())}
              />
            )}
          </div>
          <button
            onClick={() => setColWidths({})}
            className={`flex items-center gap-1.5 px-[15px] py-[7px] text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              Object.keys(colWidths).length > 0
                ? 'bg-accent/10 text-accent'
                : 'text-[#666] hover:text-[#b3b3b3] hover:bg-white/5'
            }`}
            title="Reset all column widths to auto-fit"
          >
            <Columns size={14} strokeWidth={1.75} />
            Auto-fit
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 relative">
        {/* Cover scrollbar behind sticky header */}
        <div className="absolute top-0 right-0 w-3 h-[41px] bg-[#141414] z-20 pointer-events-none border-b border-[#2a2a2a]" />
      <div ref={tableRef} className="h-full overflow-y-auto admin-scrollbar">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#404044] text-sm">
            {contacts.length === 0 ? 'No people yet.' : 'No matching people.'}
          </div>
        ) : isCastView ? (
          /* Cast gallery view */
          <div className="px-8 py-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`group cursor-pointer rounded-xl overflow-hidden border transition-colors ${
                  activeId === c.id ? 'border-white/20' : 'border-[#2a2a2a] hover:border-white/15'
                }`}
              >
                <div className="aspect-[3/4] bg-white/[0.03] flex items-center justify-center">
                  {c.headshot_url ? (
                    <img src={c.headshot_url} alt={contactFullName(c)} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-[#202022]" />
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-sm font-medium text-foreground truncate">{contactFullName(c)}</p>
                  <p className="text-xs text-[#515155] truncate">{c.role || 'Cast'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table view */
          <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
            <thead className="sticky top-0 z-10">
              <tr className="text-xs text-[#616166] uppercase tracking-wider">
                {/* First Name column */}
                <th
                  className="text-left px-8 py-3 font-medium bg-[#141414] border-b border-r border-[#2a2a2a] select-none cursor-pointer group/th hover:text-[#999] transition-colors"
                  onClick={() => handleSort('first_name')}
                >
                  <span className="inline-flex items-center gap-1">
                    First Name
                    <span className="inline-flex text-[#333]">
                      {sortKey === 'first_name' ? (
                        sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                      ) : (
                        <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      )}
                    </span>
                  </span>
                </th>
                {/* Last Name column */}
                <th
                  className="text-left px-3 py-3 font-medium bg-[#141414] border-b border-r border-[#2a2a2a] select-none cursor-pointer group/th hover:text-[#999] transition-colors"
                  onClick={() => handleSort('last_name')}
                >
                  <span className="inline-flex items-center gap-1">
                    Last Name
                    <span className="inline-flex text-[#333]">
                      {sortKey === 'last_name' ? (
                        sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                      ) : (
                        <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      )}
                    </span>
                  </span>
                </th>
                {orderedVisibleCols.map((col, idx) => {
                  const nextCol = idx < orderedVisibleCols.length - 1 ? orderedVisibleCols[idx + 1] : null;
                  const isLast = idx === orderedVisibleCols.length - 1;
                  const isDragOver = dragOverColKey === col.key;
                  const style = colWidths[col.key]
                    ? { width: colWidths[col.key], minWidth: colWidths[col.key], maxWidth: colWidths[col.key] }
                    : undefined;
                  const isSortable = !!col.sortValue;

                  return (
                    <th
                      key={col.key}
                      className={`${col.align === 'right' ? 'text-right px-8' : 'text-left px-3'} py-3 font-medium bg-[#141414] border-b ${isLast ? '' : 'border-r'} border-[#2a2a2a] select-none whitespace-nowrap relative overflow-hidden group ${isDragOver ? 'border-l-2 border-l-accent' : ''} ${isSortable ? 'cursor-pointer group/th hover:text-[#999] transition-colors' : ''}`}
                      style={style}
                      onClick={isSortable ? () => handleSort(col.key) : undefined}
                      onDragOver={(e) => handleColDragOver(e, col.key)}
                      onDrop={(e) => handleColDrop(e, col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        <span
                          draggable
                          onDragStart={(e) => { e.stopPropagation(); handleColDragStart(e, col.key); }}
                          onDragEnd={handleColDragEnd}
                          className="opacity-0 group-hover:opacity-30 cursor-grab flex-shrink-0 -ml-1"
                        >
                          <GripVertical size={10} />
                        </span>
                        {col.label}
                        {isSortable && (
                          <span className="inline-flex text-[#333]">
                            {sortKey === col.key ? (
                              sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                            ) : (
                              <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />
                            )}
                          </span>
                        )}
                      </span>
                      <span
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const th = e.currentTarget.closest('th')!;
                          const nextTh = th.nextElementSibling as HTMLElement | null;
                          handleColResize(
                            col.key,
                            nextCol?.key ?? null,
                            e.clientX,
                            th.getBoundingClientRect().width,
                            nextTh ? nextTh.getBoundingClientRect().width : 0,
                          );
                        }}
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/20 transition-colors z-10"
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`border-b border-[#2a2a2a] cursor-pointer transition-colors ${
                    activeId === c.id ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <td className="px-8 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2.5">
                      {c.headshot_url ? (
                        <img src={c.headshot_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className={`w-7 h-7 rounded-full ${TYPE_CIRCLE_BG[c.type]} flex items-center justify-center flex-shrink-0`}>
                          <User size={14} className={TYPE_ICON_COLORS[c.type]} />
                        </div>
                      )}
                      {c.first_name}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-foreground">{c.last_name}</td>
                  {orderedVisibleCols.map((col) => (
                    <td
                      key={col.key}
                      className={`${col.align === 'right' ? 'px-8 text-right text-[#515155] text-xs' : 'px-3 text-muted-foreground'} py-3`}
                      style={colWidths[col.key] ? { width: colWidths[col.key], minWidth: colWidths[col.key], maxWidth: colWidths[col.key] } : undefined}
                    >
                      {col.render(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>

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
