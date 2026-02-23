import Link from 'next/link';
import { ProjectForm } from '../../_components/ProjectForm';
import { getTagSuggestions } from '../../actions';

export default async function NewProjectPage() {
  const tagSuggestions = await getTagSuggestions();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-8 pt-10 pb-4 border-b border-white/[0.12]">
        <p className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-1">
          <Link href="/admin/projects" className="hover:text-muted-foreground transition-colors">
            Projects
          </Link>
          {' / '}
          New
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground">New Project</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 pt-4 pb-8 max-w-4xl">
        <ProjectForm project={null} videos={[]} credits={[]} btsImages={[]} tagSuggestions={tagSuggestions} />
      </div>
    </div>
  );
}
