import { getLocations } from '../actions';
import { LocationsPageClient } from './_components/LocationsPageClient';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function LocationsPage() {
  const supabase = await createClient();

  const [locations, projectsResult] = await Promise.all([
    getLocations(),
    supabase.from('projects').select('id, title').order('title'),
  ]);

  return (
    <LocationsPageClient
      initialLocations={locations}
      projects={(projectsResult.data ?? []) as { id: string; title: string }[]}
    />
  );
}
