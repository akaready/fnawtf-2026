'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { useSaveState } from '@/app/admin/_hooks/useSaveState';
import { SaveButton } from './SaveButton';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import type { LucideIcon } from 'lucide-react';
import {
  Plus, Trash2, Check, X, Download, ChevronDown,
  Pencil, Bold, Heading1, Heading2, Heading3, List, ListOrdered, Link2, ExternalLink,
  FolderOpen, Maximize2, Minimize2,
} from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import {
  type ContentSnippetRow,
  createContentSnippet,
  updateContentSnippet,
  deleteContentSnippet,
} from '../actions';
import type { SnippetCategory } from '@/types/proposal';

interface Props {
  initialSnippets: ContentSnippetRow[];
}

const MIN_LEFT = 130;
const MAX_LEFT = 300;
const MIN_MID  = 200;
const MAX_MID  = 480;

const stripMd = (s: string) => s.replace(/[*_`#>]/g, '').replace(/\n/g, ' ').trim();

const SEL = 'bg-[#1c1c1c]';
const HOV = 'hover:bg-[#141414]';

// ── Snippet WYSIWYG Editor ─────────────────────────────────────────────────

function SnippetEditor({
  body,
  onChange,
}: {
  body: string;
  onChange: (md: string) => void;
}) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl]             = useState('');
  const linkInputRef                      = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TiptapLink.configure({ openOnClick: false }),
      Markdown.configure({ html: false, tightLists: true, transformPastedText: true }),
    ],
    content: body,
    onUpdate({ editor }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange((editor.storage as any).markdown.getMarkdown());
    },
    onSelectionUpdate({ editor }) {
      // Skip if the URL input already has focus — user is typing
      if (document.activeElement === linkInputRef.current) return;
      if (editor.isActive('link')) {
        setLinkUrl(editor.getAttributes('link').href ?? '');
        setShowLinkInput(true);
      } else {
        setShowLinkInput(false);
        setLinkUrl('');
      }
    },
    editorProps: {
      attributes: { class: 'outline-none min-h-[200px] prose-snippet' },
    },
  });

  // Open URL bar for creating a new link (cursor not already on a link)
  const openLink = useCallback(() => {
    if (!editor) return;
    if (!editor.isActive('link')) {
      setLinkUrl('');
      setShowLinkInput(true);
    }
    setTimeout(() => linkInputRef.current?.focus(), 50);
  }, [editor]);

  // Apply the typed URL then let onSelectionUpdate manage visibility
  const applyLink = useCallback(() => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (url) editor.chain().focus().setLink({ href: url }).run();
    else     editor.chain().focus().unsetLink().run();
  }, [editor, linkUrl]);

  if (!editor) return null;

  const isLink = editor.isActive('link');

  const formatTools: { key: string; I: LucideIcon; lbl: string; fn: () => void; isActive: boolean }[] = [
    { key: 'bold', I: Bold,        lbl: 'Bold (⌘B)',     fn: () => editor.chain().focus().toggleBold().run(),               isActive: editor.isActive('bold') },
    { key: 'h1',   I: Heading1,    lbl: 'Heading 1',     fn: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor.isActive('heading', { level: 1 }) },
    { key: 'h2',   I: Heading2,    lbl: 'Heading 2',     fn: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive('heading', { level: 2 }) },
    { key: 'h3',   I: Heading3,    lbl: 'Heading 3',     fn: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: editor.isActive('heading', { level: 3 }) },
    { key: 'ul',   I: List,        lbl: 'Bullet list',   fn: () => editor.chain().focus().toggleBulletList().run(),          isActive: editor.isActive('bulletList') },
    { key: 'ol',   I: ListOrdered, lbl: 'Numbered list', fn: () => editor.chain().focus().toggleOrderedList().run(),         isActive: editor.isActive('orderedList') },
  ];

  return (
    <>
      {/* Toolbar — URL input lives inline here, no layout shift */}
      <div className="flex items-center gap-0.5 px-8 pt-3 pb-2 min-h-[36px]">
        {formatTools.map(({ key, I, lbl, fn, isActive }) => (
          <button
            key={key}
            onMouseDown={e => { e.preventDefault(); fn(); }}
            title={lbl}
            className={`p-1.5 rounded transition-colors flex-shrink-0 ${isActive ? 'text-foreground bg-white/[0.1]' : 'text-[#4d4d4d] hover:text-foreground hover:bg-white/[0.06]'}`}
          >
            <I size={14} />
          </button>
        ))}

        <span className="w-px h-3.5 bg-white/10 mx-1 flex-shrink-0" />

        {/* Link icon — toggles URL input inline */}
        <button
          onMouseDown={e => { e.preventDefault(); openLink(); }}
          title="Link (⌘⇧U)"
          className={`p-1.5 rounded transition-colors flex-shrink-0 ${isLink || showLinkInput ? 'text-foreground bg-white/[0.1]' : 'text-[#4d4d4d] hover:text-foreground hover:bg-white/[0.06]'}`}
        >
          <Link2 size={14} />
        </button>

        {/* Inline URL input — shown when on a link or creating one */}
        {showLinkInput && (
          <>
            <input
              ref={linkInputRef}
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter')  { e.preventDefault(); applyLink(); }
                if (e.key === 'Escape') { editor.chain().focus().run(); }
              }}
              placeholder="https://"
              className="flex-1 min-w-0 ml-1 bg-transparent text-sm text-[#b3b3b3] placeholder:text-[#333] outline-none"
            />
            {linkUrl && (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={-1}
                onMouseDown={e => e.preventDefault()}
                title="Open link"
                className="text-[#404040] hover:text-[#999] transition-colors p-1 flex-shrink-0"
              >
                <ExternalLink size={12} />
              </a>
            )}
            {isLink && (
              <button
                onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetLink().run(); }}
                title="Remove link"
                className="text-[#404040] hover:text-red-400 transition-colors p-1 flex-shrink-0"
              >
                <Trash2 size={12} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Editor — only ⌘⇧U is intercepted; all native OS shortcuts pass through */}
      <div
        className="px-8 py-3 min-h-[200px]"
        onKeyDown={e => {
          if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'u') {
            e.preventDefault();
            openLink();
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ContentSnippetsManager({ initialSnippets }: Props) {
  const [snippets, setSnippets]                 = useState(initialSnippets);
  const { saving, saved, wrap: wrapSave }        = useSaveState(2000);
  const [confirmDeleteId, setConfirmDeleteId]   = useState<string | null>(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null);
  const [creating, setCreating]                 = useState(false);
  const [activeId, setActiveId]                 = useState<string | null>(null);
  const [search, setSearch]                     = useState('');
  const [filterCat, setFilterCat]               = useState<string>('all');
  const [focusMode, setFocusMode]               = useState(false);

  // Category management
  const [editingCat, setEditingCat]       = useState<string | null>(null);
  const [editingCatVal, setEditingCatVal] = useState('');
  const [addingCat, setAddingCat]         = useState(false);
  const [newCatName, setNewCatName]       = useState('');

  const [catDropOpen, setCatDropOpen] = useState(false);

  // Column widths
  const [leftWidth, setLeftWidth] = useState(176);
  const [midWidth, setMidWidth]   = useState(288);

  // Autosave
  const autoSaveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snippetsRef    = useRef(initialSnippets);

  // ── Derived ──────────────────────────────────────────────────────────────

  const categories = useMemo(() =>
    Array.from(new Set(snippets.map(s => s.category).filter(Boolean))).sort(),
  [snippets]);

  const filtered = useMemo(() => {
    let r = snippets;
    if (filterCat !== 'all') r = r.filter(s => s.category === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(s => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q));
    }
    return r;
  }, [snippets, filterCat, search]);

  const active = useMemo(() => snippets.find(s => s.id === activeId) ?? null, [snippets, activeId]);

  // ── Core handlers ─────────────────────────────────────────────────────────

  const mutate = (id: string, field: string, value: unknown) => {
    setSnippets(prev => {
      const next = prev.map(s => s.id === id ? { ...s, [field]: value } : s);
      snippetsRef.current = next;
      return next;
    });
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      const row = snippetsRef.current.find(s => s.id === id);
      if (row) handleSave(row);
    }, 1000);
  };

  const handleSave = (row: ContentSnippetRow) => {
    wrapSave(async () => {
      await updateContentSnippet(row.id, { title: row.title, body: row.body, snippet_type: row.snippet_type, category: row.category, sort_order: row.sort_order });
    });
  };

  const handleCreate = (catOverride?: string) => {
    const cat = catOverride ?? (filterCat === 'all' ? 'general' : filterCat);
    void (async () => {
      setCreating(true);
      const id = await createContentSnippet({ title: 'New Snippet', body: '', snippet_type: 'general', category: cat, sort_order: snippets.length });
      setSnippets(prev => [...prev, { id, title: 'New Snippet', body: '', snippet_type: 'general', category: cat as SnippetCategory, sort_order: prev.length, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
      setActiveId(id);
      setFilterCat(cat);
      setCreating(false);
    })();
  };

  const handleDelete = (id: string) => {
    void (async () => {
      await deleteContentSnippet(id);
      setSnippets(prev => prev.filter(s => s.id !== id));
      setConfirmDeleteId(null);
      if (activeId === id) setActiveId(null);
    })();
  };

  // ── Category management ───────────────────────────────────────────────────

  const handleRename = (oldName: string, newName: string) => {
    setEditingCat(null);
    const n = newName.trim();
    if (!n || n === oldName) return;
    const affected = snippets.filter(s => s.category === oldName);
    setSnippets(prev => prev.map(s => s.category === oldName ? { ...s, category: n as SnippetCategory } : s));
    if (filterCat === oldName) setFilterCat(n);
    void Promise.all(affected.map(s => updateContentSnippet(s.id, { category: n })));
  };

  const handleDeleteCat = (cat: string) => {
    const fallback = categories.find(c => c !== cat) ?? 'general';
    const affected = snippets.filter(s => s.category === cat);
    setSnippets(prev => prev.map(s => s.category === cat ? { ...s, category: fallback as SnippetCategory } : s));
    if (filterCat === cat) setFilterCat('all');
    setConfirmDeleteCat(null);
    void Promise.all(affected.map(s => updateContentSnippet(s.id, { category: fallback })));
  };

  const handleAddCat = () => {
    const n = newCatName.trim();
    setAddingCat(false); setNewCatName('');
    if (n) handleCreate(n);
  };

  // ── Column resize ─────────────────────────────────────────────────────────

  const startResize = (side: 'left' | 'mid') => (e: React.MouseEvent) => {
    e.preventDefault();
    const x0 = e.clientX, w0 = side === 'left' ? leftWidth : midWidth;
    const [lo, hi] = side === 'left' ? [MIN_LEFT, MAX_LEFT] : [MIN_MID, MAX_MID];
    const set = side === 'left' ? setLeftWidth : setMidWidth;
    const mv = (ev: MouseEvent) => set(Math.max(lo, Math.min(hi, w0 + ev.clientX - x0)));
    const up = () => {
      window.removeEventListener('mousemove', mv);
      window.removeEventListener('mouseup', up);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', up);
  };

  // ── CSV ───────────────────────────────────────────────────────────────────

  const exportCsv = () => {
    const csv = [['Title', 'Body', 'Category', 'Order'], ...filtered.map(s => [s.title, s.body, s.category, s.sort_order])]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `snippets-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click(); URL.revokeObjectURL(a.href);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Content Library"
        subtitle={`${filtered.length} snippet${filtered.length !== 1 ? 's' : ''} — Pre-written content blocks for proposals.`}
        search={search} onSearchChange={setSearch} searchPlaceholder="Search snippets…"
        actions={<>
          <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"><Download size={14} />CSV</button>
          <button onClick={() => handleCreate()} disabled={creating} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg border border-white hover:bg-black hover:text-white transition-colors disabled:opacity-50"><Plus size={16} />Add Snippet</button>
        </>}
        mobileActions={<>
          <button onClick={exportCsv} className="flex items-center justify-center p-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors" title="Export CSV"><Download size={14} /></button>
          <button onClick={() => handleCreate()} disabled={creating} className="flex items-center justify-center p-2.5 bg-white text-black text-sm font-medium rounded-lg border border-white hover:bg-black hover:text-white transition-colors disabled:opacity-50" title="Add Snippet"><Plus size={16} /></button>
        </>}
      />

      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* ── LEFT sidebar ── */}
        {!focusMode && (<>
          <aside className="flex-shrink-0 flex flex-col" style={{ width: leftWidth }}>
            <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar pt-2">

              <button onClick={() => setFilterCat('all')} className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${filterCat === 'all' ? `${SEL} text-foreground` : `text-muted-foreground ${HOV} hover:text-foreground`}`}>
                <span className="flex items-center gap-2.5 min-w-0 truncate"><FolderOpen size={13} className="flex-shrink-0" />All</span>
                <span className="text-xs text-[#4d4d4d] flex-shrink-0 ml-1">{snippets.length}</span>
              </button>

              {categories.length > 0 && <div className="my-2 mx-4 border-t border-border" />}

              {categories.map(cat => {
                const isActive  = filterCat === cat;
                const isEditing = editingCat === cat;
                const count     = snippets.filter(s => s.category === cat).length;
                return (
                  <div
                    key={cat}
                    className={`group flex items-center gap-1 px-4 py-2 transition-colors cursor-pointer ${isActive ? SEL : HOV}`}
                    onClick={() => !isEditing && setFilterCat(cat)}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingCatVal}
                        onChange={e => setEditingCatVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  handleRename(cat, editingCatVal);
                          if (e.key === 'Escape') setEditingCat(null);
                        }}
                        onBlur={() => handleRename(cat, editingCatVal)}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 min-w-0 text-sm bg-transparent border-b border-border outline-none text-foreground pb-0.5 focus:border-white/30 transition-colors"
                      />
                    ) : (
                      <span className={`flex-1 min-w-0 text-sm truncate ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{cat}</span>
                    )}
                    {!isEditing && <>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={e => { e.stopPropagation(); setEditingCat(cat); setEditingCatVal(cat); }} className="p-0.5 rounded text-[#4d4d4d] hover:text-[#b3b3b3] transition-colors"><Pencil size={11} /></button>
                        <button onClick={e => { e.stopPropagation(); setConfirmDeleteCat(cat); }} className="p-0.5 rounded text-[#4d4d4d] hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                      </div>
                      <span className="text-xs text-[#4d4d4d] flex-shrink-0">{count}</span>
                    </>}
                  </div>
                );
              })}
            </div>

            <div className="flex-shrink-0 border-t border-border px-3 py-3.5 flex items-center">
              {addingCat ? (
                <input
                  autoFocus
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter')  handleAddCat();
                    if (e.key === 'Escape') { setAddingCat(false); setNewCatName(''); }
                  }}
                  onBlur={handleAddCat}
                  placeholder="Category name…"
                  className="w-full text-xs bg-transparent border-b border-border outline-none text-foreground placeholder:text-[#333] pb-0.5 focus:border-white/30 transition-colors"
                />
              ) : (
                <button onClick={() => setAddingCat(true)} className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-white/10 hover:bg-white/20 border border-transparent rounded-lg h-[36px] transition-colors"><Plus size={12} />New Category</button>
              )}
            </div>
          </aside>

          <div onMouseDown={startResize('left')} className="w-px flex-shrink-0 bg-[#1f1f1f] cursor-col-resize hover:bg-white/20 active:bg-white/30 transition-colors" />
        </>)}

        {/* ── MIDDLE list ── */}
        {!focusMode && (<>
          <div className="flex-shrink-0 flex flex-col" style={{ width: midWidth }}>
            <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar">
              {filtered.length === 0 ? (
                <div className="flex items-center justify-center h-full px-6 text-center">
                  <p className="text-xs text-[#404044]">{search ? 'No snippets match your search.' : 'No snippets yet.'}</p>
                </div>
              ) : filtered.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`w-full text-left px-4 py-3.5 border-b border-border transition-colors ${activeId === s.id ? SEL : HOV}`}
                >
                  <div className="text-sm font-medium text-foreground truncate leading-snug">{s.title || <span className="text-[#4d4d4d] italic">Untitled</span>}</div>
                  {s.body && <div className="text-xs text-white/35 mt-1 line-clamp-2 leading-relaxed">{stripMd(s.body)}</div>}
                </button>
              ))}
            </div>
          </div>

          <div onMouseDown={startResize('mid')} className="w-px flex-shrink-0 bg-[#1f1f1f] cursor-col-resize hover:bg-white/20 active:bg-white/30 transition-colors" />
        </>)}

        {/* ── RIGHT editor ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-[#303033]">Select a snippet to edit</p>
            </div>
          ) : (<>
            <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar">
              <div className={`flex flex-col ${focusMode ? 'max-w-2xl mx-auto' : 'w-full'}`}>

                <div className="flex items-start">
                  <input
                    type="text"
                    value={active.title}
                    onChange={e => mutate(active.id, 'title', e.target.value)}
                    placeholder="Snippet title…"
                    className="flex-1 text-xl font-semibold bg-transparent border-none outline-none px-8 pt-8 pb-3 text-foreground placeholder:text-[#333] focus:ring-0"
                  />
                  <div className="flex items-center gap-2 mt-[2.1rem] mr-5 flex-shrink-0">
                    <button
                      onClick={() => setFocusMode(v => !v)}
                      title={focusMode ? 'Exit focus mode' : 'Focus mode (hide sidebars)'}
                      className="p-1.5 rounded text-[#333] hover:text-[#999] hover:bg-white/5 transition-colors"
                    >
                      {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                  </div>
                </div>

                <div className="mx-8 border-b border-border" />

                <SnippetEditor
                  key={activeId}
                  body={active.body}
                  onChange={v => mutate(active.id, 'body', v)}
                />
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-border px-8 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SaveButton saving={saving} saved={saved} onClick={() => handleSave(active)} className="px-5 py-2 text-sm" />
                <div className="relative">
                  <button
                    onClick={() => setCatDropOpen(v => !v)}
                    className="flex items-center gap-2 bg-black border border-border rounded-lg px-3 pr-8 h-[38px] text-sm text-foreground cursor-pointer hover:border-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  >
                    {active.category}
                  </button>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#404044] pointer-events-none" />
                  {catDropOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setCatDropOpen(false)} />
                      <div className="absolute bottom-full left-0 mb-1 z-50 min-w-[160px] bg-black border border-border rounded-lg py-1 shadow-xl">
                        {categories.map(c => (
                          <button
                            key={c}
                            onClick={() => { mutate(active.id, 'category', c); setCatDropOpen(false); }}
                            className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${c === active.category ? 'text-foreground bg-white/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                          >
                            {c}
                          </button>
                        ))}
                        {!categories.includes(active.category) && (
                          <button
                            onClick={() => setCatDropOpen(false)}
                            className="w-full text-left px-3 py-1.5 text-sm text-foreground bg-white/10"
                          >
                            {active.category}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {confirmDeleteId === active.id ? (
                  <>
                    <span className="text-xs text-red-400">Delete?</span>
                    <button
                      onClick={() => handleDelete(active.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      title="Confirm delete"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4d4d4d] hover:text-[#b3b3b3] hover:bg-white/5 transition-colors"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDeleteId(active.id)} title="Delete snippet" className="p-2 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          </>)}
        </div>
      </div>

      {confirmDeleteCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-border/40 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-medium">Delete &ldquo;{confirmDeleteCat}&rdquo;?</h3>
            <p className="text-sm text-muted-foreground">
              {(() => {
                const n  = snippets.filter(s => s.category === confirmDeleteCat).length;
                const fb = categories.find(c => c !== confirmDeleteCat) ?? 'general';
                return n > 0 ? `${n} snippet${n !== 1 ? 's' : ''} will be moved to "${fb}".` : 'This category is empty.';
              })()}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDeleteCat(null)} className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={() => handleDeleteCat(confirmDeleteCat)} className="px-5 py-2.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
