'use client';

import { useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import { addComment } from './actions';

interface Props {
  shareId: string;
  beatId: string;
  viewerEmail: string;
  viewerName: string | null;
  onCommentAdded: () => void;
}

export function CommentInput({ shareId, beatId, viewerEmail, viewerName, onCommentAdded }: Props) {
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!text.trim()) return;
    const content = text.trim();
    setText('');
    startTransition(async () => {
      await addComment(shareId, beatId, viewerEmail, viewerName, content);
      onCommentAdded();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-3 px-6 py-4 border-t border-border bg-[#0a0a0a]">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Share your feedback on this story beat..."
        rows={2}
        className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-colors"
      />
      <button
        onClick={handleSubmit}
        disabled={isPending || !text.trim()}
        className="flex-shrink-0 px-4 h-[42px] flex items-center justify-center gap-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        title="Submit"
      >
        <Send size={13} />
        Send
      </button>
    </div>
  );
}
