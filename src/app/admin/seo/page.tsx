import { getSeoSettings } from '../actions';
import { SeoManager } from '../_components/SeoManager';

export default async function SeoPage() {
  const settings = await getSeoSettings();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-8 pt-10 pb-4 border-b border-white/[0.12]">
        <h1 className="text-2xl font-bold tracking-tight">SEO Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage meta titles, descriptions, and Open Graph data for each page.
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 pt-4 pb-8">
        <SeoManager initialSettings={settings} />
      </div>
    </div>
  );
}
