import { getContentSnippets } from '../actions';
import { ContentSnippetsManager } from '../_components/ContentSnippetsManager';

export default async function SnippetsPage() {
  const snippets = await getContentSnippets();
  return <ContentSnippetsManager initialSnippets={snippets} />;
}
