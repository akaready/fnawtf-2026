'use client';

import { useState, useRef, useTransition, forwardRef, useImperativeHandle, useEffect, useCallback } from 'react';
import { useSaveState } from '@/app/admin/_hooks/useSaveState';
import { RefreshCw, Plus, X, UserPlus, Mail, Building2, Copy, Check } from 'lucide-react';
import {
  updateProposal, createContact, addProposalContact, removeProposalContact,
  createClientRecord, type ClientRow,
} from '@/app/admin/actions';
import type { ProposalRow, ContactRow, ProposalType, ContactType } from '@/types/proposal';
import { contactFullName } from '@/lib/contacts';

export interface DetailsTabHandle {
  save: () => void;
  isDirty: boolean;
}

interface DetailsTabProps {
  proposal: ProposalRow;
  contacts: ContactRow[];
  proposalContacts: (ContactRow & { pivot_id: string })[];
  clients: ClientRow[];
  onUpdated: () => void;
  onSaveStateChange?: (isPending: boolean, saved: boolean) => void;
  onProposalTypeChange?: (type: ProposalType) => void;
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

const CONTACT_TYPES: { value: ContactType; label: string }[] = [
  { value: 'contact', label: 'Contact' },
  { value: 'crew', label: 'Crew' },
  { value: 'staff', label: 'Staff' },
  { value: 'partner', label: 'Partner' },
  { value: 'cast', label: 'Cast' },
];

const labelCls = 'block text-xs text-[#808080] uppercase tracking-wide mb-1';
const inputCls =
  'w-full bg-black/40 border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-[#333]';
const sectionHeadingCls = 'text-xs font-mono text-[#404040] uppercase tracking-widest mb-4';

export const DetailsTab = forwardRef<DetailsTabHandle, DetailsTabProps>(function DetailsTab(
  { proposal, contacts, proposalContacts: initialProposalContacts, clients: initialClients, onUpdated, onSaveStateChange, onProposalTypeChange },
  ref,
) {
  const [isPending, startTransition] = useTransition();
  const { saved, wrap: wrapSave } = useSaveState(2500);

  const lastSavedRef = useRef({
    contactName: proposal.contact_name,
    contactEmail: proposal.contact_email ?? '',
    contactCompany: proposal.contact_company,
    proposalType: proposal.proposal_type as ProposalType,
    title: proposal.title,
    subtitle: proposal.subtitle,
    slug: proposal.slug,
    password: proposal.proposal_password,
  });

  const contactName = proposal.contact_name;
  const contactEmail = proposal.contact_email ?? '';
  const [contactCompany, setContactCompany] = useState(proposal.contact_company);
  const [proposalType, setProposalType] = useState<ProposalType>(proposal.proposal_type);
  const [title, setTitle] = useState(proposal.title);
  const [subtitle, setSubtitle] = useState(proposal.subtitle);
  const [slug, setSlug] = useState(proposal.slug);
  const [password, setPassword] = useState(proposal.proposal_password);
  const [slugCopied, setSlugCopied] = useState(false);

  // Company search state
  const [clients, setClients] = useState(initialClients);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');
  const [newCompanyWebsite, setNewCompanyWebsite] = useState('');
  const [newCompanyIndustry, setNewCompanyIndustry] = useState('');
  const [newCompanyLocation, setNewCompanyLocation] = useState('');
  const [newCompanyNotes, setNewCompanyNotes] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);

  // Show filtered results only when typing and not an exact match
  const exactClientMatch = clients.some((c) => c.name.toLowerCase() === contactCompany.toLowerCase());
  const filteredClients = contactCompany.trim() && !exactClientMatch
    ? clients
        .filter((c) =>
          c.name.toLowerCase().includes(contactCompany.toLowerCase()) ||
          (c.company ?? '').toLowerCase().includes(contactCompany.toLowerCase()) ||
          (c.industry ?? '').toLowerCase().includes(contactCompany.toLowerCase()),
        )
        .slice(0, 8)
    : [];

  const handleSelectCompany = useCallback((client: ClientRow) => {
    setContactCompany(client.name);
  }, []);

  const handleAddNewCompany = useCallback(async () => {
    if (!newCompanyName.trim()) return;
    setAddingCompany(true);
    try {
      const clientId = await createClientRecord({
        name: newCompanyName.trim(),
        email: newCompanyEmail.trim() || `${slugify(newCompanyName)}@placeholder.com`,
        notes: newCompanyNotes.trim() || null,
      });
      const newClient: ClientRow = {
        id: clientId,
        name: newCompanyName.trim(),
        company: null,
        email: newCompanyEmail.trim() || `${slugify(newCompanyName)}@placeholder.com`,
        notes: newCompanyNotes.trim() || null,
        logo_url: null,
        company_types: [],
        status: 'lead',
        pipeline_stage: 'new',
        website_url: newCompanyWebsite.trim() || null,
        linkedin_url: null,
        description: null,
        industry: newCompanyIndustry.trim() || null,
        location: newCompanyLocation.trim() || null,
        founded_year: null,
        company_size: null,
        twitter_url: null,
        instagram_url: null,
        created_at: new Date().toISOString(),
      };
      setClients((prev) => [...prev, newClient]);
      setContactCompany(newCompanyName.trim());
      setNewCompanyName('');
      setNewCompanyEmail('');
      setNewCompanyWebsite('');
      setNewCompanyIndustry('');
      setNewCompanyLocation('');
      setNewCompanyNotes('');
      setShowAddCompany(false);
    } finally {
      setAddingCompany(false);
    }
  }, [newCompanyName, newCompanyEmail, newCompanyWebsite, newCompanyIndustry, newCompanyLocation, newCompanyNotes]);

  // Proposal contacts state
  const [propContacts, setPropContacts] = useState(initialProposalContacts);
  const [contactSearch, setContactSearch] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newType, setNewType] = useState<ContactType>('contact');
  const [newNotes, setNewNotes] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newLinkedin, setNewLinkedin] = useState('');
  const [newInstagram, setNewInstagram] = useState('');
  const [newImdb, setNewImdb] = useState('');
  const [addingContact, setAddingContact] = useState(false);

  const propContactIds = new Set(propContacts.map((c) => c.id));

  const filteredContacts = contactSearch.trim()
    ? contacts.filter((c) =>
        !propContactIds.has(c.id) &&
        (contactFullName(c).toLowerCase().includes(contactSearch.toLowerCase()) ||
         (c.email ?? '').toLowerCase().includes(contactSearch.toLowerCase()))
      ).slice(0, 8)
    : [];

  const handleAddExisting = useCallback(async (contact: ContactRow) => {
    const pivotId = await addProposalContact(proposal.id, contact.id);
    setPropContacts((prev) => [...prev, { ...contact, pivot_id: pivotId }]);
    setContactSearch('');
  }, [proposal.id]);

  const handleRemoveContact = useCallback(async (contactId: string) => {
    await removeProposalContact(proposal.id, contactId);
    setPropContacts((prev) => prev.filter((c) => c.id !== contactId));
  }, [proposal.id]);

  const resetNewContactForm = useCallback(() => {
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setNewPhone('');
    setNewRole('');
    setNewCompany('');
    setNewType('contact');
    setNewNotes('');
    setNewWebsite('');
    setNewLinkedin('');
    setNewInstagram('');
    setNewImdb('');
  }, []);

  const handleAddNewContact = useCallback(async () => {
    if (!newFirstName.trim()) return;
    setAddingContact(true);
    try {
      const contactId = await createContact({
        first_name: newFirstName.trim(),
        last_name: newLastName.trim(),
        email: newEmail.trim() || null,
        type: newType,
      });
      const pivotId = await addProposalContact(proposal.id, contactId);
      const newContact: ContactRow & { pivot_id: string } = {
        id: contactId,
        first_name: newFirstName.trim(),
        last_name: newLastName.trim(),
        email: newEmail.trim() || null,
        phone: newPhone.trim() || null,
        role: newRole.trim() || null,
        company: newCompany.trim() || null,
        client_id: null,
        notes: newNotes.trim() || null,
        type: newType,
        headshot_url: null,
        website_url: newWebsite.trim() || null,
        linkedin_url: newLinkedin.trim() || null,
        instagram_url: newInstagram.trim() || null,
        imdb_url: newImdb.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pivot_id: pivotId,
      };
      setPropContacts((prev) => [...prev, newContact]);
      resetNewContactForm();
      setShowAddNew(false);
    } finally {
      setAddingContact(false);
    }
  }, [newFirstName, newLastName, newEmail, newPhone, newRole, newCompany, newType, newNotes, newWebsite, newLinkedin, newInstagram, newImdb, proposal.id, resetNewContactForm]);

  const handleSave = () => {
    startTransition(() => wrapSave(async () => {
      await updateProposal(proposal.id, {
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim() || null,
        contact_company: contactCompany.trim(),
        proposal_type: proposalType,
        title: title.trim(),
        subtitle: subtitle.trim(),
        slug: slug.trim(),
        proposal_password: password.trim(),
      });
      lastSavedRef.current = {
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactCompany: contactCompany.trim(),
        proposalType,
        title: title.trim(),
        subtitle: subtitle.trim(),
        slug: slug.trim(),
        password: password.trim(),
      };
      onProposalTypeChange?.(proposalType);
      onUpdated();
    }));
  };

  const s = lastSavedRef.current;
  const isDirty =
    contactName !== s.contactName ||
    contactEmail !== s.contactEmail ||
    contactCompany !== s.contactCompany ||
    proposalType !== s.proposalType ||
    title !== s.title ||
    subtitle !== s.subtitle ||
    slug !== s.slug ||
    password !== s.password;

  useImperativeHandle(ref, () => ({ save: handleSave, get isDirty() { return isDirty; } }));

  useEffect(() => {
    onSaveStateChange?.(isPending, saved);
  }, [isPending, saved]);

  return (
    <div className="px-8 py-8">
    <div className="space-y-10 max-w-3xl">

      {/* Proposal Details */}
      <section>
        <p className={sectionHeadingCls}>Proposal Details</p>
        <div className="space-y-4">
          {/* Company — full width at top, searchable like contacts */}
          <div>
            <label className={labelCls}>Company</label>
            <div className="relative">
              <input
                type="text"
                value={contactCompany}
                onChange={(e) => {
                  setContactCompany(e.target.value);
                }}
                placeholder="Search companies…"
                className={inputCls + (contactCompany ? ' pr-8' : '')}
              />
              {contactCompany && (
                <button
                  onClick={() => { setContactCompany(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4d4d4d] hover:text-[#999] transition-colors"
                  title="Clear company"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            {filteredClients.length > 0 && (
              <div className="relative">
                <div className="absolute z-50 top-0 left-0 right-0 mt-1 max-h-48 overflow-y-auto admin-scrollbar bg-[#111] border border-white/15 rounded-lg shadow-xl">
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCompany(c)}
                      className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                    >
                      <Building2 size={12} className="text-[#4d4d4d] flex-shrink-0" />
                      <span className="truncate">{c.name}</span>
                      {c.industry && <span className="text-xs text-[#404040] truncate">{c.industry}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add new company — right below the company field */}
            {showAddCompany ? (
              <div className="mt-2 p-4 bg-white/[0.03] border border-[#2a2a2a] rounded-lg space-y-3">
                <p className="text-xs text-[#666] font-medium">New Company</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Name</label>
                    <input
                      type="text"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="Acme Corp"
                      className={inputCls}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input
                      type="email"
                      value={newCompanyEmail}
                      onChange={(e) => setNewCompanyEmail(e.target.value)}
                      placeholder="hello@acme.com"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Website</label>
                    <input
                      type="text"
                      value={newCompanyWebsite}
                      onChange={(e) => setNewCompanyWebsite(e.target.value)}
                      placeholder="https://acme.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Industry</label>
                    <input
                      type="text"
                      value={newCompanyIndustry}
                      onChange={(e) => setNewCompanyIndustry(e.target.value)}
                      placeholder="Technology"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Location</label>
                    <input
                      type="text"
                      value={newCompanyLocation}
                      onChange={(e) => setNewCompanyLocation(e.target.value)}
                      placeholder="Austin, TX"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Notes</label>
                    <input
                      type="text"
                      value={newCompanyNotes}
                      onChange={(e) => setNewCompanyNotes(e.target.value)}
                      placeholder="Optional notes"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddNewCompany}
                    disabled={!newCompanyName.trim() || addingCompany}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-white hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingCompany ? 'Adding…' : 'Add Company'}
                  </button>
                  <button
                    onClick={() => { setShowAddCompany(false); setNewCompanyName(''); setNewCompanyEmail(''); setNewCompanyWebsite(''); setNewCompanyIndustry(''); setNewCompanyLocation(''); setNewCompanyNotes(''); }}
                    className="px-3 py-1.5 text-xs text-[#666] hover:text-[#b3b3b3] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddCompany(true)}
                className="mt-1.5 flex items-center gap-1.5 text-xs text-[#4d4d4d] hover:text-[#999] transition-colors"
              >
                <Plus size={12} />
                Add new company
              </button>
            )}
          </div>

          {/* Title + Type share a row */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-4">
            <div>
              <label className={labelCls}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Acme Corp Proposal"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value as ProposalType)}
                className={inputCls + ' appearance-none cursor-pointer'}
              >
                {PROPOSAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subtitle — full width */}
          <div>
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

      {/* Access */}
      <section>
        <p className={sectionHeadingCls}>Access</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <label className={labelCls}>https://fna.wtf/p/{slug || '…'}</label>
              {slug && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://fna.wtf/p/${slug}`);
                    setSlugCopied(true);
                    setTimeout(() => setSlugCopied(false), 1500);
                  }}
                  title="Copy URL"
                  className="text-[#4d4d4d] hover:text-[#b3b3b3] transition-colors"
                >
                  {slugCopied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              )}
            </div>
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
                className="flex-shrink-0 p-2 rounded-lg border border-white/10 bg-white/[0.04] text-[#666] hover:text-[#ccc] hover:border-white/20 transition-colors"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Password</label>
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
                className="flex-shrink-0 p-2 rounded-lg border border-white/10 bg-white/[0.04] text-[#666] hover:text-[#ccc] hover:border-white/20 transition-colors"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contacts (approved access list) */}
      <section>
        <p className={sectionHeadingCls}>Contacts</p>
        <p className="text-xs text-[#4d4d4d] -mt-2 mb-4">
          People with approved access to this proposal. Their emails are validated on login.
        </p>

        {/* Existing proposal contacts */}
        {propContacts.length > 0 && (
          <div className="space-y-2 mb-4">
            {propContacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.04] border border-[#2a2a2a] rounded-lg group"
              >
                <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 text-[#4d4d4d]">
                  <UserPlus size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{contactFullName(c)}</p>
                  {c.email && (
                    <p className="text-xs text-[#666] truncate flex items-center gap-1">
                      <Mail size={10} />
                      {c.email}
                    </p>
                  )}
                </div>
                {c.role && (
                  <span className="text-[10px] text-[#404040] bg-white/[0.04] px-2 py-0.5 rounded-full flex-shrink-0">{c.role}</span>
                )}
                <button
                  onClick={() => handleRemoveContact(c.id)}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-[#4d4d4d] hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                  title="Remove contact"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search existing contacts */}
        <div className="relative">
          <input
            type="text"
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Search contacts…"
            className={inputCls}
          />
          {filteredContacts.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto admin-scrollbar bg-[#111] border border-white/15 rounded-lg shadow-xl">
              {filteredContacts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleAddExisting(c)}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                >
                  <span className="truncate">{contactFullName(c)}</span>
                  {c.email && <span className="text-xs text-[#4d4d4d] truncate">{c.email}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add new contact inline — expanded with all fields */}
        {showAddNew ? (
          <div className="mt-3 p-4 bg-white/[0.03] border border-[#2a2a2a] rounded-lg space-y-3">
            <p className="text-xs text-[#666] font-medium">New Contact</p>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>First name</label>
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="Jane"
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className={labelCls}>Last name</label>
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="Smith"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Role + Company + Type */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Role</label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Creative Director"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Company</label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ContactType)}
                  className={inputCls + ' appearance-none cursor-pointer'}
                >
                  {CONTACT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* URLs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Website</label>
                <input
                  type="text"
                  value={newWebsite}
                  onChange={(e) => setNewWebsite(e.target.value)}
                  placeholder="https://…"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>LinkedIn</label>
                <input
                  type="text"
                  value={newLinkedin}
                  onChange={(e) => setNewLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/…"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Instagram</label>
                <input
                  type="text"
                  value={newInstagram}
                  onChange={(e) => setNewInstagram(e.target.value)}
                  placeholder="@handle"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>IMDb</label>
                <input
                  type="text"
                  value={newImdb}
                  onChange={(e) => setNewImdb(e.target.value)}
                  placeholder="imdb.com/name/…"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>Notes</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Optional notes"
                className={inputCls}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddNewContact}
                disabled={!newFirstName.trim() || addingContact}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-white hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {addingContact ? 'Adding…' : 'Add Contact'}
              </button>
              <button
                onClick={() => { setShowAddNew(false); resetNewContactForm(); }}
                className="px-3 py-1.5 text-xs text-[#666] hover:text-[#b3b3b3] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddNew(true)}
            className="mt-3 flex items-center gap-1.5 text-xs text-[#4d4d4d] hover:text-[#999] transition-colors"
          >
            <Plus size={12} />
            Add new contact
          </button>
        )}
      </section>

    </div>
    </div>
  );
});
