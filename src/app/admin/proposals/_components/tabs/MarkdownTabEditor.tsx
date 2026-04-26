'use client';

import { useState, useRef, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { Bold, Heading2, Heading3, List, ListOrdered, Link2, ExternalLink, Trash2, Search, Filter, PanelRight } from 'lucide-react';
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
  onDirty?: () => void;
  /** Pipeline-generated content shown as a "Generated" snippet in the sidebar */
  generatedContent?: { title: string; body: string } | null;
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
    onDirty,
    generatedContent,
  }, ref) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl]           = useState('');
  const [title, setTitle]               = useState(section?.custom_title ?? '');
  const titleRef                        = useRef(section?.custom_title ?? '');
  const linkInputRef                    = useRef<HTMLInputElement>(null);
  const sectionRef                      = useRef<ProposalSectionRow | null>(section);
  const isDirtyRef                      = useRef(false);
  const initializedRef                  = useRef(false);
  const currentMarkdownRef              = useRef<string>(section?.custom_content ?? '');
  const titleTimerRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyTimerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef                         = useRef<() => Promise<void>>(async () => {});

  // ── Save ────────────────────────────────────────────────────────────────

  const save = useCallback(async () => {
    const markdownContent = currentMarkdownRef.current;
    const titleValue = titleRef.current || null;
    const current = sectionRef.current;
    try {
      if (current) {
        await updateProposalSection(current.id, { custom_content: markdownContent, custom_title: titleValue });
        const updated = { ...current, custom_content: markdownContent, custom_title: titleValue };
        sectionRef.current = updated;
        onSectionUpdated(updated);
      } else {
        const id = await addProposalSection({
          proposal_id: proposalId,
          section_type: 'text',
          sort_order: sortOrder,
          custom_content: markdownContent,
          custom_title: titleValue,
          layout_columns: 1,
          layout_position: 'full',
        });
        const created: ProposalSectionRow = {
          id,
          proposal_id: proposalId,
          section_type: 'text',
          snippet_id: null,
          custom_content: markdownContent,
          custom_title: titleValue,
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
  }, [proposalId, sortOrder, onSectionUpdated]);

  useImperativeHandle(ref, () => ({
    save,
    get isDirty() { return isDirtyRef.current; },
  }), [save]);

  saveRef.current = save;

  // Clear debounce timers on unmount to prevent stale saves
  useEffect(() => {
    return () => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      if (bodyTimerRef.current) clearTimeout(bodyTimerRef.current);
    };
  }, []);

  // ── Title change with debounced persist ────────────────────────────────

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    titleRef.current = value;
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
      if (initializedRef.current) {
        isDirtyRef.current = true;
        onDirty?.();
        if (bodyTimerRef.current) clearTimeout(bodyTimerRef.current);
        bodyTimerRef.current = setTimeout(() => { void saveRef.current(); }, 600);
      }
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
    onDirty?.();
  }, [editor, onDirty]);

  // ── Filtered snippets ────────────────────────────────────────────────────

  const [snippetSearch, setSnippetSearch] = useState('');
  const [snippetCategory, setSnippetCategory] = useState(defaultSnippetCategory ?? '');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const matchingSnippets = useMemo(() => {
    const matched = snippets.filter((s) => s.snippet_type === proposalType || s.snippet_type === 'general');
    if (generatedContent?.title && generatedContent?.body) {
      // Split by --- dividers into complete version blocks
      const versions = generatedContent.body
        .split(/\n---\n/)
        .map(v => v.trim())
        .filter(v => v.length > 0);
      const synthetics: ContentSnippetRow[] = versions.map((version, i) => {
        const firstLine = version.split('\n')[0].replace(/^[#*]+\s*/, '').slice(0, 50);
        return {
          id: `__generated_v${i}__`,
          title: `\u{1F916} Option ${i + 1}: ${firstLine}${firstLine.length >= 50 ? '...' : ''}`,
          body: version,
          snippet_type: 'general' as const,
          category: 'Generated',
          sort_order: i,
          created_at: '',
          updated_at: '',
        };
      });
      return [...synthetics, ...matched];
    }
    return matched;
  }, [snippets, proposalType, generatedContent]);

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
            <div className="flex-shrink-0 w-full px-8 pt-5 pb-2">
              <label className="admin-label">Slide Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={titlePlaceholder}
                className="w-full bg-transparent text-xl font-semibold text-admin-text-primary placeholder:text-admin-text-placeholder outline-none border-b border-admin-border-subtle pb-2 focus:border-admin-border-emphasis transition-colors"
              />
            </div>
          )}

          {/* Toolbar — normal bg, fixed height, aligned with snippet sidebar header */}
          <div className="flex-shrink-0 w-full">
            <div className="flex items-center gap-0.5 px-8 py-3 border-b border-admin-border">
              {formatTools.map(({ key, Icon, label, fn, isActive }) => (
                <button
                  key={key}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); fn(); }}
                  title={label}
                  className={`p-1.5 rounded transition-colors ${
                    isActive
                      ? 'text-admin-text-primary bg-admin-bg-active'
                      : 'text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover'
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}

              {/* Link display — only shown when cursor is on an existing link */}
              {isLink && (
                <>
                  <span className="w-px h-3.5 bg-admin-border-muted mx-1 flex-shrink-0" />
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-admin-bg-hover text-xs">
                    <Link2 size={12} className="text-admin-text-dim flex-shrink-0" />
                    <span className="text-admin-text-dim max-w-[120px] truncate">{linkHref}</span>
                    <a
                      href={linkHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open link"
                      className="ml-0.5 text-admin-text-faint hover:text-admin-text-primary transition-colors p-0.5 rounded"
                    >
                      <ExternalLink size={11} />
                    </a>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); openLink(); }}
                      title="Edit link"
                      className="text-admin-text-faint hover:text-admin-text-primary transition-colors p-0.5 rounded"
                    >
                      <Link2 size={11} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetLink().run(); }}
                      title="Remove link"
                      className="text-admin-text-faint hover:text-admin-danger transition-colors p-0.5 rounded"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Scrollable dark content area — fills remaining height */}
          <div className="flex-1 overflow-y-auto admin-scrollbar bg-admin-bg-base">
            <div className="max-w-3xl">

              {/* Link URL input */}
              {showLinkInput && (
                <div className="mx-8 mt-3 flex items-center gap-2.5 bg-admin-bg-raised border border-admin-border rounded-xl px-3.5 py-2.5">
                  <Link2 size={13} className="text-admin-text-faint flex-shrink-0" />
                  <input
                    ref={linkInputRef}
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')  { e.preventDefault(); applyLink(); }
                      if (e.key === 'Escape') { setShowLinkInput(false); editor.chain().focus().run(); }
                    }}
                    placeholder="https://"
                    className="flex-1 bg-transparent text-sm text-admin-text-primary placeholder:text-admin-text-ghost outline-none"
                  />
                  <kbd className="text-xs text-admin-text-placeholder font-mono">↵</kbd>
                </div>
              )}

              {/* BubbleMenu — appears on text selection */}
              <BubbleMenu
                editor={editor}
                className="flex items-center gap-0.5 bg-admin-bg-overlay border border-admin-border rounded-lg p-1 shadow-xl"
              >
                {formatTools.map(({ key, Icon, label, fn, isActive }) => (
                  <button
                    key={key}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); fn(); }}
                    title={label}
                    className={`p-1.5 rounded transition-colors ${
                      isActive
                        ? 'text-admin-text-primary bg-admin-bg-active'
                        : 'text-admin-text-dim hover:text-admin-text-primary hover:bg-admin-bg-hover'
                    }`}
                  >
                    <Icon size={13} />
                  </button>
                ))}
                <span className="w-px h-3.5 bg-admin-border-muted mx-0.5 flex-shrink-0" />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); openLink(); }}
                  title="Link"
                  className="p-1.5 rounded transition-colors text-admin-text-dim hover:text-admin-text-primary hover:bg-admin-bg-hover"
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

        {/* Snippet sidebar — collapsed state shows just the toggle button in a narrow strip */}
        {!sidebarOpen && (
          <div className="flex-shrink-0 border-l border-admin-border flex flex-col">
            <div className="h-[3rem] border-b border-admin-border flex items-center justify-center px-1.5">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                title="Show snippets"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
              >
                <PanelRight size={14} />
              </button>
            </div>
          </div>
        )}
        {sidebarOpen && (
          <div className="w-72 flex-shrink-0 border-l border-admin-border flex flex-col">
            <div className="px-3 h-[3rem] border-b border-admin-border flex-shrink-0 flex items-center gap-1.5">
              <div className="relative flex-1 min-w-0">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-text-ghost pointer-events-none" />
                <input
                  type="text"
                  value={snippetSearch}
                  onChange={(e) => setSnippetSearch(e.target.value)}
                  placeholder="Search snippets…"
                  className="admin-input w-full h-8 pl-8 pr-3 text-xs"
                />
              </div>
              {snippetCategories.length > 0 && (
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setFilterOpen((o) => !o)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      snippetCategory
                        ? 'text-admin-info bg-admin-info-bg'
                        : 'text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover'
                    }`}
                    title={snippetCategory ? `Filter: ${snippetCategory}` : 'Filter by category'}
                  >
                    <Filter size={13} />
                  </button>
                  {filterOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 min-w-[140px] bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl py-1 z-50">
                        <button
                          type="button"
                          onClick={() => { setSnippetCategory(''); setFilterOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                            !snippetCategory ? 'text-admin-text-primary bg-admin-bg-active' : 'text-admin-text-muted hover:bg-admin-bg-hover'
                          }`}
                        >
                          All
                        </button>
                        {snippetCategories.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => { setSnippetCategory(c); setFilterOpen(false); }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                              snippetCategory === c ? 'text-admin-info bg-admin-info-bg/30' : 'text-admin-text-muted hover:bg-admin-bg-hover'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                title="Hide snippets"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0"
              >
                <PanelRight size={13} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto admin-scrollbar p-3 space-y-2">
              {visibleSnippets.length === 0 ? (
                <p className="text-xs text-admin-text-ghost pt-2">No snippets match.</p>
              ) : (
                visibleSnippets.map((snippet) => (
                  <button
                    key={snippet.id}
                    type="button"
                    onClick={() => handleSnippetInsert(snippet.body)}
                    className="w-full text-left p-3 rounded-lg border border-admin-border hover:border-admin-border-emphasis bg-admin-bg-subtle hover:bg-admin-bg-hover transition-colors group"
                  >
                    <p className="text-sm font-medium text-admin-text-secondary group-hover:text-admin-text-primary transition-colors leading-tight">
                      {snippet.title}
                    </p>
                    <p className="text-xs text-admin-text-faint mt-1.5 line-clamp-3 leading-relaxed">
                      {snippet.body}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

      </div>{/* /flex row */}

    </div>
  );
});
