import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProposalPageClient } from '@/app/p/[slug]/ProposalPageClient';
import type { ProposalRow, ProposalSectionRow, ProposalQuoteRow, ProposalMilestoneRow } from '@/types/proposal';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProposalPreviewPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check — admin only
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin');

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .single();

  if (!proposal) redirect('/admin/proposals');

  const p = proposal as ProposalRow;

  const [{ data: sections }, { data: proposalVideos }, { data: quotes }, { data: milestones }] = await Promise.all([
    supabase.from('proposal_sections').select('*').eq('proposal_id', id).order('sort_order'),
    supabase.from('proposal_videos').select('*, project_video:project_videos(id, bunny_video_id, title, video_type, aspect_ratio)').eq('proposal_id', id).order('sort_order'),
    supabase.from('proposal_quotes').select('*').eq('proposal_id', id).order('created_at'),
    supabase.from('proposal_milestones').select('*').eq('proposal_id', id).order('start_date'),
  ]);

  return (
    <div className="relative h-screen">
      {/* Preview banner — fixed so it doesn't affect scroll layout */}
      <div className="fixed top-0 inset-x-0 z-[100] bg-amber-500/90 backdrop-blur-sm text-black text-center py-2 text-sm font-medium">
        Preview Mode — This is how the client will see the proposal.
      </div>

      {/* Full-screen scroll deck, offset by banner height */}
      <div className="pt-9 h-full">
        <ProposalPageClient
          proposal={p}
          sections={(sections ?? []) as ProposalSectionRow[]}
          videos={proposalVideos ?? []}
          quotes={(quotes ?? []) as ProposalQuoteRow[]}
          milestones={(milestones ?? []) as ProposalMilestoneRow[]}
          viewerEmail="admin-preview"
          viewerName="Preview"
        />
      </div>
    </div>
  );
}
