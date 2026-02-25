import { getProposal, getContacts } from '../../../actions';
import { ProposalMetadataForm } from '../../../_components/ProposalMetadataForm';

export const dynamic = 'force-dynamic';

export default async function ProposalSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [proposal, contacts] = await Promise.all([
    getProposal(id),
    getContacts(),
  ]);

  return (
    <ProposalMetadataForm
      proposal={proposal}
      contacts={contacts}
    />
  );
}
