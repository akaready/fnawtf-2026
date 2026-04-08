import React from 'react';
import type { ScriptExportProps } from '@/components/scripts/ScriptExportDocument';
import type { ScriptStoryboardDocProps } from '@/components/scripts/ScriptStoryboardDocument';

async function fetchLogoDataUrl(): Promise<string> {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const res = await fetch(`${origin}/images/logo/fna-logo.svg`);
    const svg = await res.text();
    // Strip clip-path attributes and defs (react-pdf doesn't support clip-path refs)
    const cleaned = svg
      .replace(/\s*clip-path="url\([^)]+\)"/g, '')
      .replace(/<defs>[\s\S]*?<\/defs>/g, '');
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleaned)}`;
  } catch {
    return '';
  }
}

async function registerFonts(ReactPDF: typeof import('@react-pdf/renderer')) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  ReactPDF.Font.register({
    family: 'SpaceGrotesk',
    fonts: [
      { src: `${origin}/fonts/SpaceGrotesk-Regular.ttf`, fontWeight: 400 },
      { src: `${origin}/fonts/SpaceGrotesk-Medium.ttf`, fontWeight: 500 },
      { src: `${origin}/fonts/SpaceGrotesk-Bold.ttf`, fontWeight: 700 },
    ],
  });
}

export async function generateScriptPDF(props: ScriptExportProps): Promise<Blob> {
  const [ReactPDF, { ScriptExportDocument }, logoDataUrl] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/scripts/ScriptExportDocument'),
    fetchLogoDataUrl(),
  ]);

  registerFonts(ReactPDF);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(ScriptExportDocument, { ...props, logoDataUrl }) as any;
  return ReactPDF.pdf(element).toBlob();
}

export async function generateScriptStoryboardPDF(props: ScriptStoryboardDocProps): Promise<Blob> {
  const [ReactPDF, { ScriptStoryboardDocument }, logoDataUrl] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/scripts/ScriptStoryboardDocument'),
    fetchLogoDataUrl(),
  ]);

  registerFonts(ReactPDF);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(ScriptStoryboardDocument, { ...props, logoDataUrl }) as any;
  return ReactPDF.pdf(element).toBlob();
}
