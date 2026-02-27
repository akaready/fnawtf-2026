'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import {
  Plus, Trash2, Save, Check, Loader2, Download, X,
  Mail, Phone, Building2, Briefcase, StickyNote, Image as ImageIcon,
  Wrench, Sparkles, Contact, Star, HeartHandshake, Users,
} from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminTabBar } from './AdminTabBar';
import { PanelDrawer } from './PanelDrawer';
import { ProjectPanel } from './ProjectPanel';
import {
  createContact,
  updateContact,
  deleteContact,
  getAllRoles,
  getContactRoles,
  setContactRoles,
  getContactProjects,
  type ClientRow,
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
  all: 'text-white/40',
  crew: 'text-purple-400',
  cast: 'text-pink-400',
  contact: 'text-green-400',
  staff: 'text-yellow-400',
  partner: 'text-orange-400',
};

const TYPE_ACTIVE_CLASSES: Record<string, string> = {
  all: 'bg-white/10 text-white',
  crew: 'bg-purple-500/15 text-purple-300',
  cast: 'bg-pink-500/15 text-pink-300',
  contact: 'bg-green-500/15 text-green-300',
  staff: 'bg-yellow-500/15 text-yellow-300',
  partner: 'bg-orange-500/15 text-orange-300',
};

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
}

/* ── Person Panel ───────────────────────────────────────────────────────── */

