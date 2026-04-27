import { generateProposalOg, size, contentType } from '@/lib/og/proposal-og';

export { size, contentType };
export const runtime = 'nodejs';
export const alt = 'FNA.wtf proposal';

function parseVersion(seg: string): number | undefined {
  if (!/^v\d+$/i.test(seg)) return undefined;
  const n = parseInt(seg.slice(1), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default async function Image({ params }: { params: { slug: string; version: string } }) {
  const versionNumber = parseVersion(params.version);
  return generateProposalOg(params.slug, versionNumber);
}
