import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal/portalAuth';
import { PortalTopBar } from '@/components/portal/PortalTopBar';

export default async function PortalProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPortalSession();

  if (!session) {
    redirect('/portal/login');
  }

  return (
    <div className="flex flex-col flex-1 bg-portal-bg-base">
      <PortalTopBar
        clientName={session.clientName}
        clientLogoUrl={session.logoUrl}
        email={session.email}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
