import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProposalLoginForm } from './ProposalLoginForm';

export const dynamic = 'force-dynamic';

export default async function ProposalLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from('proposals')
    .select('title, contact_company, subtitle')
    .eq('slug', slug)
    .single();

  if (!proposal) {
    redirect('/');
  }

  const p = proposal as { title: string; contact_company: string; subtitle: string };

  return <ProposalLoginForm slug={slug} title={p.title} company={p.contact_company} />;
}
