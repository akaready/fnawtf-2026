import { getTags } from '../actions';
import { TagsPageClient } from './_components/TagsPageClient';

export const dynamic = 'force-dynamic';

export default async function TagsPage() {
  const tags = await getTags();
  return <TagsPageClient initialTags={tags} />;
}
