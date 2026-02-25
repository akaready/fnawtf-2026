import { getProposals, getProposalViewCounts } from '../actions';
import { ProposalsPageClient } from './ProposalsPageClient';

export const dynamic = 'force-dynamic';

export default async function ProposalsPage() {
  const [proposals, viewCounts] = await Promise.all([
    getProposals(),
    getProposalViewCounts(),
  ]);

  return (
    <ProposalsPageClient
      initialProposals={proposals}
      viewCounts={viewCounts}
    />
  );
}
