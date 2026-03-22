'use client';

import { useState, useRef, useEffect, useCallback, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Trash2, Check, PanelRightClose, PanelRightOpen, Mail, Smile, MoreHorizontal, Send, ListFilter, Circle, Settings, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDirectionalFill } from '@/hooks/useDirectionalFill';
import gsap from 'gsap';
import { getShareComments, updateComment, deleteComment, addReply, toggleResolved, getReactions, toggleReaction, getViewerProfile, updateViewerProfile, uploadViewerAvatar } from './actions';
import { AnimatePresence } from 'framer-motion';
import type { PresentationSlide } from '@/app/admin/scripts/_components/presentationUtils';

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
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
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

// ── Shared styles ────────────────────────────────────────────────────────

const BTN_CANCEL = 'h-7 px-3 text-admin-sm text-admin-text-faint hover:text-white border border-admin-border rounded-admin-md hover:bg-admin-bg-hover transition-colors';
const BTN_REPLY = 'inline-flex items-center px-2 py-0.5 text-admin-sm text-admin-text-faint border border-admin-border hover:text-white rounded-admin-md hover:bg-admin-bg-hover transition-colors';
const ICON_HOVER = 'p-1 rounded cursor-pointer transition-colors';

// ── Avatar ───────────────────────────────────────────────────────────────

function avatarColor(email: string): string {
  let hash = 0;
  for (const ch of email) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  const colors = ['#e67e22','#3b82f6','#22c55e','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f59e0b','#14b8a6','#6366f1'];
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function CommentAvatar({ url, email, name, size = 32 }: { url: string | null; email: string; name: string | null; size?: number }) {
  const px = `${size}px`;
  if (url) {
    return <img src={url} alt="" className="rounded-full object-cover flex-shrink-0" style={{ width: px, height: px }} />;
  }
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: px, height: px, backgroundColor: avatarColor(email) }}>
      <span className="text-black leading-none" style={{ fontSize: size * 0.5, fontWeight: 900 }}>{getInitials(name, email)}</span>
    </div>
  );
}

// ── Reaction types ───────────────────────────────────────────────────────

type ReactionsMap = Record<string, { emoji: string; count: number; viewers: string[] }[]>;

// ── Quick emoji palette ──────────────────────────────────────────────────

const EMOJI_CATEGORIES = [
  { label: 'Frequently Used', emojis: ['👍', '👎', '❤️', '🔥', '💯', '👀', '🎉', '😂', '😍', '🤔', '👏', '🙌'] },
  { label: 'Smileys', emojis: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😎', '🥳', '😏', '😢', '😭', '😤', '🤯', '🥺', '😱', '🤮'] },
  { label: 'Gestures', emojis: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '🤙', '💪', '🫡', '🫶', '✋', '👋', '🖖', '🤘'] },
  { label: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '💕', '💖', '💗', '💘'] },
  { label: 'Objects', emojis: ['🔥', '⭐', '💯', '✅', '❌', '⚡', '💡', '🎯', '🏆', '🎬', '🎥', '📸', '🎵', '🎶'] },
];

