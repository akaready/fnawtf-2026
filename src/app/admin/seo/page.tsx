import { getSeoSettings } from '../actions';
import { SeoManager } from '../_components/SeoManager';

export default async function SeoPage() {
  const settings = await getSeoSettings();

  return (
    <div className="flex flex-col h-full">
      <SeoManager initialSettings={settings} />
    </div>
  );
}
