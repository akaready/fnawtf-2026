'use client';

import { User } from 'lucide-react';
import type { ScriptShareCommentRow } from '@/types/scripts';

interface Props {
  comments: ScriptShareCommentRow[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function firstName(viewerName: string | null): string {
  if (!viewerName) return 'Anonymous';
  return viewerName.split(' ')[0];
}

export function ScriptCommentsCell({ comments }: Props) {
  if (comments.length === 0) return null;

  return (
    <div className="px-3 py-2 space-y-3 min-h-0">
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-admin-bg-overlay border border-admin-border flex-shrink-0 flex items-center justify-center mt-0.5">
            <User className="w-3 h-3 text-admin-text-ghost" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <span className="text-admin-sm font-medium text-admin-cream truncate">
                {firstName(comment.viewer_name)}
              </span>
              <span className="text-admin-sm text-admin-text-faint flex-shrink-0">
                {comment.created_at ? formatTime(comment.created_at) : ''}
              </span>
            </div>
            <p className="text-admin-sm text-admin-text-secondary whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
