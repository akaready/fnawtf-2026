import { redirect } from 'next/navigation';
import { resolveAdminContact } from '@/lib/auth/resolveAdminContact';
import { StyleGuideClient } from './_components/StyleGuideClient';

export default async function StyleGuidePage() {
  const contact = await resolveAdminContact();

  if (!contact || contact.admin_role !== 'super_admin') {
    redirect('/admin');
  }

  return <StyleGuideClient />;
}
