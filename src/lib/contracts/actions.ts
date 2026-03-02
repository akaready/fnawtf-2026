'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import type {
  ContractTemplateRow,
  ContractRow,
  ContractSignerRow,
  ContractEventRow,
  MergeFieldDef,
} from '@/types/contracts';
import { renderTemplate } from './mergeEngine';

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return { supabase, userId: user.id, userEmail: user.email };
}

// ── Contract Templates ────────────────────────────────────────────────────

export async function getContractTemplates(): Promise<ContractTemplateRow[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('contract_templates')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContractTemplateRow[];
}

export async function getContractTemplate(id: string): Promise<ContractTemplateRow> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as ContractTemplateRow;
}

export async function createContractTemplate(input: {
  name: string;
  contract_type: string;
  description?: string;
  body?: string;
  merge_fields?: MergeFieldDef[];
}): Promise<string> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('contract_templates')
    .insert({
      name: input.name,
      contract_type: input.contract_type,
      description: input.description || null,
      body: input.body || '',
      merge_fields: input.merge_fields || [],
    } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/contracts/templates');
  return (data as { id: string }).id;
}

export async function updateContractTemplate(id: string, updates: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('contract_templates')
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/contracts/templates');
}

export async function deleteContractTemplate(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('contract_templates').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/contracts/templates');
}

// ── Contracts ─────────────────────────────────────────────────────────────

const CONTRACT_SELECT = `
  *,
  client:clients(id, name, company, email, location),
  contact:contacts(id, first_name, last_name, email, role),
  proposal:proposals(id, title, proposal_type),
  quote:proposal_quotes(id, quote_type, total_amount, down_amount, label),
  template:contract_templates(id, name),
  signers:contract_signers(*)
`;

export async function getContracts(): Promise<ContractRow[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('contracts')
    .select(CONTRACT_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContractRow[];
}

export async function getContract(id: string): Promise<ContractRow> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('contracts')
    .select(CONTRACT_SELECT)
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as ContractRow;
}

export async function createContractFromTemplate(params: {
  templateId: string;
  title: string;
  clientId?: string;
  contactId?: string;
  proposalId?: string;
  quoteId?: string;
  manualFields?: Record<string, string>;
}): Promise<string> {
  const { supabase, userEmail } = await requireAuth();

  // Load template
  const { data: template, error: tErr } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('id', params.templateId)
    .single();
  if (tErr) throw new Error(tErr.message);
  const tmpl = template as ContractTemplateRow;

  // Load linked records for merge
  const mergeFieldDefs = tmpl.merge_fields as MergeFieldDef[];
  const context = await loadMergeContext(supabase, mergeFieldDefs, {
    clientId: params.clientId,
    contactId: params.contactId,
    proposalId: params.proposalId,
    quoteId: params.quoteId,
    manualFields: params.manualFields,
  });

  const renderedBody = renderTemplate(tmpl.body, context);

  const { data: row, error } = await supabase
    .from('contracts')
    .insert({
      template_id: params.templateId,
      title: params.title,
      contract_type: tmpl.contract_type,
      client_id: params.clientId || null,
      contact_id: params.contactId || null,
      proposal_id: params.proposalId || null,
      quote_id: params.quoteId || null,
      body: renderedBody,
      manual_fields: params.manualFields || {},
      status: 'draft',
    } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  const contractId = (row as { id: string }).id;

  // Log creation event
  await supabase.from('contract_events').insert({
    contract_id: contractId,
    event_type: 'created',
    actor_email: userEmail,
    metadata: { template_name: tmpl.name },
  } as never);

  revalidatePath('/admin/contracts');
  return contractId;
}

export async function createContractDraft(): Promise<string> {
  const { supabase, userEmail } = await requireAuth();
  const { data: row, error } = await supabase
    .from('contracts')
    .insert({
      title: 'Untitled Contract',
      contract_type: 'sow',
      status: 'draft',
      body: '',
      manual_fields: {},
    } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  const contractId = (row as { id: string }).id;

  await supabase.from('contract_events').insert({
    contract_id: contractId,
    event_type: 'created',
    actor_email: userEmail,
    metadata: { from_scratch: true },
  } as never);

  revalidatePath('/admin/contracts');
  return contractId;
}

export async function updateContract(id: string, updates: Record<string, unknown>) {
  const { supabase, userEmail } = await requireAuth();
  const { error } = await supabase
    .from('contracts')
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);

  await supabase.from('contract_events').insert({
    contract_id: id,
    event_type: 'edited',
    actor_email: userEmail,
    metadata: { fields: Object.keys(updates) },
  } as never);

  revalidatePath('/admin/contracts');
}

export async function deleteContract(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/contracts');
}

export async function batchDeleteContracts(ids: string[]) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('contracts').delete().in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/contracts');
}

