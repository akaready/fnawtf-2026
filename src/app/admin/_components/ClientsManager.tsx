'use client';

import { useState, useTransition, useCallback, useMemo } from 'react';
import { Plus, Trash2, Save, Check, Loader2, Upload, Film, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  type ClientRow,
  createClientRecord,
  updateClientRecord,
  deleteClientRecord,
  updateTestimonial,
} from '../actions';

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

interface Props {
  initialClients: ClientRow[];
  projects: ClientProject[];
  testimonials: ClientTestimonial[];
}

export function ClientsManager({ initialClients, projects, testimonials: initialTestimonials }: Props) {
  const [clients, setClients] = useState(initialClients);
  const [localTestimonials, setLocalTestimonials] = useState(initialTestimonials);
  const [saving, startSave] = useTransition();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [expandedTestimonialId, setExpandedTestimonialId] = useState<string | null>(null);
  const [savingTestimonialId, setSavingTestimonialId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleTestimonialChange = (id: string, field: string, value: string | null) => {
    setLocalTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
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

  const handleChange = (id: string, field: string, value: unknown) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSave = (row: ClientRow) => {
    startSave(async () => {
      await updateClientRecord(row.id, {
        name: row.name,
        company: row.company,
        notes: row.notes,
        logo_url: row.logo_url,
      });
      setSavedId(row.id);
      setTimeout(() => setSavedId(null), 2000);
    });
  };

  const handleCreate = () => {
    startSave(async () => {
      setCreating(true);
      const id = await createClientRecord({
        name: 'New Client',
        email: '',
      });
      setClients((prev) => [
        ...prev,
        {
          id,
          name: 'New Client',
          company: null,
          email: '',
          notes: null,
          logo_url: null,
          created_at: new Date().toISOString(),
        },
      ]);
      setCreating(false);
    });
  };

  const handleDelete = (id: string) => {
    startSave(async () => {
      await deleteClientRecord(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
    });
  };

  const handleLogoDrop = useCallback(async (clientId: string, file: File) => {
    setUploadingId(clientId);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `${clientId}.${ext}`;

      // Upload (upsert) to logos bucket
      const { error } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(path);

      // Update local state and save
      handleChange(clientId, 'logo_url', publicUrl);
      await updateClientRecord(clientId, { logo_url: publicUrl });
      setSavedId(clientId);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      console.error('Logo upload failed:', err);
    } finally {
      setUploadingId(null);
    }
  }, []);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (c.notes?.toLowerCase().includes(q)) return true;
      if (projects.some((p) => p.client_id === c.id && p.title.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [clients, search, projects]);

  const handleExportCsv = useCallback(() => {
    const header = ['Name', 'Notes', 'Logo URL', 'Projects', 'Testimonials', 'Created'];
    const rows = filteredClients.map((c) => {
      const cProjects = projects.filter((p) => p.client_id === c.id).map((p) => p.title).join('; ');
      const cTestimonials = localTestimonials.filter((t) => t.client_id === c.id).map((t) => t.person_name ?? 'Unknown').join('; ');
      return [c.name, c.notes ?? '', c.logo_url ?? '', cProjects, cTestimonials, new Date(c.created_at).toLocaleDateString()];
    });
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredClients, projects, localTestimonials]);

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Clients"
        subtitle={`${clients.length} total — Manage client records and logos.`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search clients…"
        actions={
          <>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#1f1f1f] bg-black text-sm text-muted-foreground hover:text-foreground hover:border-[#333] hover:bg-white/5 transition-colors"
              title="Export filtered list as CSV"
            >
              <Download size={14} />
              CSV
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg border border-white hover:bg-black hover:text-white transition-colors"
            >
              <Plus size={16} />
              Add Client
            </button>
          </>
        }
      />

      {/* Scrollable cards area */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 pt-4 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredClients.map((c) => {
          const clientProjects = projects.filter((p) => p.client_id === c.id);
          const seen = new Set<string>();
          const clientTestimonials = localTestimonials.filter((t) => {
            if (t.client_id !== c.id) return false;
            if (seen.has(t.quote)) return false;
            seen.add(t.quote);
            return true;
          });
          const hasLinks = clientProjects.length > 0 || clientTestimonials.length > 0;

          return (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`rounded-xl p-6 space-y-4 transition-colors cursor-pointer ${
                activeId === c.id
                  ? 'border border-white/20 bg-[#151515]'
                  : 'border border-border/40 bg-[#111]'
              }`}
            >
              {/* Name + Logo row */}
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => handleChange(c.id, 'name', e.target.value)}
                  placeholder="Client name"
                  className="flex-1 bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground/30 focus:outline-none border-b border-transparent focus:border-white/20 pb-1"
                />
                <LogoDropzone
                  logoUrl={c.logo_url}
                  uploading={uploadingId === c.id}
                  onDrop={(file) => handleLogoDrop(c.id, file)}
                />
              </div>

              {/* Notes — full width underneath */}
              <textarea
                value={c.notes ?? ''}
                onChange={(e) => handleChange(c.id, 'notes', e.target.value || null)}
                placeholder="Notes…"
                rows={2}
                className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-muted-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
              />

              {/* Connected projects — full width */}
              {clientProjects.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/40 font-medium">Projects</p>
                  <div className="space-y-1.5">
                    {clientProjects.map((p) => (
                      <Link
                        key={p.id}
                        href={`/admin/projects/${p.id}`}
                        className="flex items-center gap-2.5 rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 transition-colors group w-full"
                      >
                        {p.thumbnail_url ? (
                          <img src={p.thumbnail_url} alt="" className="w-14 h-9 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-14 h-9 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                            <Film size={14} className="text-muted-foreground/30" />
                          </div>
                        )}
                        <span className="text-sm text-muted-foreground group-hover:text-foreground truncate">
                          {p.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected testimonials — inline editable */}
              {clientTestimonials.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/40 font-medium">Testimonials</p>
                  <div className="space-y-2">
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
                                <p className="text-[10px] text-muted-foreground/40 mt-0.5">— {t.person_name}{t.person_title ? `, ${t.person_title}` : ''}</p>
                              )}
                            </div>
                            {isExpanded ? <ChevronUp size={12} className="text-muted-foreground/30 flex-shrink-0" /> : <ChevronDown size={12} className="text-muted-foreground/30 flex-shrink-0" />}
                          </button>
                          {isExpanded && (
                            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/20">
                              <textarea
                                value={t.quote}
                                onChange={(e) => {
                                  handleTestimonialChange(t.id, 'quote', e.target.value);
                                  e.target.style.height = 'auto';
                                  e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none overflow-hidden"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={t.person_name ?? ''}
                                  onChange={(e) => handleTestimonialChange(t.id, 'person_name', e.target.value || null)}
                                  placeholder="Person name"
                                  className="rounded-lg border border-border/40 bg-black/50 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                                />
                                <input
                                  type="text"
                                  value={t.person_title ?? ''}
                                  onChange={(e) => handleTestimonialChange(t.id, 'person_title', e.target.value || null)}
                                  placeholder="Title / role"
                                  className="rounded-lg border border-border/40 bg-black/50 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                                />
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleTestimonialSave(t)}
                                  disabled={savingTestimonialId === t.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  {savedId === t.id ? (
                                    <Check size={10} className="text-green-400" />
                                  ) : savingTestimonialId === t.id ? (
                                    <Loader2 size={10} className="animate-spin" />
                                  ) : (
                                    <Save size={10} />
                                  )}
                                  {savedId === t.id ? 'Saved' : 'Save'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border/20">
                <span className="text-xs text-muted-foreground/40">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => !hasLinks && setConfirmDeleteId(c.id)}
                    disabled={hasLinks}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      hasLinks
                        ? 'text-muted-foreground/20 cursor-not-allowed'
                        : 'text-red-400/60 hover:text-red-400 hover:bg-red-500/10'
                    }`}
                    title={hasLinks ? 'Unlink projects and testimonials to delete' : 'Delete client'}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => handleSave(c)}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {savedId === c.id ? (
                      <Check size={14} className="text-green-400" />
                    ) : saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    {savedId === c.id ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12 text-muted-foreground/40 text-sm">
          No clients yet. Click &quot;Add Client&quot; to create one.
        </div>
      )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-border/40 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-medium text-base">Delete client?</h3>
            <p className="text-sm text-muted-foreground">Projects and testimonials linked to this client will have their client reference cleared.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-5 py-2.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
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
      className={`w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer transition-colors border-2 border-dashed ${
        dragOver
          ? 'border-white/40 bg-white/10'
          : logoUrl
          ? 'border-transparent bg-white/5'
          : 'border-border/40 bg-white/[0.02] hover:border-white/20'
      }`}
      title="Drop logo or click to upload"
    >
      {uploading ? (
        <Loader2 size={18} className="animate-spin text-muted-foreground/50" />
      ) : logoUrl ? (
        <img src={logoUrl} alt="" className="w-full h-full object-contain p-1" />
      ) : (
        <Upload size={18} className="text-muted-foreground/30" />
      )}
    </div>
  );
}
