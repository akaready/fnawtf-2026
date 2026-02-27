import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getProposalAuthCookie } from '@/lib/proposal/auth';
import { getProposalData } from './actions';
import { ProposalPageClient } from './ProposalPageClient';
import type { ProposalVideo } from '@/types/proposal';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('proposals')
    .select('title')
    .eq('slug', slug)
    .single();

  const row = data as { title: string } | null;
  return {
    title: row?.title ? `FNA.wtf • ${row.title}` : 'FNA.wtf • Proposal',
  };
}

export default async function ProposalPage({ params }: Props) {
  const { slug } = await params;

  // Check auth cookie
  const viewer = await getProposalAuthCookie(slug);
  if (!viewer) {
    redirect(`/p/${slug}/login`);
  }

  // Fetch proposal data
  const data = await getProposalData(slug);
  if (!data) {
    redirect(`/p/${slug}/login`);
  }

  return (
    <ProposalPageClient
      proposal={data.proposal}
      sections={data.sections}
      videos={data.videos as ProposalVideo[]}
      quotes={data.quotes}
      milestones={data.milestones}
      viewerEmail={viewer.email}
      viewerName={viewer.name}
    />
  );
}
