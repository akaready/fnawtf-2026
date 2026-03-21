import type { InvoiceData } from '@/types/invoice';

export const demoInvoice: InvoiceData = {
  id: 'demo',
  invoiceNumber: 'FNA-2026-014',
  projectId: 'proj-epson-limitless',
  clientName: 'Sarah Chen',
  clientTitle: 'Sr. Brand Manager',
  clientCompany: 'Epson America, Inc.',
  clientEmail: 'sarah.chen@epson.com',
  clientPhone: '(310) 555-0142',
  clientLogoUrl: '/images/clients/epson.png',
  projectTitle: '"Limitless"',
  projectType: 'Brand Campaign',
  issueDate: '2026-03-08',
  status: 'sent',
  currentStageId: 'stage-2',

  lineItems: [
    // Production
    { name: 'Direction (3 days)',              price: 4800, category: 'Production' },
    { name: 'Producing (3 days)',              price: 3900, category: 'Production' },
    { name: 'Director of Photography (3 days)', price: 4200, category: 'Production' },
    { name: 'Camera Package (3 days)',         price: 2100, category: 'Production' },
    { name: 'Art Direction',                   price: 1500, category: 'Production' },
    // Post-Production
    { name: 'Edit & Post Production',          price: 6000, category: 'Post-Production' },
    { name: 'Color Grade',                     price: 3000, category: 'Post-Production' },
    { name: 'Sound Design & Mix',              price: 1800, category: 'Post-Production' },
    { name: 'Deliverables Package',            price: 1200, category: 'Post-Production' },
  ],

  subtotal: 28500,
  total: 28500,

  stages: [
    {
      id: 'stage-1',
      label: 'Deposit',
      trigger: 'signing',
      amount: 11400,
      percent: 40,
      status: 'paid',
      paidAt: '2026-02-01',
    },
    {
      id: 'stage-2',
      label: 'Delivery',
      trigger: 'delivery',
      amount: 17100,
      percent: 60,
      dueDate: '2026-04-15',
      status: 'sent',
      stripePaymentLinkUrl: '#pay',
    },
  ],

  notes:
    'Deliverables provided via secure download upon receipt of final payment. Licensed per your signed production agreement.',
};

/* ── Dev mode helpers ──────────────────────────────────────────────── */

export type DemoStage = 1 | 2;
export type DemoDiscount = 'none' | 'friendly' | 'loyalty';

const DISCOUNT_CFG: Record<DemoDiscount, { label?: string; percent: number }> = {
  none:     { percent: 0 },
  friendly: { label: 'Friendly discount (5%)', percent: 0.05 },
  loyalty:  { label: 'Loyalty discount (10%)', percent: 0.10 },
};

export function buildDemoData(stage: DemoStage, discount: DemoDiscount): InvoiceData {
  const base = { ...demoInvoice };
  const discountCfg = DISCOUNT_CFG[discount];
  const discountAmount = Math.round(base.subtotal * discountCfg.percent);
  const total = base.subtotal - discountAmount;

  const depositAmount = Math.round(total * 0.4);
  const finalAmount = total - depositAmount;

  if (stage === 1) {
    return {
      ...base,
      discountAmount: discountAmount || undefined,
      discountLabel: discountCfg.label,
      total,
      currentStageId: 'stage-1',
      status: 'sent',
      stages: [
        {
          id: 'stage-1',
          label: 'Deposit',
          trigger: 'signing',
          amount: depositAmount,
          percent: 40,
          dueDate: '2026-02-15',
          status: 'sent',
          stripePaymentLinkUrl: '#pay',
        },
        {
          id: 'stage-2',
          label: 'Delivery',
          trigger: 'delivery',
          amount: finalAmount,
          percent: 60,
          dueDate: '2026-04-15',
          status: 'pending',
        },
      ],
    };
  }

  // Stage 2 — deposit paid, final due
  return {
    ...base,
    discountAmount: discountAmount || undefined,
    discountLabel: discountCfg.label,
    total,
    currentStageId: 'stage-2',
    status: 'sent',
    stages: [
      {
        id: 'stage-1',
        label: 'Deposit',
        trigger: 'signing',
        amount: depositAmount,
        percent: 40,
        status: 'paid',
        paidAt: '2026-02-01',
      },
      {
        id: 'stage-2',
        label: 'Delivery',
        trigger: 'delivery',
        amount: finalAmount,
        percent: 60,
        dueDate: '2026-04-15',
        status: 'sent',
        stripePaymentLinkUrl: '#pay',
      },
    ],
  };
}
