import React from 'react';
import type { ScriptExportProps } from '@/components/scripts/ScriptExportDocument';
import type { ScriptStoryboardDocProps } from '@/components/scripts/ScriptStoryboardDocument';

async function fetchLogoDataUrl(): Promise<string> {
  try {
    if (typeof document === 'undefined') return '';
    const origin = window.location.origin;
    const res = await fetch(`${origin}/images/logo/fna-logo.svg`);
    const svg = await res.text();

    // Convert SVG → PNG via canvas so react-pdf gets a format it handles reliably.
    // The SVG has white fills, so we render on a transparent canvas; the dark
    // PDF header band provides the contrast.
    const SCALE = 2;
    const W = 432, H = 168;
    const canvas = document.createElement('canvas');
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(SCALE, SCALE);

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => { ctx.drawImage(img, 0, 0, W, H); URL.revokeObjectURL(url); resolve(); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('svg load failed')); };
      img.src = url;
    });

    return canvas.toDataURL('image/png');
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
