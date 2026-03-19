'use server';

import { redirect } from 'next/navigation';
import { clearPortalSession } from './portalAuth';

export async function logoutFromPortal(): Promise<void> {
  await clearPortalSession();
  redirect('/portal/login');
}
