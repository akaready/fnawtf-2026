import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal/portalAuth';
import { PortalLoginForm } from './PortalLoginForm';

export const dynamic = 'force-dynamic';

export default async function PortalLoginPage() {
  const session = await getPortalSession();
  if (session) redirect('/portal');

  return <PortalLoginForm />;
}
