'use client';

import { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, FileText, PenLine } from 'lucide-react';
import type { ContractTemplateRow, ContractType } from '@/types/contracts';
import { getContractTemplates, createContractFromTemplate, createContractDraft } from '@/lib/contracts/actions';

const TYPE_LABELS: Record<ContractType, string> = {
  sow: 'SOW',
  msa: 'MSA',
  nda: 'NDA',
  amendment: 'Amendment',
  custom: 'Custom',
};

interface Props {
  onClose: () => void;
  onCreated: (contractId: string) => void;
}

export function CreateContractModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState<ContractTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Step 2: contract details
  const [title, setTitle] = useState('');

  useEffect(() => {
    getContractTemplates()
      .then((t) => setTemplates(t.filter((tmpl) => tmpl.is_active)))
      .finally(() => setLoading(false));
  }, []);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleSelectTemplate = (id: string) => {
    const tmpl = templates.find((t) => t.id === id);
    setSelectedTemplateId(id);
    if (tmpl) setTitle(tmpl.name);
    setStep(1);
  };

  const handleStartFromScratch = () => {
    setSelectedTemplateId(null);
    setTitle('');
    setStep(1);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      let id: string;
      if (selectedTemplateId) {
        id = await createContractFromTemplate({
          templateId: selectedTemplateId,
          title: title || 'Untitled Contract',
        });
      } else {
        id = await createContractDraft();
        // If user gave a title, we'd update it — but createContractDraft sets "Untitled Contract"
        // For now this is fine; they can rename in the panel
      }
      onCreated(id);
    } catch (err) {
      console.error('Failed to create contract:', err);
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={() => !creating && onClose()}
    >
      <div
        className="bg-admin-bg-raised border border-admin-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <h2 className="text-base font-semibold text-admin-text-primary">
            {step === 0 ? 'New Contract' : 'Contract Details'}
          </h2>
          <button onClick={onClose} className="btn-ghost w-8 h-8 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Step 0: Choose template */}
        {step === 0 && (
          <div className="p-6">
            {loading ? (
              <div className="text-sm text-admin-text-muted text-center py-8">Loading templates…</div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-admin-text-muted mb-4">Choose a template or start from scratch.</p>

                {templates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg bg-admin-bg-overlay border border-admin-border-subtle hover:border-admin-border hover:bg-admin-bg-hover transition-colors"
                  >
                    <FileText size={18} className="text-admin-text-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-admin-text-primary">{tmpl.name}</div>
                      {tmpl.description && (
                        <div className="text-xs text-admin-text-muted truncate">{tmpl.description}</div>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-admin-bg-hover text-admin-text-dim">
                      {TYPE_LABELS[tmpl.contract_type] || tmpl.contract_type}
                    </span>
                    <span className="text-xs text-admin-text-faint">
                      {Array.isArray(tmpl.merge_fields) ? tmpl.merge_fields.length : 0} fields
                    </span>
                    <ChevronRight size={14} className="text-admin-text-faint" />
                  </button>
                ))}

                <button
                  onClick={handleStartFromScratch}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-admin-border hover:border-admin-border hover:bg-admin-bg-hover transition-colors"
                >
                  <PenLine size={18} className="text-admin-text-muted flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-admin-text-primary">Start from scratch</div>
                    <div className="text-xs text-admin-text-muted">Create a blank contract</div>
                  </div>
                  <ChevronRight size={14} className="text-admin-text-faint" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Title & confirm */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            {selectedTemplate && (
              <div className="flex items-center gap-2 text-xs text-admin-text-muted">
                <FileText size={12} />
                Template: <span className="font-medium text-admin-text-secondary">{selectedTemplate.name}</span>
              </div>
            )}
            <div>
              <label className="text-xs text-admin-text-muted mb-1 block">Contract Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Acme Corp SOW — Brand Video"
                className="admin-input text-sm py-2.5 px-3 w-full"
                autoFocus
              />
            </div>
            <p className="text-xs text-admin-text-faint">
              You can link a client, contact, proposal, and quote after creating the contract.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              disabled={creating}
              className="btn-secondary px-4 py-2 text-sm inline-flex items-center gap-1.5"
            >
              <ChevronLeft size={14} />
              Back
            </button>
          ) : (
            <div />
          )}
          {step === 1 && (
            <button
              onClick={handleCreate}
              disabled={creating || !title}
              className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
            >
              {creating ? 'Creating…' : 'Create Contract'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
