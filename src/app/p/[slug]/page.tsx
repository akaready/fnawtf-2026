import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const [{ data: proposalRow }, { data: seoRow }] = await Promise.all([
    supabase
      .from('proposals')
      .select('title, subtitle, contact_company')
      .eq('slug', slug)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('seo_settings')
      .select('og_image_url')
      .eq('page_slug', '_global')
      .maybeSingle(),
  ]);

  const row = proposalRow as { title: string; subtitle: string | null; contact_company: string | null } | null;
  const ogImage = (seoRow as { og_image_url: string | null } | null)?.og_image_url ?? undefined;

  const title = row?.title ? `FNA.wtf • ${row.title}` : 'FNA.wtf • Proposal';
  const ogTitle = row?.contact_company
    ? `${row.title} — for ${row.contact_company}`
    : row?.title ?? 'Proposal';
  const description = row?.subtitle?.trim() || 'A proposal from Friends \'n Allies.';

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: ogTitle,
      description,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function ProposalSlugRoot({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Find the latest published version for this slug
  const { data: published } = await supabase
    .from('proposals')
    .select('version_number')
    .eq('slug', slug)
    .eq('is_published_version', true)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  let target = (published as unknown as { version_number: number } | null)?.version_number;

  // Fallback: if nothing is marked published (edge case), use the highest version_number
  if (target === undefined) {
    const { data: anyVersion } = await supabase
      .from('proposals')
      .select('version_number')
      .eq('slug', slug)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    target = (anyVersion as unknown as { version_number: number } | null)?.version_number;
  }

  if (target === undefined) notFound();
  redirect(`/p/${slug}/v${target}`);
}
