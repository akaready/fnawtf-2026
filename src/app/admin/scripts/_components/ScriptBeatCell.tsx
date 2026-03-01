'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { markdownToHtml, htmlToMarkdown } from '@/lib/scripts/parseContent';
import { MentionDropdown } from './MentionDropdown';
import type { ScriptCharacterRow, ScriptTagRow } from '@/types/scripts';

interface Props {
  value: string;
  field: 'audio_content' | 'visual_content' | 'notes_content';
  onChange: (value: string) => void;
  onAddBeat?: () => void;
  onAddScene?: () => void;
  isLastColumn?: boolean;
  characters: ScriptCharacterRow[];
  tags: ScriptTagRow[];
  beatId?: string;
}

export function ScriptBeatCell({ value, field, onChange, onAddBeat, onAddScene, isLastColumn, characters, tags, beatId }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);
  const lastValue = useRef(value);

  // Mention state
  const [mentionState, setMentionState] = useState<{
    type: 'character' | 'tag';
    query: string;
    position: { x: number; y: number };
  } | null>(null);

  // Set content from markdown (sanitized by markdownToHtml via DOMPurify)
  const setContent = useCallback((md: string) => {
    if (!ref.current) return;
    const sanitizedHtml = markdownToHtml(md, characters, tags);
    ref.current.innerHTML = sanitizedHtml;
  }, [characters, tags]);

  // Set initial content on mount
  useEffect(() => {
    setContent(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update when value changes externally
  useEffect(() => {
    if (lastValue.current !== value) {
      lastValue.current = value;
      setContent(value);
    }
  }, [value, setContent]);

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

  const handleMentionSelect = useCallback((item: ScriptCharacterRow | ScriptTagRow) => {
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
      const char = item as ScriptCharacterRow;
      replacement = `@[${char.name}](${char.id})`;
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

    // Re-render with proper mention styling (sanitized)
    const md = htmlToMarkdown(ref.current.innerHTML);
    setContent(md);
    lastValue.current = md;
    onChange(md);
    ref.current.focus();
  }, [mentionState, onChange, setContent]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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

    // Cmd+Enter = new scene
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !mentionState) {
      e.preventDefault();
      emitChange();
      onAddScene?.();
      return;
    }

    // Shift+Enter = line break within beat
    if (e.key === 'Enter' && e.shiftKey && !mentionState) {
      e.preventDefault();
      document.execCommand('insertLineBreak');
      emitChange();
      return;
    }

    // Enter = new beat
    if (e.key === 'Enter' && !mentionState) {
      e.preventDefault();
      emitChange();
      onAddBeat?.();
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

  return (
    <div className="relative min-w-0 overflow-hidden border-b border-b-[#0e0e0e]">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={() => {
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
          position={mentionState.position}
          onSelect={handleMentionSelect}
          onDismiss={() => setMentionState(null)}
        />
      )}
    </div>
  );
}
