import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';

type SeoRow = {
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  no_index: boolean;
};

/**
 * Build Next.js Metadata from the seo_settings table.
 * Falls back to provided defaults if the DB row is missing or fields are null.
 */
export async function getPageSeo(
  pageSlug: string,
  defaults: { title: string; description: string }
): Promise<Metadata> {
  const supabase = await createClient();

  const [{ data: pageRow }, { data: globalRow }] = await Promise.all([
    supabase.from('seo_settings').select('*').eq('page_slug', pageSlug).single(),
    supabase.from('seo_settings').select('*').eq('page_slug', '_global').single(),
  ]);

  const page = pageRow as SeoRow | null;
  const global = globalRow as SeoRow | null;

  const title = page?.meta_title || defaults.title;
  const description = page?.meta_description || defaults.description;
  const ogTitle = page?.og_title || page?.meta_title || defaults.title;
  const ogDescription = page?.og_description || page?.meta_description || defaults.description;
  const ogImage = page?.og_image_url || global?.og_image_url || undefined;

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };

  if (page?.canonical_url) {
    metadata.alternates = { canonical: page.canonical_url };
  }

  if (page?.no_index) {
    metadata.robots = { index: false, follow: false };
  }

  return metadata;
}
