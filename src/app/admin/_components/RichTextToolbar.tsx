'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Bold, Heading1, Heading2, Heading3, List, ListOrdered, Minus, Link2, ExternalLink, Trash2 } from 'lucide-react';

interface Props {
  editor: Editor | null;
  className?: string;
}

export function RichTextToolbar({ editor, className }: Props) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl]             = useState('');
  const linkInputRef                      = useRef<HTMLInputElement>(null);

  // Re-render when editor marks/selection change
  useEffect(() => {
    if (!editor) return;
    const fn = () => forceUpdate();
    editor.on('transaction', fn);
    return () => { editor.off('transaction', fn); };
  }, [editor]);

  // Sync link URL bar with cursor position
  useEffect(() => {
    if (!editor) return;
    const fn = () => {
      if (document.activeElement === linkInputRef.current) return;
      if (editor.isActive('link')) {
        setLinkUrl(editor.getAttributes('link').href ?? '');
        setShowLinkInput(true);
      } else {
        setShowLinkInput(false);
        setLinkUrl('');
      }
    };
    editor.on('selectionUpdate', fn);
    return () => { editor.off('selectionUpdate', fn); };
  }, [editor]);

  const openLink = useCallback(() => {
    if (!editor) return;
    if (!editor.isActive('link')) {
      setLinkUrl('');
      setShowLinkInput(true);
    }
    setTimeout(() => linkInputRef.current?.focus(), 50);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (url) editor.chain().focus().setLink({ href: url }).run();
    else     editor.chain().focus().unsetLink().run();
  }, [editor, linkUrl]);

  if (!editor) return null;

  const isLink = editor.isActive('link');

  const btnCls = (active: boolean) =>
    `p-1.5 rounded transition-colors flex-shrink-0 ${
      active
        ? 'text-admin-text-primary bg-admin-bg-active'
        : 'text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover'
    }`;

  const formatTools = [
    { key: 'h1',   I: Heading1,    lbl: 'Heading 1',     fn: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor.isActive('heading', { level: 1 }) },
    { key: 'h2',   I: Heading2,    lbl: 'Heading 2',     fn: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive('heading', { level: 2 }) },
    { key: 'h3',   I: Heading3,    lbl: 'Heading 3',     fn: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: editor.isActive('heading', { level: 3 }) },
    { key: 'bold', I: Bold,        lbl: 'Bold (⌘B)',     fn: () => editor.chain().focus().toggleBold().run(),               isActive: editor.isActive('bold') },
    { key: 'ul',   I: List,        lbl: 'Bullet list',   fn: () => editor.chain().focus().toggleBulletList().run(),         isActive: editor.isActive('bulletList') },
    { key: 'ol',   I: ListOrdered, lbl: 'Numbered list', fn: () => editor.chain().focus().toggleOrderedList().run(),        isActive: editor.isActive('orderedList') },
  ];

  return (
    <div className={className ?? 'flex items-center gap-0.5 px-8 pt-4 pb-3 min-h-[36px]'}>
      {formatTools.map(({ key, I, lbl, fn, isActive }) => (
        <button
          key={key}
          onMouseDown={e => { e.preventDefault(); fn(); }}
          title={lbl}
          className={btnCls(isActive)}
        >
          <I size={14} />
        </button>
      ))}

      <span className="w-px h-3.5 bg-admin-bg-active mx-1 flex-shrink-0" />

      {/* HR button — always muted, not togglable */}
      <button
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run(); }}
        title="Horizontal rule"
        className="p-1.5 rounded transition-colors flex-shrink-0 text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover"
      >
        <Minus size={14} />
      </button>

      <span className="w-px h-3.5 bg-admin-bg-active mx-1 flex-shrink-0" />

      {/* Link button */}
      <button
        onMouseDown={e => { e.preventDefault(); openLink(); }}
        title="Link (⌘⇧U)"
        className={btnCls(isLink || showLinkInput)}
      >
        <Link2 size={14} />
      </button>

      {/* Inline URL input */}
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
            className="flex-1 min-w-0 ml-1 bg-transparent text-sm text-admin-text-secondary placeholder:text-admin-text-ghost outline-none"
          />
          {linkUrl && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
              onMouseDown={e => e.preventDefault()}
              title="Open link"
              className="text-admin-text-ghost hover:text-admin-text-secondary transition-colors p-1 flex-shrink-0"
            >
              <ExternalLink size={12} />
            </a>
          )}
          {isLink && (
            <button
              onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetLink().run(); }}
              title="Remove link"
              className="text-admin-text-ghost hover:text-admin-danger transition-colors p-1 flex-shrink-0"
            >
              <Trash2 size={12} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
