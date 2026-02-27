import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getProposalAuthCookie } from '@/lib/proposal/auth';
import { getProposalData } from './actions';
import { ProposalPageClient } from './ProposalPageClient';

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

  return {
    title: data?.title ? `FNA.wtf • ${data.title}` : 'FNA.wtf • Proposal',
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
      videos={data.videos}
      quotes={data.quotes}
      milestones={data.milestones}
      viewerEmail={viewer.email}
      viewerName={viewer.name}
    />
  );
}
