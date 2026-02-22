/**
 * TestimonialsServer — server component
 * Fetches testimonials from Supabase and passes them to the client scroll component.
 */

import { createClient } from '@/lib/supabase/server';
import { TestimonialsSection } from './Testimonials';

export async function TestimonialsServer() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('testimonials')
    .select('id, quote, person_name, person_title, display_title, company, projects(clients(logo_url))')
    .order('created_at', { ascending: false });

  const testimonials = (data ?? []).map((t) => {
    const proj = t.projects as { clients: { logo_url: string | null } | null } | null;
    return {
      id: t.id,
      quote: `"${t.quote}"`,
      name: t.person_name ?? 'Anonymous',
      title: t.display_title ?? t.person_title ?? '',
      company: t.company ?? '',
      logoUrl: proj?.clients?.logo_url ?? '',
    };
  });

  return <TestimonialsSection testimonials={testimonials} />;
}
