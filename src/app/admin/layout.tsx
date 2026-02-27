import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AdminShell } from './_components/AdminShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FNA.wtf • Admin Portal',
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // No session = login page (proxy handles protection for all other routes)
  // Render children bare so /admin/login doesn't get wrapped in the shell
  if (!session) return <>{children}</>;

  return <AdminShell userEmail={session.user.email ?? ''}>{children}</AdminShell>;
}
