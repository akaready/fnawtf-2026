import { createClient } from '@/lib/supabase/server';
import { getTagSuggestions } from '../actions';
import { ProjectsPageClient } from './ProjectsPageClient';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  const supabase = await createClient();
  const [{ data: projects }, tagSuggestions] = await Promise.all([
    supabase.from('projects').select('*').order('updated_at', { ascending: false }),
    getTagSuggestions(),
  ]);

  return (
    <ProjectsPageClient
      projects={projects ?? []}
      tagSuggestions={tagSuggestions}
    />
  );
}
