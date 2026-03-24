'use client';

import type { ScriptShareCommentRow } from '@/types/scripts';
import { avatarColor, getInitials } from '@/lib/comments/utils';

/** Default avatar size for stacked avatars */
export const AVATAR = 20;

export function StackedAvatars({ comments, size = AVATAR }: { comments: ScriptShareCommentRow[]; size?: number }) {
  // Original order — first commenter gets highest z-index (top of stack)
  const seen = new Set<string>();
  const unique: ScriptShareCommentRow[] = [];
  for (const c of comments) {
    if (!seen.has(c.viewer_email)) { seen.add(c.viewer_email); unique.push(c); }
    if (unique.length >= 3) break;
  }
  const offset = Math.round(size * 0.3);
  const totalWidth = size + (unique.length - 1) * offset;
  const nudge = (totalWidth - size) / 2;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size, overflow: 'visible' }}>
      {unique.map((c, i) => (
        <div key={c.viewer_email} className="absolute top-0 rounded-full flex items-center justify-center overflow-hidden"
          style={{ width: size, height: size, backgroundColor: c.avatar_url ? undefined : avatarColor(c.viewer_email), zIndex: unique.length - i, left: i * offset - nudge, border: '1px solid #000' }}>
          {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : (
            <span className="text-black leading-none" style={{ fontSize: size * 0.5, fontWeight: 900 }}>{getInitials(c.viewer_name, c.viewer_email)}</span>
          )}
        </div>
      ))}
    </div>
  );
}
