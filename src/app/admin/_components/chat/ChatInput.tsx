'use client';

import { useRef, useState, type KeyboardEvent, type ChangeEvent } from 'react';
import { Send, ChevronDown } from 'lucide-react';
import { useChatContext } from './ChatContext';
import { MODEL_OPTIONS, type ModelId } from './types';

const MAX_HEIGHT = 160;

export function ChatInput() {
  const { sendMessage, isStreaming, selectedModel, setSelectedModel } = useChatContext();
  const [text, setText] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT) + 'px';
  };

  return (
    <div className="border-t border-admin-border p-3 space-y-2">
      {/* Input area */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your data..."
          rows={1}
          className="flex-1 bg-admin-bg-overlay border border-admin-border rounded-xl px-3 py-2 text-sm text-admin-text-primary placeholder:text-admin-text-faint resize-none focus:outline-none focus:border-admin-border-emphasis transition-colors overflow-hidden"
          style={{ maxHeight: MAX_HEIGHT, overflowY: text.split('\n').length > 5 ? 'auto' : 'hidden', scrollbarWidth: 'none' }}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isStreaming}
          className="flex-shrink-0 w-9 self-stretch flex items-center justify-center rounded-xl bg-white text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
        >
          <Send size={14} />
        </button>
      </div>

      {/* Footer: model selector + hint */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setModelOpen(!modelOpen)}
            className="flex items-center gap-1.5 text-[10px] text-admin-text-faint hover:text-[#888] transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500/80" />
            {MODEL_OPTIONS.find((m) => m.id === selectedModel)?.label}
            <ChevronDown size={8} />
          </button>
          {modelOpen && (
            <div className="absolute bottom-full left-0 mb-1 bg-admin-bg-overlay border border-admin-border rounded-lg py-1 z-10 min-w-[140px]">
              {MODEL_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedModel(m.id as ModelId);
                    setModelOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-admin-bg-hover transition-colors flex items-center justify-between ${
                    selectedModel === m.id ? 'text-admin-text-primary' : 'text-[#888]'
                  }`}
                >
                  <span>{m.label}</span>
                  <span className="text-admin-text-faint">{m.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-[10px] text-admin-text-ghost">⌘+Enter to send</p>
      </div>
    </div>
  );
}
