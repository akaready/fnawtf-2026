import { Inbox } from 'lucide-react';
import { getPortalSession } from '@/lib/portal/portalAuth';

export default async function PortalIntakePage() {
  await getPortalSession();

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-portal-text-primary tracking-tight">
          Intake
        </h1>
        <p className="mt-1 text-sm text-portal-text-muted">
          Project briefs and intake submissions
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Inbox size={48} strokeWidth={1.25} className="text-portal-text-faint mb-4" />
        <p className="text-sm font-medium text-portal-text-muted mb-1">Coming soon</p>
        <p className="text-xs text-portal-text-faint max-w-xs">
          Project intake forms and submissions will appear here once this section is live.
        </p>
      </div>
    </div>
  );
}
