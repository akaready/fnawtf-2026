/**
 * TestimonialsServer — server component
 * Fetches testimonials from Supabase and passes them to the client scroll component.
 */

import { createClient } from '@/lib/supabase/server';
import { TestimonialsSection } from './Testimonials';

interface TestimonialRow {
  id: string;
  quote: string;
  person_name: string | null;
  person_title: string | null;
  company: string | null;
  project_id: string | null;
  client_id: string | null;
}

interface ClientRow {
  id: string;
  logo_url: string | null;
}

export async function TestimonialsServer() {
  const supabase = await createClient();

  // Fetch testimonials and clients separately to avoid PostgREST join issues
  const [testimonialsRes, clientsRes] = await Promise.all([
    supabase
      .from('testimonials')
      .select('id, quote, person_name, person_title, company, project_id, client_id')
      .order('display_order', { ascending: true }),
    supabase
      .from('clients')
      .select('id, logo_url')
      .not('logo_url', 'is', null),
  ]);

  if (testimonialsRes.error) {
    console.error('[TestimonialsServer] testimonials error:', testimonialsRes.error.message, testimonialsRes.error.details, testimonialsRes.error.hint);
  }

  const rows = (testimonialsRes.data ?? []) as TestimonialRow[];

  // Build client logo lookup if we need logos
  let logoMap = new Map<string, string>();
  if (clientsRes.data) {
    // Direct client_id lookup
    for (const c of clientsRes.data as ClientRow[]) {
      if (c.logo_url) logoMap.set(c.id, c.logo_url);
    }
  }

  // If testimonials have project_id but no client_id, resolve logos via projects
  const projectIds = rows.filter(t => !t.client_id && t.project_id).map(t => t.project_id!);
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, client_id')
      .in('id', projectIds);
    if (projects) {
      const projectClientMap = new Map<string, string>();
      for (const p of projects as { id: string; client_id: string | null }[]) {
        if (p.client_id && logoMap.has(p.client_id)) {
          projectClientMap.set(p.id, logoMap.get(p.client_id)!);
        }
      }
      // Merge into logoMap keyed by project_id for easy lookup
      for (const [pid, url] of projectClientMap) {
        logoMap.set(`project:${pid}`, url);
      }
    }
  }

  const testimonials = rows.map((t) => {
    const logoUrl = (t.client_id && logoMap.get(t.client_id)) || (t.project_id && logoMap.get(`project:${t.project_id}`)) || '';
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
