import { getContentSnippets } from '../actions';
import { ContentSnippetsManager } from '../_components/ContentSnippetsManager';

export const dynamic = 'force-dynamic';

export default async function ContentPage() {
  const snippets = await getContentSnippets();

  return <ContentSnippetsManager initialSnippets={snippets} />;
}
