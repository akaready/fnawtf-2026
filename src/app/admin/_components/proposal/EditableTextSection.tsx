'use client';

import { useState, useRef } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { updateProposalSection } from '../../actions';

interface Props {
  sectionId: string;
  title: string | null;
  content: string | null;
  onUpdate: (data: { custom_title: string | null; custom_content: string | null }) => void;
}

export function EditableTextSection({ sectionId, title, content, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title ?? '');
  const [editContent, setEditContent] = useState(content ?? '');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = async () => {
    const newTitle = editTitle.trim() || null;
    const newContent = editContent.trim() || null;
    setSaving(true);
    try {
      await updateProposalSection(sectionId, {
        custom_title: newTitle,
        custom_content: newContent,
      });
      onUpdate({ custom_title: newTitle, custom_content: newContent });
      setEditing(false);
    } catch (err) {
      console.error('Failed to save section:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(title ?? '');
    setEditContent(content ?? '');
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleCancel();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
  };

  if (editing) {
    return (
      <section className="py-16 px-6 lg:px-16">
        <div className="max-w-5xl mx-auto space-y-4" onKeyDown={handleKeyDown}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Section label (optional)"
            autoFocus
            className="w-full text-sm tracking-[0.3em] uppercase font-mono text-white/40 bg-transparent border-b border-dashed border-white/20 outline-none placeholder:text-white/10 pb-2"
          />
          <textarea
            ref={textareaRef}
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
            placeholder="Write your content…"
            className="w-full text-white/80 leading-relaxed text-xl bg-transparent border-b border-dashed border-white/20 outline-none resize-none placeholder:text-white/10 pb-2"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/15 rounded-lg font-medium transition-colors"
            >
              {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
              Save
            </button>
          </div>
        </div>
      </section>
    );
  }

  const paragraphs = content?.split('\n\n').filter(Boolean) ?? [];

  return (
    <section
      className="py-16 px-6 lg:px-16 cursor-pointer rounded-lg transition-colors hover:ring-1 hover:ring-white/10"
      onClick={() => setEditing(true)}
    >
      <div className="max-w-5xl mx-auto">
        {title && (
          <p className="text-sm tracking-[0.3em] uppercase font-mono text-white/40 mb-6">
            {title}
          </p>
        )}
        {paragraphs.length === 0 ? (
          <p className="text-white/15 italic text-xl">Click to add content…</p>
        ) : (
          paragraphs.map((para, i) => (
            <p key={i} className="text-white/80 leading-relaxed text-xl [&+p]:mt-5">
              {para}
            </p>
          ))
        )}
      </div>
    </section>
  );
}
