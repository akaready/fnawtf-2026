'use client';

import { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { MentionDropdown } from './MentionDropdown';
import { markdownToHtml, htmlToMarkdown } from '@/lib/scripts/parseContent';
import type { ScriptCharacterRow, ScriptTagRow, ScriptLocationRow, ScriptProductRow } from '@/types/scripts';

export interface ScratchScene {
  label: string;
  /** Scene description extracted from [BRACKETED TEXT] in the heading */
  description?: string;
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
  products?: ScriptProductRow[];
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
    // Must have at least 2 uppercase letters, no lowercase (outside brackets)
    // Extract [DESCRIPTION] if present
    const bracketMatch = plain.match(/\[([^\]]+)\]/);
    const withoutBrackets = plain.replace(/\[[^\]]*\]/g, '').trim();
    if (/[A-Z]{2,}/.test(withoutBrackets) && !/[a-z]/.test(withoutBrackets)) {
      scenes.push({
        label: withoutBrackets,
        description: bracketMatch ? bracketMatch[1] : undefined,
        sceneIndex: sceneIdx++,
      });
    }
  }
  return scenes;
}

export const ScriptScratchPad = forwardRef<ScriptScratchPadHandle, Props>(
  function ScriptScratchPad({ initialContent, characters, tags, locations, products = [], onContentChange, onScenesDetected }, ref) {
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

  // Expose scrollToScene — scene headings are now .scratch-scene-heading divs
  useImperativeHandle(ref, () => ({
    scrollToScene(_sceneLabel: string, sceneIndex: number) {
      const el = editorRef.current;
      const container = scrollContainerRef.current;
      if (!el || !container) return;
      const headings = el.querySelectorAll('.scratch-scene-heading');
      const target = headings[sceneIndex];
      if (!target) return;
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      container.scrollTo({
        top: container.scrollTop + targetRect.top - containerRect.top - 24,
        behavior: 'smooth',
      });
    },
  }), []);

  // Render content: use markdownToHtml for mentions but strip bold.
  // markdownToHtml sanitizes all output via DOMPurify — safe for innerHTML.
  const renderContent = useCallback((md: string) => {
    if (!editorRef.current) return;
    const cleaned = stripBoldMarkdown(md);
    // markdownToHtml sanitizes via DOMPurify — safe for innerHTML
    editorRef.current.innerHTML = markdownToHtml(cleaned, characters, tags, locations, products);
  }, [characters, tags, locations, products]);

  // Render on mount and whenever characters/tags/locations change (re-colors existing mentions)
  useEffect(() => {
    renderContent(lastValue.current);
  }, [renderContent]);

  // Detect scenes on mount
  useEffect(() => {
    onScenesDetected?.(detectScenes(lastValue.current));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Classify browser-created block elements during live typing.
   * When the user presses Enter, contentEditable creates bare <div> elements
   * without our CSS classes. This walks the editor's children and applies
   * scratch-scene-heading or scratch-paragraph based on content.
   */
  const classifyBlocks = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    for (const child of Array.from(el.children)) {
      if (!(child instanceof HTMLElement) || child.tagName !== 'DIV') continue;
      // Strip HTML tags and mention @ prefixes for plain text check
      const plain = child.textContent?.replace(/@/g, '').trim() ?? '';
      const isHeading = plain.length > 0 && /[A-Z]{2,}/.test(plain) && !/[a-z]/.test(plain);
      if (isHeading) {
        child.classList.add('scratch-scene-heading');
        child.classList.remove('scratch-paragraph');
      } else {
        child.classList.add('scratch-paragraph');
        child.classList.remove('scratch-scene-heading');
      }
    }
  }, []);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    classifyBlocks();
    let md = htmlToMarkdown(editorRef.current.innerHTML);
    md = stripBoldMarkdown(md);
    setIsEmpty(!md.trim());
    if (md !== lastValue.current) {
      lastValue.current = md;
      onContentChange(md);
      onScenesDetected?.(detectScenes(md));
    }
  }, [classifyBlocks, onContentChange, onScenesDetected]);

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

  const handleMentionSelect = useCallback((item: ScriptCharacterRow | ScriptTagRow | ScriptLocationRow | ScriptProductRow) => {
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

    setMentionState(null);

    // Before re-render, count how many existing mention spans for this entity
    // appear BEFORE our text node in document order. After re-render, the new
    // mention span will be at this index (0-based).
    let precedingMentions = 0;
    const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_ALL);
    let walkNode: Node | null;
    while ((walkNode = walker.nextNode()) !== null) {
      if (walkNode === node) break;
      if (walkNode instanceof HTMLElement) {
        if (mentionState?.type === 'character') {
          const entity = item as ScriptCharacterRow | ScriptLocationRow;
          if (walkNode.dataset.characterId === entity.id || walkNode.dataset.locationId === entity.id) {
            precedingMentions++;
          }
        } else {
          const tag = item as ScriptTagRow;
          if (walkNode.dataset.tagSlug === tag.slug) {
            precedingMentions++;
          }
        }
      }
    }
    const mentionIndex = precedingMentions; // 0-based

    let md = htmlToMarkdown(editorRef.current.innerHTML);
    md = stripBoldMarkdown(md);

    // Save scroll position before re-render (renderContent replaces innerHTML
    // and cursor placement can cause the browser to auto-scroll)
    const container = scrollContainerRef.current;
    const savedScroll = container?.scrollTop ?? 0;

    renderContent(md);
    lastValue.current = md;
    onContentChange(md);
    onScenesDetected?.(detectScenes(md));

    // Restore cursor: find the Nth matching span and place cursor after it
    const el = editorRef.current;
    const placeCursor = (span: Element) => {
      const r = document.createRange();
      r.setStartAfter(span);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      // Restore scroll position — prevent viewport jump
      if (container) container.scrollTop = savedScroll;
    };

    if (mentionState?.type === 'character') {
      const entity = item as ScriptCharacterRow | ScriptLocationRow;
      const locSpans = el.querySelectorAll(`[data-location-id="${entity.id}"]`);
      const charSpans = el.querySelectorAll(`[data-character-id="${entity.id}"]`);
      const allSpans = [...Array.from(locSpans), ...Array.from(charSpans)];
      const targetSpan = allSpans.length > 0 ? allSpans[Math.min(mentionIndex, allSpans.length - 1)] : null;
      if (targetSpan) { placeCursor(targetSpan); return; }
    } else {
      const tag = item as ScriptTagRow;
      const spans = el.querySelectorAll(`[data-tag-slug="${tag.slug}"]`);
      const targetSpan = spans.length > 0 ? spans[Math.min(mentionIndex, spans.length - 1)] : null;
      if (targetSpan) { placeCursor(targetSpan); return; }
    }
    // Fallback: focus at end, restore scroll
    el.focus();
    if (container) container.scrollTop = savedScroll;
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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto admin-scrollbar px-12 pt-8">
        <div className="relative min-h-full">
          {/* Placeholder overlay — visible only when editor is empty */}
          {isEmpty && (
            <div className="absolute inset-0 pointer-events-none select-none font-admin-mono text-admin-text-ghost text-sm leading-relaxed whitespace-pre-line">
{`ALL CAPS  scene heading
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
        {/* Bottom spacer — lets the last scene scroll to the top; click focuses editor at end */}
        <div
          className="h-[80vh] cursor-text"
          onClick={() => {
            const el = editorRef.current;
            const container = scrollContainerRef.current;
            if (!el || !container) return;
            // Save scroll position before focus
            const scrollTop = container.scrollTop;
            // Place cursor at end without selecting all
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
            }
            // Restore scroll position (focus may have jumped)
            container.scrollTop = scrollTop;
          }}
        />
      </div>
    </div>
  );
});
