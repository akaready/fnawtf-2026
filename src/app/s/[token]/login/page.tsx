import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ScriptLoginForm } from './ScriptLoginForm';

export const dynamic = 'force-dynamic';

export default async function ScriptLoginPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: share } = await supabase
    .from('script_shares')
    .select('token, script_id, share_preferences')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  if (!share) redirect('/');

  const row = share as unknown as { token: string; script_id: string; share_preferences: Record<string, unknown> | null };

  // Fetch script + project + client for display
  const { createServiceClient } = await import('@/lib/supabase/service');
  const service = createServiceClient();

  const { data: script } = await service
    .from('scripts')
    .select('title, project_id')
    .eq('id', row.script_id)
    .single();

  let projectTitle = '';
  let clientName = '';

  if (script) {
    const s = script as { title: string; project_id: string | null };
    projectTitle = s.title;

    if (s.project_id) {
      const { data: project } = await service
        .from('projects')
        .select('title, client_id')
        .eq('id', s.project_id)
        .single();
      if (project) {
        const p = project as { title: string; client_id: string | null };
        projectTitle = p.title;
        if (p.client_id) {
          const { data: client } = await service
            .from('clients')
            .select('name')
            .eq('id', p.client_id)
            .single();
          if (client) clientName = (client as { name: string }).name;
        }
      }
    }
  }

  const requireAccessCode = (row.share_preferences as Record<string, unknown> | null)?.require_access_code === true;

  return (
    <ScriptLoginForm
      token={token}
      scriptTitle={projectTitle || (script as { title: string } | null)?.title || 'Script'}
      clientName={clientName}
      requireAccessCode={requireAccessCode}
    />
  );
}
