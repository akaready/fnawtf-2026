import Link from 'next/link';
import { ProjectForm } from '../../_components/ProjectForm';
import { getTagSuggestions } from '../../actions';

export default async function NewProjectPage() {
  const tagSuggestions = await getTagSuggestions();

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-1">
          <Link href="/admin/projects" className="hover:text-muted-foreground transition-colors">
            Projects
          </Link>
          {' / '}
          New
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground">New Project</h1>
      </div>

      <ProjectForm project={null} videos={[]} credits={[]} btsImages={[]} tagSuggestions={tagSuggestions} />
    </div>
  );
}
