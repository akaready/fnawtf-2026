'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Trash2, Send, RefreshCw, Plus, Clock, Eye, CheckCircle2, XCircle, AlertCircle, FileText, Users, History, Save } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { AdminTabBar } from '@/app/admin/_components/AdminTabBar';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { DiscardChangesDialog } from '@/app/admin/_components/DiscardChangesDialog';
import { AdminCombobox } from '@/app/admin/_components/AdminCombobox';
import type {
  ContractRow,
  ContractEventRow,
  ContractStatus,
  ContractType,
  SignerRole,
} from '@/types/contracts';
import {
  getContract,
  updateContract,
  deleteContract,
  voidContract,
  reRenderContractBody,
  addContractSigner,
  removeContractSigner,
  getContractEvents,
  sendContractForSigning,
} from '@/lib/contracts/actions';
import { getClients, getContacts, getProposals, getProposalQuotes } from '@/app/admin/actions';

const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Draft',
  pending_review: 'Review',
  sent: 'Sent',
  viewed: 'Viewed',
  signed: 'Signed',
  declined: 'Declined',
  expired: 'Expired',
  voided: 'Voided',
};

const STATUS_COLORS: Record<ContractStatus, string> = {
  draft: 'bg-admin-bg-active text-admin-text-dim',
  pending_review: 'bg-admin-warning-bg text-admin-warning',
  sent: 'bg-admin-info-bg text-admin-info',
  viewed: 'bg-admin-info-bg text-admin-info',
  signed: 'bg-admin-success-bg text-admin-success',
  declined: 'bg-admin-danger-bg text-admin-danger',
  expired: 'bg-admin-danger-bg text-admin-danger',
  voided: 'bg-admin-bg-hover text-admin-text-ghost',
};

const TYPE_OPTIONS: { value: ContractType; label: string }[] = [
  { value: 'sow', label: 'SOW' },
  { value: 'msa', label: 'MSA' },
  { value: 'nda', label: 'NDA' },
  { value: 'amendment', label: 'Amendment' },
  { value: 'pitch_video', label: 'Pitch Video' },
  { value: 'custom', label: 'Custom' },
];

interface Props {
  contractId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (contract: ContractRow) => void;
  onDeleted: (id: string) => void;
}

