'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { PanelDrawer } from '../../_components/PanelDrawer';
import { PanelFooter } from '@/app/admin/_components/PanelFooter';
import { AdminCombobox } from '../../_components/AdminCombobox';
import { SaveDot } from '../../_components/SaveDot';
import { useAutoSave } from '../../_hooks/useAutoSave';
import { createTag, renameTag } from '../../actions';
import type { TagWithCount } from '../../actions';
import { useChatContext } from '@/app/admin/_components/chat/ChatContext';

type TagCategory = 'style' | 'technique' | 'addon' | 'deliverable' | 'project_type' | 'industry';

const CATEGORY_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'project_type', label: 'Project Types' },
  { id: 'deliverable', label: 'Assets Delivered' },
  { id: 'style', label: 'Style Tags' },
  { id: 'addon', label: 'Premium Add-ons' },
  { id: 'technique', label: 'Camera Techniques' },
  { id: 'industry', label: 'Industries' },
];

interface TagPanelProps {
  tag: TagWithCount | null;
  open: boolean;
  onClose: () => void;
  onCreated: (tag: TagWithCount) => void;
  onRenamed: (id: string, newName: string) => void;
}

export function TagPanel({ tag, open, onClose, onCreated, onRenamed }: TagPanelProps) {
  const isNew = !tag;
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TagCategory>('style');
  const [creating, setCreating] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Sync form state when tag changes
  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setCategory(tag.category);
    } else {
      setName('');
      setCategory('style');
    }
  }, [tag]);

  // Focus name input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 200);
  }, [open]);

  // Chat panel context
  const { setPanelContext } = useChatContext();

  useEffect(() => {
    if (!tag?.id) return;
    const lines: string[] = [];
    lines.push(`Name: ${tag.name}`);
    const catLabel = CATEGORY_OPTIONS.find(c => c.id === tag.category)?.label ?? tag.category;
    lines.push(`Category: ${catLabel}`);
    lines.push(`Usage Count: ${tag.projectCount} project${tag.projectCount !== 1 ? 's' : ''}`);
    if (tag.color) lines.push(`Color: ${tag.color}`);
    setPanelContext({
      recordType: 'tag',
      recordId: tag.id,
      recordLabel: tag.name,
      summary: lines.join('\n'),
    });
    return () => setPanelContext(null);
  }, [tag, setPanelContext]);

  // Auto-save for edit mode (rename)
  const { status, trigger, flush, reset } = useAutoSave(
    useCallback(async () => {
      if (!tag || !name.trim() || name.trim() === tag.name) return;
      await renameTag(tag.id, name.trim());
      onRenamed(tag.id, name.trim());
    }, [tag, name, onRenamed]),
  );

  const handleNameChange = (v: string) => {
    setName(v);
    if (!isNew) trigger();
  };

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      await createTag(name.trim(), category);
      const newTag: TagWithCount = {
        id: crypto.randomUUID(),
        name: name.trim(),
        category,
        color: null,
        projectCount: 0,
      };
      onCreated(newTag);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!isNew && status === 'pending') {
      void flush();
    }
    reset();
    onClose();
  };

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[400px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border bg-admin-bg-sidebar">
          <div className="flex items-center min-w-0">
            <h2 className="text-lg font-semibold text-admin-text-primary truncate">
              {isNew ? 'New Tag' : tag.name}
            </h2>
            {!isNew && <SaveDot status={status} />}
          </div>
          <button onClick={handleClose} className="text-admin-text-muted hover:text-admin-text-primary transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto admin-scrollbar px-6 py-5 space-y-5">
          <div>
            <label className="admin-label">Name</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Tag name"
              className="admin-input w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isNew) {
                  e.preventDefault();
                  void handleCreate();
                }
              }}
            />
          </div>

          <div>
            <label className="admin-label">Category</label>
            <AdminCombobox
              value={category}
              options={CATEGORY_OPTIONS}
              onChange={(id) => { if (id) setCategory(id as TagCategory); }}
              placeholder="Select category"
              searchable={false}
              nullable={false}
              disabled={!isNew}
            />
          </div>
        </div>

        {/* Footer */}
        <PanelFooter
          onSave={isNew ? handleCreate : flush}
          saveLabel={isNew ? (creating ? 'Creating…' : 'Create Tag') : 'Save'}
          saveDisabled={isNew ? !name.trim() || creating : status !== 'pending'}
        />
      </div>
    </PanelDrawer>
  );
}
