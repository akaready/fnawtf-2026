'use client';

import { useState, useRef, useEffect, useCallback, useTransition } from 'react';
import { User, Pencil, Trash2, Check, X, PanelRightClose, PanelRightOpen, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDirectionalFill } from '@/hooks/useDirectionalFill';
import gsap from 'gsap';
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
  clientLogoUrl?: string | null;
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

const iconVariants = {
  hidden: { opacity: 0, x: -6, width: 0, marginRight: -6 },
  visible: { opacity: 1, x: 0, width: 'auto', marginRight: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

export function CommentSidebar({ shareId, beatId, viewerEmail, viewerName: _viewerName, open, onToggle, refreshKey, clientLogoUrl }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const emailBtnRef = useRef<HTMLAnchorElement>(null);
  const emailFillRef = useRef<HTMLDivElement>(null);
  const [isEmailHovered, setIsEmailHovered] = useState(false);

  useDirectionalFill(emailBtnRef, emailFillRef, {
    onFillStart: () => {
      setIsEmailHovered(true);
      const textSpan = emailBtnRef.current?.querySelector('span');
      if (textSpan) gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
    },
    onFillEnd: () => {
      setIsEmailHovered(false);
      const textSpan = emailBtnRef.current?.querySelector('span');
      if (textSpan) gsap.to(textSpan, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
    },
  });

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
        className={`absolute right-4 top-4 z-[5] h-8 flex items-center gap-1.5 px-3 rounded bg-[#1a1a1a] text-white/70 hover:bg-[#252525] hover:text-white transition-opacity duration-300 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        title="Show comments"
      >
        <span className="text-xs font-semibold uppercase tracking-widest whitespace-nowrap">Comments ({comments.length})</span>
        <PanelRightOpen size={16} />
      </button>

      {/* Sidebar */}
      <div
        className={`h-full border-l border-admin-border bg-admin-bg-sidebar overflow-hidden z-10 relative transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'w-[260px]' : 'w-0'}`}
      >
        <div className="w-[260px] h-full flex flex-col">
          {/* Header — same h-[3rem] as left sidebar */}
          <div className="h-[3rem] flex items-center justify-between px-4 border-b border-admin-border flex-shrink-0">
            <span className="text-xs font-semibold uppercase tracking-widest text-admin-text-faint">
              COMMENTS ({comments.length})
            </span>
            <button
              onClick={onToggle}
              className="w-8 h-8 flex items-center justify-center rounded text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
            >
              <PanelRightClose size={16} />
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

          {/* Footer — logos + email */}
          <div className="flex-shrink-0 border-t border-admin-border px-4 pt-5 pb-5 space-y-4">
            {/* Logos */}
            {clientLogoUrl && (
              <div className="flex items-center justify-center gap-3 py-1">
                <img src={clientLogoUrl} alt="" className="h-6 object-contain admin-logo" />
                <span className="text-white/20 text-base">&times;</span>
                <img src="/images/logo/fna-logo.svg" alt="FNA" className="h-6" />
              </div>
            )}
            {/* Email button */}
            <div className="flex justify-center">
              <a
                ref={emailBtnRef}
                href="mailto:hi@fna.wtf"
                className="relative px-5 py-2.5 text-sm font-medium text-white border border-white/20 rounded-lg overflow-hidden flex items-center gap-2"
              >
                <div
                  ref={emailFillRef}
                  className="absolute inset-0 bg-white pointer-events-none"
                  style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
                />
                <span className="relative flex items-center gap-2 whitespace-nowrap" style={{ zIndex: 10 }}>
                  <motion.span
                    variants={iconVariants}
                    initial="hidden"
                    animate={isEmailHovered ? 'visible' : 'hidden'}
                    className="flex items-center"
                  >
                    <Mail size={14} strokeWidth={1.5} />
                  </motion.span>
                  hi@fna.wtf
                </span>
              </a>
            </div>
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
      {/* Header: avatar + name + time + actions */}
      <div className="flex items-center gap-2 mb-1.5">
        {comment.avatar_url ? (
          <img src={comment.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
            <User size={10} className="text-muted-foreground/50" />
          </div>
        )}
        <span className="text-xs font-medium text-foreground/80">{firstName}</span>
        <span className="text-[10px] text-muted-foreground/40 ml-auto">{formatPT(comment.created_at)}</span>
        {isOwn && !editing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover/comment:opacity-100 transition-opacity">
            {confirmDelete ? (
              <button onClick={handleDelete} disabled={isPending} className="text-red-400 hover:text-red-300 p-0.5 transition-colors" title="Confirm delete">
                <Check size={11} />
              </button>
            ) : (
              <button onClick={() => { setEditing(true); setEditText(comment.content); }} className="text-muted-foreground/30 hover:text-foreground/60 p-0.5 transition-colors" title="Edit">
                <Pencil size={11} />
              </button>
            )}
            {confirmDelete ? (
              <button onClick={() => setConfirmDelete(false)} className="text-muted-foreground/40 hover:text-foreground/60 p-0.5 transition-colors" title="Cancel">
                <X size={11} />
              </button>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-muted-foreground/30 hover:text-red-400 p-0.5 transition-colors" title="Delete">
                <Trash2 size={11} />
              </button>
            )}
          </div>
        )}
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
    </div>
  );
}
