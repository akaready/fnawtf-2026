import { cookies } from 'next/headers';

const COOKIE_PREFIX = 'proposal_auth_';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function setProposalAuthCookie(slug: string, email: string) {
  const cookieStore = await cookies();
  cookieStore.set(`${COOKIE_PREFIX}${slug}`, email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: `/p/${slug}`,
  });
}

export async function getProposalAuthCookie(slug: string): Promise<{ email: string; name: string | null } | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(`${COOKIE_PREFIX}${slug}`);
  if (!cookie?.value) return null;
  const parts = cookie.value.split('\n');
  if (parts.length >= 2) {
    return { name: parts[0], email: parts[1] };
  }
  // Legacy cookie: email only
  return { email: parts[0], name: null };
}

export async function clearProposalAuthCookie(slug: string) {
  const cookieStore = await cookies();
  cookieStore.delete(`${COOKIE_PREFIX}${slug}`);
}

export function verifyProposalPassword(inputPassword: string, storedPassword: string): boolean {
  return inputPassword === storedPassword;
}
