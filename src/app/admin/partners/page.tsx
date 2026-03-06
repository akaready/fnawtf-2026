import { getClients, getTestimonials, getContacts } from '../actions';
import { PartnersTable } from '../_components/PartnersTable';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PartnersPage() {
  const supabase = await createClient();
  const [clients, { data: projects }, testimonials, contacts, { data: proposals }] = await Promise.all([
    getClients(),
    supabase
      .from('projects')
      .select('id, title, slug, thumbnail_url, client_id, category')
      .order('title'),
    getTestimonials(),
    getContacts(),
    supabase
      .from('proposals')
      .select('id, title, contact_company')
      .order('title'),
  ]);

  return (
    <PartnersTable
      initialPartners={clients}
      projects={(projects ?? []).map((p) => {
        const r = p as Record<string, unknown>;
        return {
          id: r.id as string,
          title: r.title as string,
          slug: r.slug as string,
          thumbnail_url: (r.thumbnail_url as string) ?? null,
          client_id: (r.client_id as string) ?? null,
          category: (r.category as string) ?? null,
        };
      })}
      testimonials={testimonials.map((t) => ({
        id: t.id,
        quote: t.quote,
        person_name: t.person_name,
        person_title: t.person_title ?? null,
        client_id: t.client_id ?? null,
      }))}
      contacts={contacts}
      proposals={(proposals ?? []).map((p) => {
        const r = p as Record<string, unknown>;
        return { id: r.id as string, title: r.title as string, contact_company: (r.contact_company as string) ?? null };
      })}
    />
  );
}
