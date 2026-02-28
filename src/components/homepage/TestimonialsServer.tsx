/**
 * TestimonialsServer — server component
 * Fetches testimonials from Supabase and passes them to the client scroll component.
 */

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';
import { TestimonialsSection } from './Testimonials';

type TestimonialRow = Pick<Database['public']['Tables']['testimonials']['Row'],
  'id' | 'quote' | 'person_name' | 'person_title' | 'company'
> & {
  client: { logo_url: string | null } | null;
  projects: { clients: { logo_url: string | null } | null } | null;
};

export async function TestimonialsServer() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('testimonials')
    .select('id, quote, person_name, person_title, company, client:clients(logo_url), projects(clients(logo_url))')
    .order('display_order', { ascending: true });

  const testimonials = ((data ?? []) as TestimonialRow[]).map((t) => {
    // Prefer direct client relation logo, fall back to project->client logo
    const logoUrl = t.client?.logo_url ?? t.projects?.clients?.logo_url ?? '';
    return {
      id: t.id,
      quote: `"${t.quote}"`,
      name: t.person_name ?? 'Anonymous',
      title: t.person_title ?? '',
      company: t.company ?? '',
      logoUrl,
    };
  });

  return <TestimonialsSection testimonials={testimonials} />;
}
