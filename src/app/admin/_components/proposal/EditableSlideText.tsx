'use client';

import { useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { updateProposalSection, addProposalSection } from '../../actions';
import type { ProposalSectionRow } from '@/types/proposal';

interface Props {
  proposalId: string;
  sectionId?: string;       // undefined = section doesn't exist yet, will be created on save
  sortOrder: number;        // used when creating a new section
  title: string | null;
  content: string | null;
  placeholder?: string;
  onSaved: (section: ProposalSectionRow) => void;
  onCancel: () => void;
}

export function EditableSlideText({
  proposalId,
  sectionId,
  sortOrder,
  title,
  content,
  placeholder = 'Click to write…',
  onSaved,
  onCancel,
}: Props) {
  const [editTitle, setEditTitle] = useState(title ?? '');
  const [editContent, setEditContent] = useState(content ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const newTitle = editTitle.trim() || null;
    const newContent = editContent.trim() || null;
    setSaving(true);
    setError(null);
    try {
      if (sectionId) {
        await updateProposalSection(sectionId, {
          custom_title: newTitle,
          custom_content: newContent,
        });
        onSaved({
          id: sectionId,
          proposal_id: proposalId,
          section_type: 'text',
          snippet_id: null,
          custom_title: newTitle,
          custom_content: newContent,
          layout_columns: 1,
          layout_position: 'full',
          sort_order: sortOrder,
          created_at: new Date().toISOString(),
        });
      } else {
        const id = await addProposalSection({
          proposal_id: proposalId,
          section_type: 'text',
          custom_title: newTitle,
          custom_content: newContent,
          sort_order: sortOrder,
        });
        onSaved({
          id,
          proposal_id: proposalId,
          section_type: 'text',
          snippet_id: null,
          custom_title: newTitle,
          custom_content: newContent,
          layout_columns: 1,
          layout_position: 'full',
          sort_order: sortOrder,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
  };

  return (
    <div
      className="absolute inset-0 z-30 bg-black/95 flex flex-col items-center justify-center px-10 py-12 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-3xl space-y-5">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Section label (optional)"
          autoFocus
          className="w-full text-sm tracking-[0.3em] uppercase font-mono text-white/40 bg-transparent border-b border-dashed border-white/20 outline-none placeholder:text-white/10 pb-2"
        />
        <textarea
          value={editContent}
          onChange={(e) => {
            setEditContent(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onFocus={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          placeholder={placeholder}
          rows={5}
          className="w-full text-2xl lg:text-3xl font-display text-white/80 leading-relaxed bg-transparent border-b border-dashed border-white/20 outline-none resize-none placeholder:text-white/15 pb-3"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/20 font-mono">⌘↵ to save · Esc to cancel</p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              <X size={10} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-white/10 hover:bg-white/15 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
