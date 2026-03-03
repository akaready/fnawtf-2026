'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { MentionDropdown } from './MentionDropdown';
import { markdownToHtml, htmlToMarkdown } from '@/lib/scripts/parseContent';
import type { ScriptCharacterRow, ScriptTagRow, ScriptLocationRow } from '@/types/scripts';

interface Props {
  scriptId: string;
  initialContent: string;
  characters: ScriptCharacterRow[];
  tags: ScriptTagRow[];
  locations: ScriptLocationRow[];
  onContentChange: (content: string) => void;
}

/**
 * Strip bold markdown — scratch pad is plain text only (no **bold**).
 * Keeps @[Name](id) and #[slug] mentions intact.
 */
function stripBoldMarkdown(md: string): string {
  return md.replace(/\*\*(.+?)\*\*/g, '$1');
}

export function ScriptScratchPad({ initialContent, characters, tags, locations, onContentChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValue = useRef(initialContent);
  // Mention state — @ queries both characters and locations
  const [mentionState, setMentionState] = useState<{
    type: 'character' | 'tag';
    query: string;
    position: { x: number; y: number };
  } | null>(null);

  // Render content: use markdownToHtml for mentions but strip bold.
  // markdownToHtml sanitizes all output via DOMPurify — safe for innerHTML.
  const renderContent = useCallback((md: string) => {
    if (!editorRef.current) return;
    const cleaned = stripBoldMarkdown(md);
    editorRef.current.innerHTML = markdownToHtml(cleaned, characters, tags, locations);
  }, [characters, tags, locations]);

  // Render on mount and whenever characters/tags/locations change (re-colors existing mentions)
  useEffect(() => {
    renderContent(lastValue.current);
  }, [renderContent]);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    let md = htmlToMarkdown(editorRef.current.innerHTML);
    md = stripBoldMarkdown(md);
    if (md !== lastValue.current) {
      lastValue.current = md;
      onContentChange(md);
    }
  }, [onContentChange]);

  const checkMentionTrigger = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) { setMentionState(null); return; }
    const range = sel.getRangeAt(0);
    if (!range.collapsed) { setMentionState(null); return; }
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) { setMentionState(null); return; }

    const text = node.textContent?.slice(0, range.startOffset) ?? '';
    const atMatch = text.match(/@(\w*)$/);
    const hashMatch = text.match(/#(\w*)$/);

    if (atMatch) {
      const rect = range.getBoundingClientRect();
      setMentionState({ type: 'character', query: atMatch[1], position: { x: rect.left, y: rect.bottom + 4 } });
    } else if (hashMatch) {
      const rect = range.getBoundingClientRect();
      setMentionState({ type: 'tag', query: hashMatch[1], position: { x: rect.left, y: rect.bottom + 4 } });
    } else {
      setMentionState(null);
    }
  }, []);

  const handleMentionSelect = useCallback((item: ScriptCharacterRow | ScriptTagRow | ScriptLocationRow) => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;

    const text = node.textContent ?? '';
    const offset = range.startOffset;
    const trigger = mentionState?.type === 'character' ? '@' : '#';
    const triggerIdx = text.lastIndexOf(trigger, offset - 1);
    if (triggerIdx === -1) return;

    const before = text.slice(0, triggerIdx);
    const after = text.slice(offset);

    let replacement: string;
    if (mentionState?.type === 'character') {
      // Both characters and locations come through the @ trigger
      const entity = item as ScriptCharacterRow | ScriptLocationRow;
      replacement = `@[${entity.name}](${entity.id})`;
    } else {
      const tag = item as ScriptTagRow;
      replacement = `#[${tag.slug}]`;
    }

    node.textContent = before + replacement + ' ' + after;
    const newOffset = before.length + replacement.length + 1;
    range.setStart(node, Math.min(newOffset, node.textContent.length));
    range.setEnd(node, Math.min(newOffset, node.textContent.length));
    sel.removeAllRanges();
    sel.addRange(range);

    setMentionState(null);

    // Re-render with proper mention styling (DOMPurify-sanitized via markdownToHtml)
    let md = htmlToMarkdown(editorRef.current.innerHTML);
    md = stripBoldMarkdown(md);
    renderContent(md);
    lastValue.current = md;
    onContentChange(md);
    editorRef.current.focus();
  }, [mentionState, onContentChange, renderContent]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Escape = dismiss mention dropdown
    if (e.key === 'Escape' && mentionState) {
      e.preventDefault();
      setMentionState(null);
      return;
    }

    // Prevent Cmd+B bold (we don't support bold in scratch pad)
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      return;
    }
  }, [mentionState]);

  const handleInput = useCallback(() => {
    emitChange();
    checkMentionTrigger();
  }, [emitChange, checkMentionTrigger]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    // Paste as plain text only — no rich formatting
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Main editor */}
      <div className="flex-1 overflow-y-auto admin-scrollbar px-12 py-8">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="min-h-full text-admin-text-primary text-base leading-relaxed outline-none font-admin-body max-w-3xl mx-auto"
          data-placeholder="Start writing your script here..."
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        />
        {mentionState && (
          <MentionDropdown
            type={mentionState.type}
            query={mentionState.query}
            characters={characters}
            tags={tags}
            position={mentionState.position}
            onSelect={handleMentionSelect}
            onDismiss={() => setMentionState(null)}
          />
        )}
      </div>
    </div>
  );
}