export async function voidContract(id: string, reason?: string) {
  const { supabase, userEmail } = await requireAuth();
  const { error } = await supabase
    .from('contracts')
    .update({ status: 'voided', updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);

  await supabase.from('contract_events').insert({
    contract_id: id,
    event_type: 'voided',
    actor_email: userEmail,
    metadata: { reason: reason || null },
  } as never);

  revalidatePath('/admin/contracts');
}

export async function reRenderContractBody(contractId: string): Promise<string> {
  const { supabase, userEmail } = await requireAuth();

  // Load contract with template
  const { data: contract, error: cErr } = await supabase
    .from('contracts')
    .select('*, template:contract_templates(*)')
    .eq('id', contractId)
    .single();
  if (cErr) throw new Error(cErr.message);
  const c = contract as ContractRow & { template: ContractTemplateRow | null };
  if (!c.template) throw new Error('Contract has no template — cannot re-render');

  const mergeFieldDefs = c.template.merge_fields as MergeFieldDef[];
  const context = await loadMergeContext(supabase, mergeFieldDefs, {
    clientId: c.client_id ?? undefined,
    contactId: c.contact_id ?? undefined,
    proposalId: c.proposal_id ?? undefined,
    quoteId: c.quote_id ?? undefined,
    manualFields: c.manual_fields,
  });

  const renderedBody = renderTemplate(c.template.body, context);

  const { error } = await supabase
    .from('contracts')
    .update({ body: renderedBody, updated_at: new Date().toISOString() } as never)
    .eq('id', contractId);
  if (error) throw new Error(error.message);

  await supabase.from('contract_events').insert({
    contract_id: contractId,
    event_type: 'edited',
    actor_email: userEmail,
    metadata: { action: 're-rendered from template' },
  } as never);

  revalidatePath('/admin/contracts');
  return renderedBody;
}

// ── Signers ───────────────────────────────────────────────────────────────

export async function getContractSigners(contractId: string): Promise<ContractSignerRow[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('contract_signers')
    .select('*')
    .eq('contract_id', contractId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContractSignerRow[];
}

export async function addContractSigner(contractId: string, input: {
  name: string;
  email: string;
  role?: string;
  contactId?: string;
}): Promise<string> {
  const { supabase } = await requireAuth();

  // Get current max sort_order
  const { data: existing } = await supabase
    .from('contract_signers')
    .select('sort_order')
    .eq('contract_id', contractId)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = existing && existing.length > 0
    ? (existing[0] as { sort_order: number }).sort_order + 1
    : 0;

  const { data, error } = await supabase
    .from('contract_signers')
    .insert({
      contract_id: contractId,
      contact_id: input.contactId || null,
      name: input.name,
      email: input.email,
      role: input.role || 'signer',
      sort_order: nextOrder,
    } as never)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/contracts');
  return (data as { id: string }).id;
}

export async function updateContractSigner(id: string, updates: Record<string, unknown>) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from('contract_signers')
    .update(updates as never)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/contracts');
}

export async function removeContractSigner(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from('contract_signers').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/contracts');
}

export async function reorderContractSigners(_contractId: string, orderedIds: string[]) {
  const { supabase } = await requireAuth();
  const updates = orderedIds.map((id, i) =>
    supabase.from('contract_signers').update({ sort_order: i } as never).eq('id', id)
  );
  await Promise.all(updates);
  revalidatePath('/admin/contracts');
}

// ── Events ────────────────────────────────────────────────────────────────

export async function getContractEvents(contractId: string): Promise<ContractEventRow[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('contract_events')
    .select('*')
    .eq('contract_id', contractId)
    .order('occurred_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContractEventRow[];
}

// ── SignWell Integration ──────────────────────────────────────────────────

export async function sendContractForSigning(contractId: string) {
  const { supabase, userEmail } = await requireAuth();

  // Load contract + signers
  const { data: contract, error: cErr } = await supabase
    .from('contracts')
    .select('*, signers:contract_signers(*)')
    .eq('id', contractId)
    .single();
  if (cErr) throw new Error(cErr.message);
  const c = contract as ContractRow;
  if (!c.signers || c.signers.length === 0) throw new Error('No signers added');
  if (!c.body) throw new Error('Contract body is empty');

  // Import SignWell client dynamically to keep it server-only
  const { createSignWellDocument } = await import('./signwell');

  // Generate PDF
  const { generateContractPDF } = await import('./generateContractPDF');
  const pdfBlob = await generateContractPDF({
    title: c.title,
    contractType: c.contract_type,
    body: c.body,
    signers: c.signers.map((s) => ({ name: s.name, email: s.email })),
  });

  const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
  const pdfBase64 = pdfBuffer.toString('base64');

  const result = await createSignWellDocument({
    title: c.title,
    pdfBase64,
    signers: c.signers.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
    })),
  });

  // Update contract with SignWell data
  await supabase
    .from('contracts')
    .update({
      status: 'sent',
      signwell_document_id: result.documentId,
      signwell_status: 'sent',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', contractId);

  // Update signers with SignWell IDs
  for (const [signerId, swSignerId] of Object.entries(result.signerIds)) {
    await supabase
      .from('contract_signers')
      .update({ signwell_signer_id: swSignerId } as never)
      .eq('id', signerId);
  }

  await supabase.from('contract_events').insert({
    contract_id: contractId,
    event_type: 'sent',
    actor_email: userEmail,
    metadata: { signwell_document_id: result.documentId },
  } as never);

  revalidatePath('/admin/contracts');
}

// ── Merge Context Loader ──────────────────────────────────────────────────

async function loadMergeContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  mergeFieldDefs: MergeFieldDef[],
  linked: {
    clientId?: string;
    contactId?: string;
    proposalId?: string;
    quoteId?: string;
    manualFields?: Record<string, string>;
  }
) {
  const sources = new Set(mergeFieldDefs.map((f) => f.source));

  const [clientRes, contactRes, proposalRes, quoteRes] = await Promise.all([
    sources.has('client') && linked.clientId
      ? supabase.from('clients').select('*').eq('id', linked.clientId).single()
      : Promise.resolve({ data: null, error: null }),
    sources.has('contact') && linked.contactId
      ? supabase.from('contacts').select('*').eq('id', linked.contactId).single()
      : Promise.resolve({ data: null, error: null }),
    sources.has('proposal') && linked.proposalId
      ? supabase.from('proposals').select('*').eq('id', linked.proposalId).single()
      : Promise.resolve({ data: null, error: null }),
    sources.has('quote') && linked.quoteId
      ? supabase.from('proposal_quotes').select('*').eq('id', linked.quoteId).single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  return {
    client: clientRes.data as Record<string, unknown> | null,
    contact: contactRes.data as Record<string, unknown> | null,
    proposal: proposalRes.data as Record<string, unknown> | null,
    quote: quoteRes.data as Record<string, unknown> | null,
    manualFields: linked.manualFields || {},
    mergeFieldDefs,
  };
}

// ── Webhook Handler (used by API route) ───────────────────────────────────

export async function handleSignWellWebhook(event: {
  event_type: string;
  document_id: string;
  signer?: { id: string; email: string };
}) {
  const supabase = createServiceClient();

  // Find contract by SignWell document ID
  const { data: contract, error: cErr } = await supabase
    .from('contracts')
    .select('id, status')
    .eq('signwell_document_id', event.document_id)
    .single();
  if (cErr || !contract) return;

  const contractId = (contract as { id: string }).id;

  if (event.event_type === 'document_viewed' && event.signer) {
    await supabase
      .from('contract_signers')
      .update({ status: 'viewed', viewed_at: new Date().toISOString() } as never)
      .eq('contract_id', contractId)
      .eq('email', event.signer.email);

    // Update contract status to viewed if still in sent state
    const contractStatus = (contract as { status: string }).status;
    if (contractStatus === 'sent') {
      await supabase
        .from('contracts')
        .update({ status: 'viewed', updated_at: new Date().toISOString() } as never)
        .eq('id', contractId);
    }

    await supabase.from('contract_events').insert({
      contract_id: contractId,
      event_type: 'viewed',
      signer_email: event.signer.email,
    } as never);
  }

  if (event.event_type === 'document_signed' && event.signer) {
    await supabase
      .from('contract_signers')
      .update({ status: 'signed', signed_at: new Date().toISOString() } as never)
      .eq('contract_id', contractId)
      .eq('email', event.signer.email);

    await supabase.from('contract_events').insert({
      contract_id: contractId,
      event_type: 'signed',
      signer_email: event.signer.email,
    } as never);

    // Check if all signers have signed
    const { data: signers } = await supabase
      .from('contract_signers')
      .select('status')
      .eq('contract_id', contractId);
    const allSigned = signers?.every((s: { status: string }) => s.status === 'signed');

    if (allSigned) {
      await supabase
        .from('contracts')
        .update({
          status: 'signed',
          signwell_status: 'completed',
          signwell_signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', contractId);
    }
  }

  if (event.event_type === 'document_declined' && event.signer) {
    await supabase
      .from('contract_signers')
      .update({ status: 'declined' } as never)
      .eq('contract_id', contractId)
      .eq('email', event.signer.email);

    await supabase
      .from('contracts')
      .update({ status: 'declined', updated_at: new Date().toISOString() } as never)
      .eq('id', contractId);

    await supabase.from('contract_events').insert({
      contract_id: contractId,
      event_type: 'declined',
      signer_email: event.signer.email,
    } as never);
  }

  revalidatePath('/admin/contracts');
}
