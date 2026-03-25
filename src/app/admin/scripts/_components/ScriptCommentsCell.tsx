'use client';

import { useState, useCallback, useRef } from 'react';
import { Check, ChevronDown, Circle, Smile, Send, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { ScriptShareCommentRow } from '@/types/scripts';
import { firstName, formatRelativeTime, groupIntoThreads } from '@/lib/comments/utils';
import { Avatar } from '@/lib/comments/Avatar';
import { AVATAR } from '@/lib/comments/StackedAvatars';
import { avatarColor, getInitials } from '@/lib/comments/utils';
import { EmojiPicker } from '@/lib/comments/EmojiPicker';
import { toggleResolved, addReply, addComment, toggleReaction, updateComment, deleteComment } from '@/app/s/[token]/actions';

interface Props {
  comments: ScriptShareCommentRow[];
  shareId?: string;
  beatId?: string;
  onRefresh?: () => void;
}

function MoreMenu({ id, content, onRefresh }: {
  id: string; content: string; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editText, setEditText] = useState(content);
  const btnRef = useRef<HTMLButtonElement>(null);

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={1}
          className="flex-1 bg-admin-bg-base border border-admin-border rounded-admin-md px-2 py-1 text-admin-sm text-admin-text-primary resize-none focus:outline-none h-7" autoFocus />
        <button onClick={async () => { await updateComment(id, 'admin', editText.trim()); setEditing(false); onRefresh(); }}
          className="w-[18px] h-[18px] flex items-center justify-center text-admin-success"><Check size={14} /></button>
        <button onClick={() => { setEditing(false); setEditText(content); }}
          className="w-[18px] h-[18px] flex items-center justify-center text-admin-text-faint"><ChevronDown size={14} className="rotate-90" /></button>
      </div>
    );
  }

  const r = btnRef.current?.getBoundingClientRect();
  return (
    <>
      <button ref={btnRef} onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className={`w-[18px] h-[18px] flex items-center justify-center text-admin-text-faint hover:text-admin-text-muted transition-colors`}>
        <span className="relative inline-flex items-center justify-center w-[18px] h-[18px]">
          <Circle size={14} />
          <MoreHorizontal size={8} className="absolute" strokeWidth={3} />
        </span>
      </button>
      {open && r && createPortal(
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => { setOpen(false); setConfirmDelete(false); }} />
          <div className="fixed z-[101] bg-admin-bg-overlay border border-admin-border rounded-admin-md py-1 shadow-lg min-w-[100px]" style={{ top: r.bottom + 4, left: Math.max(4, r.left - 40) }}>
            <button onClick={() => { setOpen(false); setEditing(true); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-admin-sm text-admin-text-primary hover:bg-admin-bg-hover">
              <Pencil size={12} /> Edit
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1 px-3 py-1.5">
                <button onClick={async () => { setOpen(false); setConfirmDelete(false); await deleteComment(id, 'admin'); onRefresh(); }} className="flex items-center gap-1 text-admin-sm text-admin-danger hover:text-red-300 transition-colors">
                  <Check size={12} /> Confirm
                </button>
                <button onClick={() => setConfirmDelete(false)} className="flex items-center gap-1 text-admin-sm text-admin-text-faint hover:text-admin-text-primary transition-colors ml-2">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="w-full flex items-center gap-2 px-3 py-1.5 text-admin-sm text-admin-danger hover:bg-admin-bg-hover">
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

function Actions({ id, content, resolved, onRefresh, isParent }: { id: string; content: string; resolved: boolean; onRefresh: () => void; isParent?: boolean }) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover/thread:opacity-100 transition-opacity">
      <MoreMenu id={id} content={content} onRefresh={onRefresh} />
      <button ref={emojiRef} onClick={e => { e.stopPropagation(); setEmojiOpen(o => !o); }} className={`w-[18px] h-[18px] flex items-center justify-center text-admin-text-faint hover:text-admin-text-muted transition-colors ${emojiOpen ? 'opacity-100' : ''}`}>
        <Smile size={14} />
      </button>
      {emojiOpen && <EmojiPicker anchorRef={emojiRef} onSelect={async emoji => { await toggleReaction(id, 'admin', emoji); onRefresh(); }} onClose={() => setEmojiOpen(false)} />}
      {isParent && <button onClick={async e => { e.stopPropagation(); await toggleResolved(id, 'admin'); onRefresh(); }} className="flex items-center justify-center cursor-pointer" title={resolved ? 'Mark unresolved' : 'Mark resolved'}>
        {resolved ? (
          <span className="relative inline-flex items-center justify-center w-[18px] h-[18px]">
            <Circle size={14} className="text-admin-success" style={{ fill: 'var(--admin-success)' }} />
            <Check size={9} className="absolute text-admin-bg-sidebar" strokeWidth={3} />
          </span>
        ) : (
          <span className="relative inline-flex items-center justify-center w-[18px] h-[18px] text-admin-text-faint">
            <Circle size={14} />
            <Check size={9} className="absolute" strokeWidth={3} />
          </span>
        )}
      </button>}
    </div>
  );
}

/* Reply row — exact same pattern as presentation page ReplyRow */
function Row({ c, shareId: _shareId, onRefresh, isLast, highlight }: {
  c: ScriptShareCommentRow; shareId?: string; onRefresh?: () => void; isLast: boolean; highlight?: boolean;
}) {
  const resolved = !!c.resolved_at;
  const lineColor = highlight ? 'bg-admin-text-muted' : 'bg-admin-border';
  return (
    <div className="group/reply flex gap-2">
      {/* Left column: line above + avatar + line below */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: AVATAR }}>
        <div className={`w-px h-2 transition-colors duration-100 ${lineColor}`} />
        <div className="flex-shrink-0"><Avatar email={c.viewer_email} name={c.viewer_name} url={c.avatar_url} /></div>
        {!isLast && <div className={`w-px flex-1 transition-colors duration-100 ${lineColor}`} />}
      </div>
      {/* Right column — pt aligns name with avatar */}
      <div className={`min-w-0 flex-1 pt-2 ${isLast ? 'pb-1' : 'pb-2'}`}>
        <div className="flex items-center gap-1">
          <span className={`text-admin-sm font-semibold truncate ${resolved ? 'text-admin-text-faint' : 'text-admin-text-primary'}`}>{firstName(c.viewer_name, c.viewer_email)}</span>
          <span className="text-admin-sm text-admin-text-faint flex-shrink-0">{formatRelativeTime(c.created_at)}</span>
          {onRefresh && <span className="ml-auto"><Actions id={c.id} content={c.content} resolved={resolved} onRefresh={onRefresh} /></span>}
        </div>
        <p className={`text-admin-sm whitespace-pre-wrap break-words mt-0.5 ${resolved ? 'text-admin-text-faint' : 'text-admin-text-secondary'}`}>{c.content}</p>
      </div>
    </div>
  );
}

function ReplyInput({ shareId, parentId, onDone, onFocusChange }: { shareId: string; parentId: string; onDone: () => void; onFocusChange?: (focused: boolean) => void }) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const submit = useCallback(() => {
    if (!text.trim()) return;
    const v = text.trim();
    setText('');
    addReply(shareId, parentId, 'admin', null, v).then(onDone);
  }, [text, shareId, parentId, onDone]);
  return (
    <div className="flex">
      {/* L-shaped connector: border-left goes down, border-bottom curves right to reply center */}
      <div
        className={`flex-shrink-0 border-l border-b rounded-bl-lg transition-colors duration-100 ${focused ? 'border-admin-text-muted' : 'border-admin-border'}`}
        style={{ width: AVATAR / 2 + 8, marginLeft: AVATAR / 2 - 0.5, marginBottom: 16 }}
      />
      <div className="flex items-center gap-2 flex-1 py-1">
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); e.target.style.height = ''; e.target.style.height = e.target.scrollHeight > 28 ? e.target.scrollHeight + 'px' : ''; }}
          onFocus={() => { setFocused(true); onFocusChange?.(true); }}
          onBlur={() => { setFocused(false); onFocusChange?.(false); }}
          placeholder="Reply..."
          rows={1}
          className="flex-1 w-full bg-admin-bg-base border border-admin-border rounded-admin-md px-2 py-1 text-admin-sm leading-5 text-admin-text-primary placeholder:text-admin-text-faint resize-none overflow-hidden focus:outline-none focus:border-admin-text-muted min-h-7"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        />
        <button
          onClick={submit}
          className={`self-stretch w-8 flex-shrink-0 flex items-center justify-center rounded-admin-md border transition-colors ${text.trim() ? 'bg-admin-text-primary text-admin-bg-base border-admin-text-primary hover:opacity-90' : 'text-admin-text-faint border-admin-border'}`}
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}

