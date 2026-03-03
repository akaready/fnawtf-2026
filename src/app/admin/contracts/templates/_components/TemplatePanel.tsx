'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Trash2, Save, FileText } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { AdminTabBar } from '@/app/admin/_components/AdminTabBar';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import { RichTextToolbar } from '@/app/admin/_components/RichTextToolbar';
import { AdminCombobox } from '@/app/admin/_components/AdminCombobox';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import type { ContractTemplateRow, ContractType, MergeFieldDef } from '@/types/contracts';
import {
  getContractTemplate,
  updateContractTemplate,
  deleteContractTemplate,
} from '@/lib/contracts/actions';
import { validateTokens } from '@/lib/contracts/mergeEngine';

const TYPE_OPTIONS: { value: ContractType; label: string }[] = [
  { value: 'sow', label: 'SOW' },
  { value: 'msa', label: 'MSA' },
  { value: 'nda', label: 'NDA' },
  { value: 'amendment', label: 'Amendment' },
  { value: 'pitch_video', label: 'Pitch Video' },
  { value: 'custom', label: 'Custom' },
];

/**
 * Predefined merge fields — auto-mapped to the database schema.
 * Grouped for display in the editor pill bar.
 */
const FIELD_GROUPS: Array<{ label: string; fields: Array<MergeFieldDef & { shortLabel: string }> }> = [
  {
    label: 'Contact',
    fields: [
      { key: 'contact_first_name', shortLabel: 'First Name',    label: 'Contact First Name',  source: 'contact',  db_path: 'first_name' },
      { key: 'contact_last_name',  shortLabel: 'Last Name',     label: 'Contact Last Name',   source: 'contact',  db_path: 'last_name'  },
      { key: 'contact_email',      shortLabel: 'Email',         label: 'Contact Email',       source: 'contact',  db_path: 'email'      },
      { key: 'contact_phone',      shortLabel: 'Phone',         label: 'Contact Phone',       source: 'contact',  db_path: 'phone'      },
      { key: 'contact_title',      shortLabel: 'Title',         label: 'Contact Title',       source: 'contact',  db_path: 'role'       },
    ],
  },
  {
    label: 'Client',
    fields: [
      { key: 'client_name',    shortLabel: 'Company Name', label: 'Client Company Name', source: 'client', db_path: 'name'     },
      { key: 'client_address', shortLabel: 'Address',      label: 'Client Address',      source: 'client', db_path: 'location' },
      { key: 'client_email',   shortLabel: 'Email',        label: 'Client Email',        source: 'client', db_path: 'email'    },
    ],
  },
  {
    label: 'Quote',
    fields: [
      { key: 'quote_total',        shortLabel: 'Total Amount', label: 'Quote Total Amount', source: 'quote', db_path: 'total_amount' },
      { key: 'quote_down_payment', shortLabel: 'Down Payment', label: 'Quote Down Payment', source: 'quote', db_path: 'down_amount'  },
    ],
  },
  {
    label: 'Dates',
    fields: [
      { key: 'effective_date', shortLabel: 'Effective Date', label: 'Effective Date', source: 'manual', db_path: null },
      { key: 'expiry_date',    shortLabel: 'Expiry Date',    label: 'Expiry Date',    source: 'manual', db_path: null },
      { key: 'project_name',   shortLabel: 'Project Name',   label: 'Project Name',   source: 'manual', db_path: null },
    ],
  },
];

/** Flat list for saving — only fields actually used in the body are stored. */
const ALL_PREDEFINED_FIELDS: MergeFieldDef[] = FIELD_GROUPS.flatMap((g) =>
  g.fields.map(({ shortLabel: _s, ...f }) => f)
);

/** Highlight {{token}} patterns inline in the editor */
const MergeTokenHighlight = Extension.create({
  name: 'mergeTokenHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mergeTokenHighlight'),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const regex = /\{\{[^}]+\}\}/g;
            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;
              let match;
              while ((match = regex.exec(node.text)) !== null) {
                decorations.push(
                  Decoration.inline(pos + match.index, pos + match.index + match[0].length, {
                    class: 'merge-token',
                  })
                );
              }
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

interface Props {
  templateId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (template: ContractTemplateRow) => void;
  onDeleted: (id: string) => void;
}

