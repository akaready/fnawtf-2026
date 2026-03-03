'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trash2, User, Building2, LayoutGrid, PenLine, Save } from 'lucide-react';
import { PanelDrawer } from './PanelDrawer';
import { SaveDot } from './SaveDot';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { DiscardChangesDialog } from './DiscardChangesDialog';
import { AdminSelect } from '../styleguide/_components/AdminSelect';
import {
  type TestimonialRow,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  createContact,
} from '../actions';

/* ── Combobox (contact picker) ──────────────────────────────────────────── */

const inputCls = 'admin-input w-full';

function ContactCombobox({
  value,
  options,
  onChange,
  onCreate,
}: {
  value: string;
  options: Array<{ id: string; name: string }>;
  onChange: (name: string, id: string | null) => void;
  onCreate: (name: string) => Promise<string>;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  const exactMatch = options.find((o) => o.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
          if (!e.target.value.trim()) onChange('', null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            if (!ref.current?.contains(document.activeElement)) {
              setOpen(false);
              if (query.trim() && !exactMatch) onChange(query.trim(), null);
            }
          }, 150);
        }}
        placeholder="Search contacts…"
        className={inputCls}
      />
      {open && (filtered.length > 0 || (query.trim() && !exactMatch)) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto admin-scrollbar bg-admin-bg-raised border border-admin-border-muted rounded-lg shadow-xl">
          {filtered.slice(0, 20).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setQuery(opt.name); onChange(opt.name, opt.id); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-admin-text-primary hover:bg-admin-bg-hover transition-colors truncate"
            >
              {opt.name}
            </button>
          ))}
          {query.trim() && !exactMatch && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={async () => {
                if (!query.trim()) return;
                setCreating(true);
                try {
                  const id = await onCreate(query.trim());
                  onChange(query.trim(), id);
                  setOpen(false);
                } finally { setCreating(false); }
              }}
              disabled={creating}
              className="w-full text-left px-3 py-2 text-sm text-admin-info hover:bg-admin-bg-hover transition-colors border-t border-admin-border"
            >
              {creating ? 'Creating…' : `Add contact "${query.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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

  const handleCreateContact = async (name: string): Promise<string> => {
    const parts = name.split(' ');
    const first_name = parts[0] || '';
    const last_name = parts.slice(1).join(' ') || '';
    const id = await createContact({ first_name, last_name, type: 'contact' });
    onContactCreated?.({ id, first_name, last_name, role: null });
    return id;
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
    name: `${c.first_name} ${c.last_name}`.trim(),
  }));

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[520px]">
      <DiscardChangesDialog
        open={confirmDiscard}
        onKeepEditing={() => setConfirmDiscard(false)}
        onDiscard={() => { setConfirmDiscard(false); onClose(); }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-admin-border flex-shrink-0 bg-admin-bg-inset">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-admin-text-primary truncate">
            {isNew ? 'New Testimonial' : (quote.length > 50 ? quote.slice(0, 50) + '…' : quote || 'Untitled')}
          </h2>
          <SaveDot status={autoSave.status} />
          {!isNew && contactName && (
            <p className="text-xs text-admin-text-faint truncate">{contactName}</p>
          )}
        </div>
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
          <label className="text-admin-sm font-medium text-admin-text-muted">Quote</label>
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
          <label className="flex items-center gap-1.5 text-admin-sm font-medium text-admin-text-muted">
            <User size={12} /> Contact
          </label>
          <ContactCombobox
            value={contactName}
            options={contactOptions}
            onChange={(name, id) => { setContactName(name); setContactId(id); if (!isNew) autoSave.trigger(); }}
            onCreate={handleCreateContact}
          />
        </div>

        {/* Display Override */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-admin-sm font-medium text-admin-text-muted">
            <PenLine size={12} /> Display Override
          </label>
          <input
            type="text"
            value={displayTitle}
            onChange={(e) => { setDisplayTitle(e.target.value); if (!isNew) autoSave.trigger(); }}
            placeholder="Optional title override"
            className={inputCls}
          />
        </div>

        {/* Client */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-admin-sm font-medium text-admin-text-muted">
            <Building2 size={12} /> Client
          </label>
          <AdminSelect
            options={[
              { value: '', label: 'No client' },
              ...clients.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={clientId ?? ''}
            onChange={(v) => { handleClientChange((v as string) || null); if (!isNew) autoSave.trigger(); }}
            placeholder="Select client…"
          />
        </div>

        {/* Project */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-admin-sm font-medium text-admin-text-muted">
            <LayoutGrid size={12} /> Project
          </label>
          <AdminSelect
            options={[
              { value: '', label: 'No project' },
              ...filteredProjects.map((p) => ({ value: p.id, label: p.title })),
            ]}
            value={projectId ?? ''}
            onChange={(v) => { setProjectId((v as string) || null); if (!isNew) autoSave.trigger(); }}
            placeholder="Select project…"
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
