import type { Metadata } from 'next';
import { demoInvoice } from './demoData';
import { Demo1 } from './variants/Demo1';
import { Demo2 } from './variants/Demo2';
import { Demo3 } from './variants/Demo3';
import { Demo4 } from './variants/Demo4';
import { Demo5 } from './variants/Demo5';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Invoice ${demoInvoice.invoiceNumber} — ${demoInvoice.projectTitle} | FNA`,
    description: `${demoInvoice.clientCompany} · ${demoInvoice.projectType}`,
  };
}

export default async function InvoiceRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  switch (slug) {
    case 'demo1':
      return <Demo1 data={demoInvoice} />;
    case 'demo2':
      return <Demo2 data={demoInvoice} />;
    case 'demo3':
      return <Demo3 data={demoInvoice} />;
    case 'demo4':
      return <Demo4 data={demoInvoice} />;
    case 'demo5':
      return <Demo5 data={demoInvoice} />;
    default:
      return <Demo5 data={demoInvoice} />;
  }
}
