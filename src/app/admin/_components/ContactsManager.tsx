'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  Plus, Trash2, Save, Check, Loader2, Download,
  Mail, Phone, Building2, Briefcase, StickyNote,
} from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import {
  createContact,
  updateContact,
  deleteContact,
} from '../actions';
import type { ContactRow } from '@/types/proposal';

interface Props {
  initialContacts: ContactRow[];
}

export function ContactsManager({ initialContacts }: Props) {
  const [contacts, setContacts] = useState(initialContacts);
  const [saving, startSave] = useTransition();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleChange = (id: string, field: string, value: unknown) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSave = (row: ContactRow) => {
    startSave(async () => {
      await updateContact(row.id, {
        name: row.name,
        email: row.email,
        phone: row.phone,
        role: row.role,
        company: row.company,
        notes: row.notes,
      });
      setSavedId(row.id);
      setTimeout(() => setSavedId(null), 2000);
    });
  };

  const handleCreate = () => {
    startSave(async () => {
      setCreating(true);
      const id = await createContact({
        name: 'New Contact',
      });
      setContacts((prev) => [
        ...prev,
        {
          id,
          name: 'New Contact',
          email: null,
          phone: null,
          role: null,
          company: null,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      setActiveId(id);
      setCreating(false);
    });
  };

  const handleDelete = (id: string) => {
    startSave(async () => {
      await deleteContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
    });
  };

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.role?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const handleExportCsv = () => {
    const header = ['Name', 'Email', 'Phone', 'Role', 'Company', 'Notes', 'Created'];
    const rows = filteredContacts.map((c) => [
      c.name,
      c.email ?? '',
      c.phone ?? '',
      c.role ?? '',
      c.company ?? '',
      c.notes ?? '',
      new Date(c.created_at).toLocaleDateString(),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Contacts"
        subtitle={`${contacts.length} total — People and companies for proposals.`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search contacts…"
        actions={
          <>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#1f1f1f] bg-black text-sm text-muted-foreground hover:text-foreground hover:border-[#333] hover:bg-white/5 transition-colors"
              title="Export as CSV"
            >
              <Download size={14} />
              CSV
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg border border-white hover:bg-black hover:text-white transition-colors"
            >
              <Plus size={16} />
              Add Contact
            </button>
          </>
        }
      />

      {/* Scrollable cards */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 pt-4 pb-8">
        {filteredContacts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground/40 text-sm">
            {contacts.length === 0
              ? 'No contacts yet. Click "Add Contact" to create one.'
              : 'No matching contacts.'}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContacts.map((c) => {
            const isActive = activeId === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`rounded-xl p-5 space-y-4 transition-colors cursor-pointer ${
                  isActive
                    ? 'border border-white/20 bg-[#151515]'
                    : 'border border-border/40 bg-[#111]'
                }`}
              >
                {/* Name */}
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => handleChange(c.id, 'name', e.target.value)}
                  placeholder="Contact name"
                  className="w-full bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground/30 focus:outline-none border-b border-transparent focus:border-white/20 pb-1"
                />

                {/* Fields */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Building2 size={12} /> Company
                    </label>
                    <input
                      type="text"
                      value={c.company ?? ''}
                      onChange={(e) => handleChange(c.id, 'company', e.target.value || null)}
                      placeholder="Acme Corp"
                      className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Mail size={12} /> Email
                      </label>
                      <input
                        type="email"
                        value={c.email ?? ''}
                        onChange={(e) => handleChange(c.id, 'email', e.target.value || null)}
                        placeholder="john@acme.com"
                        className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Phone size={12} /> Phone
                      </label>
                      <input
                        type="tel"
                        value={c.phone ?? ''}
                        onChange={(e) => handleChange(c.id, 'phone', e.target.value || null)}
                        placeholder="(555) 123-4567"
                        className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Briefcase size={12} /> Role
                    </label>
                    <input
                      type="text"
                      value={c.role ?? ''}
                      onChange={(e) => handleChange(c.id, 'role', e.target.value || null)}
                      placeholder="CEO, Founder, Marketing Director…"
                      className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <StickyNote size={12} /> Notes
                    </label>
                    <textarea
                      value={c.notes ?? ''}
                      onChange={(e) => handleChange(c.id, 'notes', e.target.value || null)}
                      placeholder="Notes…"
                      rows={2}
                      className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2.5 text-sm text-muted-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border/20">
                  <span className="text-xs text-muted-foreground/40">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete contact"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSave(c); }}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {savedId === c.id ? (
                        <Check size={14} className="text-green-400" />
                      ) : saving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      {savedId === c.id ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-border/40 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-medium">Delete contact?</h3>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
