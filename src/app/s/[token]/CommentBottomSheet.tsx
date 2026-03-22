'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { MessageCircle, X, ListFilter, Check, Send } from 'lucide-react';
import {
  SharedCommentCard,
  sharedBuildBeatLabelMap,
  sharedGroupIntoThreads,
} from './CommentSidebar';
import type { ShareComment, ReactionsMap } from './CommentSidebar';
import { getShareComments, getReactions, addComment } from './actions';
import type { PresentationSlide } from '@/app/admin/scripts/_components/presentationUtils';

// ── Props ────────────────────────────────────────────────────────────────

interface Props {
  shareId: string;
  currentBeatId: string | null;
  viewerEmail: string;
  viewerName: string | null;
  refreshKey: number;
  slides: PresentationSlide[];
  onNavigateToBeat: (beatId: string) => void;
  onCommentAdded: () => void;
}

export function CommentBottomSheet({ shareId, currentBeatId, viewerEmail, viewerName, refreshKey, slides, onNavigateToBeat, onCommentAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<ShareComment[]>([]);
  const [reactions, setReactions] = useState<ReactionsMap>({});
  const [loading, setLoading] = useState(false);
  const [sortMode, setSortMode] = useState<'script' | 'oldest' | 'newest' | 'unresolved'>('script');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [newText, setNewText] = useState('');
  const [isPending, startTransition] = useTransition();

  const beatLabelMap = sharedBuildBeatLabelMap(slides);

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

  useEffect(() => {
    if (open) loadComments();
  }, [open, loadComments, refreshKey]);

  const handleToggleReaction = useCallback(async (commentId: string, emoji: string) => {
    const { toggleReaction } = await import('./actions');
    await toggleReaction(commentId, viewerEmail, emoji);
    const commentIds = comments.map(c => c.id);
    if (commentIds.length > 0) {
      const r = await getReactions(commentIds);
      setReactions(r);
    }
  }, [viewerEmail, comments]);

  const handleNewComment = () => {
    if (!newText.trim() || !currentBeatId) return;
    const content = newText.trim();
    setNewText('');
    startTransition(async () => {
      await addComment(shareId, currentBeatId, viewerEmail, viewerName, content);
      onCommentAdded();
      loadComments();
    });
  };

  const currentBeatLabel = currentBeatId ? beatLabelMap[currentBeatId] ?? '' : '';

  // Close sort menu on outside click
  useEffect(() => {
    if (!sortMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) setSortMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortMenuOpen]);

  const threads = sharedGroupIntoThreads(comments);
  const topLevelCount = threads.length;

  // Sort threads — same logic as sidebar
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
      if (aR !== bR) return aR - bR;
      return new Date(b.parent.created_at).getTime() - new Date(a.parent.created_at).getTime();
    }
    return new Date(b.parent.created_at).getTime() - new Date(a.parent.created_at).getTime();
  });

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); loadComments(); }}
        className="w-9 h-9 flex items-center justify-center rounded-admin-md bg-[#1a1a1a] text-white/70 hover:bg-[#252525] hover:text-white transition-colors relative"
        title="Comments"
      >
        <MessageCircle size={16} />
        {topLevelCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-admin-text-primary text-admin-bg-base text-[9px] font-bold">
            {topLevelCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Bottom sheet */}
      <div className={`fixed left-0 right-0 bottom-0 z-[61] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="bg-[#111111] border-t border-admin-border rounded-t-2xl max-h-[70vh] flex flex-col">
          {/* Handle + header */}
          <div className="flex flex-col items-center pt-4 pb-3 px-5 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/10 mb-4" />
            <div className="flex items-center justify-between w-full">
              <span className="text-admin-sm font-semibold uppercase tracking-widest text-admin-text-faint">
                Comments {topLevelCount > 0 && `(${topLevelCount})`}
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
                <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-admin-md text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Comment list — uses same CommentCard as sidebar */}
          <div className="flex-1 overflow-y-auto admin-scrollbar-auto pt-1 pb-3 px-1">
            {loading && comments.length === 0 && (
              <p className="px-4 py-6 text-admin-sm text-admin-text-faint text-center">Loading...</p>
            )}
            {!loading && comments.length === 0 && (
              <p className="px-4 py-6 text-admin-sm text-admin-text-faint text-center">No comments yet.</p>
            )}
            {sortedThreads.map(thread => (
              <SharedCommentCard
                key={thread.parent.id}
                thread={thread}
                beatLabel={beatLabelMap[thread.parent.beat_id] ?? '?'}
                isActive={thread.parent.beat_id === currentBeatId}
                isOwn={thread.parent.viewer_email === viewerEmail}
                viewerEmail={viewerEmail}
                viewerName={viewerName}
                shareId={shareId}
                onNavigate={() => { onNavigateToBeat(thread.parent.beat_id); setOpen(false); }}
                onRefresh={loadComments}
                reactions={reactions}
                onToggleReaction={handleToggleReaction}
              />
            ))}
          </div>

          {/* Comment input — identical to floating input on main view */}
          <div className="flex-shrink-0 px-3 py-3">
            {currentBeatLabel && (
              <p className="text-admin-sm text-admin-text-faint mb-2 px-1">Commenting on <span className="text-admin-warning font-mono">{currentBeatLabel}</span></p>
            )}
            <div className="bg-[#111111] border border-white/[0.14] rounded-xl shadow-[0_-8px_40px_rgba(0,0,0,0.7),0_-2px_15px_rgba(0,0,0,0.5)] flex items-center gap-3 pl-4 pr-2 py-2">
              <textarea
                value={newText}
                onChange={e => {
                  setNewText(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleNewComment(); } }}
                placeholder="Share feedback..."
                rows={1}
                style={{ overflow: 'hidden' }}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none border-none outline-none leading-relaxed max-md:[font-size:16px]"
              />
              <button
                onClick={handleNewComment}
                disabled={isPending || !newText.trim()}
                className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${
                  newText.trim()
                    ? 'bg-white text-black border-white hover:bg-white/90'
                    : 'bg-transparent text-white/20 border-white/20'
                } disabled:cursor-not-allowed`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
