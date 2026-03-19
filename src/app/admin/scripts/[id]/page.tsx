import { getScriptById, getScriptScenes, getScriptBeats, getScriptCharacters, getScriptTags, getScriptLocations, getBeatReferences, getActiveLocationsForSelect } from '../../actions';
import { ScriptEditorClient } from '../_components/ScriptEditorClient';

export const dynamic = 'force-dynamic';

export default async function ScriptEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [script, scenes, characters, tags, locations, globalLocations] = await Promise.all([
    getScriptById(id),
    getScriptScenes(id),
    getScriptCharacters(id),
    getScriptTags(id),
    getScriptLocations(id),
    getActiveLocationsForSelect(),
  ]);

  const sceneIds = scenes.map((s: { id: string }) => s.id);
  const beats = sceneIds.length > 0 ? await getScriptBeats(sceneIds) : [];
  const beatIds = beats.map((b: { id: string }) => b.id);
  const references = beatIds.length > 0 ? await getBeatReferences(beatIds) : [];

  return (
    <ScriptEditorClient
      script={script as Parameters<typeof ScriptEditorClient>[0]['script']}
      initialScenes={scenes as Parameters<typeof ScriptEditorClient>[0]['initialScenes']}
      initialBeats={beats as Parameters<typeof ScriptEditorClient>[0]['initialBeats']}
      initialCharacters={characters as Parameters<typeof ScriptEditorClient>[0]['initialCharacters']}
      initialTags={tags as Parameters<typeof ScriptEditorClient>[0]['initialTags']}
      initialLocations={locations as Parameters<typeof ScriptEditorClient>[0]['initialLocations']}
      initialReferences={references as Parameters<typeof ScriptEditorClient>[0]['initialReferences']}
      globalLocations={globalLocations as Parameters<typeof ScriptEditorClient>[0]['globalLocations']}
    />
  );
}
