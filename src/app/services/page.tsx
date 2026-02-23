import { getServicesProjects } from '@/lib/services/getServicesProjects';
import { FooterCTA } from '@/components/layout/FooterCTA';
import { ServicesLayout } from './layout-client';

import { getPageSeo } from '@/lib/seo';

export async function generateMetadata() {
  return getPageSeo('/services', {
    title: 'Services — FNA.WTF',
    description: 'What we do. Three phases, one direction: yours.',
  });
}

export default async function ServicesPage() {
  const projects = await getServicesProjects();
  return (
    <div className="min-h-screen">
      <ServicesLayout projects={projects} />
      <FooterCTA />
    </div>
  );
}
