'use client';

import { forwardRef } from 'react';
import { MarkdownTabEditor, type MarkdownTabEditorHandle } from './MarkdownTabEditor';
import type { ProposalSectionRow, ContentSnippetRow, ProposalType } from '@/types/proposal';

export type { MarkdownTabEditorHandle as WelcomeTabHandle };

interface Props {
  proposalId: string;
  proposalType: ProposalType;
  section: ProposalSectionRow | null;
  snippets: ContentSnippetRow[];
  onSectionUpdated: (s: ProposalSectionRow) => void;
  onDirty?: () => void;
}

export const WelcomeTab = forwardRef<MarkdownTabEditorHandle, Props>(
  function WelcomeTab({ proposalId, proposalType, section, snippets, onSectionUpdated, onDirty }, ref) {
    return (
      <MarkdownTabEditor
        ref={ref}
        proposalId={proposalId}
        proposalType={proposalType}
        sortOrder={0}
        snippets={snippets}
        section={section}
        onSectionUpdated={onSectionUpdated}
        onDirty={onDirty}
        label="Welcome"
        defaultSnippetCategory="Welcome"
        titlePlaceholder="A Note for You"
      />
    );
  }
);