function EmojiPicker({ onSelect, onClose, anchorRef }: { onSelect: (emoji: string) => void; onClose: () => void; anchorRef: React.RefObject<HTMLButtonElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: Math.max(8, rect.right - 240),
      });
    }
  }, [anchorRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      className="w-[240px] h-[280px] border border-admin-border rounded-admin-lg shadow-2xl flex flex-col overflow-hidden bg-admin-bg-sidebar"
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Search */}
      <div className="px-3 py-2 bg-admin-bg-base flex-shrink-0 border-b border-admin-border">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full bg-transparent text-admin-sm text-white placeholder:text-admin-text-faint/30 focus:outline-none"
          autoFocus
        />
      </div>
      {/* Emoji grid */}
      <div className="flex-1 overflow-y-auto admin-scrollbar px-2 pb-2 bg-admin-bg-hover">
        {EMOJI_CATEGORIES.map(cat => {
          const matchesSearch = !search || cat.label.toLowerCase().includes(search.toLowerCase());
          if (!matchesSearch) return null;
          return (
            <div key={cat.label}>
              <p className="text-[10px] uppercase tracking-wider text-admin-text-faint/50 mt-2 mb-1 px-0.5">{cat.label}</p>
              <div className="grid grid-cols-7 gap-0.5">
                {cat.emojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { onSelect(emoji); onClose(); }}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-admin-bg-hover text-base transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

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
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-admin-sm transition-colors ${
              isMine
                ? 'border border-admin-info/50 bg-admin-info/15 text-white'
                : 'border border-admin-border bg-admin-bg-base hover:bg-admin-bg-hover text-admin-text-faint'
            }`}
          >
            <span className="text-sm leading-none">{r.emoji}</span>
            <span className="text-[11px] font-medium">{r.count}</span>
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
}: {
  commentId: string;
  viewerEmail: string;
  onRefresh: () => void;
  onStartEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setConfirmDelete(false); }
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={ICON_HOVER} style={{ color: '#666' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = '#666')}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="fixed mt-1 bg-admin-bg-sidebar border border-admin-border rounded-admin-md shadow-xl py-1 min-w-[130px]" style={{ zIndex: 9999, transform: 'translate(-90px, 0)' }}>
          <button
            onClick={() => { onStartEdit(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-admin-sm text-white hover:bg-admin-bg-hover transition-colors flex items-center gap-2.5"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={() => {
              if (confirmDelete) {
                handleDelete();
              } else {
                setConfirmDelete(true);
              }
            }}
            className="w-full text-left px-3 py-2 text-admin-sm text-admin-danger hover:bg-admin-bg-hover transition-colors flex items-center gap-2.5"
          >
            <Trash2 size={14} /> {confirmDelete ? 'Confirm?' : 'Delete'}
          </button>
        </div>
      )}
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
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const openReplyWith = (name?: string) => {
    const text = name ? `@${name} ` : '';
    setReplyText(text);
    setReplyOpen(true);
    setTimeout(() => {
      if (replyTextareaRef.current) {
        replyTextareaRef.current.focus();
        replyTextareaRef.current.selectionStart = text.length;
        replyTextareaRef.current.selectionEnd = text.length;
      }
    }, 0);
  };
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(parent.content);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiTriggerRef = useRef<HTMLButtonElement>(null);
  const [isPending, startTransition] = useTransition();
  const needsClamp = parent.content.length > 280 || parent.content.split('\n').length > 6;

  const firstName = parent.viewer_name?.split(' ')[0] || 'Anonymous';

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
    setReplyOpen(false);
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

  const hasReplies = replies.length > 0;

  return (
    <div
      onClick={onNavigate}
      className={`group/comment rounded-admin-lg border mx-3 mb-3 transition-colors cursor-pointer ${
        isActive ? 'border-admin-border bg-admin-bg-overlay brightness-125' : 'border-admin-border-subtle bg-admin-bg-overlay'
      }`}
    >
      <div className="p-3 pb-0 rounded-t-admin-lg">
        {/* Avatar column + content column layout */}
        <div className="flex gap-3">
          {/* Left column: avatar + vertical connector line */}
          <div className="flex flex-col items-center flex-shrink-0">
            <CommentAvatar url={parent.avatar_url} email={parent.viewer_email} name={parent.viewer_name} size={28} />
            {/* Vertical line connecting to replies */}
            {hasReplies && <div className="w-0.5 flex-1 mt-1 bg-admin-border-subtle" />}
          </div>

          {/* Right column: name, badge, text, actions */}
          <div className="flex-1 min-w-0 pb-4">
            {/* Name + time + badge + #N */}
            <div className="flex items-center gap-2">
              <span className="text-admin-sm font-semibold text-white">{firstName}</span>
              <span className="text-admin-sm text-admin-text-faint">{formatRelativeTime(parent.created_at)}</span>
              <span className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                  className="rounded px-1.5 py-0.5 text-admin-sm font-mono font-semibold"
                  style={{ background: 'rgba(234, 179, 8, 0.25)', color: '#eab308' }}
                >
                  {beatLabel}
                </button>
                <span className="text-admin-sm text-admin-text-faint">#{parent.comment_number ?? ''}</span>
              </span>
            </div>

            {/* Comment body */}
            <div className="mt-1.5">
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
                  <p className={`text-admin-sm text-white/80 leading-relaxed whitespace-pre-wrap inline ${needsClamp && !expanded ? 'line-clamp-6' : ''}`}>
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
            </div>

            {/* Reaction pills */}
            {!editing && (
              <ReactionPills
                commentId={parent.id}
                reactions={reactions[parent.id] ?? []}
                viewerEmail={viewerEmail}
                onToggle={onToggleReaction}
              />
            )}

            {/* Actions: Reply ... emoji dots resolved */}
            {!editing && (
              <div className="flex items-center mt-3" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => replyOpen ? setReplyOpen(false) : openReplyWith()}
                  className={BTN_REPLY}
                >
                  Reply
                </button>

                <div className="ml-auto flex items-center gap-0.5">
                  {/* Emoji + dots: hidden until card hover, individually white on icon hover */}
                  <div className="flex items-center gap-0.5 invisible group-hover/comment:visible">
                    <button ref={emojiTriggerRef} onClick={() => setEmojiPickerOpen(!emojiPickerOpen)} className={ICON_HOVER} style={{ color: '#666' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = '#666')} title="React">
                      <Smile size={16} />
                    </button>
                    {isOwn && (
                      <CommentActionsMenu
                        commentId={parent.id}
                        viewerEmail={viewerEmail}
                        onRefresh={onRefresh}
                        onStartEdit={() => { setEditing(true); setEditText(parent.content); }}
                      />
                    )}
                  </div>
                  {emojiPickerOpen && (
                    <EmojiPicker
                      onSelect={(emoji) => onToggleReaction(parent.id, emoji)}
                      onClose={() => setEmojiPickerOpen(false)}
                      anchorRef={emojiTriggerRef}
                    />
                  )}
                  {/* Resolved check: visible when resolved, hover-only when not */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleResolved(); }}
                    disabled={isPending}
                    className={`flex items-center justify-center cursor-pointer ${parent.resolved_at ? '' : 'invisible group-hover/comment:visible'}`}
                    onMouseEnter={e => { if (!parent.resolved_at) e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { if (!parent.resolved_at) e.currentTarget.style.color = ''; }}
                    title={parent.resolved_at ? 'Mark unresolved' : 'Mark resolved'}
                  >
                    {parent.resolved_at ? (
                      <span className="relative inline-flex items-center justify-center w-[18px] h-[18px]">
                        <Circle size={18} className="text-admin-success" style={{ fill: 'var(--admin-success)' }} />
                        <Check size={11} className="absolute text-admin-bg-sidebar" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="relative inline-flex items-center justify-center w-[18px] h-[18px]" style={{ color: '#666' }}>
                        <Circle size={18} />
                        <Check size={10} className="absolute" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Replies ── */}
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
              onReplyClick={() => openReplyWith(reply.viewer_name?.split(' ')[0] || 'Anonymous')}
            />
          ))}
        </div>
      )}

      {/* ── Reply input ── */}
      {replyOpen && (
        <div className="border-t border-admin-border bg-admin-bg-base px-3 py-3 rounded-b-admin-lg" onClick={e => e.stopPropagation()}>
          <textarea
            ref={replyTextareaRef}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Leave your reply here..."
            rows={2}
            className="w-full bg-transparent text-sm text-white placeholder:text-admin-text-faint/25 resize-none focus:outline-none max-md:[font-size:16px]"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
          />
          <div className="flex items-center justify-end gap-2 -mt-0.5">
            <button onClick={() => { setReplyOpen(false); setReplyText(''); }} className={BTN_CANCEL}>Cancel</button>
            <button
              onClick={handleReply}
              disabled={isPending || !replyText.trim()}
              className={`h-7 w-7 flex items-center justify-center border rounded-admin-md transition-colors ${replyText.trim() ? 'border-white bg-white text-black hover:bg-white/90' : 'border-admin-border text-admin-text-faint cursor-not-allowed'}`}
            >
              <Send size={14} />
            </button>
          </div>
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
  onReplyClick,
}: {
  reply: ShareComment;
  isOwn: boolean;
  viewerEmail: string;
  onRefresh: () => void;
  isLast: boolean;
  reactions: { emoji: string; count: number; viewers: string[] }[];
  onToggleReaction: (commentId: string, emoji: string) => void;
  onReplyClick: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.content);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiTriggerRef = useRef<HTMLButtonElement>(null);
  const [isPending, startTransition] = useTransition();
  const firstName = reply.viewer_name?.split(' ')[0] || 'Anonymous';

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
        <div className="w-0.5 h-3 bg-admin-border-subtle" />
        <CommentAvatar url={reply.avatar_url} email={reply.viewer_email} name={reply.viewer_name} size={24} />
        {/* Line below (if not last) */}
        {!isLast && <div className="w-0.5 flex-1 mt-1 bg-admin-border-subtle" />}
      </div>

      {/* Right column */}
      <div className="flex-1 min-w-0 pb-4">
        {/* Name + time */}
        <div className="flex items-center gap-2">
          <span className="text-admin-sm font-semibold text-white">{firstName}</span>
          <span className="text-admin-sm text-admin-text-faint">{formatRelativeTime(reply.created_at)}</span>
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
          <p className="text-admin-sm text-white/70 leading-relaxed whitespace-pre-wrap mt-0.5">{reply.content}</p>
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

        {/* Actions: Reply ... emoji dots */}
        {!editing && (
          <div className="flex items-center mt-3" onClick={e => e.stopPropagation()}>
            <button
              onClick={onReplyClick}
              className={BTN_REPLY}
            >
              Reply
            </button>
            <div className="ml-auto flex items-center gap-0.5 invisible group-hover/reply:visible">
              <button ref={emojiTriggerRef} onClick={() => setEmojiPickerOpen(!emojiPickerOpen)} className={ICON_HOVER} style={{ color: '#666' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = '#666')}>
                <Smile size={16} />
              </button>
              {isOwn && (
                <CommentActionsMenu
                  commentId={reply.id}
                  viewerEmail={viewerEmail}
                  onRefresh={onRefresh}
                  onStartEdit={() => { setEditing(true); setEditText(reply.content); }}
                />
              )}
            </div>
            {emojiPickerOpen && (
              <EmojiPicker
                onSelect={(emoji) => onToggleReaction(reply.id, emoji)}
                onClose={() => setEmojiPickerOpen(false)}
                anchorRef={emojiTriggerRef}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────

const iconVariants = {
  hidden: { opacity: 0, x: -6, width: 0, marginRight: -6 },
  visible: { opacity: 1, x: 0, width: 'auto', marginRight: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

// ── Exported for reuse in CommentBottomSheet ────────────────────────────
export {
  CommentCard as SharedCommentCard,
  CommentAvatar as SharedCommentAvatar,
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
}: Props) {
  const [comments, setComments] = useState<ShareComment[]>([]);
  const [reactions, setReactions] = useState<ReactionsMap>({});
  const [loading, setLoading] = useState(false);
  const [sortMode, setSortMode] = useState<'script' | 'oldest' | 'newest' | 'unresolved'>('script');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const commentListRef = useRef<HTMLDivElement>(null);
  const emailBtnRef = useRef<HTMLAnchorElement>(null);
  const emailFillRef = useRef<HTMLDivElement>(null);
  const [isEmailHovered, setIsEmailHovered] = useState(false);

  const beatLabelMap = buildBeatLabelMap(slides);

  // Profile editor state
  const [sidebarProfileOpen, setSidebarProfileOpen] = useState(false);
  const [spFirstName, setSpFirstName] = useState('');
  const [spLastName, setSpLastName] = useState('');
  const [spEmail, setSpEmail] = useState(viewerEmail);
  const [spAvatarUrl, setSpAvatarUrl] = useState<string | null>(null);
  const [spColor, setSpColor] = useState<string | null>(null);
  const [spSaving, setSpSaving] = useState(false);
  const [spPendingFile, setSpPendingFile] = useState<File | null>(null);
  const [spAvatarRemoved, setSpAvatarRemoved] = useState(false);
  const spFileRef = useRef<HTMLInputElement>(null);
  const spSnapshot = useRef({ firstName: '', lastName: '', email: '', color: null as string | null, avatarUrl: null as string | null });

  // Load profile on mount
  useEffect(() => {
    if (!viewerEmail) return;
    getViewerProfile(viewerEmail).then(p => {
      if (p) {
        setSpAvatarUrl(p.headshot_url);
        setSpColor(p.avatar_color);
        if (p.first_name) setSpFirstName(p.first_name);
        if (p.last_name) setSpLastName(p.last_name);
      } else if (viewerName) {
        const parts = viewerName.trim().split(/\s+/);
        setSpFirstName(parts[0] || '');
        setSpLastName(parts.slice(1).join(' ') || '');
      }
    });
  }, [viewerEmail, viewerName]);

  const handleSpSave = useCallback(async () => {
    if (!viewerEmail) return;
    setSpSaving(true);
    try {
      // Upload pending avatar if any
      if (spPendingFile) {
        const fd = new FormData();
        fd.append('file', spPendingFile);
        fd.append('email', viewerEmail);
        await uploadViewerAvatar(fd);
        setSpPendingFile(null);
      }
      await updateViewerProfile(viewerEmail, spFirstName, spLastName, spColor, spAvatarRemoved);
      setSpAvatarRemoved(false);
      setSidebarProfileOpen(false);
      _onCommentAdded?.();
    } finally {
      setSpSaving(false);
    }
  }, [viewerEmail, spFirstName, spLastName, spColor, spPendingFile, spAvatarRemoved, _onCommentAdded]);

  const handleSpAvatarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Stage locally — show preview, don't upload yet
    setSpPendingFile(file);
    setSpAvatarUrl(URL.createObjectURL(file));
  }, []);

  const spDirty = spFirstName !== spSnapshot.current.firstName ||
    spLastName !== spSnapshot.current.lastName ||
    spEmail !== spSnapshot.current.email ||
    spColor !== spSnapshot.current.color ||
    spPendingFile !== null ||
    spAvatarRemoved;

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
    if (sortMode === 'script') {
      const aIdx = slides.findIndex(s => s.beatId === a.parent.beat_id);
      const bIdx = slides.findIndex(s => s.beatId === b.parent.beat_id);
      return (aIdx === -1 ? Infinity : aIdx) - (bIdx === -1 ? Infinity : bIdx);
    }
    if (sortMode === 'oldest') {
      return new Date(a.parent.created_at).getTime() - new Date(b.parent.created_at).getTime();
    }
    if (sortMode === 'unresolved') {
      const aR = a.parent.resolved_at ? 1 : 0;
      const bR = b.parent.resolved_at ? 1 : 0;
      if (aR !== bR) return aR - bR; // unresolved first
      return new Date(b.parent.created_at).getTime() - new Date(a.parent.created_at).getTime();
    }
    // newest
    return new Date(b.parent.created_at).getTime() - new Date(a.parent.created_at).getTime();
  });

  return (
    <div className="hidden md:flex md:relative md:flex-shrink-0 md:h-full">
      {/* Re-open button */}
      <button
        onClick={onToggle}
        className={`absolute right-4 top-4 z-[5] h-8 flex items-center gap-1.5 px-3 rounded-admin-md bg-admin-bg-overlay text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-primary transition-opacity duration-300 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        title="Show comments"
      >
        <span className="text-admin-sm font-semibold uppercase tracking-widest whitespace-nowrap">Comments ({topLevelCount})</span>
        <PanelRightOpen size={16} />
      </button>

      {/* Sidebar */}
      <div
        className={`h-full border-l border-admin-border bg-admin-bg-nav overflow-hidden z-10 relative transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'w-[320px]' : 'w-0'}`}
      >
        <div className="w-[320px] h-full flex flex-col">
          {/* Header */}
          <div className="h-[3rem] flex items-center justify-between px-4 border-b border-admin-border flex-shrink-0">
            <span className="text-admin-sm font-semibold uppercase tracking-widest text-admin-text-faint">
              COMMENTS ({topLevelCount})
            </span>
            <div className="flex items-center gap-1">
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
              <button
                onClick={onToggle}
                className="w-8 h-8 flex items-center justify-center rounded-admin-md text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
              >
                <PanelRightClose size={16} />
              </button>
            </div>
          </div>

          {/* Comment list */}
          <div ref={commentListRef} className="flex-1 overflow-y-auto admin-scrollbar-auto pt-3 pb-3">
            {loading && comments.length === 0 && (
              <p className="px-4 py-6 text-admin-sm text-admin-text-faint text-center">Loading...</p>
            )}
            {!loading && comments.length === 0 && (
              <p className="px-4 py-6 text-admin-sm text-admin-text-faint text-center">No comments yet.</p>
            )}
            {sortedThreads.map(thread => (
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

          {/* Footer — profile editor + email */}
          <div className="flex-shrink-0">
            <div
              className="overflow-hidden transition-[max-height,box-shadow] duration-300 ease-out"
              style={{
                maxHeight: sidebarProfileOpen ? 400 : 0,
                boxShadow: sidebarProfileOpen ? 'inset 0 1px 0 0 var(--admin-border)' : 'inset 0 1px 0 0 transparent',
              }}
            >
                  <div className="px-4 pt-5 pb-4 space-y-4">
                    {/* Avatar with upload */}
                    <div className="flex justify-center">
                      <div className="relative group/avatar">
                        <button
                          onClick={() => spFileRef.current?.click()}
                          className="relative flex-shrink-0"
                          title="Upload photo"
                        >
                          {spAvatarUrl ? (
                            <img src={spAvatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
                          ) : (
                            <div
                              className="w-16 h-16 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: spColor || avatarColor(viewerEmail) }}
                            >
                              <span className="text-black leading-none" style={{ fontSize: 32, fontWeight: 900 }}>
                                {getInitials(viewerName, viewerEmail)}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                            <Camera size={18} className="text-white" />
                          </div>
                        </button>
                        {spAvatarUrl && (
                          <button
                            onClick={() => { setSpAvatarUrl(null); setSpAvatarRemoved(true); setSpPendingFile(null); }}
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-black/80 border border-white/30 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity hover:bg-red-600 hover:border-red-600"
                            title="Remove photo"
                          >
                            <span className="text-white text-sm leading-none font-bold">&times;</span>
                          </button>
                        )}
                      </div>
                      <input
                        ref={spFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleSpAvatarUpload}
                      />
                    </div>

                    {/* Color picker (when no photo) */}
                    <AnimatePresence>
                      {!spAvatarUrl && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center justify-between py-1 px-0.5">
                            {['#ef4444','#e67e22','#f59e0b','#22c55e','#14b8a6','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#ec4899'].map(c => (
                              <button
                                key={c}
                                onClick={() => setSpColor(c)}
                                className="w-5 h-5 rounded-full transition-transform hover:scale-125"
                                style={{
                                  backgroundColor: c,
                                  outline: (spColor || avatarColor(viewerEmail)) === c ? '2px solid white' : 'none',
                                  outlineOffset: '1px',
                                }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* First name */}
                    <input
                      value={spFirstName}
                      onChange={e => setSpFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full bg-white/[0.06] border border-white/[0.14] rounded-lg px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                    />

                    {/* Last name */}
                    <input
                      value={spLastName}
                      onChange={e => setSpLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full bg-white/[0.06] border border-white/[0.14] rounded-lg px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                    />

                    {/* Email */}
                    <input
                      value={spEmail}
                      onChange={e => setSpEmail(e.target.value)}
                      placeholder="Email"
                      type="email"
                      className="w-full bg-white/[0.06] border border-white/[0.14] rounded-lg px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                    />

                  </div>
            </div>

            {/* Button row */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-admin-border">
              <button
                onClick={() => {
                  if (!sidebarProfileOpen) {
                    spSnapshot.current = { firstName: spFirstName, lastName: spLastName, email: spEmail, color: spColor, avatarUrl: spAvatarUrl };
                  }
                  setSidebarProfileOpen(p => !p);
                }}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors ${
                  sidebarProfileOpen
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-white/[0.14] text-white/50 hover:text-white hover:border-white/30'
                }`}
                title="Edit profile"
              >
                <Settings size={16} />
              </button>
              <AnimatePresence mode="wait">
                {sidebarProfileOpen ? (
                  <motion.div
                    key="profile-actions"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="flex items-center gap-2"
                  >
                    <button
                      onClick={() => {
                        setSidebarProfileOpen(false);
                        setSpFirstName(spSnapshot.current.firstName);
                        setSpLastName(spSnapshot.current.lastName);
                        setSpEmail(spSnapshot.current.email);
                        setSpColor(spSnapshot.current.color);
                        setSpAvatarUrl(spSnapshot.current.avatarUrl);
                        setSpPendingFile(null);
                        setSpAvatarRemoved(false);
                      }}
                      className="px-3 py-1.5 text-sm text-white/50 border border-white/20 rounded-lg hover:text-white hover:border-white/40 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSpSave}
                      disabled={spSaving || !spDirty}
                      className={`px-3 py-1.5 text-sm rounded-lg border ${
                        spDirty
                          ? 'bg-white text-black border-white hover:bg-white/90'
                          : 'bg-transparent text-white/20 border-white/20 cursor-not-allowed'
                      } disabled:opacity-50`}
                    >
                      {spSaving ? 'Saving...' : 'Save'}
                    </button>
                  </motion.div>
                ) : (
                  <motion.a
                    key="email-btn"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    ref={emailBtnRef}
                    href="mailto:hi@fna.wtf"
                    className="relative px-3 py-1.5 text-sm font-medium text-admin-text-primary border border-admin-border rounded-lg overflow-hidden flex items-center gap-2"
                  >
                    <div
                      ref={emailFillRef}
                      className="absolute inset-0 bg-admin-text-primary pointer-events-none"
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
                  </motion.a>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
