import type { Metadata } from 'next';
import { demoCallSheet } from './demoData';
import { Demo1 } from './variants/Demo1';
import { Demo2 } from './variants/Demo2';
import { Demo3 } from './variants/Demo3';
import { Demo4 } from './variants/Demo4';
import { Demo5 } from './variants/Demo5';
import { CallSheetPage } from './CallSheetPage';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Call Sheet — ${demoCallSheet.projectTitle} ${demoCallSheet.projectType} | FNA`,
    description: `Day ${demoCallSheet.shootDay} of ${demoCallSheet.totalDays} — General Crew Call ${demoCallSheet.callTime}`,
  };
}

export default async function CallSheetRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  switch (slug) {
    case 'demo1':
      return <Demo1 data={demoCallSheet} />;
    case 'demo2':
      return <Demo2 data={demoCallSheet} />;
    case 'demo3':
      return <Demo3 data={demoCallSheet} />;
    case 'demo4':
      return <Demo4 data={demoCallSheet} />;
    case 'demo5':
      return <Demo5 data={demoCallSheet} />;
    default:
      return <CallSheetPage data={demoCallSheet} />;
  }
}
