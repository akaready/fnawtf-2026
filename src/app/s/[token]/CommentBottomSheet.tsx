'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { User, Pencil, Trash2, Check, X, MessageCircle } from 'lucide-react';
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

interface Props {
  shareId: string;
  beatId: string | null;
  viewerEmail: string;
  refreshKey: number;
}

export function CommentBottomSheet({ shareId, beatId, viewerEmail, refreshKey }: Props) {
  const [open, setOpen] = useState(false);
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
    if (open) loadComments();
  }, [open, loadComments, refreshKey]);

  // Also reload when beat changes
  useEffect(() => {
    if (open) loadComments();
  }, [beatId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); loadComments(); }}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1a1a1a] text-white/70 hover:bg-[#252525] hover:text-white transition-colors relative"
        title="Comments"
      >
        <MessageCircle size={16} />
        {comments.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-white text-black text-[9px] font-bold">
            {comments.length}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-[61] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-[#1a1a1a] border-t border-white/10 rounded-t-2xl max-h-[60vh] flex flex-col">
          {/* Handle + header */}
          <div className="flex flex-col items-center pt-3 pb-2 px-4 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20 mb-3" />
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
                Comments {comments.length > 0 && `(${comments.length})`}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Comment list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {loading && comments.length === 0 && (
              <p className="py-6 text-xs text-white/30 text-center">Loading...</p>
            )}
            {!loading && comments.length === 0 && (
              <p className="py-6 text-xs text-white/30 text-center">No comments on this beat yet.</p>
            )}
            {comments.map(comment => (
              <MobileCommentRow
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
    </>
  );
}

// ── Mobile comment row ───────────────────────────────────────────────────

function MobileCommentRow({
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
    <div className="py-3 border-b border-white/[0.06] last:border-0">
      {/* Header: avatar + name + time + actions */}
      <div className="flex items-center gap-2 mb-1.5">
        {comment.avatar_url ? (
          <img src={comment.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
            <User size={12} className="text-white/40" />
          </div>
        )}
        <span className="text-sm font-medium text-white/80">{firstName}</span>
        <span className="text-xs text-white/30 ml-auto">{formatPT(comment.created_at)}</span>
        {isOwn && !editing && (
          <div className="flex items-center gap-1">
            {confirmDelete ? (
              <button onClick={handleDelete} disabled={isPending} className="text-red-400 hover:text-red-300 p-1 transition-colors" title="Confirm delete">
                <Check size={13} />
              </button>
            ) : (
              <button onClick={() => { setEditing(true); setEditText(comment.content); }} className="text-white/25 hover:text-white/60 p-1 transition-colors" title="Edit">
                <Pencil size={13} />
              </button>
            )}
            {confirmDelete ? (
              <button onClick={() => setConfirmDelete(false)} className="text-white/30 hover:text-white/60 p-1 transition-colors" title="Cancel">
                <X size={13} />
              </button>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-white/25 hover:text-red-400 p-1 transition-colors" title="Delete">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-2 ml-8">
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={3}
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={isPending} className="text-xs text-white/70 hover:text-white px-3 py-1.5 rounded bg-white/[0.08] transition-colors">Save</button>
            <button onClick={() => { setEditing(false); setEditText(comment.content); }} className="text-xs text-white/40 hover:text-white px-3 py-1.5 transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap ml-8">{comment.content}</p>
      )}
    </div>
  );
}
