'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  Plus, Trash2, Save, Check, Loader2, Download,
  Hammer, Rocket, TrendingUp, Globe, ArrowUpDown, Tag, FileText, Layers, Megaphone,
} from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import {
  type ContentSnippetRow,
  createContentSnippet,
  updateContentSnippet,
  deleteContentSnippet,
} from '../actions';
import type { SnippetType, SnippetCategory } from '@/types/proposal';

interface Props {
  initialSnippets: ContentSnippetRow[];
}

const SNIPPET_TYPES: { value: SnippetType; label: string; icon: typeof Hammer }[] = [
  { value: 'build', label: 'Build', icon: Hammer },
  { value: 'launch', label: 'Launch', icon: Rocket },
  { value: 'scale', label: 'Scale', icon: TrendingUp },
  { value: 'build-launch', label: 'Build + Launch', icon: Layers },
  { value: 'fundraising', label: 'Fundraising', icon: Megaphone },
  { value: 'general', label: 'General', icon: Globe },
];

const SNIPPET_CATEGORIES: { value: SnippetCategory; label: string }[] = [
  { value: 'intro', label: 'Introduction' },
  { value: 'process', label: 'Process' },
  { value: 'deliverables', label: 'Deliverables' },
  { value: 'team', label: 'Team' },
  { value: 'closing', label: 'Closing' },
  { value: 'custom', label: 'Custom' },
];

export function ContentSnippetsManager({ initialSnippets }: Props) {
  const [snippets, setSnippets] = useState(initialSnippets);
  const [saving, startSave] = useTransition();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<SnippetType | 'all'>('all');

  const handleChange = (id: string, field: string, value: unknown) => {
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = (row: ContentSnippetRow) => {
    startSave(async () => {
      await updateContentSnippet(row.id, {
        title: row.title,
        body: row.body,
        snippet_type: row.snippet_type,
        category: row.category,
        sort_order: row.sort_order,
      });
      setSavedId(row.id);
      setTimeout(() => setSavedId(null), 2000);
    });
  };

  const handleCreate = () => {
    startSave(async () => {
      setCreating(true);
      const id = await createContentSnippet({
        title: 'New Snippet',
        body: '',
        snippet_type: filterType === 'all' ? 'general' : filterType,
        category: 'custom',
        sort_order: snippets.length,
      });
      setSnippets((prev) => [
        ...prev,
        {
          id,
          title: 'New Snippet',
          body: '',
          snippet_type: (filterType === 'all' ? 'general' : filterType) as SnippetType,
          category: 'custom' as SnippetCategory,
          sort_order: snippets.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      setActiveId(id);
      setCreating(false);
    });
  };

  const handleDelete = (id: string) => {
    startSave(async () => {
      await deleteContentSnippet(id);
      setSnippets((prev) => prev.filter((s) => s.id !== id));
      setConfirmDeleteId(null);
    });
  };

  const filteredSnippets = useMemo(() => {
    let result = snippets;
    if (filterType !== 'all') {
      result = result.filter((s) => s.snippet_type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.body.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [snippets, search, filterType]);

  // Group by snippet_type for display
  const grouped = useMemo(() => {
    const groups: Record<string, ContentSnippetRow[]> = {};
    for (const s of filteredSnippets) {
      const key = s.snippet_type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return groups;
  }, [filteredSnippets]);

  const handleExportCsv = () => {
    const header = ['Title', 'Body', 'Type', 'Category', 'Order'];
    const rows = filteredSnippets.map((s) => [s.title, s.body, s.snippet_type, s.category, s.sort_order]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-snippets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Content Library"
        subtitle={`${snippets.length} snippet${snippets.length !== 1 ? 's' : ''} — Pre-written content blocks for proposals.`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search snippets…"
        actions={
          <>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#1f1f1f] bg-black text-sm text-muted-foreground hover:text-foreground hover:border-[#333] hover:bg-white/5 transition-colors"
              title="Export as CSV"
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
              Add Snippet
            </button>
          </>
        }
        below={
          <div className="flex items-center gap-1 bg-[#111] rounded-lg p-1 border border-white/[0.08] w-fit">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterType === 'all' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {SNIPPET_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setFilterType(t.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filterType === t.value ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 pt-4 pb-8">
        {Object.entries(grouped).length === 0 && (
          <div className="text-center py-12 text-muted-foreground/40 text-sm">
            No snippets yet. Click &quot;Add Snippet&quot; to create one.
          </div>
        )}

        {SNIPPET_TYPES.filter((t) => grouped[t.value]).map((type) => {
          const TypeIcon = type.icon;
          return (
            <div key={type.value} className="mb-8">
              {/* Group header */}
              {filterType === 'all' && (
                <div className="flex items-center gap-2.5 mb-3 px-1">
                  <TypeIcon size={14} className="text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {type.label}
                  </span>
                  <span className="text-xs text-muted-foreground/40">
                    {grouped[type.value].length}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {grouped[type.value].map((s) => {
                  const isActive = activeId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setActiveId(s.id)}
                      className={`rounded-xl p-5 space-y-4 transition-colors cursor-pointer ${
                        isActive
                          ? 'border border-white/20 bg-[#151515]'
                          : 'border border-border/40 bg-[#111]'
                      }`}
                    >
                      {/* Title */}
                      <input
                        type="text"
                        value={s.title}
                        onChange={(e) => handleChange(s.id, 'title', e.target.value)}
                        placeholder="Snippet title…"
                        className="w-full text-base font-medium bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/30 focus:ring-0"
                      />

                      {/* Body */}
                      <textarea
                        value={s.body}
                        onChange={(e) => {
                          handleChange(s.id, 'body', e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                        placeholder="Snippet content…"
                        className="w-full rounded-lg border border-border/40 bg-black/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none overflow-hidden"
                      />

                      {/* Metadata row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <FileText size={12} /> Type
                          </label>
                          <select
                            value={s.snippet_type}
                            onChange={(e) => handleChange(s.id, 'snippet_type', e.target.value)}
                            className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-white/20"
                          >
                            {SNIPPET_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Tag size={12} /> Category
                          </label>
                          <select
                            value={s.category}
                            onChange={(e) => handleChange(s.id, 'category', e.target.value)}
                            className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-white/20"
                          >
                            {SNIPPET_CATEGORIES.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <ArrowUpDown size={12} /> Order
                          </label>
                          <input
                            type="number"
                            value={s.sort_order}
                            onChange={(e) => handleChange(s.id, 'sort_order', parseInt(e.target.value) || 0)}
                            className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-white/20"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/20">
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(s.id); }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSave(s); }}
                          disabled={saving}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {saving && savedId !== s.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : savedId === s.id ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Save size={14} />
                          )}
                          {savedId === s.id ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-border/40 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-medium">Delete snippet?</h3>
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
