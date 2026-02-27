import { createClient } from '@/lib/supabase/server';
import { getTagSuggestions, getTestimonials, getClients } from '../actions';
import { ProjectsPageClient } from './ProjectsPageClient';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  const supabase = await createClient();
  const [{ data: projects }, tagSuggestions, allTestimonials, allClients] = await Promise.all([
    supabase.from('projects').select('*').order('updated_at', { ascending: false }),
    getTagSuggestions(),
    getTestimonials(),
    getClients(),
  ]);

  const testimonials = allTestimonials.map((t) => ({
    id: t.id,
    quote: t.quote,
    person_name: t.person_name,
    project_id: t.project_id,
    client_id: t.client_id ?? null,
  }));

  return (
    <ProjectsPageClient
      projects={projects ?? []}
      tagSuggestions={tagSuggestions}
      testimonials={testimonials}
      clients={allClients.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
