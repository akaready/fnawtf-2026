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
  const offset = Math.round(size * 0.25);
  const totalWidth = size + (unique.length - 1) * offset;
  const nudge = (totalWidth - size) / 2;
  return (
    // Outer div occupies exactly `size` in layout flow
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Inner div is absolutely positioned, centered, and holds all avatars without clipping */}
      <div className="absolute top-0" style={{ width: totalWidth, height: size, left: -nudge }}>
        {unique.map((c, i) => (
          <div key={c.viewer_email} className="absolute top-0 rounded-full flex items-center justify-center overflow-hidden"
            style={{ width: size, height: size, backgroundColor: c.avatar_url ? undefined : avatarColor(c.viewer_email), zIndex: unique.length - i, left: i * offset, border: '1px solid #000' }}>
            {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : (
              <span className="text-black leading-none" style={{ fontSize: size * 0.5, fontWeight: 900 }}>{getInitials(c.viewer_name, c.viewer_email)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
