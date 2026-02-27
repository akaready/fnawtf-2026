'use client';

import { useState, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { Bold, Heading2, Heading3, List, ListOrdered, Link2, ExternalLink, Trash2, Search, Filter } from 'lucide-react';
import { addProposalSection, updateProposalSection } from '@/app/admin/actions';
import type { ProposalSectionRow, ContentSnippetRow, ProposalType } from '@/types/proposal';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MarkdownTabEditorHandle {
  save: () => Promise<void>;
  isDirty: boolean;
}

interface MarkdownTabEditorProps {
  proposalId: string;
  proposalType: ProposalType;
  sortOrder: 0 | 1;
  snippets: ContentSnippetRow[];
  section: ProposalSectionRow | null;
  onSectionUpdated: (s: ProposalSectionRow) => void;
  label: string;
  defaultSnippetCategory?: string;
  titlePlaceholder?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export const MarkdownTabEditor = forwardRef<MarkdownTabEditorHandle, MarkdownTabEditorProps>(
  function MarkdownTabEditor({
    proposalId,
    proposalType,
    sortOrder,
    snippets,
    section,
    onSectionUpdated,
    label: _label,
    defaultSnippetCategory,
    titlePlaceholder,
  }, ref) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl]           = useState('');
  const [title, setTitle]               = useState(section?.custom_title ?? '');
  const linkInputRef                    = useRef<HTMLInputElement>(null);
  const sectionRef                      = useRef<ProposalSectionRow | null>(section);
  const isDirtyRef                      = useRef(false);
  const initializedRef                  = useRef(false);
  const currentMarkdownRef              = useRef<string>(section?.custom_content ?? '');
  const titleTimerRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Save ────────────────────────────────────────────────────────────────

  const save = useCallback(async () => {
    const markdownContent = currentMarkdownRef.current;
    const current = sectionRef.current;
    try {
      if (current) {
        await updateProposalSection(current.id, { custom_content: markdownContent, custom_title: title || null });
        const updated = { ...current, custom_content: markdownContent, custom_title: title || null };
        sectionRef.current = updated;
        onSectionUpdated(updated);
      } else {
        const id = await addProposalSection({
          proposal_id: proposalId,
          section_type: 'text',
          sort_order: sortOrder,
          custom_content: markdownContent,
          custom_title: title || null,
          layout_columns: 1,
          layout_position: 'full',
        });
        const created: ProposalSectionRow = {
          id,
          proposal_id: proposalId,
          section_type: 'text',
          snippet_id: null,
          custom_content: markdownContent,
          custom_title: title || null,
          layout_columns: 1,
          layout_position: 'full',
          sort_order: sortOrder,
          created_at: new Date().toISOString(),
        };
        sectionRef.current = created;
        onSectionUpdated(created);
      }
      isDirtyRef.current = false;
    } catch {
      // swallow — caller may show error via saving state
    }
  }, [proposalId, sortOrder, onSectionUpdated, title]);

  useImperativeHandle(ref, () => ({
    save,
    get isDirty() { return isDirtyRef.current; },
  }), [save]);

  // ── Title change with debounced persist ────────────────────────────────

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => {
      const current = sectionRef.current;
      if (current) {
        void updateProposalSection(current.id, { custom_title: value || null });
        const updated = { ...current, custom_title: value || null };
        sectionRef.current = updated;
        onSectionUpdated(updated);
      }
    }, 600);
  }, [onSectionUpdated]);

  // ── Editor ──────────────────────────────────────────────────────────────

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      TiptapLink.configure({ openOnClick: false }),
      Markdown.configure({ html: false, tightLists: true, transformPastedText: true }),
    ],
    content: section?.custom_content ?? '',
    onCreate() {
      // Skip the first onUpdate that fires when Tiptap renders initial content
      setTimeout(() => { initializedRef.current = true; }, 0);
    },
    onUpdate({ editor: e }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = (e.storage as any).markdown.getMarkdown();
      currentMarkdownRef.current = md;
      if (initializedRef.current) isDirtyRef.current = true;
    },
    editorProps: {
      attributes: { class: 'outline-none min-h-[320px] prose-snippet' },
    },
  });

  // ── Link helpers ────────────────────────────────────────────────────────

  const openLink = useCallback(() => {
    if (!editor) return;
    setLinkUrl(editor.getAttributes('link').href ?? '');
    setShowLinkInput(true);
    setTimeout(() => linkInputRef.current?.focus(), 50);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (url) editor.chain().focus().setLink({ href: url }).run();
    else     editor.chain().focus().unsetLink().run();
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  // ── Snippet insert ──────────────────────────────────────────────────────

  const handleSnippetInsert = useCallback((body: string) => {
    if (!editor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentMd = (editor.storage as any).markdown.getMarkdown() as string;
    const combined = currentMd.trim() ? `${currentMd.trim()}\n\n${body}` : body;
    editor.commands.setContent(combined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const md = (editor.storage as any).markdown.getMarkdown();
    currentMarkdownRef.current = md;
    isDirtyRef.current = true;
  }, [editor]);

  // ── Filtered snippets ────────────────────────────────────────────────────

  const [snippetSearch, setSnippetSearch] = useState('');
  const [snippetCategory, setSnippetCategory] = useState(defaultSnippetCategory ?? '');

  const matchingSnippets = useMemo(
    () => snippets.filter((s) => s.snippet_type === proposalType || s.snippet_type === 'general'),
    [snippets, proposalType]
  );

  const snippetCategories = useMemo(() => {
    const set = new Set<string>();
    for (const s of matchingSnippets) if (s.category) set.add(s.category);
    return Array.from(set).sort();
  }, [matchingSnippets]);

  const visibleSnippets = useMemo(() => {
    let result = matchingSnippets;
    if (snippetCategory) result = result.filter((s) => s.category === snippetCategory);
    if (snippetSearch.trim()) {
      const q = snippetSearch.trim().toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q)
      );
    }
    return result;
  }, [matchingSnippets, snippetSearch, snippetCategory]);

  // ── Toolbar items ────────────────────────────────────────────────────────

  if (!editor) return null;

  const isLink   = editor.isActive('link');
  const linkHref = editor.getAttributes('link').href as string | undefined;

  const formatTools = [
    {
      key: 'bold',
      Icon: Bold,
      label: 'Bold (⌘B)',
      fn: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      key: 'h2',
      Icon: Heading2,
      label: 'Heading 2',
      fn: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
    },
    {
      key: 'h3',
      Icon: Heading3,
      label: 'Heading 3',
      fn: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive('heading', { level: 3 }),
    },
    {
      key: 'ul',
      Icon: List,
      label: 'Bullet list',
      fn: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      key: 'ol',
      Icon: ListOrdered,
      label: 'Numbered list',
      fn: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
    },
  ] as const;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* Middle: editor column + snippet sidebar */}
      <div className="flex flex-1 min-h-0">

        {/* Editor column */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          {/* Page title */}
          {titlePlaceholder && (
            <div className="flex-shrink-0 max-w-3xl w-full px-8 pt-5 pb-2">
              <label className="text-[10px] uppercase tracking-widest text-[#4d4d4d] mb-1.5 block">Slide Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={titlePlaceholder}
                className="w-full bg-transparent text-xl font-semibold text-white placeholder:text-[#333] outline-none border-b border-white/[0.06] pb-2 focus:border-white/20 transition-colors"
              />
            </div>
          )}

          {/* Toolbar — normal bg, fixed height, aligned with snippet sidebar header */}
          <div className="flex-shrink-0 max-w-3xl w-full">
            <div className="flex items-center gap-0.5 px-8 py-3 border-b border-[#2a2a2a]">
              {formatTools.map(({ key, Icon, label, fn, isActive }) => (
                <button
                  key={key}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); fn(); }}
                  title={label}
                  className={`p-1.5 rounded transition-colors ${
                    isActive
                      ? 'text-foreground bg-white/[0.1]'
                      : 'text-[#4d4d4d] hover:text-foreground hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}

              <span className="w-px h-3.5 bg-white/10 mx-1 flex-shrink-0" />

              {/* Link button */}
              {isLink ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/[0.06] text-xs">
                  <Link2 size={12} className="text-[#666] flex-shrink-0" />
                  <span className="text-[#666] max-w-[120px] truncate">{linkHref}</span>
                  <a
                    href={linkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open link"
                    className="ml-0.5 text-[#4d4d4d] hover:text-foreground transition-colors p-0.5 rounded"
                  >
                    <ExternalLink size={11} />
                  </a>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); openLink(); }}
                    title="Edit link"
                    className="text-[#4d4d4d] hover:text-foreground transition-colors p-0.5 rounded"
                  >
                    <Link2 size={11} />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetLink().run(); }}
                    title="Remove link"
                    className="text-[#4d4d4d] hover:text-red-400 transition-colors p-0.5 rounded"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); openLink(); }}
                  title="Link (⌘⇧U)"
                  className="p-1.5 rounded transition-colors text-[#4d4d4d] hover:text-foreground hover:bg-white/[0.06]"
                >
                  <Link2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable dark content area — fills remaining height */}
          <div className="flex-1 overflow-y-auto admin-scrollbar bg-black/40">
            <div className="max-w-3xl">

              {/* Link URL input */}
              {showLinkInput && (
                <div className="mx-8 mt-3 flex items-center gap-2.5 bg-[#1c1c1c] border border-white/15 rounded-xl px-3.5 py-2.5">
                  <Link2 size={13} className="text-[#4d4d4d] flex-shrink-0" />
                  <input
                    ref={linkInputRef}
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')  { e.preventDefault(); applyLink(); }
                      if (e.key === 'Escape') { setShowLinkInput(false); editor.chain().focus().run(); }
                    }}
                    placeholder="https://"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-[#404040] outline-none"
                  />
                  <kbd className="text-xs text-[#333] font-mono">↵</kbd>
                </div>
              )}

              {/* BubbleMenu — appears on text selection */}
              <BubbleMenu
                editor={editor}
                className="flex items-center gap-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1 shadow-xl"
              >
                {formatTools.map(({ key, Icon, label, fn, isActive }) => (
                  <button
                    key={key}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); fn(); }}
                    title={label}
                    className={`p-1.5 rounded transition-colors ${
                      isActive
                        ? 'text-foreground bg-white/[0.12]'
                        : 'text-[#666] hover:text-foreground hover:bg-white/[0.08]'
                    }`}
                  >
                    <Icon size={13} />
                  </button>
                ))}
                <span className="w-px h-3.5 bg-white/10 mx-0.5 flex-shrink-0" />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); openLink(); }}
                  title="Link"
                  className="p-1.5 rounded transition-colors text-[#666] hover:text-foreground hover:bg-white/[0.08]"
                >
                  <Link2 size={13} />
                </button>
              </BubbleMenu>

              {/* Editor content */}
              <div
                className="px-8 pt-5 pb-4"
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'u') {
                    e.preventDefault();
                    openLink();
                  }
                }}
              >
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

        </div>

        {/* Snippet sidebar */}
        <div className="w-64 flex-shrink-0 border-l border-[#2a2a2a] flex flex-col">
          <div className="px-3 h-[51px] border-b border-[#2a2a2a] flex-shrink-0 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#404040] pointer-events-none" />
              <input
                type="text"
                value={snippetSearch}
                onChange={(e) => setSnippetSearch(e.target.value)}
                placeholder="Search snippets…"
                className="w-full h-8 bg-black/40 border border-[#2a2a2a] rounded-md pl-8 pr-3 text-xs text-white placeholder:text-[#333] focus:outline-none focus:border-white/20"
              />
            </div>
            {snippetCategories.length > 0 && (
              <div
                className={`relative flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md border transition-colors cursor-pointer ${
                  snippetCategory
                    ? 'border-white/30 text-[#b3b3b3] bg-white/[0.08]'
                    : 'border-[#2a2a2a] text-[#4d4d4d] hover:text-[#999] hover:border-white/25'
                }`}
                title={snippetCategory ? `Filter: ${snippetCategory}` : 'Filter by category'}
              >
                <Filter size={13} className="pointer-events-none" />
                <select
                  value={snippetCategory}
                  onChange={(e) => setSnippetCategory(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  <option value="">All categories</option>
                  {snippetCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto admin-scrollbar p-3 space-y-2">
            {visibleSnippets.length === 0 ? (
              <p className="text-xs text-[#333] pt-2">No snippets match.</p>
            ) : (
              visibleSnippets.map((snippet) => (
                <button
                  key={snippet.id}
                  type="button"
                  onClick={() => handleSnippetInsert(snippet.body)}
                  className="w-full text-left p-3 rounded-lg border border-[#2a2a2a] hover:border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
                >
                  <p className="text-sm font-medium text-[#b3b3b3] group-hover:text-white/90 transition-colors leading-tight">
                    {snippet.title}
                  </p>
                  <p className="text-xs text-[#4d4d4d] mt-1.5 line-clamp-3 leading-relaxed">
                    {snippet.body}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

      </div>{/* /flex row */}

    </div>
  );
});
