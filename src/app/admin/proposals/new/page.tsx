import { getContacts } from '../../actions';
import { ProposalMetadataForm } from '../../_components/ProposalMetadataForm';

export const dynamic = 'force-dynamic';

export default async function NewProposalPage() {
  const contacts = await getContacts();

  return (
    <ProposalMetadataForm
      proposal={null}
      contacts={contacts}
    />
  );
}
