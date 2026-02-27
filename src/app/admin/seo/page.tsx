import { getSeoSettings } from '../actions';
import { SeoManager } from '../_components/SeoManager';
import { AdminPageHeader } from '../_components/AdminPageHeader';

export default async function SeoPage() {
  const settings = await getSeoSettings();

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="SEO Settings"
        subtitle="Manage meta titles, descriptions, and Open Graph data for each page."
      />
      <SeoManager initialSettings={settings} />
    </div>
  );
}