function Thread({ thread, shareId, onRefresh }: {
  thread: { parent: ScriptShareCommentRow; replies: ScriptShareCommentRow[] }; shareId?: string; onRefresh?: () => void;
}) {
  const { parent, replies } = thread;
  const [expanded, setExpanded] = useState(true);
  const [replyFocused, setReplyFocused] = useState(false);
  const refresh = useCallback(() => { onRefresh?.(); }, [onRefresh]);

  // Compute avatar animation data
  const avatarOffset = Math.round(AVATAR * 0.25);
  const avatarSeen = new Set<string>();
  const uniqueAvatars: ScriptShareCommentRow[] = [];
  for (const c of [parent, ...replies]) {
    if (!avatarSeen.has(c.viewer_email)) { avatarSeen.add(c.viewer_email); uniqueAvatars.push(c); }
    if (uniqueAvatars.length >= 3) break;
  }
  const avatarNudge = ((uniqueAvatars.length - 1) * avatarOffset) / 2;
  const bgAvatars = uniqueAvatars.slice(1);
  const bgCount = bgAvatars.length;

  const hasReplies = replies.length > 0;

  return (
    <div className="group/thread overflow-visible">
      {/* Parent row: avatar column + text column (matches presentation page) */}
      <div className="flex gap-2 overflow-visible items-start">
        {/* Left column: avatar + vertical line */}
        <div className="flex flex-col items-center flex-shrink-0 cursor-pointer overflow-visible" style={{ width: AVATAR }} onClick={() => setExpanded(x => !x)}>
          <div className="relative flex-shrink-0" style={{ width: AVATAR, height: AVATAR, overflow: 'visible' }}>
            {bgAvatars.map((c, i) => {
              const origIdx = i + 1;
              const xPos = origIdx * avatarOffset - avatarNudge;
              const exitDelay = (bgCount - 1 - i) * 0.1;
              const enterDelay = i * 0.1;
              return (
                <motion.div
                  key={c.viewer_email}
                  className="absolute top-0 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ width: AVATAR, height: AVATAR, zIndex: uniqueAvatars.length - origIdx, left: xPos, border: '1px solid #000', pointerEvents: expanded ? 'none' : 'auto', backgroundColor: c.avatar_url ? undefined : avatarColor(c.viewer_email) }}
                  animate={expanded
                    ? { opacity: 0, y: 4, scale: 0.85, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1], delay: exitDelay } }
                    : { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.0, 0, 0.2, 1], delay: enterDelay } }
                  }
                >
                  {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : (
                    <span className="text-black leading-none" style={{ fontSize: AVATAR * 0.5, fontWeight: 900 }}>{getInitials(c.viewer_name, c.viewer_email)}</span>
                  )}
                </motion.div>
              );
            })}
            <motion.div
              className="absolute top-0"
              style={{ zIndex: uniqueAvatars.length }}
              animate={{ x: expanded ? 0 : -avatarNudge }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1], delay: expanded ? (uniqueAvatars.length - 1) * 0.05 : 0 }}
            >
              <Avatar email={parent.viewer_email} name={parent.viewer_name} url={parent.avatar_url} />
            </motion.div>
          </div>
          {/* No line here — it's in the animated block below */}
        </div>

        {/* Right column: name + body */}
        <div className="flex-1 min-w-0">
          <div className="group/namerow flex items-center gap-1 cursor-pointer select-none" onClick={() => setExpanded(x => !x)}>
            <span className={`text-admin-sm font-semibold whitespace-nowrap ${parent.resolved_at ? 'text-admin-text-faint' : 'text-admin-text-primary'}`}>
              {firstName(parent.viewer_name, parent.viewer_email)}<span className={`comment-names-suffix ${!expanded ? 'is-visible' : ''}`}>{(() => {
                const seen = new Set<string>();
                const names: string[] = [];
                for (const c of [parent, ...replies]) {
                  const n = firstName(c.viewer_name, c.viewer_email);
                  if (!seen.has(n)) { seen.add(n); names.push(n); }
                }
                if (names.length <= 1) return '';
                const rest = names.slice(1);
                if (rest.length === 1) return `, and ${rest[0]}`;
                if (rest.length === 2) return `, ${rest[0]}, and ${rest[1]}`;
                return `, ${rest[0]}, ${rest[1]}...`;
              })()}</span>
            </span>
            <span className="text-admin-sm text-admin-text-faint flex-shrink-0">{formatRelativeTime(parent.created_at)}</span>
            <span className={`text-admin-text-faint transition-all opacity-0 group-hover/thread:opacity-100 ${expanded ? '' : '-rotate-90'}`}><ChevronDown size={10} /></span>
            <span className="ml-auto"><Actions id={parent.id} content={parent.content} resolved={!!parent.resolved_at} onRefresh={refresh} isParent /></span>
          </div>
        </div>
      </div>

      {/* Body + replies + reply input — ONE animated block */}
      <div className={`comment-expand ${expanded ? 'is-open' : ''}`}>
        <div>
          {/* Parent body with connector line on the left */}
          <div className="flex gap-2">
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: AVATAR }}>
              {(hasReplies || shareId) && <div className={`w-px flex-1 transition-colors duration-100 ${replyFocused ? 'bg-admin-text-muted' : 'bg-admin-border'}`} />}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p className={`text-admin-sm whitespace-pre-wrap break-words mt-0.5 ${parent.resolved_at ? 'text-admin-text-faint' : 'text-admin-text-secondary'}`}>{parent.content}</p>
            </div>
          </div>
          {/* Replies */}
          {hasReplies && replies.map((r, i) => (
            <Row key={r.id} c={r} shareId={shareId} onRefresh={refresh} isLast={!shareId && i === replies.length - 1} highlight={replyFocused} />
          ))}
          {shareId && <ReplyInput shareId={shareId} parentId={parent.id} onDone={refresh} onFocusChange={setReplyFocused} />}
        </div>
      </div>
    </div>
  );
}

