'use client';

import { useCallback, useEffect, useRef } from 'react';
import { X, Trash2, Plus, ArrowUpFromLine, Save, FileText } from 'lucide-react';
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
import { AdminSelect } from '@/app/admin/styleguide/_components/AdminSelect';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { useState } from 'react';
import type { ContractTemplateRow, ContractType, MergeFieldDef, MergeFieldSource } from '@/types/contracts';
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
  { value: 'custom', label: 'Custom' },
];

const MAPPING_OPTIONS: { value: string; label: string; source: MergeFieldSource; db_path: string | null }[] = [
  { value: '__manual__', label: 'Manual Input (filled per contract)', source: 'manual', db_path: null },
  { value: 'client::name', label: 'Client → Company Name', source: 'client', db_path: 'name' },
  { value: 'client::company', label: 'Client → Company', source: 'client', db_path: 'company' },
  { value: 'client::email', label: 'Client → Email', source: 'client', db_path: 'email' },
  { value: 'client::location', label: 'Client → Location', source: 'client', db_path: 'location' },
  { value: 'contact::first_name', label: 'Contact → First Name', source: 'contact', db_path: 'first_name' },
  { value: 'contact::last_name', label: 'Contact → Last Name', source: 'contact', db_path: 'last_name' },
  { value: 'contact::email', label: 'Contact → Email', source: 'contact', db_path: 'email' },
  { value: 'contact::role', label: 'Contact → Role / Title', source: 'contact', db_path: 'role' },
  { value: 'proposal::title', label: 'Proposal → Title', source: 'proposal', db_path: 'title' },
  { value: 'proposal::proposal_type', label: 'Proposal → Type', source: 'proposal', db_path: 'proposal_type' },
  { value: 'quote::label', label: 'Quote → Label', source: 'quote', db_path: 'label' },
  { value: 'quote::total_amount', label: 'Quote → Total Amount', source: 'quote', db_path: 'total_amount' },
  { value: 'quote::down_amount', label: 'Quote → Down Payment', source: 'quote', db_path: 'down_amount' },
  { value: 'quote::quote_type', label: 'Quote → Type', source: 'quote', db_path: 'quote_type' },
];

