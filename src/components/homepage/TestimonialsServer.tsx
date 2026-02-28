/**
 * TestimonialsServer — server component
 * Fetches testimonials from Supabase and passes them to the client scroll component.
 */

import { createClient } from '@/lib/supabase/server';
import { TestimonialsSection } from './Testimonials';

export async function TestimonialsServer() {
  const supabase = await createClient();

  // Use wildcard select to avoid referencing columns that may not exist yet
  const { data, error } = await supabase
    .from('testimonials')
    .select('*');

  if (error) {
    console.error('[TestimonialsServer] error:', error.message, error.details, error.hint);
    return <TestimonialsSection testimonials={[]} />;
  }

  if (!data || data.length === 0) {
    console.warn('[TestimonialsServer] No testimonials found in database');
    return <TestimonialsSection testimonials={[]} />;
  }

  // Sort by display_order if the column exists, otherwise by created_at
  const rows = [...data].sort((a, b) => {
    if ('display_order' in a) return (a.display_order ?? 0) - (b.display_order ?? 0);
    return 0;
  });

  // Resolve client logos if client_id column exists on any rows
  const clientIds = rows.map(t => t.client_id).filter(Boolean);
  const projectIds = rows.filter(t => !t.client_id && t.project_id).map(t => t.project_id!);
  const logoMap = new Map<string, string>();

  if (clientIds.length > 0 || projectIds.length > 0) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, logo_url')
      .not('logo_url', 'is', null);
    if (clients) {
      for (const c of clients) {
        if (c.logo_url) logoMap.set(c.id, c.logo_url);
      }
    }

    if (projectIds.length > 0) {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, client_id')
        .in('id', projectIds);
      if (projects) {
        for (const p of projects) {
          if (p.client_id && logoMap.has(p.client_id)) {
            logoMap.set(`p:${p.id}`, logoMap.get(p.client_id)!);
          }
        }
      }
    }
  }

  const testimonials = rows.map((t) => ({
    id: t.id,
    quote: `"${t.quote}"`,
    name: t.person_name ?? 'Anonymous',
    title: t.person_title ?? '',
    company: t.company ?? '',
    logoUrl: (t.client_id && logoMap.get(t.client_id)) || (t.project_id && logoMap.get(`p:${t.project_id}`)) || '',
  }));

  return <TestimonialsSection testimonials={testimonials} />;
}