export function TemplatePanel({ templateId, open, onClose, onUpdated, onDeleted }: Props) {
  const [template, setTemplate] = useState<ContractTemplateRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contractType, setContractType] = useState<ContractType>('sow');
  const [isActive, setIsActive] = useState(true);

  // Refs for capturing latest state in autoSave closure
  const templateRef = useRef(template);
  const nameRef = useRef(name);
  const descriptionRef = useRef(description);
  const contractTypeRef = useRef(contractType);
  const isActiveRef = useRef(isActive);

  useEffect(() => { templateRef.current = template; }, [template]);
  useEffect(() => { nameRef.current = name; }, [name]);
  useEffect(() => { descriptionRef.current = description; }, [description]);
  useEffect(() => { contractTypeRef.current = contractType; }, [contractType]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  // Flag to suppress autoSave when programmatically setting editor content
  const isLoadingRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  const autoSave = useAutoSave(async () => {
    const t = templateRef.current;
    const ed = editorRef.current;
    if (!t || !ed) return;
    const body = ed.getHTML();
    // Only persist merge field defs that are actually referenced in the body
    const usedKeys = new Set(Array.from(body.matchAll(/\{\{(\w+)\}\}/g), (m: RegExpExecArray) => m[1]));
    const merge_fields = ALL_PREDEFINED_FIELDS.filter((f) => usedKeys.has(f.key));
    const updates = {
      name: nameRef.current,
      description: descriptionRef.current || null,
      contract_type: contractTypeRef.current,
      body,
      merge_fields,
      is_active: isActiveRef.current,
    };
    await updateContractTemplate(t.id, updates);
    const updated = { ...t, ...updates, updated_at: new Date().toISOString() };
    setTemplate(updated as ContractTemplateRow);
    onUpdated(updated as ContractTemplateRow);
  });

  const autoSaveRef = useRef(autoSave);
  useEffect(() => { autoSaveRef.current = autoSave; }, [autoSave]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapLink.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: 'Start writing…\nClick a field pill above to insert a token.',
      }),
      MergeTokenHighlight,
    ],
    editorProps: {
      attributes: {
        class: 'prose-snippet prose-contract font-admin-mono outline-none min-h-full p-8',
        spellcheck: 'false',
      },
    },
    immediatelyRender: false,
    onUpdate: () => {
      if (!isLoadingRef.current) autoSaveRef.current.trigger();
    },
  });

  // Keep editorRef in sync
  useEffect(() => { editorRef.current = editor ?? null; }, [editor]);

  // Load template data
  useEffect(() => {
    if (!open || !templateId) {
      setTemplate(null);
      editor?.commands.clearContent();
      autoSave.reset();
      setActiveTab('details');
      return;
    }
    setLoading(true);
    isLoadingRef.current = true;
    getContractTemplate(templateId)
      .then((t) => {
        setTemplate(t);
        setName(t.name);
        setDescription(t.description || '');
        setContractType(t.contract_type);
        setIsActive(t.is_active);
        editor?.commands.setContent(t.body || '');
        autoSave.reset();
      })
      .finally(() => {
        isLoadingRef.current = false;
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, templateId]);

  const handleSave = useCallback(async () => {
    await autoSave.flush();
    onClose();
  }, [autoSave, onClose]);

  const handleDelete = async () => {
    if (!template) return;
    await deleteContractTemplate(template.id);
    onDeleted(template.id);
    onClose();
  };

  const handleInsertToken = (key: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(`{{${key}}}`).run();
    autoSave.trigger();
  };

  const bodyText = editor?.getHTML() ?? '';
  const tokenStatus = validateTokens(bodyText, ALL_PREDEFINED_FIELDS);

  const tabs = [
    { value: 'details', label: 'Details' },
    { value: 'editor', label: 'Editor' },
  ];

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[min(92vw,720px)]">
      {loading ? (
        <div className="flex items-center justify-center h-full text-admin-text-muted">Loading…</div>
      ) : !template ? (
        <div className="flex items-center justify-center h-full text-admin-text-muted">Template not found</div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 h-[4rem] border-b border-admin-border bg-admin-bg-inset">
            <h2 className="text-admin-lg font-semibold text-admin-text-primary truncate inline-flex items-center gap-1 min-w-0 flex-1">
              {name || 'Untitled'}
              <SaveDot status={autoSave.status} />
            </h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { setIsActive(!isActive); autoSave.trigger(); }}
                className={`text-[10px] px-2.5 py-1 rounded-full font-medium border transition-colors ${isActive ? 'bg-admin-success-bg text-admin-success border-admin-success-border hover:opacity-80' : 'bg-admin-bg-hover text-admin-text-faint border-admin-border hover:border-admin-border-emphasis'}`}
              >
                {isActive ? 'Active' : 'Inactive'}
              </button>
              <button onClick={onClose} className="btn-ghost w-9 h-9 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <AdminTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Content */}
          <div className="flex-1 overflow-hidden">

            {/* Details tab */}
            {activeTab === 'details' && (
              <div className="overflow-y-auto admin-scrollbar h-full p-5 space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="block text-admin-xs font-semibold uppercase tracking-widest text-admin-text-faint">Template Name</label>
                  <input
                    value={name}
                    onChange={(e) => { setName(e.target.value); autoSave.trigger(); }}
                    placeholder="e.g. Standard SOW, Master Services Agreement…"
                    className="admin-input w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-admin-xs font-semibold uppercase tracking-widest text-admin-text-faint">Type</label>
                  <AdminCombobox
                    options={TYPE_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
                    value={contractType}
                    onChange={(v) => { if (v) { setContractType(v as ContractType); autoSave.trigger(); } }}
                    placeholder="Select type…"
                    nullable={false}
                    searchable={false}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-admin-xs font-semibold uppercase tracking-widest text-admin-text-faint">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); autoSave.trigger(); }}
                    placeholder="Brief description of when to use this template…"
                    rows={3}
                    className="admin-input w-full resize-none"
                  />
                </div>
              </div>
            )}

            {/* Editor tab */}
            {activeTab === 'editor' && (
              <div className="flex flex-col h-full">

                {/* Token pills bar — grouped by category, one row per group */}
                <div className="flex-shrink-0 border-b border-admin-border bg-admin-bg-inset divide-y divide-admin-border-subtle">
                  {FIELD_GROUPS.map((group) => (
                    <div key={group.label} className="flex items-center gap-1.5 px-6 py-2">
                      <span className="text-[10px] text-admin-text-faint uppercase tracking-wider w-14 flex-shrink-0">{group.label}</span>
                      {group.fields.map((field) => (
                        <button
                          key={field.key}
                          onMouseDown={(e) => { e.preventDefault(); handleInsertToken(field.key); }}
                          title={`Insert {{${field.key}}}`}
                          className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-admin-info-bg text-admin-info border border-admin-info-border hover:bg-admin-info-bg-strong transition-colors"
                        >
                          {field.shortLabel}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Tiptap editor */}
                <div
                  className="flex flex-col flex-1 min-h-0 bg-admin-bg-base cursor-text"
                  onClick={() => editor?.commands.focus()}
                >
                  <div className="py-1">
                    <RichTextToolbar editor={editor} />
                  </div>
                  <div className="flex-1 overflow-y-auto admin-scrollbar">
                    <EditorContent editor={editor} className="h-full" />
                  </div>
                  {tokenStatus.undefined.length > 0 && (
                    <div className="px-8 py-2 text-admin-sm text-admin-danger border-t border-admin-border-subtle">
                      {tokenStatus.undefined.length} undefined token{tokenStatus.undefined.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border flex-shrink-0 bg-admin-bg-wash">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
              >
                <Save size={14} />
                Save
              </button>
              <button
                onClick={() => window.open(`/admin/contracts/templates/${template.id}/preview`, '_blank')}
                className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm"
              >
                <FileText size={14} />
                View PDF
              </button>
            </div>
            <div className="flex items-center gap-2">
              {confirmDelete ? (
                <>
                  <span className="text-admin-sm text-admin-danger mr-1">Delete this template?</span>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-admin-border text-admin-text-muted hover:text-admin-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 text-xs rounded-lg bg-admin-danger-bg-strong text-admin-danger border border-admin-danger-border hover:bg-admin-danger-bg-strong transition-colors"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-danger/50 hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PanelDrawer>
  );
}
