import {
  getProposal, getProposalSections, getContentSnippets, getVideoLibrary,
  getProposalVideos, getProposalQuotes, getProposalMilestones,
} from '../../actions';
import { ProposalBuilderClient } from '../../_components/proposal/ProposalBuilderClient';

export const dynamic = 'force-dynamic';

export default async function ProposalBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [proposal, sections, snippets, videos, proposalVideos, proposalQuotes, milestones] = await Promise.all([
    getProposal(id),
    getProposalSections(id),
    getContentSnippets(),
    getVideoLibrary(),
    getProposalVideos(id),
    getProposalQuotes(id),
    getProposalMilestones(id),
  ]);

  return (
    <ProposalBuilderClient
      proposal={proposal}
      initialSections={sections}
      snippets={snippets}
      videos={videos as never}
      proposalVideos={proposalVideos as never}
      proposalQuotes={proposalQuotes}
      initialMilestones={milestones}
    />
  );
}
