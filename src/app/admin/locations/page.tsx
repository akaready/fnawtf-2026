import { getLocations } from '../actions';
import { LocationsPageClient } from './_components/LocationsPageClient';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function LocationsPage() {
  const supabase = await createClient();

  const [locations, projectsResult] = await Promise.all([
    getLocations(),
    supabase.from('projects').select('id, title, thumbnail_url, client_name').order('title'),
  ]);

  return (
    <LocationsPageClient
      initialLocations={locations}
      projects={(projectsResult.data ?? []) as { id: string; title: string; thumbnail_url: string | null; client_name: string | null }[]}
    />
  );
}
