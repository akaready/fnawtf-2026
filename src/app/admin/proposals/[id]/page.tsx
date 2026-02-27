import { notFound } from 'next/navigation';
import {
  getProposal,
  getProposalSections,
  getProposalMilestones,
  getProposalQuotes,
  getContentSnippets,
  getContacts,
  getProposalContacts,
  getClients,
} from '../../actions';
import {
  getProposalProjects,
  getProjectsForBrowser,
} from '../../actions';
import { ProposalAdminEditor } from '../_components/ProposalAdminEditor';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProposalEditorPage({ params }: Props) {
  const { id } = await params;

  try {
    const [proposal, sections, milestones, quotesRaw, proposalProjects, snippets, contacts, allProjects, proposalContacts, clients] =
      await Promise.all([
        getProposal(id),
        getProposalSections(id),
        getProposalMilestones(id),
        getProposalQuotes(id),
        getProposalProjects(id),
        getContentSnippets(),
        getContacts(),
        getProjectsForBrowser(),
        getProposalContacts(id),
        getClients(),
      ]);

    const quotes = quotesRaw.filter(q => !q.deleted_at);

    return (
      <ProposalAdminEditor
        proposal={proposal}
        contacts={contacts}
        proposalContacts={proposalContacts}
        clients={clients}
        snippets={snippets}
        sections={sections}
        milestones={milestones}
        quotes={quotes}
        allProjects={allProjects}
        proposalProjects={proposalProjects}
      />
    );
  } catch {
    notFound();
  }
}
