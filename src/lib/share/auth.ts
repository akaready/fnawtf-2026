import { cookies } from 'next/headers';

export type ShareType = 'proposal' | 'script';

const CONFIG: Record<ShareType, { cookiePrefix: string; pathPrefix: string }> = {
  proposal: { cookiePrefix: 'proposal_auth_', pathPrefix: '/p/' },
  script:   { cookiePrefix: 'script_auth_',   pathPrefix: '/s/' },
};

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function setShareAuthCookie(type: ShareType, slug: string, email: string, name?: string) {
  const { cookiePrefix, pathPrefix } = CONFIG[type];
  const cookieStore = await cookies();
  const value = name ? `${name}\n${email}` : email;
  cookieStore.set(`${cookiePrefix}${slug}`, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: `${pathPrefix}${slug}`,
  });
}

export async function getShareAuthCookie(type: ShareType, slug: string): Promise<{ email: string; name: string | null } | null> {
  const { cookiePrefix } = CONFIG[type];
  const cookieStore = await cookies();
  const cookie = cookieStore.get(`${cookiePrefix}${slug}`);
  if (!cookie?.value) return null;
  const parts = cookie.value.split('\n');
  if (parts.length >= 2) {
    return { name: parts[0], email: parts[1] };
  }
  // Legacy cookie: email only
  return { email: parts[0], name: null };
}

export async function clearShareAuthCookie(type: ShareType, slug: string) {
  const { cookiePrefix } = CONFIG[type];
  const cookieStore = await cookies();
  cookieStore.delete(`${cookiePrefix}${slug}`);
}

export function verifySharePassword(inputPassword: string, storedPassword: string): boolean {
  return inputPassword === storedPassword;
}
