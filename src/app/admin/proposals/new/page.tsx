import { getContacts } from '../../actions';
import { ProposalMetadataForm } from '@/app/admin/_components/ProposalMetadataForm';

export default async function NewProposalPage() {
  const contacts = await getContacts();
  return (
    <div className="flex flex-col h-full">
      <ProposalMetadataForm proposal={null} contacts={contacts} />
    </div>
  );
}
