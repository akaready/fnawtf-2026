import { getClients, getTestimonials } from '../actions';
import { ClientsManager } from '../_components/ClientsManager';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const supabase = await createClient();
  const [clients, { data: projects }, testimonials] = await Promise.all([
    getClients(),
    supabase
      .from('projects')
      .select('id, title, slug, thumbnail_url, client_id')
      .order('title'),
    getTestimonials(),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {clients.length} total — Manage client records and logos.
        </p>
      </div>
      <ClientsManager
        initialClients={clients}
        projects={(projects ?? []).map((p) => {
          const r = p as Record<string, unknown>;
          return {
            id: r.id as string,
            title: r.title as string,
            slug: r.slug as string,
            thumbnail_url: (r.thumbnail_url as string) ?? null,
            client_id: (r.client_id as string) ?? null,
          };
        })}
        testimonials={testimonials.map((t) => ({
          id: t.id,
          quote: t.quote,
          person_name: t.person_name,
          person_title: t.person_title ?? null,
          client_id: t.client_id ?? null,
        }))}
      />
    </div>
  );
}
