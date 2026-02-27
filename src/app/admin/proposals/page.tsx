import { getProposals, getProposalViewCounts } from '../actions';
import { ProposalListClient } from './_components/ProposalListClient';

export default async function ProposalsPage() {
  const [proposals, viewCounts] = await Promise.all([
    getProposals(),
    getProposalViewCounts(),
  ]);
  return <ProposalListClient proposals={proposals} viewCounts={viewCounts} />;
}
