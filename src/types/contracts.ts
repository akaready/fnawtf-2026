export type ContractType = 'sow' | 'msa' | 'nda' | 'amendment' | 'custom';

export type ContractStatus =
  | 'draft'
  | 'pending_review'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'declined'
  | 'expired'
  | 'voided';

export type SignerRole = 'signer' | 'approver' | 'cc';
export type SignerStatus = 'pending' | 'viewed' | 'signed' | 'declined';

export type MergeFieldSource = 'client' | 'contact' | 'proposal' | 'quote' | 'manual';

export interface MergeFieldDef {
  key: string;
  label: string;
  source: MergeFieldSource;
  db_path: string | null;
}

export interface ContractTemplateRow {
  id: string;
  name: string;
  description: string | null;
  contract_type: ContractType;
  body: string;
  merge_fields: MergeFieldDef[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContractRow {
  id: string;
  contract_number: number;
  template_id: string | null;
  title: string;
  contract_type: ContractType;
  status: ContractStatus;
  client_id: string | null;
  contact_id: string | null;
  proposal_id: string | null;
  quote_id: string | null;
  body: string;
  manual_fields: Record<string, string>;
  signwell_document_id: string | null;
  signwell_status: string | null;
  signwell_signed_at: string | null;
  signwell_expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  client?: { id: string; name: string; company: string | null; email: string | null; location: string | null } | null;
  contact?: { id: string; first_name: string; last_name: string; email: string | null; role: string | null } | null;
  proposal?: { id: string; title: string; proposal_type: string } | null;
  quote?: { id: string; quote_type: string; total_amount: number | null; down_amount: number | null; label: string } | null;
  template?: { id: string; name: string } | null;
  signers?: ContractSignerRow[];
  events?: ContractEventRow[];
}

export interface ContractSignerRow {
  id: string;
  contract_id: string;
  contact_id: string | null;
  name: string;
  email: string;
  role: SignerRole;
  sort_order: number;
  signwell_signer_id: string | null;
  status: SignerStatus;
  signed_at: string | null;
  viewed_at: string | null;
  created_at: string;
}

export interface ContractEventRow {
  id: string;
  contract_id: string;
  event_type: string;
  actor_email: string | null;
  signer_email: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
}
