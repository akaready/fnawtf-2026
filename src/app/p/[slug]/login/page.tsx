import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProposalLoginForm } from './ProposalLoginForm';

export const dynamic = 'force-dynamic';

export default async function ProposalLoginPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { slug } = await params;
  const { v } = await searchParams;
  const supabase = await createClient();

  // Multiple versions can share a slug — pick the latest for company name
  const { data: proposal } = await supabase
    .from('proposals')
    .select('contact_company')
    .eq('slug', slug)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!proposal) {
    redirect('/');
  }

  const p = proposal as { contact_company: string };

  return <ProposalLoginForm slug={slug} company={p.contact_company} returnVersion={v} />;
}
