'use client';

import type { ContentSnippetRow, ProposalType } from '@/types/proposal';

interface SnippetQuickAddProps {
  snippets: ContentSnippetRow[];
  proposalType: ProposalType;
  onInsert: (body: string) => void;
}

export function SnippetQuickAdd({ snippets, proposalType, onInsert }: SnippetQuickAddProps) {
  const matching = snippets.filter(
    (s) => s.snippet_type === proposalType || s.snippet_type === 'general',
  );

  if (matching.length === 0) {
    return (
      <p className="text-xs text-[#404040]">No snippets for this proposal type.</p>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {matching.map((snippet) => (
          <button
            key={snippet.id}
            type="button"
            onClick={() => onInsert(snippet.body)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs border border-white/10 bg-white/[0.04] whitespace-nowrap hover:bg-white/[0.08] transition-colors text-[#999] hover:text-white"
          >
            {snippet.title}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-[#333] font-mono">
        {matching.length} snippet{matching.length !== 1 ? 's' : ''} available
      </p>
    </div>
  );
}
