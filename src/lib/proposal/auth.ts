// Re-exports from shared auth library for backwards compatibility.
// New code should import from '@/lib/share/auth' directly.
import { setShareAuthCookie, getShareAuthCookie, clearShareAuthCookie, verifySharePassword } from '@/lib/share/auth';

export const setProposalAuthCookie = (slug: string, email: string, name?: string) =>
  setShareAuthCookie('proposal', slug, email, name);

export const getProposalAuthCookie = (slug: string) =>
  getShareAuthCookie('proposal', slug);

export const clearProposalAuthCookie = (slug: string) =>
  clearShareAuthCookie('proposal', slug);

export const verifyProposalPassword = verifySharePassword;
