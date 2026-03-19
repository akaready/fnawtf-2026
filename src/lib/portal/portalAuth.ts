import { cookies } from 'next/headers';

const PORTAL_COOKIE_NAME = 'portal_auth';
const PORTAL_COOKIE_PATH = '/portal';
const PORTAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export interface PortalSession {
  clientId: string;
  clientName: string;
  email: string;
  logoUrl: string | null;
}

export async function setPortalSession(session: PortalSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: PORTAL_COOKIE_MAX_AGE,
    path: PORTAL_COOKIE_PATH,
  });
}

export async function getPortalSession(): Promise<PortalSession | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(PORTAL_COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    const session = JSON.parse(cookie.value) as PortalSession;
    if (!session.clientId || !session.clientName || !session.email) return null;
    return session;
  } catch {
    return null;
  }
}

export async function clearPortalSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PORTAL_COOKIE_NAME);
}
