'use client';

import { useState } from 'react';
import {
  Building2, Globe, ExternalLink, RefreshCw, Pencil, X, Expand,
  Linkedin, Twitter, Instagram,
} from 'lucide-react';
import { AdminCombobox } from '../../_components/AdminCombobox';
import { CompanyPanel } from '../../_components/CompanyPanel';
import { updateClientRecord, scrapeCompanyInfo } from '../../actions';
import type { ClientRow, IntakeSubmission } from '../../actions';
import type { ScrapedCompanyInfo } from '../../actions';
import type { ContactRow } from '@/types/proposal';

interface Props {
  submission: IntakeSubmission;
  clients: ClientRow[];
  contacts: ContactRow[];
  onLinkClient: (id: string | null) => void;
}

export function IntakeCompanyCard({ submission, clients, contacts, onLinkClient }: Props) {
  const initial = submission.client_id ? clients.find((c) => c.id === submission.client_id) ?? null : null;
  const [client, setClient] = useState<ClientRow | null>(initial);
  const [isEditing, setIsEditing] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCompanyPanel, setShowCompanyPanel] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editInstagram, setEditInstagram] = useState('');

  const wasScraped = !!submission.company_url;

  const startEdit = () => {
    if (!client) return;
    setEditName(client.name || '');
    setEditDescription(client.description || '');
    setEditWebsite(client.website_url || '');
    setEditLinkedin(client.linkedin_url || '');
    setEditTwitter(client.twitter_url || '');
    setEditInstagram(client.instagram_url || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!client) return;
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        name: editName.trim(),
        description: editDescription.trim() || null,
        website_url: editWebsite.trim() || null,
        linkedin_url: editLinkedin.trim() || null,
        twitter_url: editTwitter.trim() || null,
        instagram_url: editInstagram.trim() || null,
      };
      await updateClientRecord(client.id, updates);
      setClient({
        ...client,
        name: editName.trim(),
        description: editDescription.trim() || null,
        website_url: editWebsite.trim() || null,
        linkedin_url: editLinkedin.trim() || null,
        twitter_url: editTwitter.trim() || null,
        instagram_url: editInstagram.trim() || null,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRescrape = async () => {
    if (!client) return;
    const url = client.website_url || submission.company_url;
    if (!url) return;
    setScraping(true);
    try {
      const info: ScrapedCompanyInfo = await scrapeCompanyInfo(client.name, url);
      const updates: Record<string, unknown> = {};
      if (info.description) updates.description = info.description;
      if (info.website_url) updates.website_url = info.website_url;
      if (info.linkedin_url) updates.linkedin_url = info.linkedin_url;
      if (info.twitter_url) updates.twitter_url = info.twitter_url;
      if (info.instagram_url) updates.instagram_url = info.instagram_url;
      if (Object.keys(updates).length > 0) {
        await updateClientRecord(client.id, updates);
        setClient({ ...client, ...updates } as ClientRow);
      }
    } finally {
      setScraping(false);
    }
  };

  const handleChangeCompany = (id: string | null) => {
    onLinkClient(id);
    const newClient = id ? clients.find((c) => c.id === id) ?? null : null;
    setClient(newClient);
    setIsChanging(false);
    setIsEditing(false);
  };

  // ── No company linked ──────────────────────────────────────────────────
  if (!client) {
    return (
      <div className="rounded-xl border border-admin-border-subtle bg-admin-bg-raised p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-admin-bg-hover flex items-center justify-center flex-shrink-0">
            <Building2 size={14} className="text-admin-text-dim" />
          </div>
          <p className="text-sm text-admin-text-muted">No company linked</p>
        </div>
        <AdminCombobox
          value={null}
          options={clients.map((c) => ({ id: c.id, label: c.name }))}
          onChange={handleChangeCompany}
          placeholder="Link to existing company..."
        />
      </div>
    );
  }

  // ── Company linked — expanded view ─────────────────────────────────────
  const socials = [
    { url: client.linkedin_url, icon: Linkedin, label: 'LinkedIn' },
    { url: client.twitter_url, icon: Twitter, label: 'Twitter' },
    { url: client.instagram_url, icon: Instagram, label: 'Instagram' },
  ].filter((s) => s.url);

  return (
    <>
    <div className="rounded-xl border border-admin-border bg-admin-bg-raised overflow-hidden">
      {/* Auto-fetched banner */}
      {wasScraped && !isEditing && (
        <div className="px-4 py-2 bg-admin-warning-bg border-b border-admin-warning-border">
          <p className="text-xs text-admin-warning font-medium">Auto-fetched from website — please review</p>
        </div>
      )}

      <div className="p-4 space-y-3">
        {isEditing ? (
          /* ── Edit mode ─────────────────────────────────────────── */
          <div className="space-y-3">
            <div>
              <label className="admin-label">Company name</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="admin-input w-full" />
            </div>
            <div>
              <label className="admin-label">Website</label>
              <input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} className="admin-input w-full" placeholder="https://..." />
            </div>
            <div>
              <label className="admin-label">Description</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="admin-input w-full resize-none" rows={3} />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="admin-label">LinkedIn</label>
                <input value={editLinkedin} onChange={(e) => setEditLinkedin(e.target.value)} className="admin-input w-full" placeholder="https://linkedin.com/company/..." />
              </div>
              <div>
                <label className="admin-label">Twitter / X</label>
                <input value={editTwitter} onChange={(e) => setEditTwitter(e.target.value)} className="admin-input w-full" placeholder="https://x.com/..." />
              </div>
              <div>
                <label className="admin-label">Instagram</label>
                <input value={editInstagram} onChange={(e) => setEditInstagram(e.target.value)} className="admin-input w-full" placeholder="https://instagram.com/..." />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button onClick={handleSave} disabled={saving} className="btn-primary px-3 py-2 text-xs">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setIsEditing(false)} className="btn-secondary px-3 py-2 text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          /* ── View mode ─────────────────────────────────────────── */
          <>
            {/* Header row */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-admin-bg-hover flex items-center justify-center flex-shrink-0">
                <Building2 size={14} className="text-admin-text-dim" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-admin-text-primary truncate">{client.name}</p>
              </div>
              <button onClick={() => setShowCompanyPanel(true)} className="btn-ghost w-8 h-8 flex items-center justify-center" title="Open full panel">
                <Expand size={14} />
              </button>
              <button onClick={startEdit} className="btn-ghost w-8 h-8 flex items-center justify-center" title="Edit company">
                <Pencil size={14} />
              </button>
            </div>

            {/* Website */}
            {client.website_url && (
              <div className="flex items-center gap-2">
                <Globe size={12} className="text-admin-text-dim flex-shrink-0" />
                <a href={client.website_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline truncate">
                  {client.website_url.replace(/^https?:\/\/(?:www\.)?/, '')}
                </a>
                <button onClick={handleRescrape} disabled={scraping}
                  className="btn-ghost w-6 h-6 flex items-center justify-center flex-shrink-0" title="Re-fetch data">
                  <RefreshCw size={12} className={scraping ? 'animate-spin' : ''} />
                </button>
              </div>
            )}

            {/* Description */}
            {client.description && (
              <p className="text-sm text-admin-text-secondary leading-relaxed">{client.description}</p>
            )}

            {/* Social links */}
            {socials.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {socials.map((s) => (
                  <a key={s.label} href={s.url!} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-admin-bg-hover text-admin-text-muted hover:text-admin-text-primary text-xs border border-admin-border-subtle transition-colors">
                    <s.icon size={12} />
                    {s.label}
                    <ExternalLink size={10} className="text-admin-text-ghost" />
                  </a>
                ))}
              </div>
            )}

            {/* Empty data prompt */}
            {!client.description && !client.website_url && socials.length === 0 && (
              <p className="text-xs text-admin-text-dim">No company details yet. <button onClick={startEdit} className="text-accent hover:underline">Add details</button></p>
            )}

            {/* Re-fetch if no website but submission had URL */}
            {!client.website_url && submission.company_url && (
              <button onClick={handleRescrape} disabled={scraping}
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
                <RefreshCw size={12} className={scraping ? 'animate-spin' : ''} />
                {scraping ? 'Fetching...' : 'Fetch data from website'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Change company footer */}
      {!isEditing && (
        <div className="px-4 py-2.5 border-t border-admin-border-subtle bg-admin-bg-wash">
          {isChanging ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <AdminCombobox
                  value={client.id}
                  options={clients.map((c) => ({ id: c.id, label: c.name }))}
                  onChange={handleChangeCompany}
                  placeholder="Select company..."
                />
              </div>
              <button onClick={() => setIsChanging(false)} className="btn-ghost w-8 h-8 flex items-center justify-center">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => setIsChanging(true)} className="text-xs text-admin-text-muted hover:text-admin-text-primary transition-colors">
              Change company...
            </button>
          )}
        </div>
      )}
    </div>

    {/* Company Panel */}
    {showCompanyPanel && client && (
      <CompanyPanel
        company={client}
        contacts={contacts.filter((c) => c.client_id === client.id)}
        projects={[]}
        testimonials={[]}
        onClose={() => setShowCompanyPanel(false)}
        onCompanyUpdated={(updated) => setClient(updated)}
        onCompanyDeleted={() => { setShowCompanyPanel(false); handleChangeCompany(null); }}
        onContactLinked={() => {}}
        onContactUnlinked={() => {}}
      />
    )}
    </>
  );
}