function NewComment({ shareId, beatId, onDone }: { shareId: string; beatId: string; onDone: () => void }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submit = useCallback(async () => {
    if (!text.trim()) return;
    setSending(true);
    try { await addComment(shareId, beatId, 'admin', null, text.trim()); setText(''); onDone(); }
    finally { setSending(false); }
  }, [text, shareId, beatId, onDone]);

  const active = focused || !!text.trim();

  return (
    <div className="px-3 pb-2 mt-auto">
      <div className="flex items-center gap-2">
        {/* Avatar slides up from below on focus */}
        <div
          className="flex-shrink-0 transition-all duration-200 ease-out"
          style={{ width: active ? AVATAR : 0, opacity: active ? 1 : 0, transform: active ? 'scale(1)' : 'scale(0.5)' }}
        >
          <Avatar email="admin" name="Admin" />
        </div>
        <textarea ref={textareaRef} value={text}
          onChange={e => { setText(e.target.value); e.target.style.height = ''; e.target.style.height = e.target.scrollHeight > 28 ? e.target.scrollHeight + 'px' : ''; }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={1}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="New comment..." className="flex-1 w-full bg-admin-bg-base border border-admin-border rounded-admin-md px-2 py-1 text-admin-sm leading-5 text-admin-text-primary placeholder:text-admin-text-faint resize-none overflow-hidden focus:outline-none focus:border-admin-text-muted min-h-7 transition-all duration-200" />
        <button onClick={submit} disabled={!text.trim() || sending}
          className={`self-stretch w-8 flex-shrink-0 flex items-center justify-center rounded-admin-md border transition-colors ${text.trim() ? 'bg-admin-text-primary text-admin-bg-base border-admin-text-primary hover:opacity-90' : 'text-admin-text-faint border-admin-border'}`}>
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}

export function ScriptCommentsCell({ comments, shareId, beatId, onRefresh }: Props) {
  const threads = groupIntoThreads(comments);
  const refresh = useCallback(() => { onRefresh?.(); }, [onRefresh]);
  return (
    <div className="flex flex-col h-full pt-3 min-h-0">
      {threads.length > 0 ? (
        <div className="space-y-3 pb-2 px-3 flex-1 overflow-y-auto admin-scrollbar-auto">
          {threads.map(t => <Thread key={t.parent.id} thread={t} shareId={shareId} onRefresh={refresh} />)}
        </div>
      ) : <div className="flex-1" />}
      {shareId && beatId && <NewComment shareId={shareId} beatId={beatId} onDone={refresh} />}
    </div>
  );
}
