import type { ScriptShareCommentRow } from '@/types/scripts';

/** Deterministic avatar color from email hash */
export function avatarColor(email: string): string {
  let hash = 0;
  for (const ch of email) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  const colors = ['#e67e22','#3b82f6','#22c55e','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f59e0b','#14b8a6','#6366f1'];
  return colors[Math.abs(hash) % colors.length];
}

/** Two-letter initials from name or email */
export function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

/** First name from full name or email */
export function firstName(viewerName: string | null, email?: string): string {
  if (viewerName) return viewerName.split(' ')[0];
  if (email) return email.split('@')[0];
  return 'Anonymous';
}

/** Relative time string (e.g. "2h ago", "3d ago") */
export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Thread: a parent comment with its replies */
export interface CommentThread {
  parent: ScriptShareCommentRow;
  replies: ScriptShareCommentRow[];
}

/** Group flat comments into threads (parent + replies) */
export function groupIntoThreads(comments: ScriptShareCommentRow[]): CommentThread[] {
  const parentMap = new Map<string, ScriptShareCommentRow>();
  const replyMap = new Map<string, ScriptShareCommentRow[]>();

  for (const c of comments) {
    if (!c.parent_comment_id) {
      parentMap.set(c.id, c);
    } else {
      if (!replyMap.has(c.parent_comment_id)) replyMap.set(c.parent_comment_id, []);
      replyMap.get(c.parent_comment_id)!.push(c);
    }
  }

  const threads: CommentThread[] = [];
  for (const parent of parentMap.values()) {
    threads.push({
      parent,
      replies: (replyMap.get(parent.id) ?? []).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    });
  }

  // Sort threads by creation time
  threads.sort((a, b) => new Date(a.parent.created_at).getTime() - new Date(b.parent.created_at).getTime());
  return threads;
}
