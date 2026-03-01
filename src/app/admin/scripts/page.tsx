import { getScripts } from '../actions';
import { ScriptsListClient } from './_components/ScriptsListClient';

export const dynamic = 'force-dynamic';

export default async function ScriptsPage() {
  const scripts = await getScripts();
  return <ScriptsListClient scripts={scripts} />;
}
