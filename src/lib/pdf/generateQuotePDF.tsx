import React from 'react';
import type { QuoteData, ContactInfo } from './types';

export async function generateQuotePDF(
  data: QuoteData,
  contact: ContactInfo,
): Promise<Blob> {
  const [ReactPDF, { QuoteDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/pricing/QuoteDocument'),
  ]);

  // Register fonts with absolute URL so react-pdf can fetch them client-side
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  ReactPDF.Font.register({
    family: 'SpaceGrotesk',
    fonts: [
      { src: `${origin}/fonts/SpaceGrotesk-Regular.ttf`, fontWeight: 400 },
      { src: `${origin}/fonts/SpaceGrotesk-Medium.ttf`, fontWeight: 500 },
      { src: `${origin}/fonts/SpaceGrotesk-Bold.ttf`, fontWeight: 700 },
    ],
  });

  // Cast to any: QuoteDocument renders a <Document> internally, which is what pdf() expects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(QuoteDocument, { data, contact }) as any;
  const blob = await ReactPDF.pdf(element).toBlob();
  return blob;
}