const SOURCE_COLORS: Record<MergeFieldSource, string> = {
  client: 'bg-admin-info-bg text-admin-info',
  contact: 'bg-admin-success-bg text-admin-success',
  proposal: 'bg-admin-warning-bg text-admin-warning',
  quote: 'text-admin-toolbar-violet bg-admin-bg-hover',
  manual: 'bg-admin-bg-hover text-admin-text-dim',
};

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
  const [activeTab, setActiveTab] = useState('editor');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contractType, setContractType] = useState<ContractType>('sow');
  const [mergeFields, setMergeFields] = useState<MergeFieldDef[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [showNewField, setShowNewField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldMapping, setNewFieldMapping] = useState('');

  // Refs for capturing latest state in autoSave closure
  const templateRef = useRef(template);
  const nameRef = useRef(name);
  const descriptionRef = useRef(description);
  const contractTypeRef = useRef(contractType);
  const mergeFieldsRef = useRef(mergeFields);
  const isActiveRef = useRef(isActive);

  useEffect(() => { templateRef.current = template; }, [template]);
  useEffect(() => { nameRef.current = name; }, [name]);
  useEffect(() => { descriptionRef.current = description; }, [description]);
  useEffect(() => { contractTypeRef.current = contractType; }, [contractType]);
  useEffect(() => { mergeFieldsRef.current = mergeFields; }, [mergeFields]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

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
      },
    },
    immediatelyRender: false,
    onUpdate: () => autoSave.trigger(),
  });

  const autoSave = useAutoSave(async () => {
    const t = templateRef.current;
    if (!t) return;
    const body = editor?.getHTML() ?? '';
    const updates = {
      name: nameRef.current,
      description: descriptionRef.current || null,
      contract_type: contractTypeRef.current,
      body,
      merge_fields: mergeFieldsRef.current,
      is_active: isActiveRef.current,
    };
    await updateContractTemplate(t.id, updates);
    const updated = { ...t, ...updates, updated_at: new Date().toISOString() };
    setTemplate(updated as ContractTemplateRow);
    onUpdated(updated as ContractTemplateRow);
  });

  // Load template data
  useEffect(() => {
    if (!open || !templateId) {
      setTemplate(null);
      editor?.commands.clearContent();
      autoSave.reset();
      return;
    }
    setLoading(true);
    getContractTemplate(templateId)
      .then((t) => {
        setTemplate(t);
        setName(t.name);
        setDescription(t.description || '');
        setContractType(t.contract_type);
        setMergeFields(t.merge_fields || []);
        setIsActive(t.is_active);
        editor?.commands.setContent(t.body || '');
        autoSave.reset();
      })
      .finally(() => setLoading(false));
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

  const handleAddField = () => {
    if (!newFieldName || !newFieldMapping) return;
    const key = newFieldName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (!key || mergeFields.some((f) => f.key === key)) return;
    const mapping = MAPPING_OPTIONS.find((m) => m.value === newFieldMapping);
    if (!mapping) return;
    const updated = [...mergeFields, {
      key,
      label: newFieldName,
      source: mapping.source,
      db_path: mapping.db_path,
    }];
    setMergeFields(updated);
    setNewFieldName('');
    setNewFieldMapping('');
    setShowNewField(false);
    autoSave.trigger();
  };

  const handleRemoveField = (key: string) => {
    setMergeFields((prev) => prev.filter((f) => f.key !== key));
    autoSave.trigger();
  };

  const handleInsertToken = (key: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(`{{${key}}}`).run();
    setActiveTab('editor');
    autoSave.trigger();
  };

  const bodyText = editor?.getHTML() ?? '';
  const tokenStatus = validateTokens(bodyText, mergeFields);

  const tabs = [
    { value: 'editor', label: 'Editor' },
    {
      value: 'fields',
      label: 'Fields',
      badge: <span className="text-admin-xs px-1.5 py-0.5 rounded-full bg-admin-bg-hover">{mergeFields.length}</span>,
    },
  ];

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[min(92vw,960px)]">
      {loading ? (
        <div className="flex items-center justify-center h-full text-admin-text-muted">Loading…</div>
      ) : !template ? (
        <div className="flex items-center justify-center h-full text-admin-text-muted">Template not found</div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 h-[4rem] border-b border-admin-border bg-admin-bg-inset">
            <div className="flex items-center gap-3 min-w-0">
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); autoSave.trigger(); }}
                className="bg-transparent text-admin-lg font-semibold text-admin-text-primary outline-none min-w-0 flex-1"
                placeholder="Template name…"
              />
              <SaveDot status={autoSave.status} />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={onClose} className="btn-ghost w-9 h-9 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex-shrink-0 flex items-center gap-4 px-6 py-3 border-b border-admin-border-subtle">
            <div className="flex items-center gap-2">
              <label className="text-admin-sm text-admin-text-muted">Type</label>
              <AdminSelect
                options={TYPE_OPTIONS}
                value={contractType}
                onChange={(v) => { setContractType(v as ContractType); autoSave.trigger(); }}
                placeholder="Select type…"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-admin-sm text-admin-text-muted">Active</label>
              <button
                onClick={() => { setIsActive(!isActive); autoSave.trigger(); }}
                className={`px-3 py-1.5 rounded-admin-sm text-admin-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-admin-success-bg text-admin-success'
                    : 'bg-admin-bg-hover text-admin-text-faint'
                }`}
              >
                {isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
            <div className="flex-1">
              <input
                value={description}
                onChange={(e) => { setDescription(e.target.value); autoSave.trigger(); }}
                placeholder="Description (optional)…"
                className="admin-input w-full"
              />
            </div>
          </div>

          {/* Field pills — click to insert token */}
          {mergeFields.length > 0 && activeTab === 'editor' && (
            <div className="flex-shrink-0 flex items-center gap-1.5 px-6 py-2 border-b border-admin-border-subtle flex-wrap">
              <span className="text-admin-xs text-admin-text-ghost mr-1 uppercase tracking-wider">Insert:</span>
              {mergeFields.map((f) => (
                <button
                  key={f.key}
                  onMouseDown={(e) => { e.preventDefault(); handleInsertToken(f.key); }}
                  className={`text-admin-xs px-1.5 py-0.5 rounded-full font-medium transition-opacity hover:opacity-80 ${SOURCE_COLORS[f.source]}`}
                  title={`Insert {{${f.key}}}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Tabs */}
          <AdminTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'editor' && (
              <div
                className="flex flex-col h-full bg-admin-bg-base cursor-text"
                onClick={() => editor?.commands.focus()}
              >
                <RichTextToolbar editor={editor} />
                <div className="flex-1 overflow-y-auto admin-scrollbar">
                  <EditorContent editor={editor} className="h-full" />
                </div>
                {tokenStatus.undefined.length > 0 && (
                  <div className="px-8 py-2 text-admin-sm text-admin-danger border-t border-admin-border-subtle">
                    {tokenStatus.undefined.length} undefined token{tokenStatus.undefined.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'fields' && (
              <div className="flex-1 overflow-y-auto admin-scrollbar p-6">
                <div className="space-y-2 mb-6">
                  {mergeFields.length === 0 && !showNewField && (
                    <div className="text-admin-base text-admin-text-muted text-center py-8">
                      No merge fields defined yet. Add fields to use{' '}
                      <code className="font-admin-mono text-admin-info">{'{{variable}}'}</code> tokens in your template.
                    </div>
                  )}
                  {mergeFields.map((field) => (
                    <div
                      key={field.key}
                      className="group/field flex items-center gap-3 px-4 py-3 rounded-lg bg-admin-bg-overlay border border-admin-border-subtle hover:border-admin-border transition-colors"
                    >
                      <code className="font-admin-mono text-admin-sm text-admin-info bg-admin-bg-base px-2 py-1 rounded">
                        {`{{${field.key}}}`}
                      </code>
                      <span className="text-admin-base text-admin-text-primary font-medium">{field.label}</span>
                      <span className={`text-admin-xs px-1.5 py-0.5 rounded-full font-medium ${SOURCE_COLORS[field.source]}`}>
                        {field.source === 'manual' ? 'manual input' : `${field.source} → ${field.db_path}`}
                      </span>
                      <div className="flex-1" />
                      <button
                        onClick={() => { handleInsertToken(field.key); setActiveTab('editor'); }}
                        className="opacity-0 group-hover/field:opacity-100 transition-opacity btn-ghost w-8 h-8 flex items-center justify-center"
                        title="Insert into template"
                      >
                        <ArrowUpFromLine size={13} />
                      </button>
                      <button
                        onClick={() => handleRemoveField(field.key)}
                        className="opacity-0 group-hover/field:opacity-100 transition-opacity btn-ghost-danger w-8 h-8 flex items-center justify-center"
                        title="Remove field"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {showNewField ? (
                  <div className="border border-admin-border rounded-lg p-4 bg-admin-bg-overlay space-y-3">
                    <div>
                      <label className="block text-admin-sm font-medium text-admin-text-muted">Field Name</label>
                      <input
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        placeholder="e.g. Client Name, Total Amount, Effective Date…"
                        className="admin-input w-full"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-admin-sm font-medium text-admin-text-muted">Maps to</label>
                      <AdminSelect
                        options={MAPPING_OPTIONS.map((m) => ({ value: m.value, label: m.label }))}
                        value={newFieldMapping}
                        onChange={(v) => setNewFieldMapping(v as string)}
                        placeholder="Where does this value come from?"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleAddField}
                        disabled={!newFieldName || !newFieldMapping}
                        className="btn-primary px-4 py-1.5 text-sm"
                      >
                        Add Field
                      </button>
                      <button
                        onClick={() => { setShowNewField(false); setNewFieldName(''); setNewFieldMapping(''); }}
                        className="btn-secondary px-4 py-1.5 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewField(true)}
                    className="btn-secondary px-4 py-2 text-sm inline-flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Add Merge Field
                  </button>
                )}
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
