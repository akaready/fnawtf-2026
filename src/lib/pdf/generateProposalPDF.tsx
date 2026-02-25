import React from 'react';
import type { ProposalRow, ProposalSectionRow, ProposalQuoteRow } from '@/types/proposal';

export interface ProposalPDFData {
  proposal: ProposalRow;
  sections: ProposalSectionRow[];
  quotes: ProposalQuoteRow[];
  videos: { title: string; video_type: string }[];
  projects: { title: string; client_name: string }[];
}

export async function generateProposalPDF(data: ProposalPDFData): Promise<Blob> {
  const [ReactPDF, { ProposalDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/proposal/ProposalDocument'),
  ]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  ReactPDF.Font.register({
    family: 'SpaceGrotesk',
    fonts: [
      { src: `${origin}/fonts/SpaceGrotesk-Regular.ttf`, fontWeight: 400 },
      { src: `${origin}/fonts/SpaceGrotesk-Medium.ttf`, fontWeight: 500 },
      { src: `${origin}/fonts/SpaceGrotesk-Bold.ttf`, fontWeight: 700 },
    ],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(ProposalDocument, { data }) as any;
  const blob = await ReactPDF.pdf(element).toBlob();
  return blob;
}
