'use client';

import { useState, useEffect, useRef, useCallback, useTransition, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { Bold, Heading2, Heading3, List, ListOrdered, Link2, ExternalLink, Trash2, Search, Filter } from 'lucide-react';
import { addProposalSection, updateProposalSection } from '@/app/admin/actions';
import type { ProposalSectionRow, ContentSnippetRow, ProposalType } from '@/types/proposal';

// ── Types ──────────────────────────────────────────────────────────────────

interface MarkdownTabEditorProps {
  proposalId: string;
  proposalType: ProposalType;
  sortOrder: 0 | 1;
  snippets: ContentSnippetRow[];
  section: ProposalSectionRow | null;
  onSectionUpdated: (s: ProposalSectionRow) => void;
  label: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

// ── Component ──────────────────────────────────────────────────────────────

export function MarkdownTabEditor({
  proposalId,
  proposalType,
  sortOrder,
  snippets,
  section,
  onSectionUpdated,
  label,
}: MarkdownTabEditorProps) {
  const [saveStatus, setSaveStatus]     = useState<SaveStatus>('idle');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl]           = useState('');
  const linkInputRef                    = useRef<HTMLInputElement>(null);
  const sectionRef                      = useRef<ProposalSectionRow | null>(section);
  const debounceTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFadeTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition]             = useTransition();

  // Keep sectionRef in sync so the autosave closure always has the latest value
  useEffect(() => { sectionRef.current = section; }, [section]);

  // ── Autosave ────────────────────────────────────────────────────────────

  const persist = useCallback((markdownContent: string) => {
    startTransition(async () => {
      setSaveStatus('saving');
      try {
        const current = sectionRef.current;
        if (current) {
          await updateProposalSection(current.id, { custom_content: markdownContent });
        } else {
          const id = await addProposalSection({
            proposal_id: proposalId,
            section_type: 'text',
            sort_order: sortOrder,
            custom_content: markdownContent,
            layout_columns: 1,
            layout_position: 'full',
          });
          const created: ProposalSectionRow = {
            id,
            proposal_id: proposalId,
            section_type: 'text',
            snippet_id: null,
            custom_content: markdownContent,
            custom_title: null,
            layout_columns: 1,
            layout_position: 'full',
            sort_order: sortOrder,
            created_at: new Date().toISOString(),
          };
          sectionRef.current = created;
          onSectionUpdated(created);
        }
        setSaveStatus('saved');
        if (savedFadeTimer.current) clearTimeout(savedFadeTimer.current);
        savedFadeTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    });
  }, [proposalId, sortOrder, onSectionUpdated]);

  const scheduleAutosave = useCallback((md: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => persist(md), 1500);
  }, [persist]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (savedFadeTimer.current) clearTimeout(savedFadeTimer.current);
    };
  }, []);

  // ── Editor ──────────────────────────────────────────────────────────────

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      TiptapLink.configure({ openOnClick: false }),
      Markdown.configure({ html: false, tightLists: true, transformPastedText: true }),
    ],
    content: section?.custom_content ?? '',
    onUpdate({ editor: e }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = (e.storage as any).markdown.getMarkdown();
      scheduleAutosave(md);
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
    scheduleAutosave(md);
  }, [editor, scheduleAutosave]);

  // ── Filtered snippets ────────────────────────────────────────────────────

  const [snippetSearch, setSnippetSearch] = useState('');
  const [snippetCategory, setSnippetCategory] = useState('');

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

  // ── Status dot ──────────────────────────────────────────────────────────

  const dotClass =
    saveStatus === 'saving' ? 'bg-yellow-400'
    : saveStatus === 'saved'  ? 'bg-green-400'
    : 'bg-white/20';

  const statusLabel =
    saveStatus === 'saving' ? 'Saving…'
    : saveStatus === 'saved'  ? 'Saved'
    : 'Auto-save on';

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
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-3xl">

            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-8 pt-4 pb-2">
              {formatTools.map(({ key, Icon, label, fn, isActive }) => (
                <button
                  key={key}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); fn(); }}
                  title={label}
                  className={`p-1.5 rounded transition-colors ${
                    isActive
                      ? 'text-foreground bg-white/[0.1]'
                      : 'text-white/30 hover:text-foreground hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}

              <span className="w-px h-3.5 bg-white/10 mx-1 flex-shrink-0" />

              {/* Link button */}
              {isLink ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/[0.06] text-xs">
                  <Link2 size={12} className="text-white/40 flex-shrink-0" />
                  <span className="text-white/40 max-w-[120px] truncate">{linkHref}</span>
                  <a
                    href={linkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open link"
                    className="ml-0.5 text-white/30 hover:text-foreground transition-colors p-0.5 rounded"
                  >
                    <ExternalLink size={11} />
                  </a>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); openLink(); }}
                    title="Edit link"
                    className="text-white/30 hover:text-foreground transition-colors p-0.5 rounded"
                  >
                    <Link2 size={11} />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetLink().run(); }}
                    title="Remove link"
                    className="text-white/30 hover:text-red-400 transition-colors p-0.5 rounded"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); openLink(); }}
                  title="Link (⌘⇧U)"
                  className="p-1.5 rounded transition-colors text-white/30 hover:text-foreground hover:bg-white/[0.06]"
                >
                  <Link2 size={14} />
                </button>
              )}
            </div>

            {/* Link URL input */}
            {showLinkInput && (
              <div className="mx-8 mb-3 flex items-center gap-2.5 bg-[#1c1c1c] border border-white/15 rounded-xl px-3.5 py-2.5">
                <Link2 size={13} className="text-white/30 flex-shrink-0" />
                <input
                  ref={linkInputRef}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter')  { e.preventDefault(); applyLink(); }
                    if (e.key === 'Escape') { setShowLinkInput(false); editor.chain().focus().run(); }
                  }}
                  placeholder="https://"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-white/25 outline-none"
                />
                <kbd className="text-xs text-white/20 font-mono">↵</kbd>
              </div>
            )}

            {/* BubbleMenu — appears on text selection */}
            <BubbleMenu
              editor={editor}
              className="flex items-center gap-0.5 bg-[#1a1a1a] border border-white/[0.12] rounded-lg p-1 shadow-xl"
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
                      : 'text-white/40 hover:text-foreground hover:bg-white/[0.08]'
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
                className="p-1.5 rounded transition-colors text-white/40 hover:text-foreground hover:bg-white/[0.08]"
              >
                <Link2 size={13} />
              </button>
            </BubbleMenu>

            {/* Editor content */}
            <div
              className="px-8 py-4"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'u') {
                  e.preventDefault();
                  openLink();
                }
              }}
            >
              <EditorContent editor={editor} />
            </div>
          </div>{/* /max-w-3xl */}
        </div>

        {/* Snippet sidebar */}
        <div className="w-64 flex-shrink-0 border-l border-white/[0.12] flex flex-col">
          <div className="px-3 pt-3 pb-3 border-b border-white/[0.12] flex-shrink-0 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
              <input
                type="text"
                value={snippetSearch}
                onChange={(e) => setSnippetSearch(e.target.value)}
                placeholder="Search snippets…"
                className="w-full bg-white/[0.04] border border-white/[0.12] rounded-md pl-8 pr-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
              />
            </div>
            {snippetCategories.length > 0 && (
              <div
                className={`relative flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md border transition-colors cursor-pointer ${
                  snippetCategory
                    ? 'border-white/30 text-white/70 bg-white/[0.08]'
                    : 'border-white/[0.12] text-white/30 hover:text-white/60 hover:border-white/25'
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
              <p className="text-xs text-white/20 pt-2">No snippets match.</p>
            ) : (
              visibleSnippets.map((snippet) => (
                <button
                  key={snippet.id}
                  type="button"
                  onClick={() => handleSnippetInsert(snippet.body)}
                  className="w-full text-left p-3 rounded-lg border border-white/[0.12] hover:border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
                >
                  <p className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors leading-tight">
                    {snippet.title}
                  </p>
                  <p className="text-xs text-white/30 mt-1.5 line-clamp-3 leading-relaxed">
                    {snippet.body}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

      </div>{/* /flex row */}

      {/* Footer with autosave status */}
      <div className="px-8 py-3 border-t border-white/[0.12] flex items-center justify-between flex-shrink-0">
        <p className="text-xs text-white/30">{label} section</p>
        <span className="flex items-center gap-1.5 text-xs text-white/30">
          <span className={`inline-block w-1.5 h-1.5 rounded-full transition-colors duration-300 ${dotClass}`} />
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
