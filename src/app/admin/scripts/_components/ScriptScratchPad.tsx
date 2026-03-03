'use client';

import { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { MentionDropdown } from './MentionDropdown';
import { markdownToHtml, htmlToMarkdown } from '@/lib/scripts/parseContent';
import type { ScriptCharacterRow, ScriptTagRow, ScriptLocationRow } from '@/types/scripts';

export interface ScratchScene {
  label: string;
  /** Index among all detected scenes (0-based), used as a stable key for scroll targeting */
  sceneIndex: number;
}

export interface ScriptScratchPadHandle {
  scrollToScene: (sceneLabel: string, sceneIndex: number) => void;
}

interface Props {
  scriptId: string;
  initialContent: string;
  characters: ScriptCharacterRow[];
  tags: ScriptTagRow[];
  locations: ScriptLocationRow[];
  onContentChange: (content: string) => void;
  onScenesDetected?: (scenes: ScratchScene[]) => void;
}

/**
 * Strip bold markdown — scratch pad is plain text only (no **bold**).
 * Keeps @[Name](id) and #[slug] mentions intact.
 */
function stripBoldMarkdown(md: string): string {
  return md.replace(/\*\*(.+?)\*\*/g, '$1');
}

/**
 * Detect ALL CAPS lines as scene headings.
 * A line qualifies if it has at least 2 consecutive uppercase letters
 * and no lowercase letters (ignoring whitespace, digits, punctuation).
 */
function detectScenes(md: string): ScratchScene[] {
  const lines = md.split('\n');
  const scenes: ScratchScene[] = [];
  let sceneIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Strip mention markup for detection: @[Name](id) → Name
    const plain = line.replace(/@\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/#\[[^\]]+\]/g, '');
    // Must have at least 2 uppercase letters, no lowercase
    if (/[A-Z]{2,}/.test(plain) && !/[a-z]/.test(plain)) {
      scenes.push({ label: plain, sceneIndex: sceneIdx++ });
    }
  }
  return scenes;
}

export const ScriptScratchPad = forwardRef<ScriptScratchPadHandle, Props>(
  function ScriptScratchPad({ initialContent, characters, tags, locations, onContentChange, onScenesDetected }, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastValue = useRef(initialContent);
  const [isEmpty, setIsEmpty] = useState(!initialContent.trim());
  // Mention state — @ queries both characters and locations
  const [mentionState, setMentionState] = useState<{
    type: 'character' | 'tag';
    query: string;
    position: { x: number; y: number };
  } | null>(null);

  /**
   * Post-process the editor DOM: stamp data-scene-index on ALL CAPS block elements.
   * Called after every render so scrollToScene can find them via querySelector.
   */
  const stampSceneAnchors = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    // Clear old markers
    el.querySelectorAll('[data-scene-index]').forEach(n => n.removeAttribute('data-scene-index'));
    // Walk direct children (divs / text lines in contentEditable)
    let sceneIdx = 0;
    for (const child of Array.from(el.childNodes)) {
      const text = (child.textContent ?? '').trim();
      if (!text) continue;
      if (/[A-Z]{2,}/.test(text) && !/[a-z]/.test(text)) {
        const target = child instanceof HTMLElement ? child : child.parentElement;
        if (target && target !== el) {
          target.setAttribute('data-scene-index', String(sceneIdx++));
        }
      }
    }
  }, []);

  // Expose scrollToScene — uses data-scene-index attributes stamped on DOM
  useImperativeHandle(ref, () => ({
    scrollToScene(_sceneLabel: string, sceneIndex: number) {
      const el = editorRef.current;
      const container = scrollContainerRef.current;
      if (!el || !container) return;
      const target = el.querySelector(`[data-scene-index="${sceneIndex}"]`);
      if (target) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        container.scrollTo({
          top: container.scrollTop + targetRect.top - containerRect.top,
          behavior: 'smooth',
        });
      }
    },
  }), []);

  // Render content: use markdownToHtml for mentions but strip bold.
  // markdownToHtml sanitizes all output via DOMPurify — safe for innerHTML.
  const renderContent = useCallback((md: string) => {
    if (!editorRef.current) return;
    const cleaned = stripBoldMarkdown(md);
    // markdownToHtml sanitizes via DOMPurify — safe for innerHTML
    editorRef.current.innerHTML = markdownToHtml(cleaned, characters, tags, locations);
    stampSceneAnchors();
  }, [characters, tags, locations, stampSceneAnchors]);

  // Render on mount and whenever characters/tags/locations change (re-colors existing mentions)
  useEffect(() => {
    renderContent(lastValue.current);
  }, [renderContent]);

  // Detect scenes on mount
  useEffect(() => {
    onScenesDetected?.(detectScenes(lastValue.current));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    let md = htmlToMarkdown(editorRef.current.innerHTML);
    md = stripBoldMarkdown(md);
    setIsEmpty(!md.trim());
    if (md !== lastValue.current) {
      lastValue.current = md;
      onContentChange(md);
      onScenesDetected?.(detectScenes(md));
      stampSceneAnchors();
    }
  }, [onContentChange, onScenesDetected, stampSceneAnchors]);

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
    onScenesDetected?.(detectScenes(md));
    editorRef.current.focus();
  }, [mentionState, onContentChange, onScenesDetected, renderContent]);

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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto admin-scrollbar px-12 py-8">
        <div className="relative min-h-full">
          {/* Placeholder overlay — visible only when editor is empty */}
          {isEmpty && (
            <div className="absolute inset-0 pointer-events-none select-none font-admin-mono text-admin-text-ghost text-sm leading-relaxed whitespace-pre-line">
{`---  new location
ALL CAPS  scene heading
@  character or location
#  special footage type
@Name:  spoken words or VO
Shot:  shot details and focus`}
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="min-h-full text-admin-text-primary text-base leading-relaxed outline-none font-admin-body"
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          />
        </div>
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
});
