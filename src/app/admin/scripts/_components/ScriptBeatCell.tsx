'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { markdownToHtml, htmlToMarkdown } from '@/lib/scripts/parseContent';
import { MentionDropdown } from './MentionDropdown';
import type { ScriptCharacterRow, ScriptTagRow, ScriptLocationRow, ScriptProductRow } from '@/types/scripts';

/** Place cursor immediately after the mention span for `itemId` that follows `before` text. */
function positionCursorAfterMention(container: HTMLElement, before: string, itemId: string) {
  const selector = [
    `[data-character-id="${itemId}"]`,
    `[data-location-id="${itemId}"]`,
    `[data-product-id="${itemId}"]`,
  ].join(', ');
  const allSpans = Array.from(container.querySelectorAll(selector)) as Element[];
  if (allSpans.length === 0) return;

  // Default to the last span; if multiple, find the one whose preceding text ends with `before`
  let targetSpan = allSpans[allSpans.length - 1];
  if (allSpans.length > 1) {
    for (const span of allSpans) {
      const prev = span.previousSibling;
      if (prev?.nodeType === Node.TEXT_NODE && (prev.textContent ?? '').endsWith(before)) {
        targetSpan = span;
        break;
      }
    }
  }

  // selectNode + collapse(false) is the unambiguous "cursor right after this element"
  // — avoids browser quirks with setStart(textNode, 0) adjacent to contenteditable="false"
  const range = document.createRange();
  range.selectNode(targetSpan);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

interface Props {
  value: string;
  field: 'audio_content' | 'visual_content' | 'notes_content';
  onChange: (value: string) => void;
  onAddBeat?: () => void;
  onAddScene?: () => void;
  isLastColumn?: boolean;
  characters: ScriptCharacterRow[];
  tags: ScriptTagRow[];
  locations?: ScriptLocationRow[];
  products?: ScriptProductRow[];
  beatId?: string;
  /** If set, another user has this cell locked */
  lockedBy?: { email: string } | null;
  /** Called when this cell gains focus */
  onCellFocus?: () => void;
  /** Called when this cell loses focus */
  onCellBlur?: () => void;
}

export function ScriptBeatCell({ value, field, onChange, onAddBeat, onAddScene, isLastColumn, characters, tags, locations = [], products = [], beatId, lockedBy, onCellFocus, onCellBlur }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);
  const lastValue = useRef(value);

  const mentionJustSelected = useRef(false);
  const isFocused = useRef(false);
  const selectedMentionRef = useRef<Element | null>(null);
  const isExitingToken = useRef(false);

  // Mention state
  const [mentionState, setMentionState] = useState<{
    type: 'character' | 'tag';
    query: string;
    position: { x: number; y: number };
  } | null>(null);

  // Set content from markdown (sanitized by markdownToHtml via DOMPurify)
  const setContent = useCallback((md: string) => {
    if (!ref.current) return;
    // markdownToHtml sanitizes all output via DOMPurify — safe for innerHTML
    const sanitizedHtml = markdownToHtml(md, characters, tags, locations, products, { noHeadings: field !== 'notes_content' });
    ref.current.innerHTML = sanitizedHtml;
  }, [characters, tags, locations, products]);

  // Update when value changes from outside (not from own edits)
  useEffect(() => {
    if (lastValue.current !== value) {
      lastValue.current = value;
      setContent(value);
    }
    // setContent intentionally excluded — entity list changes handled by the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Re-render when entity lists change (e.g. products load async after mount).
  // setContent identity only changes when [characters, tags, locations, products] changes.
  useEffect(() => {
    setContent(lastValue.current);
    // value intentionally excluded — external value changes handled by the effect above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setContent]);

  const emitChange = useCallback(() => {
    if (!ref.current) return;
    const md = htmlToMarkdown(ref.current.innerHTML);
    if (md !== lastValue.current) {
      lastValue.current = md;
      onChange(md);
    }
  }, [onChange]);

  const checkMentionTrigger = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) {
      setMentionState(null);
      return;
    }

    const range = sel.getRangeAt(0);
    if (!range.collapsed) {
      setMentionState(null);
      return;
    }

    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) {
      setMentionState(null);
      return;
    }

    const text = node.textContent?.slice(0, range.startOffset) ?? '';
    const atMatch = text.match(/@(\w*)$/);
    const hashMatch = text.match(/#(\w*)$/);

    if (atMatch) {
      const rect = range.getBoundingClientRect();
      setMentionState({
        type: 'character',
        query: atMatch[1],
        position: { x: rect.left, y: rect.bottom + 4 },
      });
    } else if (hashMatch) {
      const rect = range.getBoundingClientRect();
      setMentionState({
        type: 'tag',
        query: hashMatch[1],
        position: { x: rect.left, y: rect.bottom + 4 },
      });
    } else {
      setMentionState(null);
    }
  }, []);

  const handleMentionSelect = useCallback((item: ScriptCharacterRow | ScriptTagRow | ScriptLocationRow | ScriptProductRow) => {
    if (!ref.current) return;

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
      // Characters, locations, and products all use the @ trigger
      const entity = item as ScriptCharacterRow | ScriptLocationRow | ScriptProductRow;
      replacement = `@[${entity.name}](${entity.id})`;
    } else {
      const tag = item as ScriptTagRow;
      replacement = `#[${tag.slug}]`;
    }

    node.textContent = before + replacement + after;

    const newOffset = before.length + replacement.length;
    range.setStart(node, Math.min(newOffset, node.textContent.length));
    range.setEnd(node, Math.min(newOffset, node.textContent.length));
    sel.removeAllRanges();
    sel.addRange(range);

    setMentionState(null);
    mentionJustSelected.current = true;
    setTimeout(() => { mentionJustSelected.current = false; }, 50);

    // Re-render with proper mention styling (sanitized)
    const md = htmlToMarkdown(ref.current.innerHTML);
    setContent(md);
    lastValue.current = md;
    onChange(md);
    ref.current.focus();

    // Re-place cursor after the inserted mention span (setContent replaced innerHTML)
    positionCursorAfterMention(ref.current, before, item.id);
  }, [mentionState, onChange, setContent]);

  // Selection-change listener: when cursor moves adjacent to a mention, highlight it and
  // track it so arrow keys can skip over it and Delete can remove it.
  // Cursor stays collapsed (no text selection inside the box).
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!ref.current || !isFocused.current || mentionJustSelected.current) return;
      if (isExitingToken.current) return;

      // Clear previous highlight
      if (selectedMentionRef.current) {
        selectedMentionRef.current.classList.remove('mention-highlighted');
        selectedMentionRef.current = null;
        ref.current.style.caretColor = '';
      }

      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (!range.collapsed) return;
      const node = range.startContainer;
      if (node.nodeType !== Node.TEXT_NODE) return;
      const offset = range.startOffset;
      const len = node.textContent?.length ?? 0;

      let adjacentSpan: Element | null = null;
      if (offset === len) {
        const next = node.nextSibling;
        if (next instanceof Element && next.classList.contains('script-mention')) adjacentSpan = next;
      }
      if (offset === 0) {
        const prev = node.previousSibling;
        if (prev instanceof Element && prev.classList.contains('script-mention')) adjacentSpan = prev;
      }
      if (!adjacentSpan) return;

      adjacentSpan.classList.add('mention-highlighted');
      selectedMentionRef.current = adjacentSpan;
      ref.current.style.caretColor = 'transparent';
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Mention token selected: Arrow moves cursor to outside edge; Delete removes span
    if (selectedMentionRef.current && !mentionState) {
      const span = selectedMentionRef.current;
      const sel = window.getSelection();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        span.classList.remove('mention-highlighted');
        selectedMentionRef.current = null;
        ref.current?.style && (ref.current.style.caretColor = '');
        isExitingToken.current = true;
        setTimeout(() => { isExitingToken.current = false; }, 50);
        const r = document.createRange();
        if (e.key === 'ArrowLeft') r.setStartBefore(span);
        else r.setStartAfter(span);
        r.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(r);
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        span.classList.remove('mention-highlighted');
        selectedMentionRef.current = null;
        ref.current?.style && (ref.current.style.caretColor = '');
        span.parentNode?.removeChild(span);
        emitChange();
        return;
      }
      // Any other key: deselect token and let it through normally
      span.classList.remove('mention-highlighted');
      selectedMentionRef.current = null;
      ref.current?.style && (ref.current.style.caretColor = '');
    }

    // Cmd+Shift+Backspace/Delete = delete beat row (handled by canvas, stop contentEditable default)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      // Let the document-level handler in ScriptEditorCanvas pick this up
      return;
    }

    // Bold toggle
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      document.execCommand('bold');
      emitChange();
      return;
    }

    // Skip Enter if mention was just selected (dropdown handled it)
    if (e.key === 'Enter' && mentionJustSelected.current) {
      e.preventDefault();
      return;
    }

    // Cmd+Shift+Enter = new scene
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && e.shiftKey && !mentionState) {
      e.preventDefault();
      emitChange();
      onAddScene?.();
      return;
    }

    // Cmd+Enter = new beat
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !mentionState) {
      e.preventDefault();
      emitChange();
      onAddBeat?.();
      return;
    }

    // Enter / Shift+Enter = line break within beat
    if (e.key === 'Enter' && !mentionState) {
      e.preventDefault();
      document.execCommand('insertLineBreak');
      emitChange();
      return;
    }

    // Tab at end of last visible column = new beat
    if (e.key === 'Tab' && !e.shiftKey && isLastColumn && !mentionState) {
      e.preventDefault();
      emitChange();
      onAddBeat?.();
      return;
    }

    if (e.key === 'Escape' && mentionState) {
      e.preventDefault();
      setMentionState(null);
      return;
    }

    // Arrow up/down: navigate between beats when at first/last line
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !mentionState) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || !ref.current) return;
      const range = sel.getRangeAt(0);
      const rangeRect = range.getBoundingClientRect();
      const containerRect = ref.current.getBoundingClientRect();
      const isFirstLine = rangeRect.top - containerRect.top < 20;
      const isLastLine = containerRect.bottom - rangeRect.bottom < 20;

      if ((e.key === 'ArrowUp' && isFirstLine) || (e.key === 'ArrowDown' && isLastLine)) {
        const allCells = Array.from(document.querySelectorAll(`[data-field="${field}"][contenteditable]`));
        const currentIdx = allCells.indexOf(ref.current);
        const targetIdx = e.key === 'ArrowUp' ? currentIdx - 1 : currentIdx + 1;
        if (targetIdx >= 0 && targetIdx < allCells.length) {
          e.preventDefault();
          (allCells[targetIdx] as HTMLElement).focus();
          // Place cursor at start (up) or end (down) of target
          const targetEl = allCells[targetIdx] as HTMLElement;
          const newRange = document.createRange();
          const newSel = window.getSelection();
          if (e.key === 'ArrowUp' && targetEl.lastChild) {
            newRange.selectNodeContents(targetEl);
            newRange.collapse(false); // end
          } else if (targetEl.firstChild) {
            newRange.selectNodeContents(targetEl);
            newRange.collapse(true); // start
          }
          newSel?.removeAllRanges();
          newSel?.addRange(newRange);
        }
      }
    }
  }, [emitChange, mentionState, onAddBeat, onAddScene, isLastColumn, field]);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    emitChange();
    checkMentionTrigger();
  }, [emitChange, checkMentionTrigger]);

  const handleWrapperMouseDown = useCallback((e: React.MouseEvent) => {
    // If the click landed on the wrapper itself (not on the contenteditable or its children),
    // focus the editor and place cursor at the end of content.
    if (e.target !== e.currentTarget || !ref.current) return;
    e.preventDefault();
    ref.current.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, []);

  return (
    <div
      className="relative min-w-0 overflow-hidden border-b border-admin-border-subtle"
      onMouseDown={handleWrapperMouseDown}
    >
      {/* Lock overlay */}
      {lockedBy && (
        <div className="absolute inset-0 z-10 bg-admin-bg-hover/40 cursor-not-allowed flex items-end justify-end pointer-events-auto">
          <span className="m-1 w-5 h-5 rounded-full bg-admin-info/20 border border-admin-info/40 flex items-center justify-center text-[9px] font-medium text-admin-info uppercase" title={`Editing: ${lockedBy.email}`}>
            {lockedBy.email[0]}
          </span>
        </div>
      )}
      <div
        ref={ref}
        contentEditable={!lockedBy}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => { isFocused.current = true; onCellFocus?.(); }}
        onBlur={() => {
          isFocused.current = false;
          onCellBlur?.();
          if (selectedMentionRef.current) {
            selectedMentionRef.current.classList.remove('mention-highlighted');
            selectedMentionRef.current = null;
          }
          ref.current?.style && (ref.current.style.caretColor = '');
          emitChange();
          setTimeout(() => setMentionState(null), 200);
        }}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
        data-beat-id={beatId}
        data-field={field}
        className="min-h-[2.5rem] px-3 py-2 text-sm text-admin-text-primary outline-none focus:bg-admin-bg-hover/50 transition-colors [&_strong]:font-bold"
      />

      {mentionState && (
        <MentionDropdown
          type={mentionState.type}
          query={mentionState.query}
          characters={characters}
          tags={tags}
          locations={locations}
          products={products}
          position={mentionState.position}
          onSelect={handleMentionSelect}
          onDismiss={() => setMentionState(null)}
        />
      )}
    </div>
  );
}
