import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ProjectsTable } from '../_components/ProjectsTable';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {projects?.length ?? 0} total
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-black hover:text-white border border-white transition-colors"
        >
          <Plus size={15} />
          New Project
        </Link>
      </div>

      <ProjectsTable projects={projects ?? []} />
    </div>
  );
}
