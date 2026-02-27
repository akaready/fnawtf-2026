'use client';

import { useState, useTransition } from 'react';
import { RefreshCw, Check, Loader2, ExternalLink, X } from 'lucide-react';
import { updateProposal } from '@/app/admin/actions';
import type { ProposalRow, ContactRow, ProposalType, ProposalStatus } from '@/types/proposal';

interface DetailsTabProps {
  proposal: ProposalRow;
  contacts: ContactRow[];
  onUpdated: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

const PROPOSAL_TYPES: { value: ProposalType; label: string }[] = [
  { value: 'build', label: 'Build' },
  { value: 'launch', label: 'Launch' },
  { value: 'scale', label: 'Scale' },
  { value: 'build-launch', label: 'Build + Launch' },
  { value: 'fundraising', label: 'Fundraising' },
];

const STATUSES: { value: ProposalStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
];

const labelCls = 'block text-xs text-white/50 uppercase tracking-wide mb-1';
const inputCls =
  'w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-white/20';
const sectionHeadingCls = 'text-xs font-mono text-white/25 uppercase tracking-widest mb-4';

export function DetailsTab({ proposal, contacts, onUpdated }: DetailsTabProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  // Try to match an existing contact record by name + email
  const initialLinked = contacts.find(
    (c) => c.name === proposal.contact_name &&
      (c.email ?? '') === (proposal.contact_email ?? '')
  ) ?? null;

  const [linkedContact, setLinkedContact] = useState<ContactRow | null>(initialLinked);
  const [contactName, setContactName] = useState(proposal.contact_name);
  const [contactEmail, setContactEmail] = useState(proposal.contact_email ?? '');
  const [contactCompany, setContactCompany] = useState(proposal.contact_company);
  const [proposalType, setProposalType] = useState<ProposalType>(proposal.proposal_type);
  const [title, setTitle] = useState(proposal.title);
  const [subtitle, setSubtitle] = useState(proposal.subtitle);
  const [slug, setSlug] = useState(proposal.slug);
  const [password, setPassword] = useState(proposal.proposal_password);
  const [status, setStatus] = useState<ProposalStatus>(proposal.status);

  const handleContactSelect = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;
    setLinkedContact(contact);
    setContactName(contact.name);
    setContactEmail(contact.email ?? '');
    setContactCompany(contact.company ?? '');
  };

  const handleUnlink = () => setLinkedContact(null);

  const handleSave = () => {
    startTransition(async () => {
      await updateProposal(proposal.id, {
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim() || null,
        contact_company: contactCompany.trim(),
        proposal_type: proposalType,
        title: title.trim(),
        subtitle: subtitle.trim(),
        slug: slug.trim(),
        proposal_password: password.trim(),
        status,
      });
      setSaved(true);
      onUpdated();
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="px-8 py-8">
    <div className="space-y-10 max-w-3xl">
      {/* Contact */}
      <section>
        <p className={sectionHeadingCls}>Contact</p>
        {linkedContact ? (
          /* Linked contact card */
          <div className="flex items-center gap-4 p-4 bg-white/[0.04] border border-white/10 rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{linkedContact.name}</p>
              <p className="text-xs text-white/50 mt-0.5">
                {[linkedContact.company, linkedContact.email].filter(Boolean).join(' · ')}
              </p>
            </div>
            <a
              href="/admin/contacts"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
            >
              <ExternalLink size={11} />
              View
            </a>
            <button
              onClick={handleUnlink}
              title="Change contact"
              className="p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          /* Contact selector + override fields */
          <div className="space-y-4">
            {contacts.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => { if (e.target.value) handleContactSelect(e.target.value); }}
                className={inputCls + ' cursor-pointer'}
              >
                <option value="">Select a contact…</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.company ? ` — ${c.company}` : ''}
                  </option>
                ))}
              </select>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Name</label>
                <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="John Smith" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="john@acme.com" className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Company</label>
                <input type="text" value={contactCompany} onChange={(e) => setContactCompany(e.target.value)} placeholder="Acme Corporation" className={inputCls} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Proposal metadata */}
      <section>
        <p className={sectionHeadingCls}>Proposal Details</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Proposal type</label>
            <select
              value={proposalType}
              onChange={(e) => setProposalType(e.target.value as ProposalType)}
              className={inputCls + ' cursor-pointer'}
            >
              {PROPOSAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProposalStatus)}
              className={inputCls + ' cursor-pointer'}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Acme Corp Proposal"
              className={inputCls}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Elevating your brand through story-driven video"
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* Slug + Password */}
      <section>
        <p className={sectionHeadingCls}>Access</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Slug</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-corp"
                className={inputCls + ' font-mono'}
              />
              <button
                onClick={() => setSlug(slugify(contactCompany))}
                title="Regenerate slug from company name"
                className="flex-shrink-0 p-2 rounded-lg border border-white/10 bg-white/[0.04] text-white/40 hover:text-white/80 hover:border-white/20 transition-colors"
              >
                <RefreshCw size={13} />
              </button>
            </div>
            <p className="mt-1 text-[11px] text-white/25 font-mono">/p/{slug || '…'}</p>
          </div>
          <div>
            <label className={labelCls}>Access code / password</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls + ' font-mono'}
              />
              <button
                onClick={() => setPassword(generatePassword())}
                title="Generate new password"
                className="flex-shrink-0 p-2 rounded-lg border border-white/10 bg-white/[0.04] text-white/40 hover:text-white/80 hover:border-white/20 transition-colors"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="btn-primary px-6 py-2.5 text-sm"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <Check size={14} className="text-green-600" />
          ) : null}
          {isPending ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
    </div>
  );
}
