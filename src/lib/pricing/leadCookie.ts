// Client-side only — do not import in server components.

export interface LeadData {
  name: string;
  company?: string;
  email: string;
  timeline: string;       // 'asap' | 'soon' | 'later' | 'specific' | 'unsure'
  timelineDate?: string;  // ISO date string, only when timeline === 'specific'
}

const COOKIE_NAME = 'fna_lead';
const COOKIE_DAYS = 30;

export function getLeadCookie(): LeadData | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(COOKIE_NAME + '='));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
  } catch {
    return null;
  }
}

export function setLeadCookie(data: LeadData): void {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_DAYS);
  document.cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}`,
    `expires=${expires.toUTCString()}`,
    'path=/',
    'SameSite=Lax',
  ].join('; ');
}
