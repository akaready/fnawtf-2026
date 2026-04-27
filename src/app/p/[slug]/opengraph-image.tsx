import { generateProposalOg, size, contentType } from '@/lib/og/proposal-og';

export { size, contentType };
export const runtime = 'nodejs';
export const alt = 'FNA.wtf proposal';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return generateProposalOg(slug);
}
