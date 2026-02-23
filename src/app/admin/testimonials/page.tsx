import { getTestimonials, getClients } from '../actions';
import { TestimonialsManager } from '../_components/TestimonialsManager';

export const dynamic = 'force-dynamic';

export default async function TestimonialsPage() {
  const [testimonials, clients] = await Promise.all([
    getTestimonials(),
    getClients(),
  ]);

  // Also fetch projects for the project selector
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, client_id')
    .order('title');

  return (
    <TestimonialsManager
      initialTestimonials={testimonials}
      clients={clients.map((c) => ({ id: c.id, name: c.name, logo_url: c.logo_url }))}
      projects={(projects ?? []).map((p) => {
        const r = p as Record<string, unknown>;
        return { id: r.id as string, title: r.title as string, client_id: (r.client_id as string) ?? null };
      })}
    />
  );
}