function PersonPanel({
  person,
  open,
  onClose,
  companies,
  onSave,
  onDelete,
  saving,
}: {
  person: ContactRow | null;
  open: boolean;
  onClose: () => void;
  companies: ClientRow[];
  onSave: (row: ContactRow) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<ContactRow | null>(person);
  const [dirty, setDirty] = useState(false);
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saved'>('idle');
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [personRoleIds, setPersonRoleIds] = useState<Set<string>>(new Set());
  const [projects, setProjects] = useState<Array<{ id: string; title: string; client_name: string; thumbnail_url: string | null }>>([]);
  const [openProject, setOpenProject] = useState<{ id: string; title: string; thumbnail_url: string | null } | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);

  useEffect(() => {
    setDraft(person);
    setDirty(false);
    setSavedStatus('idle');
    setConfirmClose(false);
    setConfirmDelete(false);
    if (person) {
      setLoadingMeta(true);
      Promise.all([
        getAllRoles(),
        getContactRoles(person.id),
        getContactProjects(person.id),
      ]).then(([allRoles, contactRoles, contactProjects]) => {
        setRoles(allRoles);
        setPersonRoleIds(new Set(contactRoles.map((r) => r.id)));
        setProjects(contactProjects);
      }).finally(() => setLoadingMeta(false));
    } else {
      setRoles([]);
      setPersonRoleIds(new Set());
      setProjects([]);
    }
  }, [person]);

  if (!draft) return <PanelDrawer open={open} onClose={onClose} width="w-[520px]"><div /></PanelDrawer>;

  const handleChange = (field: string, value: unknown) => {
    setDraft((prev) => prev ? { ...prev, [field]: value } : prev);
    setDirty(true);
    if (savedStatus !== 'idle') setSavedStatus('idle');
  };

  const handleSave = () => {
    if (!draft) return;
    onSave(draft);
    setDirty(false);
    setSavedStatus('saved');
    setTimeout(() => setSavedStatus('idle'), 2000);
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
    setContactRoles(draft.id, [...next]);
  };

  const inputClass = 'w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20';

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[520px]">
      {/* Unsaved changes warning */}
      {confirmClose && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 mx-6 max-w-sm space-y-4 shadow-2xl">
            <p className="text-sm text-foreground font-medium">You have unsaved changes</p>
            <p className="text-xs text-muted-foreground">Closing will discard your edits. Save first or discard to continue.</p>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setConfirmClose(false)} className="px-4 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
                Keep editing
              </button>
              <button onClick={() => { setConfirmClose(false); setDirty(false); onClose(); }} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.12] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {draft.headshot_url ? (
            <img src={draft.headshot_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 text-muted-foreground/40">
              <ImageIcon size={16} />
            </div>
          )}
          <div className="min-w-0">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="bg-transparent text-lg font-semibold text-foreground placeholder:text-muted-foreground/30 focus:outline-none w-full"
              placeholder="Name"
            />
            <span className={`inline-flex px-2 py-0.5 text-xs rounded border capitalize ${TYPE_COLORS[draft.type]}`}>
              {draft.type}
            </span>
          </div>
        </div>
        <button onClick={handleClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors flex-shrink-0">
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-6 py-5 space-y-5">
        {/* Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <div className="flex gap-1.5 flex-wrap">
            {(['contact', 'crew', 'cast', 'staff', 'partner'] as ContactType[]).map((t) => (
              <button
                key={t}
                onClick={() => handleChange('type', t)}
                className={`px-3 py-1.5 text-xs rounded-lg border capitalize transition-colors ${
                  draft.type === t ? TYPE_COLORS[t] : 'border-white/10 text-muted-foreground/50 hover:text-foreground hover:border-white/20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
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

        {/* Title */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Briefcase size={12} /> Title
          </label>
          <input type="text" value={draft.role ?? ''} onChange={(e) => handleChange('role', e.target.value || null)} placeholder="CEO, Founder, Marketing Director..." className={inputClass} />
        </div>

        {/* Headshot URL */}
        {(draft.type === 'cast' || draft.type === 'crew') && (
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ImageIcon size={12} /> Headshot URL
            </label>
            <input type="url" value={draft.headshot_url ?? ''} onChange={(e) => handleChange('headshot_url', e.target.value || null)} placeholder="https://..." className={inputClass} />
          </div>
        )}

        {/* Production Roles (multi-select chips) */}
        {(draft.type === 'crew' || draft.type === 'cast') && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Production Roles</label>
            {loadingMeta ? (
              <p className="text-xs text-muted-foreground/40">Loading...</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => toggleRole(r.id)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                      personRoleIds.has(r.id)
                        ? 'bg-white/10 border-white/20 text-foreground'
                        : 'border-white/[0.06] text-muted-foreground/50 hover:text-foreground hover:border-white/15'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Linked Projects */}
        {projects.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Projects ({projects.length})</label>
            <div className="grid grid-cols-2 gap-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setOpenProject(p)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.04] transition-colors group text-left"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded overflow-hidden bg-white/[0.04]">
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/50 group-hover:text-white/70 truncate">{p.title}</p>
                    {p.client_name && (
                      <p className="text-xs text-white/25 truncate">{p.client_name}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

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
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.12] flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-40"
        >
          {savedStatus === 'saved' ? <Check size={14} className="text-green-600" /> : saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {savedStatus === 'saved' ? 'Saved' : 'Save'}
        </button>
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

      {/* Nested Project Panel */}
      <ProjectPanel
        project={openProject ? { id: openProject.id, title: openProject.title, thumbnail_url: openProject.thumbnail_url } : null}
        open={!!openProject}
        onClose={() => setOpenProject(null)}
        onProjectUpdated={() => {}}
        onProjectDeleted={() => {}}
        onProjectCreated={() => {}}
      />
    </PanelDrawer>
  );
}

/* ── Main People Page ───────────────────────────────────────────────────── */

export function ContactsManager({ initialContacts, companies }: Props) {
  const [contacts, setContacts] = useState(initialContacts);
  const [saving, startSave] = useTransition();
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContactType | 'all'>('all');

  useEffect(() => { setContacts(initialContacts); }, [initialContacts]);

  const filtered = useMemo(() => {
    let result = contacts;
    if (typeFilter !== 'all') result = result.filter((c) => c.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.role?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [contacts, search, typeFilter]);

  const activePerson = activeId ? contacts.find((c) => c.id === activeId) ?? null : null;

  const handleCreate = (type: ContactType = typeFilter === 'all' ? 'contact' : typeFilter) => {
    startSave(async () => {
      setCreating(true);
      const id = await createContact({ name: 'New Person', type });
      const newContact: ContactRow = {
        id,
        name: 'New Person',
        email: null,
        phone: null,
        role: null,
        company: null,
        client_id: null,
        notes: null,
        type,
        headshot_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setContacts((prev) => [...prev, newContact]);
      setActiveId(id);
      setCreating(false);
    });
  };

  const handleSave = (row: ContactRow) => {
    setContacts((prev) => prev.map((c) => (c.id === row.id ? row : c)));
    startSave(async () => {
      await updateContact(row.id, {
        name: row.name,
        email: row.email,
        phone: row.phone,
        role: row.role,
        company: row.company,
        client_id: row.client_id ?? null,
        notes: row.notes,
        type: row.type,
        headshot_url: row.headshot_url,
      });
    });
  };

  const handleDelete = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
    startSave(async () => { await deleteContact(id); });
  };

  const handleExportCsv = () => {
    const header = ['Name', 'Type', 'Email', 'Phone', 'Role', 'Company', 'Notes', 'Created'];
    const rows = filtered.map((c) => [
      c.name, c.type, c.email ?? '', c.phone ?? '', c.role ?? '', c.company ?? '', c.notes ?? '',
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
            badge: <span className="text-xs text-white/30 ml-0.5">{typeCounts[t] ?? 0}</span>,
            activeClassName: TYPE_ACTIVE_CLASSES[t],
          };
        })}
        activeTab={typeFilter}
        onTabChange={(v) => setTypeFilter(v as ContactType | 'all')}
        dividerAfter="all"
      />

      {/* Content area */}
      <div className="flex-1 min-h-0 relative">
        {/* Cover scrollbar behind sticky header */}
        <div className="absolute top-0 right-0 w-3 h-[41px] bg-[#141414] z-20 pointer-events-none border-b border-[#1f1f1f]" />
      <div className="h-full overflow-y-auto admin-scrollbar">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground/40 text-sm">
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
                  activeId === c.id ? 'border-white/20' : 'border-white/[0.06] hover:border-white/15'
                }`}
              >
                <div className="aspect-[3/4] bg-white/[0.03] flex items-center justify-center">
                  {c.headshot_url ? (
                    <img src={c.headshot_url} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-muted-foreground/20" />
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground/50 truncate">{c.role || 'Cast'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table view */
          <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
            <thead className="sticky top-0 z-10">
              <tr className="text-xs text-muted-foreground/60 uppercase tracking-wider">
                <th className="text-left px-8 py-3 font-medium bg-[#141414] border-b border-r border-[#1f1f1f]">Name</th>
                <th className="text-left px-3 py-3 font-medium bg-[#141414] border-b border-r border-[#1f1f1f]">Type</th>
                <th className="text-left px-3 py-3 font-medium bg-[#141414] border-b border-r border-[#1f1f1f]">Email</th>
                <th className="text-left px-3 py-3 font-medium bg-[#141414] border-b border-r border-[#1f1f1f]">Company</th>
                <th className="text-left px-3 py-3 font-medium bg-[#141414] border-b border-r border-[#1f1f1f]">Title</th>
                <th className="text-right px-8 py-3 font-medium bg-[#141414] border-b border-[#1f1f1f]">Added</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`border-b border-white/[0.04] cursor-pointer transition-colors ${
                    activeId === c.id ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <td className="px-8 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs rounded border capitalize ${TYPE_COLORS[c.type]}`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{c.email || '—'}</td>
                  <td className="px-3 py-3 text-muted-foreground">{c.company || '—'}</td>
                  <td className="px-3 py-3 text-muted-foreground">{c.role || '—'}</td>
                  <td className="px-8 py-3 text-right text-muted-foreground/50 text-xs">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
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
        saving={saving}
      />
    </div>
  );
}
