import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getShareAuthCookie } from '@/lib/share/auth';
import { getScriptShareData } from './actions';
import { ScriptShareClient } from './ScriptShareClient';

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const data = await getScriptShareData(token);
  return {
    title: data?.script.title ? `FNA.wtf \u00B7 ${data.script.title}` : 'FNA.wtf \u00B7 Script',
  };
}

export default async function ScriptSharePage({ params }: Props) {
  const { token } = await params;

  // Check auth cookie
  const viewer = await getShareAuthCookie('script', token);
  if (!viewer) {
    redirect(`/s/${token}/login`);
  }

  // Fetch share data
  const data = await getScriptShareData(token);
  if (!data) {
    redirect(`/s/${token}/login`);
  }

  return (
    <ScriptShareClient
      shareId={data.shareId}
      shareNotes={data.shareNotes}
      script={data.script}
      projectTitle={data.projectTitle}
      projectNumber={data.projectNumber}
      clientName={data.clientName}
      clientLogoUrl={data.clientLogoUrl}
      scenes={data.scenes}
      beats={data.beats}
      characters={data.characters}
      tags={data.tags}
      locations={data.locations}
      references={data.references}
      storyboardFrames={data.storyboardFrames}
      viewerEmail={viewer.email}
      viewerName={viewer.name}
    />
  );
}
