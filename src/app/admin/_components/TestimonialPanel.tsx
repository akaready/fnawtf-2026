'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trash2, User, Building2, LayoutGrid, PenLine, Save } from 'lucide-react';
import { PanelDrawer } from './PanelDrawer';
import { SaveDot } from './SaveDot';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { DiscardChangesDialog } from './DiscardChangesDialog';
import { AdminCombobox } from './AdminCombobox';
import {
  type TestimonialRow,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  createContact,
} from '../actions';

/* ── Helpers ───────────────────────────────────────────────────────────── */

/* ── TestimonialPanel ───────────────────────────────────────────────────── */

interface Props {
  testimonial: TestimonialRow | null;
  open: boolean;
  onClose: () => void;
  onCreated: (row: TestimonialRow) => void;
  onUpdated: (row: TestimonialRow) => void;
  onDeleted: (id: string) => void;
  clients: { id: string; name: string; logo_url: string | null }[];
  projects: { id: string; title: string; client_id?: string | null }[];
  contacts: { id: string; first_name: string; last_name: string; role: string | null }[];
  onContactCreated?: (contact: { id: string; first_name: string; last_name: string; role: string | null }) => void;
}

export function TestimonialPanel({
  testimonial,
  open,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
  clients,
  projects,
  contacts,
  onContactCreated,
}: Props) {
  const isNew = !testimonial;

  // Local edit state
  const [quote, setQuote] = useState('');
  const [contactId, setContactId] = useState<string | null>(null);
  const [contactName, setContactName] = useState('');
  const [displayTitle, setDisplayTitle] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Refs for auto-save closure
  const stateRef = useRef({ quote, contactId, contactName, displayTitle, clientId, projectId });
  useEffect(() => { stateRef.current = { quote, contactId, contactName, displayTitle, clientId, projectId }; });

  const autoSave = useAutoSave(async () => {
    if (isNew || !testimonial) return;
    const s = stateRef.current;
    const selectedContact = s.contactId ? contacts.find((c) => c.id === s.contactId) ?? null : null;
    await updateTestimonial(testimonial.id, {
      quote: s.quote,
      contact_id: s.contactId,
      person_name: s.contactName || null,
      person_title: selectedContact?.role ?? testimonial.person_title ?? null,
      display_title: s.displayTitle || null,
      client_id: s.clientId,
      project_id: s.projectId,
    });
    const contact = s.contactId ? contacts.find((c) => c.id === s.contactId) ?? null : null;
    onUpdated({
      ...testimonial,
      quote: s.quote, contact_id: s.contactId, person_name: s.contactName || null,
      display_title: s.displayTitle || null, client_id: s.clientId, project_id: s.projectId,
      contact: contact ? { id: contact.id, first_name: contact.first_name, last_name: contact.last_name, role: contact.role, headshot_url: testimonial.contact?.headshot_url ?? null } : null,
    });
  });

  // For new records: dirty = has content (drives Create button enabled state)
  const isDirty = isNew ? quote.trim().length > 0 : autoSave.hasPending;

  // Reset local state when panel opens with a different testimonial
  useEffect(() => {
    if (!open) return;
    setQuote(testimonial?.quote ?? '');
    setContactId(testimonial?.contact_id ?? null);
    setContactName(
      testimonial?.contact
        ? `${testimonial.contact.first_name} ${testimonial.contact.last_name}`.trim()
        : testimonial?.person_name ?? ''
    );
    setDisplayTitle(testimonial?.display_title ?? '');
    setClientId(testimonial?.client_id ?? null);
    setProjectId(testimonial?.project_id ?? null);
    setConfirmDelete(false);
    setConfirmDiscard(false);
    autoSave.reset();
  }, [open, testimonial?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    if (isNew ? isDirty : autoSave.hasPending) {
      setConfirmDiscard(true);
    } else {
      onClose();
    }
  }, [isNew, isDirty, autoSave.hasPending, onClose]);

  // Derive person_name / person_title from contact selection
  const selectedContact = contactId ? contacts.find((c) => c.id === contactId) : null;
  const personName = contactName || null;
  const personTitle = selectedContact?.role ?? testimonial?.person_title ?? null;

  // Filter projects by selected client
  const filteredProjects = clientId
    ? projects.filter((p) => p.client_id === clientId)
    : projects;

  // When client changes, clear project if it doesn't belong
  const handleClientChange = (newClientId: string | null) => {
    setClientId(newClientId);
    if (projectId && newClientId) {
      const proj = projects.find((p) => p.id === projectId);
      if (proj && proj.client_id !== newClientId) setProjectId(null);
    }
  };

  const handleCreateContact = async (name: string) => {
    const parts = name.split(' ');
    const first_name = parts[0] || '';
    const last_name = parts.slice(1).join(' ') || '';
    const id = await createContact({ first_name, last_name, type: 'contact' });
    onContactCreated?.({ id, first_name, last_name, role: null });
    setContactId(id);
    setContactName(name);
    if (!isNew) autoSave.trigger();
  };

  const handleSave = async () => {
    if (isNew) {
      // Create new record explicitly
      if (!quote.trim()) return;
      const data = { quote, contact_id: contactId, person_name: personName, person_title: personTitle, display_title: displayTitle || null, client_id: clientId, project_id: projectId };
      const id = await createTestimonial(data);
      const contact = contactId ? contacts.find((c) => c.id === contactId) ?? null : null;
      onCreated({ id, ...data, display_order: 0, company: null, profile_picture_url: null, created_at: new Date().toISOString(), contact: contact ? { id: contact.id, first_name: contact.first_name, last_name: contact.last_name, role: contact.role, headshot_url: null } : null });
    } else {
      // Existing record: flush any pending auto-save then close
      await autoSave.flush();
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!testimonial) return;
    await deleteTestimonial(testimonial.id);
    onDeleted(testimonial.id);
  };

  const contactOptions = contacts.map((c) => ({
    id: c.id,
    label: `${c.first_name} ${c.last_name}`.trim(),
  }));

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[520px]">
      <DiscardChangesDialog
        open={confirmDiscard}
        onKeepEditing={() => setConfirmDiscard(false)}
        onDiscard={() => { setConfirmDiscard(false); onClose(); }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-admin-border flex-shrink-0 bg-admin-bg-sidebar">
        <h2 className="flex-1 min-w-0 text-lg font-semibold text-admin-text-primary truncate">
          {isNew ? 'New Testimonial' : (quote.length > 50 ? quote.slice(0, 50) + '…' : quote || 'Untitled')}
        </h2>
        <SaveDot status={autoSave.status} />
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-6 py-5 space-y-5">
        {/* Quote */}
        <div className="space-y-1.5">
          <label className="admin-label">Quote</label>
          <textarea
            value={quote}
            onChange={(e) => {
              setQuote(e.target.value);
              if (!isNew) autoSave.trigger();
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
            placeholder="Enter the testimonial quote…"
            className="admin-input w-full resize-none overflow-hidden"
            rows={3}
          />
        </div>

        {/* Contact */}
        <div className="space-y-1.5">
          <label className="admin-label flex items-center gap-1.5">
            <User size={12} /> Contact
          </label>
          <AdminCombobox
            value={contactId}
            options={contactOptions}
            onChange={(id) => {
              setContactId(id);
              const c = id ? contacts.find((ct) => ct.id === id) : null;
              setContactName(c ? `${c.first_name} ${c.last_name}`.trim() : '');
              if (!isNew) autoSave.trigger();
            }}
            onCreate={handleCreateContact}
            createLabel="Add Contact"
            placeholder="Search contacts…"
          />
        </div>

        {/* Contact Title Override */}
        <div className="space-y-1.5">
          <label className="admin-label flex items-center gap-1.5">
            <PenLine size={12} /> Contact Title Override
          </label>
          <input
            type="text"
            value={displayTitle}
            onChange={(e) => { setDisplayTitle(e.target.value); if (!isNew) autoSave.trigger(); }}
            placeholder="Overrides contact's role as displayed title"
            className="admin-input w-full"
          />
        </div>

        {/* Client */}
        <div className="space-y-1.5">
          <label className="admin-label flex items-center gap-1.5">
            <Building2 size={12} /> Client
          </label>
          <AdminCombobox
            options={clients.map((c) => ({ id: c.id, label: c.name }))}
            value={clientId}
            onChange={(v) => { handleClientChange(v); if (!isNew) autoSave.trigger(); }}
            placeholder="Search clients…"
          />
        </div>

        {/* Project */}
        <div className="space-y-1.5">
          <label className="admin-label flex items-center gap-1.5">
            <LayoutGrid size={12} /> Project
          </label>
          <AdminCombobox
            options={filteredProjects.map((p) => ({ id: p.id, label: p.title }))}
            value={projectId}
            onChange={(v) => { setProjectId(v); if (!isNew) autoSave.trigger(); }}
            placeholder="Search projects…"
          />
        </div>

      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border flex-shrink-0 bg-admin-bg-wash">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!quote.trim()}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Save size={14} />
            {isNew ? 'Create' : 'Save'}
          </button>
        </div>
        {!isNew && (
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-xs text-admin-danger mr-1">Delete?</span>
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
        )}
      </div>
    </PanelDrawer>
  );
}
