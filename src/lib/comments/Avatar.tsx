'use client';

import { avatarColor, getInitials } from '@/lib/comments/utils';

/** Default avatar size in pixels */
export const AVATAR_SIZE = 20;

export function Avatar({ email, name, url, size = AVATAR_SIZE }: { email: string; name: string | null; url?: string | null; size?: number }) {
  const px = `${size}px`;
  if (url) {
    return <img src={url} alt="" className="rounded-full object-cover flex-shrink-0" style={{ width: px, height: px, border: '1px solid #000' }} />;
  }
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: px, height: px, backgroundColor: avatarColor(email), border: '1px solid #000' }}>
      <span className="text-black leading-none" style={{ fontSize: size * 0.5, fontWeight: 900 }}>{getInitials(name, email)}</span>
    </div>
  );
}
