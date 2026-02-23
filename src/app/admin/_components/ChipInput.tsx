'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  suggestions?: string[];
}

export function ChipInput({ value, onChange, placeholder = 'Add tag…', disabled, suggestions = [] }: Props) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter(
    (s) => !value.includes(s) && s.toLowerCase().includes(input.toLowerCase())
  );

  const add = (tag?: string) => {
    const trimmed = (tag ?? input).trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
    setHighlightIndex(-1);
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    // Let macOS system shortcuts pass through (Cmd+A, Cmd+C, Shift+arrows, etc.)
    if (e.metaKey || e.ctrlKey) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filtered.length > 0) {
        setHighlightIndex((i) => (i + 1) % filtered.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filtered.length > 0) {
        setHighlightIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < filtered.length) {
        add(filtered[highlightIndex]);
      } else {
        add();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightIndex(-1);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={`flex flex-wrap gap-1.5 min-h-[42px] px-3 py-2 bg-black border border-border rounded-lg focus-within:border-white/30 transition-colors ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/8 border border-border/60 rounded-md text-xs text-foreground"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(tag); }}
                className="text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                <X size={10} />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={onKey}
          onBlur={() => {
            // Delay to allow click on suggestion
            setTimeout(() => {
              if (input.trim()) add();
              setShowSuggestions(false);
            }, 150);
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-24 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-[#111] border border-border/60 rounded-lg shadow-xl">
          {filtered.map((suggestion, i) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(suggestion);
                inputRef.current?.focus();
              }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                i === highlightIndex
                  ? 'bg-white/10 text-foreground'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
