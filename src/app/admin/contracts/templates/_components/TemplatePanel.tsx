'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Trash2, Plus, ArrowUpFromLine } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { AdminTabBar } from '@/app/admin/_components/AdminTabBar';
import { SaveButton } from '@/app/admin/_components/SaveButton';
import { AdminSelect } from '@/app/admin/styleguide/_components/AdminSelect';
import type { ContractTemplateRow, ContractType, MergeFieldDef, MergeFieldSource } from '@/types/contracts';
import {
  getContractTemplate,
  updateContractTemplate,
  deleteContractTemplate,
} from '@/lib/contracts/actions';
import { renderTemplate, validateTokens } from '@/lib/contracts/mergeEngine';

const TYPE_OPTIONS: { value: ContractType; label: string }[] = [
  { value: 'sow', label: 'SOW' },
  { value: 'msa', label: 'MSA' },
  { value: 'nda', label: 'NDA' },
  { value: 'amendment', label: 'Amendment' },
  { value: 'custom', label: 'Custom' },
];

/** All mappable database fields, presented as "Source → Field" in a single flat list */
const MAPPING_OPTIONS: { value: string; label: string; source: MergeFieldSource; db_path: string | null }[] = [
  // Manual is always first
  { value: '__manual__', label: 'Manual Input (filled per contract)', source: 'manual', db_path: null },
  // Client fields
  { value: 'client::name', label: 'Client → Company Name', source: 'client', db_path: 'name' },
  { value: 'client::company', label: 'Client → Company', source: 'client', db_path: 'company' },
  { value: 'client::email', label: 'Client → Email', source: 'client', db_path: 'email' },
  { value: 'client::location', label: 'Client → Location', source: 'client', db_path: 'location' },
  // Contact fields
  { value: 'contact::first_name', label: 'Contact → First Name', source: 'contact', db_path: 'first_name' },
  { value: 'contact::last_name', label: 'Contact → Last Name', source: 'contact', db_path: 'last_name' },
  { value: 'contact::email', label: 'Contact → Email', source: 'contact', db_path: 'email' },
  { value: 'contact::role', label: 'Contact → Role / Title', source: 'contact', db_path: 'role' },
  // Proposal fields
  { value: 'proposal::title', label: 'Proposal → Title', source: 'proposal', db_path: 'title' },
  { value: 'proposal::proposal_type', label: 'Proposal → Type', source: 'proposal', db_path: 'proposal_type' },
  // Quote fields
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Local edit state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contractType, setContractType] = useState<ContractType>('sow');
  const [body, setBody] = useState('');
  const [mergeFields, setMergeFields] = useState<MergeFieldDef[]>([]);
  const [isActive, setIsActive] = useState(true);

  // New field form
  const [showNewField, setShowNewField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldMapping, setNewFieldMapping] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load template data
  useEffect(() => {
    if (!open || !templateId) {
      setTemplate(null);
      return;
    }
    setLoading(true);
    getContractTemplate(templateId)
      .then((t) => {
        setTemplate(t);
        setName(t.name);
        setDescription(t.description || '');
        setContractType(t.contract_type);
        setBody(t.body);
        setMergeFields(t.merge_fields || []);
        setIsActive(t.is_active);
      })
      .finally(() => setLoading(false));
  }, [open, templateId]);

  const handleSave = useCallback(async () => {
    if (!template) return;
    setSaving(true);
    try {
      const updates = {
        name,
        description: description || null,
        contract_type: contractType,
        body,
        merge_fields: mergeFields,
        is_active: isActive,
      };
      await updateContractTemplate(template.id, updates);
      const updated = { ...template, ...updates, updated_at: new Date().toISOString() };
      setTemplate(updated as ContractTemplateRow);
      onUpdated(updated as ContractTemplateRow);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [template, name, description, contractType, body, mergeFields, isActive, onUpdated]);

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
    setMergeFields((prev) => [...prev, {
      key,
      label: newFieldName,
      source: mapping.source,
      db_path: mapping.db_path,
    }]);
    setNewFieldName('');
    setNewFieldMapping('');
    setShowNewField(false);
  };

  const handleRemoveField = (key: string) => {
    setMergeFields((prev) => prev.filter((f) => f.key !== key));
  };

  const handleInsertToken = (key: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const token = `{{${key}}}`;
    const newBody = body.substring(0, start) + token + body.substring(end);
    setBody(newBody);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
    setActiveTab('editor');
  };

  // Token validation
  const tokenStatus = validateTokens(body, mergeFields);

  // Live preview with sample values
  const previewBody = renderTemplate(body, {
    client: { name: 'Acme Corp', email: 'hello@acme.com', location: 'Austin, TX', company: 'Acme Corp' },
    contact: { first_name: 'Jane', last_name: 'Doe', email: 'jane@acme.com', role: 'CEO' },
    proposal: { title: 'Brand Video Package', proposal_type: 'build' },
    quote: { total_amount: 2500000, down_amount: 750000, label: 'Primary Quote', quote_type: 'build' },
    manualFields: Object.fromEntries(
      mergeFields.filter((f) => f.source === 'manual').map((f) => [f.key, `[${f.label}]`])
    ),
    mergeFieldDefs: mergeFields,
  });

  const tabs = [
    { value: 'editor', label: 'Editor' },
    { value: 'fields', label: 'Fields', badge: <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-admin-bg-hover">{mergeFields.length}</span> },
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
          <div className="flex-shrink-0 flex items-center justify-between px-6 h-[4rem] border-b border-admin-border">
            <div className="flex items-center gap-3 min-w-0">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent text-lg font-semibold text-admin-text-primary outline-none min-w-0 flex-1"
                placeholder="Template name…"
              />
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
              <label className="text-xs text-admin-text-muted">Type</label>
              <AdminSelect
                options={TYPE_OPTIONS}
                value={contractType}
                onChange={(v) => setContractType(v as ContractType)}
                placeholder="Select type…"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-admin-text-muted">Active</label>
              <button
                onClick={() => setIsActive(!isActive)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
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
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)…"
                className="admin-input text-sm py-1 px-2 w-full"
              />
            </div>
          </div>

          {/* Tabs */}
          <AdminTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'editor' && (
              <div className="flex h-full">
                {/* Left: editor */}
                <div className="flex-1 flex flex-col border-r border-admin-border">
                  <div className="px-4 py-2 text-xs text-admin-text-faint border-b border-admin-border-subtle flex items-center justify-between">
                    <span>Template Body</span>
                    <span>
                      {tokenStatus.undefined.length > 0 && (
                        <span className="text-admin-danger">
                          {tokenStatus.undefined.length} undefined token{tokenStatus.undefined.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="absolute inset-0 w-full h-full resize-none bg-transparent text-sm text-admin-text-primary font-admin-mono p-4 outline-none admin-scrollbar"
                      placeholder="Type your contract template here… Use {{variable_name}} for merge fields."
                      spellCheck={false}
                    />
                  </div>
                </div>
                {/* Right: preview */}
                <div className="flex-1 flex flex-col">
                  <div className="px-4 py-2 text-xs text-admin-text-faint border-b border-admin-border-subtle">
                    Live Preview (sample data)
                  </div>
                  <div className="flex-1 overflow-y-auto admin-scrollbar p-4">
                    <div className="text-sm text-admin-text-secondary whitespace-pre-wrap leading-relaxed">
                      {previewBody || <span className="text-admin-text-faint">Preview will appear here…</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fields' && (
              <div className="flex-1 overflow-y-auto admin-scrollbar p-6">
                {/* Existing fields */}
                <div className="space-y-2 mb-6">
                  {mergeFields.length === 0 && !showNewField && (
                    <div className="text-sm text-admin-text-muted text-center py-8">
                      No merge fields defined yet. Add fields to use <code className="font-admin-mono text-admin-info">{'{{variable}}'}</code> tokens in your template.
                    </div>
                  )}
                  {mergeFields.map((field) => (
                    <div
                      key={field.key}
                      className="group/field flex items-center gap-3 px-4 py-3 rounded-lg bg-admin-bg-overlay border border-admin-border-subtle hover:border-admin-border transition-colors"
                    >
                      <code className="font-admin-mono text-xs text-admin-info bg-admin-bg-base px-2 py-1 rounded">
                        {`{{${field.key}}}`}
                      </code>
                      <span className="text-sm text-admin-text-primary font-medium">{field.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[field.source]}`}>
                        {field.source === 'manual' ? 'manual input' : `${field.source} → ${field.db_path}`}
                      </span>
                      <div className="flex-1" />
                      <button
                        onClick={() => handleInsertToken(field.key)}
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

                {/* Add field form */}
                {showNewField ? (
                  <div className="border border-admin-border rounded-lg p-4 bg-admin-bg-overlay space-y-3">
                    <div>
                      <label className="text-xs text-admin-text-muted mb-1 block">Field Name</label>
                      <input
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        placeholder="e.g. Client Name, Total Amount, Effective Date…"
                        className="admin-input text-sm py-2 px-3 w-full"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs text-admin-text-muted mb-1 block">Maps to</label>
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
              <SaveButton saving={saving} saved={saved} onClick={handleSave} className="px-5 py-2.5 text-sm" />
              <span className="text-xs text-admin-text-faint">
                {mergeFields.length} field{mergeFields.length !== 1 ? 's' : ''} · {tokenStatus.defined.length} used in body
              </span>
            </div>
            <div className="flex items-center gap-2">
              {confirmDelete ? (
                <>
                  <span className="text-xs text-admin-danger mr-1">Delete this template?</span>
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
