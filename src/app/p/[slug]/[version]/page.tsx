import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getProposalAuthCookie } from '@/lib/proposal/auth';
import { getProposalData } from '../actions';
import { ProposalPageClient } from '../ProposalPageClient';
import type { ProposalVideo } from '@/types/proposal';

interface Props {
  params: Promise<{ slug: string; version: string }>;
}

function parseVersion(seg: string): number | null {
  if (!/^v\d+$/i.test(seg)) return null;
  const n = parseInt(seg.slice(1), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, version } = await params;
  const versionNumber = parseVersion(version);

  const baseRobots = { index: false, follow: false } as const;

  if (versionNumber === null) {
    return { title: 'FNA.wtf • Proposal', robots: baseRobots };
  }

  const supabase = await createClient();
  const { data: proposalRow } = await supabase
    .from('proposals')
    .select('title, subtitle, contact_company')
    .eq('slug', slug)
    .eq('version_number', versionNumber)
    .maybeSingle();

  const row = proposalRow as { title: string; subtitle: string | null; contact_company: string | null } | null;

  const title = row?.title ? `FNA.wtf • ${row.title}` : 'FNA.wtf • Proposal';
  const ogTitle = row?.contact_company
    ? `${row.title} — for ${row.contact_company}`
    : row?.title ?? 'Proposal';
  const description = row?.subtitle?.trim() || 'A proposal from Friends \'n Allies.';

  return {
    title,
    description,
    robots: baseRobots,
    openGraph: {
      title: ogTitle,
      description,
      type: 'website',
      siteName: 'FNA.wtf',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
    },
  };
}

export default async function ProposalVersionPage({ params }: Props) {
  const { slug, version } = await params;
  const versionNumber = parseVersion(version);
  if (versionNumber === null) notFound();

  // Verify version exists and is published
  const supabase = await createClient();
  const { data: row } = await supabase
    .from('proposals')
    .select('id, is_published_version')
    .eq('slug', slug)
    .eq('version_number', versionNumber)
    .maybeSingle();

  if (!row) notFound();
  const meta = row as unknown as { id: string; is_published_version: boolean };
  if (!meta.is_published_version) notFound();

  // Auth check — preserve the requested version through login redirect
  const viewer = await getProposalAuthCookie(slug);
  if (!viewer) {
    redirect(`/p/${slug}/login?v=${version}`);
  }

  const data = await getProposalData(slug, versionNumber);
  if (!data) {
    redirect(`/p/${slug}/login?v=${version}`);
  }

  return (
    <ProposalPageClient
      proposal={data.proposal}
      sections={data.sections}
      videos={data.videos as ProposalVideo[]}
      quotes={data.quotes as Parameters<typeof ProposalPageClient>[0]['quotes']}
      milestones={data.milestones}
      viewerEmail={viewer.email}
      viewerName={viewer.name}
    />
  );
}
