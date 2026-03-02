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
      script={script}
      initialScenes={scenes}
      initialBeats={beats}
      initialCharacters={characters}
      initialTags={tags}
      initialLocations={locations}
      initialReferences={references}
      globalLocations={globalLocations}
    />
  );
}
