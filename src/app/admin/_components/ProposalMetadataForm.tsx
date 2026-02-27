'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Check, Loader2, RefreshCw, Copy, Hammer, Rocket, TrendingUp, Layers, Megaphone,
} from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { type ProposalRow, createProposal, updateProposal } from '../actions';
import type { ProposalType, ContactRow } from '@/types/proposal';

interface Props {
  proposal: ProposalRow | null;
  contacts: ContactRow[];
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

const TYPES: { value: ProposalType; label: string; icon: typeof Hammer }[] = [
  { value: 'build', label: 'Build', icon: Hammer },
  { value: 'launch', label: 'Launch', icon: Rocket },
  { value: 'scale', label: 'Scale', icon: TrendingUp },
  { value: 'build-launch', label: 'Build + Launch', icon: Layers },
  { value: 'fundraising', label: 'Fundraising', icon: Megaphone },
];

export function ProposalMetadataForm({ proposal, contacts }: Props) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);
  const isNew = !proposal;

  const [title, setTitle] = useState(proposal?.title ?? '');
  const [contactName, setContactName] = useState(proposal?.contact_name ?? '');
  const [contactEmail, setContactEmail] = useState(proposal?.contact_email ?? '');
  const [contactCompany, setContactCompany] = useState(proposal?.contact_company ?? '');
  const [proposalType, setProposalType] = useState<ProposalType>((proposal?.proposal_type ?? 'build') as ProposalType);
  const [subtitle, setSubtitle] = useState(proposal?.subtitle ?? '');
  const [slug, setSlug] = useState(proposal?.slug ?? '');
  const [password, setPassword] = useState(proposal?.proposal_password ?? generatePassword());
  const [slugManual, setSlugManual] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);

  const handleContactSelect = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;
    setContactName(`${contact.first_name} ${contact.last_name}`.trim());
    setContactEmail(contact.email ?? '');
    setContactCompany(contact.company ?? '');
    if (!slugManual && contact.company) {
      setSlug(slugify(contact.company));
    }
    if (!title && contact.company) {
      setTitle(`${contact.company} Proposal`);
    }
  };

  const handleCompanyChange = (value: string) => {
    setContactCompany(value);
    if (!slugManual && isNew) {
      setSlug(slugify(value));
    }
  };

  const handleSave = () => {
    if (!title.trim() || !contactName.trim() || !contactCompany.trim() || !subtitle.trim() || !slug.trim() || !password.trim()) return;

    startSave(async () => {
      const data = {
        title: title.trim(),
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim() || null,
        contact_company: contactCompany.trim(),
        proposal_type: proposalType,
        subtitle: subtitle.trim(),
        slug: slug.trim(),
        proposal_password: password,
      };

      if (isNew) {
        const id = await createProposal(data);
        router.push(`/admin/proposals/${id}`);
      } else {
        await updateProposal(proposal.id, data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  const inputCls = 'w-full rounded-lg border border-border/40 bg-black/50 px-4 py-3 text-sm text-foreground placeholder:text-[#303033] focus:outline-none focus:ring-1 focus:ring-white/20';
  const labelCls = 'text-xs font-medium text-muted-foreground mb-1.5 block';

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title={isNew ? 'New Proposal' : `Edit: ${proposal.title}`}
        subtitle={!isNew ? `/p/${proposal.slug}` : undefined}
        leftContent={
          <button
            onClick={() => router.push('/admin/proposals')}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        }
        actions={
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !contactName.trim() || !contactCompany.trim() || !subtitle.trim() || !slug.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg border border-white hover:bg-black hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saved ? (
              <Check size={14} className="text-green-600" />
            ) : (
              <Save size={14} />
            )}
            {isNew ? 'Create Proposal' : saved ? 'Saved' : 'Save'}
          </button>
        }
      />

      {/* Form */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 pt-6 pb-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Proposal Type */}
          <div>
            <label className={labelCls}>Proposal Type</label>
            <div className="flex gap-2">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const active = proposalType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setProposalType(t.value)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      active
                        ? 'border-white/30 bg-white/10 text-foreground'
                        : 'border-border/40 bg-black/50 text-muted-foreground hover:text-foreground hover:border-white/20'
                    }`}
                  >
                    <Icon size={15} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact selector */}
          {contacts.length > 0 && (
            <div>
              <label className={labelCls}>Select Existing Contact (optional)</label>
              <select
                onChange={(e) => { if (e.target.value) handleContactSelect(e.target.value); }}
                defaultValue=""
                className={inputCls}
              >
                <option value="">Choose a contact…</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}{c.company ? ` — ${c.company}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Contact details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Contact Name *</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="John Smith"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="john@acme.com"
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Company *</label>
              <input
                type="text"
                value={contactCompany}
                onChange={(e) => handleCompanyChange(e.target.value)}
                placeholder="Acme Corporation"
                className={inputCls}
              />
            </div>
          </div>

          {/* Proposal details */}
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Proposal Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Acme Corp Proposal"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Proposal Subtitle *</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Elevating your brand through story-driven video"
                className={inputCls}
              />
            </div>
          </div>

          {/* Slug + Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>URL Slug *</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#404044] font-mono whitespace-nowrap">/p/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(slugify(e.target.value)); setSlugManual(true); }}
                  placeholder="acme-corp"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Access Code *</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
                <button
                  onClick={() => setPassword(generatePassword())}
                  title="Generate new code"
                  className="p-3 rounded-lg border border-border/40 bg-black/50 text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors flex-shrink-0"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(password); setCopiedPw(true); setTimeout(() => setCopiedPw(false), 2000); }}
                  title="Copy code"
                  className="p-3 rounded-lg border border-border/40 bg-black/50 text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors flex-shrink-0"
                >
                  {copiedPw ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
