import type { InvoiceData } from '@/types/invoice';

export const demoInvoice: InvoiceData = {
  id: 'demo',
  invoiceNumber: 'FNA-2026-014',
  projectId: 'proj-epson-limitless',
  clientName: 'Sarah Chen',
  clientCompany: 'Epson America, Inc.',
  clientEmail: 'sarah.chen@epson.com',
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
      label: 'Final Payment',
      trigger: 'delivery',
      amount: 17100,
      percent: 60,
      dueDate: '2026-04-15',
      status: 'sent',
      stripePaymentLinkUrl: '#pay',
    },
  ],

  notes:
    'Thank you for choosing Friends \'n Allies. All deliverables will be provided via secure download link upon receipt of final payment. Files are licensed for use per the terms of your signed production agreement.',
};
