export type PaymentTrigger = 'signing' | 'delivery' | 'campaign-launch' | 'post-raise';
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'void';
export type StageStatus = 'pending' | 'sent' | 'paid' | 'overdue';

export interface PaymentStage {
  id: string;
  label: string;
  trigger: PaymentTrigger;
  amount: number;
  percent?: number;
  dueDate?: string;
  status: StageStatus;
  paidAt?: string;
  stripePaymentLinkUrl?: string;
}

export interface InvoiceLineItem {
  name: string;
  price: number;
  category?: string;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  projectId?: string;
  proposalId?: string;
  clientName: string;
  clientCompany?: string;
  clientEmail: string;
  clientLogoUrl?: string;
  projectTitle: string;
  projectType?: string;
  issueDate: string;
  stages: PaymentStage[];
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discountLabel?: string;
  discountAmount?: number;
  total: number;
  notes?: string;
  status: InvoiceStatus;
  currentStageId: string;
  quickbooksId?: string;
  stripeCustomerId?: string;
}