export function ContractPanel({ contractId, open, onClose, onUpdated, onDeleted }: Props) {
  const [contract, setContract] = useState<ContractRow | null>(null);
  const [events, setEvents] = useState<ContractEventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Edit state
  const [title, setTitle] = useState('');
  const [contractType, setContractType] = useState<ContractType>('sow');
  const [body, setBody] = useState('');
  const [notes, setNotes] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);

  // Lookup lists for linked record pickers
  const [clientOptions, setClientOptions] = useState<{ id: string; label: string }[]>([]);
  const [contactOptions, setContactOptions] = useState<{ id: string; label: string }[]>([]);
  const [contactsData, setContactsData] = useState<{ id: string; first_name: string; last_name: string; email: string | null }[]>([]);
  const [proposalOptions, setProposalOptions] = useState<{ id: string; label: string }[]>([]);
  const [quoteOptions, setQuoteOptions] = useState<{ id: string; label: string }[]>([]);

  // Ref for auto-save closure
  const stateRef = useRef({ title, contractType, body, notes, clientId, contactId, proposalId, quoteId });
  useEffect(() => { stateRef.current = { title, contractType, body, notes, clientId, contactId, proposalId, quoteId }; });

  const autoSave = useAutoSave(async () => {
    if (!contract) return;
    const s = stateRef.current;
    const updates: Record<string, unknown> = {
      title: s.title, contract_type: s.contractType, body: s.body, notes: s.notes || null,
      client_id: s.clientId || null, contact_id: s.contactId || null,
      proposal_id: s.proposalId || null, quote_id: s.quoteId || null,
    };
    await updateContract(contract.id, updates);
    const updated = { ...contract, ...updates, updated_at: new Date().toISOString() } as ContractRow;
    setContract(updated);
    onUpdated(updated);
  });

  // New signer form
  const [showAddSigner, setShowAddSigner] = useState(false);
  const [signerMode, setSignerMode] = useState<'pick' | 'manual'>('pick');
  const [signerContactPick, setSignerContactPick] = useState('');
  const [newSignerName, setNewSignerName] = useState('');
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [newSignerRole, setNewSignerRole] = useState<SignerRole>('signer');

  // Load contract + lookup lists
  useEffect(() => {
    if (!open || !contractId) {
      setContract(null);
      setEvents([]);
      setActiveTab('details');
      autoSave.reset();
      return;
    }
    setLoading(true);
    Promise.all([
      getContract(contractId),
      getContractEvents(contractId),
      getClients(),
      getContacts(),
      getProposals(),
    ])
      .then(([c, e, clients, contacts, proposals]) => {
        setContract(c);
        setEvents(e);
        setTitle(c.title);
        setContractType(c.contract_type);
        setBody(c.body);
        setNotes(c.notes || '');
        setClientId(c.client_id);
        setContactId(c.contact_id);
        setProposalId(c.proposal_id);
        setQuoteId(c.quote_id);
        autoSave.reset();
        setClientOptions(clients.map((cl) => ({ id: cl.id, label: cl.name })));
        setContactsData(contacts.map((ct) => ({ id: ct.id, first_name: ct.first_name, last_name: ct.last_name, email: ct.email })));
        setContactOptions(contacts.map((ct) => ({ id: ct.id, label: `${ct.first_name} ${ct.last_name}` })));
        setProposalOptions(proposals.map((p) => ({ id: p.id, label: p.title })));
        // Load quotes if proposal is already linked
        if (c.proposal_id) {
          getProposalQuotes(c.proposal_id).then((quotes) => {
            setQuoteOptions(quotes.map((q) => ({ id: q.id, label: q.label || q.quote_type })));
          });
        }
      })
      .finally(() => setLoading(false));
  }, [open, contractId]);

  // Re-fetch quotes when proposal changes
  useEffect(() => {
    if (!proposalId) {
      setQuoteOptions([]);
      setQuoteId(null);
      return;
    }
    getProposalQuotes(proposalId).then((quotes) => {
      setQuoteOptions(quotes.map((q) => ({ id: q.id, label: q.label || q.quote_type })));
    });
  }, [proposalId]);

  const handleSave = useCallback(async () => {
    if (!contract) return;
    await autoSave.flush();
    onClose();
  }, [contract, autoSave, onClose]);

  const handleDelete = async () => {
    if (!contract) return;
    await deleteContract(contract.id);
    onDeleted(contract.id);
    onClose();
  };

  const handleClose = useCallback(() => {
    if (autoSave.hasPending) {
      setConfirmDiscard(true);
    } else {
      onClose();
    }
  }, [autoSave.hasPending, onClose]);

  const handleVoid = async () => {
    if (!contract) return;
    await voidContract(contract.id);
    const updated = { ...contract, status: 'voided' as ContractStatus };
    setContract(updated);
    onUpdated(updated);
    setConfirmVoid(false);
  };

  const handleReRender = async () => {
    if (!contract) return;
    const newBody = await reRenderContractBody(contract.id);
    setBody(newBody);
    const updated = { ...contract, body: newBody };
    setContract(updated);
    onUpdated(updated);
  };

  const handleAddSigner = async () => {
    if (!contract || !newSignerName || !newSignerEmail) return;
    await addContractSigner(contract.id, {
      name: newSignerName,
      email: newSignerEmail,
      role: newSignerRole,
      contactId: signerMode === 'pick' && signerContactPick ? signerContactPick : undefined,
    });
    const updated = await getContract(contract.id);
    setContract(updated);
    onUpdated(updated);
    resetSignerForm();
  };

  const resetSignerForm = () => {
    setNewSignerName('');
    setNewSignerEmail('');
    setNewSignerRole('signer');
    setSignerContactPick('');
    setSignerMode('pick');
    setShowAddSigner(false);
  };

  const handleSignerContactPick = (contactId: string) => {
    setSignerContactPick(contactId);
    const ct = contactsData.find((c) => c.id === contactId);
    if (ct) {
      setNewSignerName(`${ct.first_name} ${ct.last_name}`);
      setNewSignerEmail(ct.email || '');
    }
  };

  const handleRemoveSigner = async (signerId: string) => {
    if (!contract) return;
    await removeContractSigner(signerId);
    const updated = await getContract(contract.id);
    setContract(updated);
    onUpdated(updated);
  };

  const handleSend = async () => {
    if (!contract) return;
    setSending(true);
    try {
      await sendContractForSigning(contract.id);
      const updated = await getContract(contract.id);
      setContract(updated);
      onUpdated(updated);
      setConfirmSend(false);
    } finally {
      setSending(false);
    }
  };

  const isEditable = contract?.status === 'draft' || contract?.status === 'pending_review';
  const canSend = isEditable && (contract?.signers?.length ?? 0) > 0 && !!body;

  const tabs = [
    { value: 'details', label: 'Details', icon: <FileText size={13} /> },
    { value: 'body', label: 'Body' },
    { value: 'signers', label: 'Signers', icon: <Users size={13} />, badge: contract?.signers?.length ? <span className="text-admin-xs px-1.5 py-0.5 rounded-full bg-admin-bg-hover">{contract.signers.length}</span> : undefined },
    { value: 'activity', label: 'Activity', icon: <History size={13} /> },
  ];

  const signerStatusIcon = (status: string) => {
    switch (status) {
      case 'signed': return <CheckCircle2 size={13} className="text-admin-success" />;
      case 'viewed': return <Eye size={13} className="text-admin-info" />;
      case 'declined': return <XCircle size={13} className="text-admin-danger" />;
      default: return <Clock size={13} className="text-admin-text-faint" />;
    }
  };

  const eventIcon = (eventType: string) => {
    switch (eventType) {
      case 'created': return <Plus size={13} />;
      case 'edited': return <FileText size={13} />;
      case 'sent': return <Send size={13} className="text-admin-info" />;
      case 'viewed': return <Eye size={13} className="text-admin-info" />;
      case 'signed': return <CheckCircle2 size={13} className="text-admin-success" />;
      case 'declined': return <XCircle size={13} className="text-admin-danger" />;
      case 'voided': return <AlertCircle size={13} className="text-admin-danger" />;
      default: return <Clock size={13} />;
    }
  };

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[min(92vw,900px)]">
      <DiscardChangesDialog
        open={confirmDiscard}
        onKeepEditing={() => setConfirmDiscard(false)}
        onDiscard={() => { setConfirmDiscard(false); onClose(); }}
      />
      {loading ? (
        <div className="flex items-center justify-center h-full text-admin-text-muted">Loading...</div>
      ) : !contract ? (
        <div className="flex items-center justify-center h-full text-admin-text-muted">Contract not found</div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Header — title + status pill + close */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 h-[4rem] border-b border-admin-border bg-admin-bg-sidebar">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-admin-xs font-admin-mono text-admin-text-faint flex-shrink-0">#{contract.contract_number}</span>
              {isEditable ? (
                <input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); autoSave.trigger(); }}
                  className="bg-transparent text-admin-lg font-semibold text-admin-text-primary outline-none min-w-0 flex-1"
                />
              ) : (
                <span className="text-admin-lg font-semibold text-admin-text-primary truncate">{title}</span>
              )}
              <SaveDot status={autoSave.status} />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-admin-xs font-medium ${STATUS_COLORS[contract.status]}`}>
                {STATUS_LABELS[contract.status]}
              </span>
              <button onClick={onClose} className="btn-ghost w-9 h-9 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <AdminTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Content */}
          <div className="flex-1 overflow-y-auto admin-scrollbar">
            {/* -- Details Tab -- */}
            {activeTab === 'details' && (
              <div className="p-6 space-y-6">
                <div>
                  <label className="admin-label">Title</label>
                  {isEditable ? (
                    <input
                      value={title}
                      onChange={(e) => { setTitle(e.target.value); autoSave.trigger(); }}
                      className="admin-input w-full"
                      placeholder="Contract title…"
                    />
                  ) : (
                    <div className="text-admin-base text-admin-text-primary">{title}</div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">Type</label>
                    {isEditable ? (
                      <AdminCombobox
                        options={TYPE_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
                        value={contractType}
                        onChange={(v) => { if (v) { setContractType(v as ContractType); autoSave.trigger(); } }}
                        placeholder="Select type…"
                        nullable={false}
                        searchable={false}
                      />
                    ) : (
                      <div className="text-admin-base text-admin-text-primary">{TYPE_OPTIONS.find((o) => o.value === contractType)?.label}</div>
                    )}
                  </div>
                  <div>
                    <label className="admin-label">Template</label>
                    <div className="text-admin-base text-admin-text-secondary">
                      {contract.template?.name || <span className="text-admin-text-faint">From scratch</span>}
                    </div>
                  </div>
                </div>

                {/* Linked records */}
                <div>
                  <h3 className="text-admin-xs font-semibold text-admin-text-muted uppercase tracking-wider mb-3">Linked Records</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="admin-label">Client</label>
                      {isEditable ? (
                        <AdminCombobox
                          options={clientOptions}
                          value={clientId}
                          onChange={(v) => { setClientId(v); autoSave.trigger(); }}
                          placeholder="Search clients…"
                        />
                      ) : (
                        <div className="text-admin-base text-admin-text-primary">{contract.client?.name || <span className="text-admin-text-faint">None</span>}</div>
                      )}
                    </div>
                    <div>
                      <label className="admin-label">Contact</label>
                      {isEditable ? (
                        <AdminCombobox
                          options={contactOptions}
                          value={contactId}
                          onChange={(v) => { setContactId(v); autoSave.trigger(); }}
                          placeholder="Search contacts…"
                        />
                      ) : (
                        <div className="text-admin-base text-admin-text-primary">
                          {contract.contact ? `${contract.contact.first_name} ${contract.contact.last_name}` : <span className="text-admin-text-faint">None</span>}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="admin-label">Proposal</label>
                      {isEditable ? (
                        <AdminCombobox
                          options={proposalOptions}
                          value={proposalId}
                          onChange={(v) => {
                            setProposalId(v);
                            if (!v) setQuoteId(null);
                            autoSave.trigger();
                          }}
                          placeholder="Search proposals…"
                        />
                      ) : (
                        <div className="text-admin-base text-admin-text-primary">{contract.proposal?.title || <span className="text-admin-text-faint">None</span>}</div>
                      )}
                    </div>
                    <div>
                      <label className="admin-label">Quote</label>
                      {isEditable ? (
                        proposalId ? (
                          <AdminCombobox
                            options={quoteOptions}
                            value={quoteId}
                            onChange={(v) => { setQuoteId(v); autoSave.trigger(); }}
                            placeholder="Search quotes…"
                          />
                        ) : (
                          <div className="text-admin-xs text-admin-text-faint py-2">Select a proposal first</div>
                        )
                      ) : (
                        <div className="text-admin-base text-admin-text-primary">
                          {contract.quote ? contract.quote.label : <span className="text-admin-text-faint">None</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="admin-label">Notes</label>
                  {isEditable ? (
                    <textarea
                      value={notes}
                      onChange={(e) => { setNotes(e.target.value); autoSave.trigger(); }}
                      rows={3}
                      className="admin-input w-full resize-none"
                      placeholder="Internal notes..."
                    />
                  ) : (
                    <div className="text-admin-base text-admin-text-secondary whitespace-pre-wrap">
                      {notes || <span className="text-admin-text-faint">No notes</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* -- Body Tab -- */}
            {activeTab === 'body' && (
              <div className="flex flex-col h-full">
                {contract.template_id && isEditable && (
                  <div className="flex-shrink-0 px-6 py-2 border-b border-admin-border-subtle flex items-center justify-between">
                    <span className="text-admin-sm text-admin-text-faint">
                      Template: {contract.template?.name}
                    </span>
                    <button
                      onClick={handleReRender}
                      className="btn-secondary px-3 py-1.5 text-admin-sm inline-flex items-center gap-1.5"
                    >
                      <RefreshCw size={12} />
                      Re-render from template
                    </button>
                  </div>
                )}
                <div className="flex-1 p-6">
                  {isEditable ? (
                    <textarea
                      value={body}
                      onChange={(e) => { setBody(e.target.value); autoSave.trigger(); }}
                      className="w-full h-full min-h-[400px] resize-none bg-admin-bg-overlay border border-admin-border rounded-lg text-admin-text-primary font-admin-mono outline-none focus:border-admin-border admin-scrollbar"
                      placeholder="Contract body text..."
                      spellCheck={false}
                    />
                  ) : (
                    <div className="bg-admin-bg-overlay border border-admin-border rounded-lg p-4 text-admin-base text-admin-text-secondary whitespace-pre-wrap leading-relaxed min-h-[400px]">
                      {body || <span className="text-admin-text-faint">Empty contract body</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* -- Signers Tab -- */}
            {activeTab === 'signers' && (
              <div className="p-6 space-y-4">
                {(contract.signers || []).length === 0 && !showAddSigner && (
                  <div className="text-admin-base text-admin-text-muted text-center py-8">
                    No signers added yet. Add signers to send this contract for signature.
                  </div>
                )}
                {(contract.signers || []).map((signer) => (
                  <div
                    key={signer.id}
                    className="group/signer flex items-center gap-4 px-4 py-3 rounded-lg bg-admin-bg-overlay border border-admin-border-subtle hover:border-admin-border transition-colors"
                  >
                    {signerStatusIcon(signer.status)}
                    <div className="flex-1 min-w-0">
                      <div className="text-admin-base font-medium text-admin-text-primary">{signer.name}</div>
                      <div className="text-admin-sm text-admin-text-muted">{signer.email}</div>
                    </div>
                    <span className="text-admin-xs px-1.5 py-0.5 rounded-full bg-admin-bg-hover text-admin-text-dim uppercase tracking-wider">
                      {signer.role}
                    </span>
                    {signer.signed_at && (
                      <span className="text-admin-sm text-admin-success">
                        Signed {new Date(signer.signed_at).toLocaleDateString()}
                      </span>
                    )}
                    {isEditable && (
                      <button
                        onClick={() => handleRemoveSigner(signer.id)}
                        className="opacity-0 group-hover/signer:opacity-100 transition-opacity btn-ghost-danger w-8 h-8 flex items-center justify-center"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add signer */}
                {isEditable && (
                  showAddSigner ? (
                    <div className="border border-admin-border rounded-lg p-4 bg-admin-bg-overlay space-y-3">
                      {/* Mode toggle */}
                      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-admin-bg-inset w-fit">
                        <button
                          type="button"
                          onClick={() => { setSignerMode('pick'); setNewSignerName(''); setNewSignerEmail(''); setSignerContactPick(''); }}
                          className={`px-3 py-1.5 text-admin-sm rounded-md transition-colors ${signerMode === 'pick' ? 'bg-admin-bg-overlay text-admin-text-primary shadow-sm' : 'text-admin-text-muted hover:text-admin-text-primary'}`}
                        >
                          From Contacts
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSignerMode('manual'); setSignerContactPick(''); }}
                          className={`px-3 py-1.5 text-admin-sm rounded-md transition-colors ${signerMode === 'manual' ? 'bg-admin-bg-overlay text-admin-text-primary shadow-sm' : 'text-admin-text-muted hover:text-admin-text-primary'}`}
                        >
                          Enter Manually
                        </button>
                      </div>

                      {signerMode === 'pick' ? (
                        <div>
                          <label className="admin-label">Contact</label>
                          <AdminCombobox
                            options={contactOptions}
                            value={signerContactPick || null}
                            onChange={(v) => { if (v) handleSignerContactPick(v); }}
                            placeholder="Search contacts…"
                            nullable={false}
                          />
                          {signerContactPick && newSignerName && (
                            <div className="mt-2 text-admin-sm text-admin-text-muted">
                              {newSignerName} · {newSignerEmail || 'No email on file'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="admin-label">Name</label>
                            <input
                              value={newSignerName}
                              onChange={(e) => setNewSignerName(e.target.value)}
                              placeholder="Full name"
                              className="admin-input w-full"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="admin-label">Email</label>
                            <input
                              value={newSignerEmail}
                              onChange={(e) => setNewSignerEmail(e.target.value)}
                              placeholder="email@example.com"
                              className="admin-input w-full"
                              type="email"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="admin-label">Role</label>
                        <AdminCombobox
                          options={[
                            { id: 'signer', label: 'Signer' },
                            { id: 'approver', label: 'Approver' },
                            { id: 'cc', label: 'CC' },
                          ]}
                          value={newSignerRole}
                          onChange={(v) => { if (v) setNewSignerRole(v as SignerRole); }}
                          placeholder="Select role…"
                          nullable={false}
                          searchable={false}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleAddSigner}
                          disabled={!newSignerName || !newSignerEmail}
                          className="btn-primary px-4 py-1.5 text-admin-base"
                        >
                          Add Signer
                        </button>
                        <button onClick={resetSignerForm} className="btn-secondary px-4 py-1.5 text-admin-base">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddSigner(true)}
                      className="btn-secondary px-4 py-2 text-admin-base inline-flex items-center gap-2"
                    >
                      <Plus size={14} />
                      Add Signer
                    </button>
                  )
                )}
              </div>
            )}

            {/* -- Activity Tab -- */}
            {activeTab === 'activity' && (
              <div className="p-6">
                {events.length === 0 ? (
                  <div className="text-admin-base text-admin-text-muted text-center py-8">No activity yet</div>
                ) : (
                  <div className="space-y-0">
                    {events.map((event, i) => (
                      <div key={event.id} className="flex gap-3 pb-4">
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-admin-bg-hover flex items-center justify-center flex-shrink-0">
                            {eventIcon(event.event_type)}
                          </div>
                          {i < events.length - 1 && (
                            <div className="w-px flex-1 bg-admin-border-subtle mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="text-admin-base text-admin-text-primary">
                            <span className="font-medium capitalize">{event.event_type.replace(/_/g, ' ')}</span>
                            {event.actor_email && (
                              <span className="text-admin-text-muted"> by {event.actor_email}</span>
                            )}
                            {event.signer_email && (
                              <span className="text-admin-text-muted"> -- {event.signer_email}</span>
                            )}
                          </div>
                          <div className="text-admin-sm text-admin-text-faint mt-0.5">
                            {new Date(event.occurred_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer: save + send (left) | void + delete (right) */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border flex-shrink-0 bg-admin-bg-wash">
            <div className="flex items-center gap-3">
              {isEditable && (
                <button onClick={handleSave} className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm">
                  <Save size={14} />
                  Save
                </button>
              )}
              {/* Send for signature */}
              {isEditable && !confirmSend && (
                <button
                  onClick={() => setConfirmSend(true)}
                  disabled={!canSend}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-admin-border text-sm text-admin-text-muted hover:text-admin-text-primary hover:border-admin-border-emphasis hover:bg-admin-bg-hover transition-colors disabled:opacity-40"
                >
                  <Send size={14} />
                  Send for Signature
                </button>
              )}
              {confirmSend && (
                <div className="flex items-center gap-2">
                  <span className="text-admin-sm text-admin-info mr-1">
                    Send to {contract.signers?.length || 0} signer{(contract.signers?.length || 0) !== 1 ? 's' : ''}?
                  </span>
                  <button
                    onClick={() => setConfirmSend(false)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-admin-border text-admin-text-muted hover:text-admin-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="btn-primary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                  >
                    <Send size={12} />
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Void button for sent/viewed contracts */}
              {(contract.status === 'sent' || contract.status === 'viewed') && !confirmVoid && (
                <button
                  onClick={() => setConfirmVoid(true)}
                  className="btn-ghost-danger px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                >
                  <XCircle size={13} />
                  Void
                </button>
              )}
              {confirmVoid && (
                <>
                  <span className="text-admin-sm text-admin-danger mr-1">Void this contract?</span>
                  <button
                    onClick={() => setConfirmVoid(false)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-admin-border text-admin-text-muted hover:text-admin-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVoid}
                    className="px-3 py-1.5 text-xs rounded-lg bg-admin-danger-bg-strong text-admin-danger border border-admin-danger-border hover:bg-admin-danger-bg-strong transition-colors"
                  >
                    Void
                  </button>
                </>
              )}
              {/* Delete — two-state confirmation */}
              {confirmDelete ? (
                <>
                  <span className="text-admin-sm text-admin-danger mr-1">Delete this contract?</span>
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
