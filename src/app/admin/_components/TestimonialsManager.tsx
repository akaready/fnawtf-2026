'use client';

import { useState, useTransition, useMemo } from 'react';
import { Plus, Trash2, Save, Check, Loader2, LayoutGrid, User, Building2, Briefcase, ArrowUpDown, PenLine, Download } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import {
  type TestimonialRow,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../actions';

interface Props {
  initialTestimonials: TestimonialRow[];
  clients: { id: string; name: string; logo_url: string | null }[];
  projects: { id: string; title: string; client_id?: string | null }[];
}

export function TestimonialsManager({ initialTestimonials, clients, projects }: Props) {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [saving, startSave] = useTransition();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleChange = (id: string, field: string, value: unknown) => {
    setTestimonials((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, [field]: value };
        // When client changes, clear project if it doesn't belong to the new client
        if (field === 'client_id' && updated.project_id) {
          const proj = projects.find((p) => p.id === updated.project_id);
          if (proj && value && proj.client_id !== value) {
            updated.project_id = null;
          }
        }
        return updated;
      })
    );
  };

  const handleSave = (row: TestimonialRow) => {
    startSave(async () => {
      await updateTestimonial(row.id, {
        quote: row.quote,
        person_name: row.person_name,
        person_title: row.person_title,
        display_title: row.display_title,
        company: row.company,
        profile_picture_url: row.profile_picture_url,
        project_id: row.project_id,
        client_id: row.client_id,
        display_order: row.display_order,
      });
      setSavedId(row.id);
      setTimeout(() => setSavedId(null), 2000);
    });
  };

  const handleCreate = () => {
    startSave(async () => {
      setCreating(true);
      const id = await createTestimonial({
        quote: 'New testimonial…',
        display_order: testimonials.length,
      });
      setTestimonials((prev) => [
        ...prev,
        {
          id,
          quote: 'New testimonial…',
          person_name: null,
          person_title: null,
          display_title: null,
          company: null,
          profile_picture_url: null,
          project_id: null,
          client_id: null,
          display_order: testimonials.length,
          created_at: new Date().toISOString(),
        },
      ]);
      setCreating(false);
    });
  };

  const handleDelete = (id: string) => {
    startSave(async () => {
      await deleteTestimonial(id);
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      setConfirmDeleteId(null);
    });
  };

  const filteredTestimonials = useMemo(() => {
    if (!search.trim()) return testimonials;
    const q = search.toLowerCase();
    return testimonials.filter((t) => {
      if (t.quote.toLowerCase().includes(q)) return true;
      if (t.person_name?.toLowerCase().includes(q)) return true;
      if (t.person_title?.toLowerCase().includes(q)) return true;
      if (t.company?.toLowerCase().includes(q)) return true;
      // Match by client name
      if (t.client_id) {
        const client = clients.find((c) => c.id === t.client_id);
        if (client?.name.toLowerCase().includes(q)) return true;
      }
      // Match by project title
      if (t.project_id) {
        const project = projects.find((p) => p.id === t.project_id);
        if (project?.title.toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [testimonials, search, clients, projects]);

  const handleExportCsv = () => {
    const header = ['Quote', 'Person Name', 'Person Title', 'Display Title', 'Company', 'Client', 'Project', 'Order', 'Created'];
    const rows = filteredTestimonials.map((t) => {
      const clientName = t.client_id ? clients.find((c) => c.id === t.client_id)?.name ?? '' : '';
      const projectTitle = t.project_id ? projects.find((p) => p.id === t.project_id)?.title ?? '' : '';
      return [t.quote, t.person_name ?? '', t.person_title ?? '', t.display_title ?? '', t.company ?? '', clientName, projectTitle, t.display_order, new Date(t.created_at).toLocaleDateString()];
    });
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `testimonials-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Testimonials"
        subtitle={`${testimonials.length} total — Manage client quotes displayed on the site.`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search testimonials…"
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
              Add Testimonial
            </button>
          </>
        }
      />

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 pt-4 pb-8">
      <div className="space-y-4">
      {filteredTestimonials.map((t) => {
        const isUnattached = !t.client_id && !t.project_id;
        const borderColor = isUnattached ? 'border-red-500/30' : 'border-border/40';

        // Filter projects by selected client — only show projects that match
        const filteredProjects = t.client_id
          ? projects.filter((p) => p.client_id === t.client_id)
          : projects;

        const isActive = activeId === t.id;

        return (
          <div
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`rounded-xl p-6 space-y-5 transition-colors cursor-pointer ${
              isActive
                ? `border border-white/20 bg-[#151515] ${isUnattached ? 'border-red-500/30' : ''}`
                : `border ${borderColor} bg-[#111]`
            }`}
          >
            {isUnattached && (
              <div className="text-[11px] text-red-400/70 bg-red-500/5 rounded-lg px-3 py-1.5 -mt-1">
                Not linked to a client or project
              </div>
            )}

            {/* Quote textarea — no label, just the textarea */}
            <textarea
              value={t.quote}
              onChange={(e) => {
                handleChange(t.id, 'quote', e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
              placeholder="Quote text…"
              className="w-full rounded-lg border border-border/40 bg-black/50 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none overflow-hidden"
            />

            {/* Attribution row — all with icons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <User size={12} /> Person Name
                </label>
                <input
                  type="text"
                  value={t.person_name ?? ''}
                  onChange={(e) => handleChange(t.id, 'person_name', e.target.value || null)}
                  placeholder="Jane Smith"
                  className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Briefcase size={12} /> Person Title
                </label>
                <input
                  type="text"
                  value={t.person_title ?? ''}
                  onChange={(e) => handleChange(t.id, 'person_title', e.target.value || null)}
                  placeholder="VP of Marketing"
                  className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <PenLine size={12} /> Display Override
                </label>
                <input
                  type="text"
                  value={t.display_title ?? ''}
                  onChange={(e) => handleChange(t.id, 'display_title', e.target.value || null)}
                  placeholder="Optional override"
                  className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
            </div>

            {/* Relations row — all with icons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Building2 size={12} /> Client
                </label>
                <select
                  value={t.client_id ?? ''}
                  onChange={(e) => handleChange(t.id, 'client_id', e.target.value || null)}
                  className={`w-full rounded-lg border ${!t.client_id ? 'border-red-500/30' : 'border-border/40'} bg-black/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-white/20`}
                >
                  <option value="">No client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <LayoutGrid size={12} /> Project
                </label>
                <select
                  value={t.project_id ?? ''}
                  onChange={(e) => handleChange(t.id, 'project_id', e.target.value || null)}
                  className={`w-full rounded-lg border ${!t.project_id ? 'border-red-500/30' : 'border-border/40'} bg-black/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-white/20`}
                >
                  <option value="">No project</option>
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <ArrowUpDown size={12} /> Order
                </label>
                <input
                  type="number"
                  value={t.display_order}
                  onChange={(e) => handleChange(t.id, 'display_order', parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/20">
              <button
                onClick={() => setConfirmDeleteId(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
              <button
                onClick={() => handleSave(t)}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving && savedId !== t.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : savedId === t.id ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Save size={14} />
                )}
                {savedId === t.id ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        );
      })}

      {testimonials.length === 0 && (
        <div className="text-center py-12 text-muted-foreground/40 text-sm">
          No testimonials yet. Click &quot;Add Testimonial&quot; to create one.
        </div>
      )}
      </div>
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-border/40 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-medium">Delete testimonial?</h3>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
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
