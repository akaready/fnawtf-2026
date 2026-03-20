'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { User, Pencil, Trash2, Check, X, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { getComments, updateComment, deleteComment } from './actions';

interface Comment {
  id: string;
  beat_id: string;
  viewer_email: string;
  viewer_name: string | null;
  content: string;
  is_admin: boolean;
  created_at: string;
  avatar_url: string | null;
}

interface Props {
  shareId: string;
  beatId: string | null;
  viewerEmail: string;
  viewerName: string | null;
  open: boolean;
  onToggle: () => void;
  refreshKey: number;
}

function formatPT(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function CommentSidebar({ shareId, beatId, viewerEmail, viewerName: _viewerName, open, onToggle, refreshKey }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadComments = useCallback(async () => {
    if (!beatId) return;
    setLoading(true);
    try {
      const data = await getComments(shareId, beatId);
      setComments(data as Comment[]);
    } finally {
      setLoading(false);
    }
  }, [shareId, beatId]);

  useEffect(() => {
    loadComments();
  }, [loadComments, refreshKey]);

  return (
    <div className="hidden md:flex md:relative md:flex-shrink-0 md:h-full">
      {/* Re-open button — always rendered, hidden behind sidebar via z-index */}
      <button
        onClick={onToggle}
        className={`absolute right-2 top-2 z-[5] h-8 flex items-center gap-1.5 px-2.5 rounded bg-[#1a1a1a] text-white/70 hover:bg-[#252525] hover:text-white transition-opacity duration-300 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        title="Show comments"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest">Comments</span>
        <PanelRightOpen size={14} />
      </button>

      {/* Sidebar */}
      <div
        className={`h-full border-l border-admin-border bg-admin-bg-sidebar overflow-hidden z-10 relative transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'w-[260px]' : 'w-0'}`}
      >
        <div className="w-[260px] h-full flex flex-col">
          {/* Header — same h-[3rem] as left sidebar */}
          <div className="h-[3rem] flex items-center justify-between px-4 border-b border-admin-border flex-shrink-0">
            <span className="text-xs font-semibold uppercase tracking-widest text-admin-text-faint">
              Comments {comments.length > 0 && `(${comments.length})`}
            </span>
            <button
              onClick={onToggle}
              className="w-7 h-7 flex items-center justify-center rounded text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
            >
              <PanelRightClose size={14} />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto admin-scrollbar-auto">
            {loading && comments.length === 0 && (
              <p className="px-4 py-6 text-xs text-muted-foreground/40 text-center">Loading...</p>
            )}
            {!loading && comments.length === 0 && (
              <p className="px-4 py-6 text-xs text-muted-foreground/40 text-center">No comments on this beat yet.</p>
            )}
            {comments.map(comment => (
              <CommentRow
                key={comment.id}
                comment={comment}
                isOwn={comment.viewer_email === viewerEmail}
                onUpdate={loadComments}
                viewerEmail={viewerEmail}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Individual comment ───────────────────────────────────────────────────

function CommentRow({
  comment,
  isOwn,
  onUpdate,
  viewerEmail,
}: {
  comment: Comment;
  isOwn: boolean;
  onUpdate: () => void;
  viewerEmail: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!editText.trim()) return;
    startTransition(async () => {
      await updateComment(comment.id, viewerEmail, editText.trim());
      setEditing(false);
      onUpdate();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteComment(comment.id, viewerEmail);
      setConfirmDelete(false);
      onUpdate();
    });
  };

  const firstName = comment.viewer_name?.split(' ')[0] || 'Anonymous';

  return (
    <div className="group/comment px-4 py-3 border-b border-border/20 hover:bg-white/[0.02] transition-colors">
      {/* Header: avatar + name + time */}
      <div className="flex items-center gap-2 mb-1.5">
        {/* Avatar */}
        {comment.avatar_url ? (
          <img src={comment.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
            <User size={10} className="text-muted-foreground/50" />
          </div>
        )}
        <span className="text-xs font-medium text-foreground/80">{firstName}</span>
        <span className="text-[10px] text-muted-foreground/40 ml-auto">{formatPT(comment.created_at)}</span>
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={3}
            className="w-full bg-white/[0.04] border border-border rounded px-2 py-1.5 text-xs text-foreground resize-none focus:outline-none"
            autoFocus
          />
          <div className="flex items-center gap-1">
            <button onClick={handleSave} disabled={isPending} className="text-xs text-foreground/60 hover:text-foreground px-2 py-1 rounded bg-white/[0.06] transition-colors">Save</button>
            <button onClick={() => { setEditing(false); setEditText(comment.content); }} className="text-xs text-muted-foreground/40 hover:text-foreground px-2 py-1 transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
      )}

      {/* Actions — own comments only, on hover */}
      {isOwn && !editing && (
        <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover/comment:opacity-100 transition-opacity">
          <button
            onClick={() => { setEditing(true); setEditText(comment.content); }}
            className="text-muted-foreground/30 hover:text-foreground/60 p-0.5 transition-colors"
            title="Edit"
          >
            <Pencil size={11} />
          </button>
          {confirmDelete ? (
            <>
              <button onClick={handleDelete} disabled={isPending} className="text-red-400 hover:text-red-300 p-0.5 transition-colors" title="Confirm delete">
                <Check size={11} />
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-muted-foreground/40 hover:text-foreground/60 p-0.5 transition-colors" title="Cancel">
                <X size={11} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-muted-foreground/30 hover:text-red-400 p-0.5 transition-colors"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
