'use client';

import { useState, useRef, useEffect, useCallback, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Trash2, Check, X, PanelRightClose, PanelRightOpen, Smile, MoreHorizontal, Send, ListFilter, Circle, Eye, ChevronDown, CornerDownLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { getShareComments, updateComment, deleteComment, addReply, toggleResolved, getReactions, toggleReaction } from './actions';
import { AnimatePresence } from 'framer-motion';
import type { PresentationSlide } from '@/app/admin/scripts/_components/presentationUtils';
import { EmojiPicker } from '@/lib/comments/EmojiPicker';
import { Avatar } from '@/lib/comments/Avatar';
import type { ScriptShareCommentRow } from '@/types/scripts';

// ── Types ────────────────────────────────────────────────────────────────

interface ShareComment {
  id: string;
  beat_id: string;
  viewer_email: string;
  viewer_name: string | null;
  content: string;
  is_admin: boolean;
  created_at: string;
  avatar_url: string | null;
  parent_comment_id: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  comment_number: number | null;
}

interface CommentThread {
  parent: ShareComment;
  replies: ShareComment[];
}

interface Props {
  shareId: string;
  currentBeatId: string | null;
  viewerEmail: string;
  viewerName: string | null;
  open: boolean;
  onToggle: () => void;
  refreshKey: number;
  clientLogoUrl?: string | null;
  slides: PresentationSlide[];
  onNavigateToBeat: (beatId: string) => void;
  onCommentAdded: () => void;
  scrollToEmail?: string | null;
  onScrollToEmailHandled?: () => void;
  hideReopenButton?: boolean;
  externalHideCompleted?: boolean;
  externalSortMode?: 'script' | 'oldest' | 'newest' | 'unresolved';
  externalSceneFilter?: 'current' | 'all';
  externalCurrentSceneId?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '1m';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildBeatLabelMap(slides: PresentationSlide[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const s of slides) {
    const beatsInScene = slides.filter(sl => sl.sceneId === s.sceneId);
    map[s.beatId] = beatsInScene.length > 1 ? `${s.sceneNumber}${s.beatLetter}` : `${s.sceneNumber}`;
  }
  return map;
}

function groupIntoThreads(comments: ShareComment[]): CommentThread[] {
  const topLevel = comments.filter(c => !c.parent_comment_id);
  const replyMap = new Map<string, ShareComment[]>();
  for (const c of comments) {
    if (c.parent_comment_id) {
      const arr = replyMap.get(c.parent_comment_id) ?? [];
      arr.push(c);
      replyMap.set(c.parent_comment_id, arr);
    }
  }
  return topLevel.map(parent => ({ parent, replies: replyMap.get(parent.id) ?? [] }));
}

/** Cast local ShareComment[] to ScriptShareCommentRow[] for shared components */
function asScriptRows(comments: ShareComment[]): ScriptShareCommentRow[] {
  return comments as unknown as ScriptShareCommentRow[];
}

// ── Shared styles ────────────────────────────────────────────────────────

const BTN_CANCEL = 'h-7 px-3 text-admin-sm text-admin-text-faint hover:text-white border border-admin-border rounded-admin-md hover:bg-admin-bg-hover transition-colors';

// ── Reaction types ───────────────────────────────────────────────────────

type ReactionsMap = Record<string, { emoji: string; count: number; viewers: string[] }[]>;

// ── Reaction pills ───────────────────────────────────────────────────────

function ReactionPills({
  commentId,
  reactions,
  viewerEmail,
  onToggle,
}: {
  commentId: string;
  reactions: { emoji: string; count: number; viewers: string[] }[];
  viewerEmail: string;
  onToggle: (commentId: string, emoji: string) => void;
}) {
  if (reactions.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap" onClick={e => e.stopPropagation()}>
      {reactions.map(r => {
        const isMine = r.viewers.includes(viewerEmail);
        return (
          <button
            key={r.emoji}
            onClick={() => onToggle(commentId, r.emoji)}
            className={`relative inline-flex items-center gap-1 pl-1.5 pr-2 h-[22px] rounded-full text-admin-sm transition-colors border ${
              isMine
                ? 'bg-white/[0.12] border-transparent hover:border-white/10 text-white'
                : 'bg-white/[0.06] border-transparent hover:border-white/[0.08] text-admin-text-faint'
            }`}
          >
            <span className="text-sm leading-none">{r.emoji}</span>
            <span className="text-[10px] font-semibold text-white/80">{r.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Three-dot menu (shared by parent + replies) ─────────────────────────

function CommentActionsMenu({
  commentId,
  viewerEmail,
  onRefresh,
  onStartEdit,
  hoverClass = 'group-hover/comment',
}: {
  commentId: string;
  viewerEmail: string;
  onRefresh: () => void;
  onStartEdit: () => void;
  hoverClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false); setConfirmDelete(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleDelete = async () => {
    await deleteComment(commentId, viewerEmail);
    setConfirmDelete(false);
    setOpen(false);
    onRefresh();
  };

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-colors invisible ${hoverClass}:visible`}
        style={{ color: '#666' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = '#666')}
      >
        <span className="relative inline-flex items-center justify-center w-4 h-4">
          <Circle size={16} />
          <MoreHorizontal size={9} className="absolute" strokeWidth={3} />
        </span>
      </button>
      {open && (() => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return null;
        return createPortal(
          <div ref={menuRef} className="fixed z-[101] bg-admin-bg-sidebar border border-admin-border rounded-admin-md shadow-xl py-1 min-w-[130px]" style={{ top: r.bottom + 4, left: r.right - 130 }}>
              <button
                onClick={() => { onStartEdit(); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-admin-sm text-white hover:bg-admin-bg-hover transition-colors flex items-center gap-2.5"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={() => { if (confirmDelete) { handleDelete(); } else { setConfirmDelete(true); } }}
                className="w-full text-left px-3 py-2 text-admin-sm text-admin-danger hover:bg-admin-bg-hover transition-colors flex items-center gap-2.5"
              >
                <Trash2 size={14} /> {confirmDelete ? 'Confirm?' : 'Delete'}
              </button>
            </div>,
          document.body
        );
      })()}
    </div>
  );
}

// ── Comment Card ─────────────────────────────────────────────────────────

function CommentCard({
  thread,
  beatLabel,
  isActive,
  isOwn,
  viewerEmail,
  viewerName,
  shareId,
  onNavigate,
  onRefresh,
  reactions,
  onToggleReaction,
}: {
  thread: CommentThread;
  beatLabel: string;
  isActive: boolean;
  isOwn: boolean;
  viewerEmail: string;
  viewerName: string | null;
  shareId: string;
  onNavigate: () => void;
  onRefresh: () => void;
  reactions: ReactionsMap;
  onToggleReaction: (commentId: string, emoji: string) => void;
}) {
  const { parent, replies } = thread;
  const [expanded, setExpanded] = useState(false);
  const [threadExpanded, setThreadExpanded] = useState(true);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(parent.content);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiTriggerRef = useRef<HTMLButtonElement>(null);
  const [isPending, startTransition] = useTransition();
  const needsClamp = parent.content.length > 280 || parent.content.split('\n').length > 6;

  const firstNameStr = parent.viewer_name?.split(' ')[0] || 'Anonymous';
  const hasReplies = replies.length > 0;
  const allComments = [parent, ...replies];

  const handleSave = () => {
    if (!editText.trim()) return;
    startTransition(async () => {
      await updateComment(parent.id, viewerEmail, editText.trim());
      setEditing(false);
      onRefresh();
    });
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    const content = replyText.trim();
    setReplyText('');
    startTransition(async () => {
      await addReply(shareId, parent.id, viewerEmail, viewerName, content);
      onRefresh();
    });
  };

  const handleToggleResolved = () => {
    startTransition(async () => {
      await toggleResolved(parent.id, viewerEmail);
      onRefresh();
    });
  };

  // Compute stacked avatar data outside JSX so AnimatePresence works
  const AVATAR_SIZE = 24;
  const AVATAR_OFFSET = Math.round(AVATAR_SIZE * 0.3);
  const avatarRows = asScriptRows(allComments);
  const avatarSeen = new Set<string>();
  const uniqueAvatars: ReturnType<typeof asScriptRows> = [];
  for (const c of avatarRows) {
    if (!avatarSeen.has(c.viewer_email)) { avatarSeen.add(c.viewer_email); uniqueAvatars.push(c); }
    if (uniqueAvatars.length >= 3) break;
  }
  const avatarNudge = ((uniqueAvatars.length - 1) * AVATAR_OFFSET) / 2;
  const bgAvatars = uniqueAvatars.slice(1);

  return (
    <div
      onClick={onNavigate}
      className={`group/comment rounded-admin-lg border mx-3 mb-3 transition-colors cursor-pointer select-none ${
        isActive ? 'border-admin-border bg-admin-bg-overlay brightness-125' : 'border-admin-border-subtle bg-admin-bg-overlay'
      }`}
    >
      <div className={`p-3 rounded-t-admin-lg ${threadExpanded ? 'pb-0' : ''}`}>
        {/* Avatar column + content column layout */}
        <div className="flex gap-3">
          {/* Left column: avatar + vertical connector line */}
          <div className="flex flex-col items-center flex-shrink-0 cursor-pointer overflow-visible" onClick={(e) => { e.stopPropagation(); setThreadExpanded(prev => !prev); }}>
            <div className="relative flex-shrink-0" style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, overflow: 'visible' }}>
              {/* Background avatars — always rendered, animated via state */}
              {bgAvatars.map((c, i) => {
                const origIdx = i + 1;
                const xPos = origIdx * AVATAR_OFFSET - avatarNudge;
                const bgCount = bgAvatars.length;
                // Expand: farthest drops first; Collapse: closest appears first
                const exitDelay = (bgCount - 1 - i) * 0.1;
                const enterDelay = i * 0.1;
                return (
                  <motion.div
                    key={c.viewer_email}
                    className="absolute top-0 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, zIndex: uniqueAvatars.length - origIdx, left: xPos, border: '1px solid #000', pointerEvents: threadExpanded ? 'none' : 'auto' }}
                    animate={threadExpanded
                      ? { opacity: 0, y: 4, scale: 0.85, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1], delay: exitDelay } }
                      : { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.0, 0, 0.2, 1], delay: enterDelay } }
                    }
                  >
                    <Avatar email={c.viewer_email} name={c.viewer_name} url={c.avatar_url} size={AVATAR_SIZE} />
                  </motion.div>
                );
              })}
              {/* Primary avatar — slides between stacked offset and center */}
              <motion.div
                className="absolute top-0"
                style={{ zIndex: uniqueAvatars.length }}
                animate={{ x: threadExpanded ? 0 : -avatarNudge }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1], delay: threadExpanded ? (uniqueAvatars.length - 1) * 0.05 : 0 }}
              >
                <Avatar email={parent.viewer_email} name={parent.viewer_name} url={parent.avatar_url} size={AVATAR_SIZE} />
              </motion.div>
            </div>
            {/* Vertical line connecting to replies */}
            {hasReplies && threadExpanded && <div className="w-0.5 flex-1 bg-white/15" />}
          </div>

          {/* Right column: name, badge, text, actions */}
          <div className={`flex-1 min-w-0 ${threadExpanded ? 'pb-1' : ''}`}>
            {/* Name + time + actions + badge + #N */}
            <div className="flex items-center gap-2 cursor-pointer leading-6" onClick={(e) => { e.stopPropagation(); setThreadExpanded(prev => !prev); }}>
              <span className={`text-admin-sm font-semibold whitespace-nowrap min-w-0 overflow-hidden shrink ${parent.resolved_at ? 'text-white/30' : 'text-white'}`}>
                {firstNameStr}{parent.is_admin && <span className="ml-1 inline-flex items-center px-1 py-px rounded text-[9px] font-bold leading-none bg-white/15 text-white/60 uppercase tracking-wider">FNA</span>}<span className={`comment-names-suffix ${!threadExpanded ? 'is-visible' : ''}`}>{(() => {
                  const rows = asScriptRows(allComments);
                  const seen = new Set<string>();
                  const names: string[] = [];
                  for (const c of rows) {
                    const n = c.viewer_name?.split(' ')[0] || 'Anonymous';
                    if (!seen.has(n)) { seen.add(n); names.push(n); }
                  }
                  if (names.length <= 1) return '';
                  const rest = names.slice(1);
                  if (rest.length === 1) return `, and ${rest[0]}`;
                  if (rest.length === 2) return `, ${rest[0]}, and ${rest[1]}`;
                  return `, ${rest[0]}, ${rest[1]}...`;
                })()}</span>
              </span>
              <span className={`text-admin-sm flex-shrink-0 ${parent.resolved_at ? 'text-white/20' : 'text-admin-text-faint'}`}>{formatRelativeTime(parent.created_at)}</span>

              {/* Collapse chevron */}
              <ChevronDown
                size={14}
                className={`text-admin-text-faint transition-transform flex-shrink-0 ${!threadExpanded ? '-rotate-90' : ''}`}
              />

              {/* Actions + badge — right-aligned together */}
              <span className="ml-auto flex items-center gap-0 flex-shrink-0" onClick={e => e.stopPropagation()}>
                {threadExpanded && isOwn && (
                  <CommentActionsMenu
                    commentId={parent.id}
                    viewerEmail={viewerEmail}
                    onRefresh={onRefresh}
                    onStartEdit={() => { setEditing(true); setEditText(parent.content); }}
                  />
                )}
                {threadExpanded && (
                  <button ref={emojiTriggerRef} onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                    className="w-6 h-6 flex items-center justify-center cursor-pointer transition-colors invisible group-hover/comment:visible"
                    style={{ color: '#666' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = '#666')} title="React">
                    <Smile size={16} />
                  </button>
                )}
                {emojiPickerOpen && (
                  <EmojiPicker
                    onSelect={(emoji) => onToggleReaction(parent.id, emoji)}
                    onClose={() => setEmojiPickerOpen(false)}
                    anchorRef={emojiTriggerRef}
                  />
                )}
                {threadExpanded && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleResolved(); }}
                    disabled={isPending}
                    className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${parent.resolved_at ? '' : 'invisible group-hover/comment:visible'}`}
                    style={{ color: parent.resolved_at ? undefined : '#666' }}
                    onMouseEnter={e => { if (!parent.resolved_at) e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { if (!parent.resolved_at) e.currentTarget.style.color = '#666'; }}
                    title={parent.resolved_at ? 'Mark unresolved' : 'Mark resolved'}
                  >
                    {parent.resolved_at ? (
                      <span className="relative inline-flex items-center justify-center w-4 h-4">
                        <Circle size={16} className="text-admin-success" style={{ fill: 'var(--admin-success)' }} />
                        <Check size={10} className="absolute text-admin-bg-sidebar" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="relative inline-flex items-center justify-center w-4 h-4">
                        <Circle size={16} />
                        <Check size={9} className="absolute" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                  className="rounded px-1.5 py-0 text-admin-sm font-mono font-semibold ml-1 flex-shrink-0 leading-5"
                  style={{ background: 'rgba(234, 179, 8, 0.25)', color: '#eab308' }}
                >
                  {beatLabel}
                </button>
              </span>
            </div>

            {/* Comment body */}
            {threadExpanded && (
              <>
                {editing ? (
                  <div className="space-y-2 mt-1">
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={3}
                      className="w-full bg-admin-bg-base border border-admin-border rounded-admin-md px-3 py-2 text-admin-sm text-white resize-none focus:outline-none"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditing(false); setEditText(parent.content); }} className={BTN_CANCEL}>Cancel</button>
                      <button onClick={handleSave} disabled={isPending} className={`h-7 px-3 text-admin-sm border rounded-admin-md transition-colors ${editText.trim() ? 'border-white bg-white text-black hover:bg-white/90' : 'border-admin-border text-admin-text-faint cursor-not-allowed'}`}>Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={`text-admin-sm leading-relaxed whitespace-pre-wrap mt-0.5 ${needsClamp && !expanded ? 'line-clamp-6' : ''} ${parent.resolved_at ? 'text-white/30' : 'text-white/70'}`}>
                      {parent.content}
                    </p>
                    {needsClamp && !expanded && (
                      <div>
                        <button onClick={() => setExpanded(true)} className="text-admin-sm text-admin-info mt-1 hover:underline">
                          Read more
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Reaction pills */}
                {!editing && (
                  <ReactionPills
                    commentId={parent.id}
                    reactions={reactions[parent.id] ?? []}
                    viewerEmail={viewerEmail}
                    onToggle={onToggleReaction}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Replies + Reply area — one animated wrapper ── */}
      {threadExpanded && (
        <div>
          {/* Replies */}
          {hasReplies && (
            <div className="px-3 pb-1">
              {replies.map((reply, i) => (
                <ReplyRow
                  key={reply.id}
                  reply={reply}
                  isOwn={reply.viewer_email === viewerEmail}
                  viewerEmail={viewerEmail}
                  onRefresh={onRefresh}
                  isLast={i === replies.length - 1}
                  reactions={reactions[reply.id] ?? []}
                  onToggleReaction={onToggleReaction}
                />
              ))}
            </div>
          )}

          {/* Reply area */}
          <AnimatePresence mode="wait" initial={false}>
            {replyOpen ? (
              <motion.div
                key="reply-input"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="border-t border-admin-border-subtle bg-admin-bg-base p-3 rounded-b-admin-lg"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <textarea
                    ref={replyTextareaRef}
                    value={replyText}
                    onChange={e => { setReplyText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                    placeholder="Reply..."
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-admin-text-faint/25 resize-none focus:outline-none min-h-6 leading-6 overflow-hidden max-md:[font-size:16px] pl-1.5"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); setReplyOpen(false); }
                      if (e.key === 'Escape') { setReplyOpen(false); setReplyText(''); }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => { setReplyOpen(false); setReplyText(''); }}
                    className="w-7 h-7 flex-shrink-0 flex items-center justify-center border border-admin-border rounded-admin-md text-admin-text-faint hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={() => { handleReply(); setReplyOpen(false); }}
                    disabled={isPending || !replyText.trim()}
                    className={`w-7 h-7 flex-shrink-0 flex items-center justify-center border rounded-admin-md transition-colors ${replyText.trim() ? 'border-white bg-white text-black hover:bg-white/90' : 'border-admin-border text-admin-text-faint cursor-not-allowed'}`}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="reply-button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="border-t border-transparent p-3 rounded-b-admin-lg flex justify-end"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setReplyOpen(true); }}
                  className="h-7 inline-flex items-center gap-1.5 px-2.5 text-admin-sm text-admin-text-faint border border-admin-border hover:text-white rounded-admin-md hover:bg-admin-bg-hover transition-colors"
                >
                  Reply
                  <CornerDownLeft size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Reply Row ────────────────────────────────────────────────────────────

function ReplyRow({
  reply,
  isOwn,
  viewerEmail,
  onRefresh,
  isLast,
  reactions,
  onToggleReaction,
}: {
  reply: ShareComment;
  isOwn: boolean;
  viewerEmail: string;
  onRefresh: () => void;
  isLast: boolean;
  reactions: { emoji: string; count: number; viewers: string[] }[];
  onToggleReaction: (commentId: string, emoji: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.content);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiTriggerRef = useRef<HTMLButtonElement>(null);
  const [isPending, startTransition] = useTransition();
  const firstNameStr = reply.viewer_name?.split(' ')[0] || 'Anonymous';

  const handleSave = () => {
    if (!editText.trim()) return;
    startTransition(async () => {
      await updateComment(reply.id, viewerEmail, editText.trim());
      setEditing(false);
      onRefresh();
    });
  };

  return (
    <div className="group/reply flex gap-3">
      {/* Left column: connector line + avatar */}
      <div className="flex flex-col items-center flex-shrink-0">
        {/* Line from above */}
        <div className="w-0.5 h-3 bg-white/15" />
        <Avatar email={reply.viewer_email} name={reply.viewer_name} url={reply.avatar_url} size={24} />
        {/* Line below (if not last) */}
        {!isLast && <div className="w-0.5 flex-1 bg-white/15" />}
      </div>

      {/* Right column — pt-3 aligns name with avatar (below h-3 connector) */}
      <div className="flex-1 min-w-0 pt-3 pb-1">
        {/* Name + time + actions */}
        <div className="flex items-center gap-2 leading-6">
          <span className={`text-admin-sm font-semibold ${reply.resolved_at ? 'text-white/30' : 'text-white'}`}>{firstNameStr}</span>{reply.is_admin && <span className="inline-flex items-center px-1 py-px rounded text-[9px] font-bold leading-none bg-white/15 text-white/60 uppercase tracking-wider">FNA</span>}
          <span className={`text-admin-sm ${reply.resolved_at ? 'text-white/20' : 'text-admin-text-faint'}`}>{formatRelativeTime(reply.created_at)}</span>
          {/* Actions: dots + emoji (no checkmark for replies) */}
          <span className="ml-auto flex items-center gap-0" onClick={e => e.stopPropagation()}>
            {isOwn && (
              <CommentActionsMenu
                commentId={reply.id}
                viewerEmail={viewerEmail}
                onRefresh={onRefresh}
                onStartEdit={() => { setEditing(true); setEditText(reply.content); }}
                hoverClass="group-hover/reply"
              />
            )}
            <button ref={emojiTriggerRef} onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
              className="w-6 h-6 flex items-center justify-center cursor-pointer transition-colors invisible group-hover/reply:visible"
              style={{ color: '#666' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = '#666')}>
              <Smile size={16} />
            </button>
            {emojiPickerOpen && (
              <EmojiPicker
                onSelect={(emoji) => onToggleReaction(reply.id, emoji)}
                onClose={() => setEmojiPickerOpen(false)}
                anchorRef={emojiTriggerRef}
              />
            )}
          </span>
        </div>

        {/* Body */}
        {editing ? (
          <div className="space-y-2 mt-1">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={2}
              className="w-full bg-admin-bg-base border border-admin-border rounded-admin-md px-3 py-2 text-admin-sm text-white resize-none focus:outline-none"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => { setEditing(false); setEditText(reply.content); }} className={BTN_CANCEL}>Cancel</button>
              <button onClick={handleSave} disabled={isPending} className={`h-7 px-3 text-admin-sm border rounded-admin-md transition-colors ${editText.trim() ? 'border-white bg-white text-black hover:bg-white/90' : 'border-admin-border text-admin-text-faint cursor-not-allowed'}`}>Save</button>
            </div>
          </div>
        ) : (
          <p className={`text-admin-sm leading-relaxed whitespace-pre-wrap mt-0.5 ${reply.resolved_at ? 'text-white/30' : 'text-white/70'}`}>{reply.content}</p>
        )}

        {/* Reaction pills */}
        {!editing && (
          <ReactionPills
            commentId={reply.id}
            reactions={reactions}
            viewerEmail={viewerEmail}
            onToggle={onToggleReaction}
          />
        )}
      </div>
    </div>
  );
}

// ── Filter dropdown ──────────────────────────────────────────────────────

function FilterDropdown({
  hideCompleted,
  setHideCompleted,
  hiddenUsers,
  setHiddenUsers,
  allUsers,
  onClose,
}: {
  hideCompleted: boolean;
  setHideCompleted: (v: boolean) => void;
  hiddenUsers: Set<string>;
  setHiddenUsers: (v: Set<string>) => void;
  allUsers: { email: string; name: string }[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="fixed mt-1 bg-admin-bg-sidebar border border-admin-border rounded-admin-md shadow-xl py-1 min-w-[200px]" style={{ zIndex: 9999, transform: 'translate(-160px, 0)' }}>
      <button
        onClick={() => setHideCompleted(!hideCompleted)}
        className="w-full text-left px-3 py-2 text-admin-sm text-white hover:bg-admin-bg-hover transition-colors flex items-center gap-2.5"
      >
        <span className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${hideCompleted ? 'bg-admin-info border-admin-info' : 'border-admin-border'}`}>
          {hideCompleted && <Check size={10} className="text-white" strokeWidth={3} />}
        </span>
        Hide completed
      </button>
      {allUsers.length > 0 && (
        <>
          <div className="border-t border-admin-border my-1" />
          <p className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-admin-text-faint/50">By User</p>
          {allUsers.map(u => {
            const hidden = hiddenUsers.has(u.email);
            return (
              <button
                key={u.email}
                onClick={() => {
                  const next = new Set(hiddenUsers);
                  if (hidden) next.delete(u.email); else next.add(u.email);
                  setHiddenUsers(next);
                }}
                className="w-full text-left px-3 py-2 text-admin-sm text-white hover:bg-admin-bg-hover transition-colors flex items-center gap-2.5"
              >
                <span className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${!hidden ? 'bg-admin-info border-admin-info' : 'border-admin-border'}`}>
                  {!hidden && <Check size={10} className="text-white" strokeWidth={3} />}
                </span>
                {u.name}
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────

// ── Exported for reuse in CommentBottomSheet ────────────────────────────
export {
  CommentCard as SharedCommentCard,
  formatRelativeTime as sharedFormatRelativeTime,
  buildBeatLabelMap as sharedBuildBeatLabelMap,
  groupIntoThreads as sharedGroupIntoThreads,
};
export type { ShareComment, CommentThread, ReactionsMap };

export function CommentSidebar({
  shareId,
  currentBeatId,
  viewerEmail,
  viewerName,
  open,
  onToggle,
  refreshKey,
  clientLogoUrl: _clientLogoUrl,
  slides,
  onNavigateToBeat,
  onCommentAdded: _onCommentAdded,
  scrollToEmail,
  onScrollToEmailHandled,
  hideReopenButton = false,
  externalHideCompleted,
  externalSortMode,
  externalSceneFilter,
  externalCurrentSceneId,
}: Props) {
  const [comments, setComments] = useState<ShareComment[]>([]);
  const [reactions, setReactions] = useState<ReactionsMap>({});
  const [loading, setLoading] = useState(false);
  const [sortMode, setSortMode] = useState<'script' | 'oldest' | 'newest' | 'unresolved'>('script');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(new Set());
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const commentListRef = useRef<HTMLDivElement>(null);

  // Use external controls when provided (toolbar-driven), else internal state
  const effectiveHideCompleted = externalHideCompleted ?? hideCompleted;
  const effectiveSortMode = externalSortMode ?? sortMode;
  const beatLabelMap = buildBeatLabelMap(slides);

  const loadComments = useCallback(async () => {
    if (!shareId) return;
    setLoading(true);
    try {
      const data = await getShareComments(shareId);
      setComments(data as ShareComment[]);
      const commentIds = (data as ShareComment[]).map(c => c.id);
      if (commentIds.length > 0) {
        const r = await getReactions(commentIds);
        setReactions(r);
      }
    } finally {
      setLoading(false);
    }
  }, [shareId]);

  // Reload comments AND refresh timeline avatars
  const loadCommentsAndRefreshAuthors = useCallback(async () => {
    await loadComments();
    _onCommentAdded?.();
  }, [loadComments, _onCommentAdded]);

  const handleToggleReaction = useCallback(async (commentId: string, emoji: string) => {
    await toggleReaction(commentId, viewerEmail, emoji);
    // Reload reactions
    const commentIds = comments.map(c => c.id);
    if (commentIds.length > 0) {
      const r = await getReactions(commentIds);
      setReactions(r);
    }
  }, [viewerEmail, comments]);

  useEffect(() => {
    loadComments();
  }, [loadComments, refreshKey]);

  // Scroll to a specific commenter's comment when requested
  useEffect(() => {
    if (!scrollToEmail || loading || !commentListRef.current) return;
    const el = commentListRef.current.querySelector(`[data-comment-email="${CSS.escape(scrollToEmail)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    onScrollToEmailHandled?.();
  }, [scrollToEmail, loading, onScrollToEmailHandled]);

  const threads = groupIntoThreads(comments);
  const topLevelCount = threads.length;

  // Build unique users list for filter
  const allUsers = (() => {
    const seen = new Set<string>();
    const users: { email: string; name: string }[] = [];
    for (const c of comments) {
      if (!seen.has(c.viewer_email)) {
        seen.add(c.viewer_email);
        users.push({ email: c.viewer_email, name: c.viewer_name || c.viewer_email.split('@')[0] });
      }
    }
    return users;
  })();

  // Close sort menu on outside click
  useEffect(() => {
    if (!sortMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) setSortMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortMenuOpen]);

  // Sort threads
  const sortedThreads = [...threads].sort((a, b) => {
    if (effectiveSortMode === 'script') {
      const aIdx = slides.findIndex(s => s.beatId === a.parent.beat_id);
      const bIdx = slides.findIndex(s => s.beatId === b.parent.beat_id);
      return (aIdx === -1 ? Infinity : aIdx) - (bIdx === -1 ? Infinity : bIdx);
    }
    if (effectiveSortMode === 'oldest') {
      return new Date(a.parent.created_at).getTime() - new Date(b.parent.created_at).getTime();
    }
    if (effectiveSortMode === 'unresolved') {
      const aR = a.parent.resolved_at ? 1 : 0;
      const bR = b.parent.resolved_at ? 1 : 0;
      if (aR !== bR) return aR - bR; // unresolved first
      return new Date(b.parent.created_at).getTime() - new Date(a.parent.created_at).getTime();
    }
    // newest
    return new Date(b.parent.created_at).getTime() - new Date(a.parent.created_at).getTime();
  });

  // Apply filters
  const filteredThreads = sortedThreads.filter(t => {
    if (effectiveHideCompleted && t.parent.resolved_at) return false;
    if (hiddenUsers.size > 0 && hiddenUsers.has(t.parent.viewer_email)) return false;
    // Scene filter — only show comments for current scene's beats
    if (externalSceneFilter === 'current' && externalCurrentSceneId) {
      const sceneBeatIds = new Set(slides.filter(s => s.sceneId === externalCurrentSceneId).map(s => s.beatId));
      if (!sceneBeatIds.has(t.parent.beat_id)) return false;
    }
    return true;
  });

  const hasActiveFilters = effectiveHideCompleted || hiddenUsers.size > 0;

  return (
    <div className="hidden md:flex md:relative md:flex-shrink-0 md:h-full">
      {/* Re-open button — hidden when toolbar provides comments toggle */}
      {!hideReopenButton && (
        <button
          onClick={onToggle}
          className={`absolute right-4 top-4 z-[5] h-8 flex items-center gap-1.5 px-3 rounded-admin-md bg-admin-bg-overlay text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-primary transition-opacity duration-300 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          title="Show comments"
        >
          <span className="text-admin-sm font-semibold uppercase tracking-widest whitespace-nowrap">Comments ({topLevelCount})</span>
          <PanelRightOpen size={16} />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`h-full border-l border-admin-border bg-[#030303] overflow-hidden z-10 relative transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'w-[320px]' : 'w-0'}`}
      >
        <div className="w-[320px] h-full flex flex-col">
          {/* Header — hidden when toolbar provides controls */}
          <div className={`flex items-center justify-between px-4 border-b border-admin-border flex-shrink-0 ${hideReopenButton ? 'hidden' : 'h-[3rem]'}`}>
            {!hideReopenButton && (
              <span className="text-admin-sm font-semibold uppercase tracking-widest text-admin-text-faint">
                COMMENTS ({topLevelCount})
              </span>
            )}
            <div className={`flex items-center gap-1 ${hideReopenButton ? 'ml-auto' : ''}`}>
              {/* Filter dropdown */}
              <div className="relative" ref={filterMenuRef}>
                <button
                  onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                  className={`w-8 h-8 flex items-center justify-center rounded-admin-md transition-colors ${
                    hasActiveFilters
                      ? 'text-admin-info hover:text-admin-info hover:bg-admin-bg-hover'
                      : 'text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover'
                  }`}
                  title="Filter comments"
                >
                  <Eye size={15} />
                </button>
                {filterMenuOpen && (
                  <FilterDropdown
                    hideCompleted={hideCompleted}
                    setHideCompleted={setHideCompleted}
                    hiddenUsers={hiddenUsers}
                    setHiddenUsers={setHiddenUsers}
                    allUsers={allUsers}
                    onClose={() => setFilterMenuOpen(false)}
                  />
                )}
              </div>
              {/* Sort dropdown */}
              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => setSortMenuOpen(!sortMenuOpen)}
                  className="w-8 h-8 flex items-center justify-center rounded-admin-md text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                  title="Sort comments"
                >
                  <ListFilter size={15} />
                </button>
                {sortMenuOpen && (
                  <div className="fixed mt-1 bg-admin-bg-sidebar border border-admin-border rounded-admin-md shadow-xl py-1 min-w-[170px]" style={{ zIndex: 9999, transform: 'translate(-130px, 0)' }}>
                    <p className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-admin-text-faint/50">Sort by...</p>
                    {([
                      { key: 'script' as const, label: 'Script Order' },
                      { key: 'oldest' as const, label: 'Oldest' },
                      { key: 'newest' as const, label: 'Newest' },
                      { key: 'unresolved' as const, label: 'Unresolved' },
                    ]).map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { setSortMode(opt.key); setSortMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 text-admin-sm text-white hover:bg-admin-bg-hover transition-colors flex items-center justify-between"
                      >
                        {opt.label}
                        {sortMode === opt.key && <Check size={14} className="text-admin-info" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!hideReopenButton && (
                <button
                  onClick={onToggle}
                  className="w-8 h-8 flex items-center justify-center rounded-admin-md text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                >
                  <PanelRightClose size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Comment list */}
          <div ref={commentListRef} className="flex-1 overflow-y-scroll admin-scrollbar pt-3 pb-3">
            {loading && comments.length === 0 && (
              <p className="px-4 py-6 text-admin-sm text-admin-text-faint text-center">Loading...</p>
            )}
            {!loading && comments.length === 0 && (
              <p className="px-4 py-6 text-admin-sm text-admin-text-faint text-center">No comments yet.</p>
            )}
            {filteredThreads.map(thread => (
              <div key={thread.parent.id} data-comment-email={thread.parent.viewer_email}>
              <CommentCard
                thread={thread}
                beatLabel={beatLabelMap[thread.parent.beat_id] ?? '?'}
                isActive={thread.parent.beat_id === currentBeatId}
                isOwn={thread.parent.viewer_email === viewerEmail}
                viewerEmail={viewerEmail}
                viewerName={viewerName}
                shareId={shareId}
                onNavigate={() => onNavigateToBeat(thread.parent.beat_id)}
                onRefresh={loadCommentsAndRefreshAuthors}
                reactions={reactions}
                onToggleReaction={handleToggleReaction}
              />
              </div>
            ))}
          </div>

          {/* Footer removed — profile settings moved to header popover */}
        </div>
      </div>
    </div>
  );
}
