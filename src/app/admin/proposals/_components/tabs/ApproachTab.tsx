'use client';

import { MarkdownTabEditor } from './MarkdownTabEditor';
import type { ProposalSectionRow, ContentSnippetRow, ProposalType } from '@/types/proposal';

interface Props {
  proposalId: string;
  proposalType: ProposalType;
  section: ProposalSectionRow | null;
  snippets: ContentSnippetRow[];
  onSectionUpdated: (s: ProposalSectionRow) => void;
}

export function ApproachTab({ proposalId, proposalType, section, snippets, onSectionUpdated }: Props) {
  return (
    <MarkdownTabEditor
      proposalId={proposalId}
      proposalType={proposalType}
      sortOrder={1}
      snippets={snippets}
      section={section}
      onSectionUpdated={onSectionUpdated}
      label="Approach"
    />
  );
}
