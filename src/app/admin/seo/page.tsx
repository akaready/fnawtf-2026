import { getSeoSettings } from '../actions';
import { SeoManager } from '../_components/SeoManager';

export default async function SeoPage() {
  const settings = await getSeoSettings();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">SEO Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage meta titles, descriptions, and Open Graph data for each page.
        </p>
      </div>
      <SeoManager initialSettings={settings} />
    </div>
  );
}
