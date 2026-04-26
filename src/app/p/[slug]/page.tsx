import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ slug: string }>;
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
