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
    <div className="flex items-end gap-2 px-4 py-3 border-t border-border bg-black/30">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Share your feedback on this frame..."
        rows={2}
        className="flex-1 bg-white/[0.04] border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none focus:border-muted-foreground/30 transition-colors"
      />
      <button
        onClick={handleSubmit}
        disabled={isPending || !text.trim()}
        className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Submit"
      >
        <Send size={14} />
      </button>
    </div>
  );
}
