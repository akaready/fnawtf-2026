'use client';

import { forwardRef } from 'react';
import { MarkdownTabEditor, type MarkdownTabEditorHandle } from './MarkdownTabEditor';
import type { ProposalSectionRow, ContentSnippetRow, ProposalType } from '@/types/proposal';

export type { MarkdownTabEditorHandle as ApproachTabHandle };

interface Props {
  proposalId: string;
  proposalType: ProposalType;
  section: ProposalSectionRow | null;
  snippets: ContentSnippetRow[];
  onSectionUpdated: (s: ProposalSectionRow) => void;
}

export const ApproachTab = forwardRef<MarkdownTabEditorHandle, Props>(
  function ApproachTab({ proposalId, proposalType, section, snippets, onSectionUpdated }, ref) {
    return (
      <MarkdownTabEditor
        ref={ref}
        proposalId={proposalId}
        proposalType={proposalType}
        sortOrder={1}
        snippets={snippets}
        section={section}
        onSectionUpdated={onSectionUpdated}
        label="Approach"
        defaultSnippetCategory="Approach"
        titlePlaceholder="Our Approach"
      />
    );
  }
);
