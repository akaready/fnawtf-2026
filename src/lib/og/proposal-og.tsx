import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const FNA_LOGO_PATH = (
  <svg width="120" height="136" viewBox="0 0 148 168" fill="none">
    <g transform="translate(9.5,0)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M125.928 77.76L125.518 77.71L78.0582 73.72L69.0882 72.97L62.3482 72.4L53.0582 59.99L74.3782 53.97L125.228 39.62C126.928 39.14 127.928 37.38 127.448 35.67L117.078 2.26C116.558 0.57 114.758 -0.38 113.068 0.14L16.6982 29.12C15.0182 29.62 14.0482 31.39 14.5382 33.08L20.7482 54.53L19.0682 64.56L17.4482 74.26L0.0682187 157.69C-0.291781 159.42 0.808219 161.11 2.53822 161.48L2.73822 161.52L46.6382 167.81C48.3882 168.06 50.0182 166.85 50.2682 165.1L58.9482 115.63L118.298 121.25C120.038 121.42 121.588 120.17 121.798 118.45L128.518 81.48C128.838 79.75 127.678 78.08 125.938 77.76H125.928ZM34.7382 77.42C34.5582 80.38 32.0182 82.64 29.0582 82.46C26.0982 82.28 23.8382 79.74 24.0182 76.78C24.1982 73.82 26.7382 71.56 29.6982 71.74C32.6582 71.92 34.9182 74.46 34.7382 77.42ZM37.1382 57.32C36.9582 60.28 34.4182 62.54 31.4582 62.36C28.4982 62.18 26.2382 59.64 26.4182 56.68C26.5982 53.72 29.1382 51.46 32.0982 51.64C35.0582 51.82 37.3182 54.36 37.1382 57.32ZM57.4982 79.23C57.3182 82.19 54.7782 84.45 51.8182 84.27C48.8582 84.09 46.5982 81.55 46.7782 78.59C46.9582 75.63 49.4982 73.37 52.4582 73.55C55.4182 73.73 57.6782 76.27 57.4982 79.23Z"
        fill="white"
      />
    </g>
  </svg>
);

async function loadSpaceGrotesk(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        },
      }
    ).then((r) => r.text());
    const match = css.match(/src:\s*url\((https:[^)]+)\)\s*format\(['"]?woff2['"]?\)/);
    if (!match) return null;
    const fontUrl = match[1];
    return await fetch(fontUrl).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

function pickTitleSize(text: string): number {
  const len = text.length;
  if (len <= 18) return 128;
  if (len <= 28) return 104;
  if (len <= 40) return 84;
  if (len <= 60) return 64;
  return 52;
}

interface ProposalOgRow {
  title: string;
  contact_company: string | null;
}

async function fetchProposalRow(slug: string, versionNumber?: number): Promise<ProposalOgRow | null> {
  const supabase = await createClient();
  let query = supabase.from('proposals').select('title, contact_company').eq('slug', slug);
  if (versionNumber !== undefined) {
    query = query.eq('version_number', versionNumber);
  } else {
    query = query.order('version_number', { ascending: false }).limit(1);
  }
  const { data } = await query.maybeSingle();
  return (data as ProposalOgRow | null) ?? null;
}

export async function generateProposalOg(slug: string, versionNumber?: number) {
  const [row, fontData] = await Promise.all([
    fetchProposalRow(slug, versionNumber),
    loadSpaceGrotesk(),
  ]);

  const title = row?.title?.trim() || 'Proposal';
  const company = row?.contact_company?.trim() || null;

  const headlineText = company ? `${company} × FNA` : `${title} × FNA`;
  const headlineSize = pickTitleSize(headlineText);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          backgroundColor: '#111111',
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.07) 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
          fontFamily: '"Space Grotesk", sans-serif',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            Proposal
          </div>
          <div style={{ display: 'flex' }}>{FNA_LOGO_PATH}</div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '28px',
            maxWidth: '1040px',
          }}
        >
          {company && (
            <div
              style={{
                display: 'flex',
                fontSize: 26,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              {title}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              fontSize: headlineSize,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          >
            {headlineText}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            fontSize: 22,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          <div style={{ display: 'flex' }}>FNA.wtf</div>
          <div style={{ display: 'flex' }}>Friends &apos;n Allies</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: 'Space Grotesk',
              data: fontData,
              style: 'normal',
              weight: 700,
            },
          ]
        : undefined,
    }
  );
}
