'use client';

import { useState } from 'react';
import { X, Loader2, ExternalLink, Check, Save, MapPin, Users, Ruler, Star } from 'lucide-react';
import { createLocationRecord } from '@/app/admin/actions';
import type { LocationWithImages, PeerspaceData } from '@/types/locations';

interface ScrapedImage {
  url: string;
  alt_text: string | null;
  selected: boolean;
}

interface ScrapedData {
  name: string;
  description: string;
  address: string;
  peerspace_id: string | null;
  peerspace_url: string;
  peerspace_data: PeerspaceData;
  images: { url: string; alt_text: string | null }[];
}

interface Props {
  onClose: () => void;
  onImport: (loc: LocationWithImages) => void;
}

type Step = 'url' | 'scraping' | 'preview' | 'saving' | 'error';

export function PeerspaceImportModal({ onClose, onImport }: Props) {
  const [url, setUrl] = useState('');
  const [step, setStep] = useState<Step>('url');
  const [error, setError] = useState('');
  const [scraped, setScraped] = useState<ScrapedData | null>(null);
  const [images, setImages] = useState<ScrapedImage[]>([]);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saveProgress, setSaveProgress] = useState('');

  const handleScrape = async () => {
    if (!url.includes('peerspace.com')) {
      setError('Please enter a valid Peerspace URL.');
      return;
    }
    setStep('scraping');
    setError('');

    try {
      const res = await fetch('/api/admin/peerspace/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scrape', url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Scrape failed');
      if (!json.success) throw new Error(json.error || 'Scrape returned no data');

      const data = json.data as ScrapedData;
      setScraped(data);
      setEditName(data.name || '');
      setEditDescription(data.description || '');
      setImages(data.images.map(img => ({ ...img, selected: true })));
      setStep('preview');
    } catch (err) {
      setError((err as Error).message);
      setStep('error');
    }
  };

  const handleSave = async () => {
    if (!scraped) return;
    setStep('saving');

    try {
      // Create the location record
      setSaveProgress('Creating location…');
      const selectedImages = images.filter(i => i.selected);
      const id = await createLocationRecord({
        name: editName || scraped.name,
        description: editDescription || scraped.description || null,
        address: scraped.address || null,
        peerspace_url: scraped.peerspace_url,
        peerspace_id: scraped.peerspace_id,
        peerspace_data: scraped.peerspace_data,
        status: 'active',
        tags: [],
        featured_image: selectedImages[0]?.url ?? null,
      });

      // Save images to Supabase storage
      if (selectedImages.length > 0) {
        setSaveProgress(`Downloading ${selectedImages.length} images…`);
        const res = await fetch('/api/admin/peerspace/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save-images',
            locationId: id,
            images: selectedImages.map(i => ({ url: i.url, alt_text: i.alt_text })),
          }),
        });
        const json = await res.json();

        // Build the location object with saved image data
        const savedImages = (json.saved || []).map((s: { image_url: string; storage_path: string; alt_text: string | null; sort_order: number }, idx: number) => ({
          id: `temp-${idx}`,
          location_id: id,
          image_url: s.image_url,
          storage_path: s.storage_path,
          alt_text: s.alt_text,
          source: 'peerspace' as const,
          is_featured: idx === 0,
          sort_order: s.sort_order,
          created_at: new Date().toISOString(),
        }));

        const loc: LocationWithImages = {
          id,
          name: editName || scraped.name,
          description: editDescription || scraped.description || null,
          address: scraped.address || null,
          city: null,
          state: null,
          zip: null,
          google_maps_url: null,
          featured_image: savedImages[0]?.image_url ?? null,
          status: 'active',
          peerspace_url: scraped.peerspace_url,
          peerspace_id: scraped.peerspace_id,
          peerspace_data: scraped.peerspace_data,
          tags: [],
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          location_images: savedImages,
        };
        onImport(loc);
      } else {
        // No images selected
        const loc: LocationWithImages = {
          id,
          name: editName || scraped.name,
          description: editDescription || scraped.description || null,
          address: scraped.address || null,
          city: null,
          state: null,
          zip: null,
          google_maps_url: null,
          featured_image: null,
          status: 'active',
          peerspace_url: scraped.peerspace_url,
          peerspace_id: scraped.peerspace_id,
          peerspace_data: scraped.peerspace_data,
          tags: [],
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          location_images: [],
        };
        onImport(loc);
      }
    } catch (err) {
      setError((err as Error).message);
      setStep('error');
    }
  };

  const toggleImage = (idx: number) => {
    setImages(prev => prev.map((img, i) => i === idx ? { ...img, selected: !img.selected } : img));
  };

  const toggleAll = () => {
    const allSelected = images.every(i => i.selected);
    setImages(prev => prev.map(img => ({ ...img, selected: !allSelected })));
  };

  const selectedCount = images.filter(i => i.selected).length;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-admin-bg-sidebar border border-admin-border rounded-xl w-full max-w-2xl mx-4 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <ExternalLink size={16} className="text-admin-info" />
            <h2 className="text-lg font-semibold text-admin-text-primary">Import from Peerspace</h2>
          </div>
          <button onClick={onClose} className="text-admin-text-muted hover:text-admin-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto admin-scrollbar-auto overscroll-contain">
          {/* Step 1: URL input */}
          {(step === 'url' || step === 'error') && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-admin-text-muted">
                Paste a Peerspace listing URL to automatically import location data and images.
              </p>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.peerspace.com/pages/listings/…"
                className="admin-input w-full text-sm py-2.5 px-3"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleScrape()}
              />
              {error && (
                <p className="text-sm text-admin-danger">{error}</p>
              )}
            </div>
          )}

          {/* Step 2: Scraping */}
          {step === 'scraping' && (
            <div className="p-6 flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin text-admin-info" />
              <p className="text-sm text-admin-text-muted">Scraping Peerspace listing…</p>
              <p className="text-xs text-admin-text-faint">This may take 10-20 seconds.</p>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && scraped && (() => {
            const ps = scraped.peerspace_data;
            return (
            <div className="p-6 space-y-5">
              {/* Editable fields */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="admin-input w-full text-base font-semibold py-2 px-3"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Description</label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={3}
                  className="admin-input w-full text-sm resize-none py-2.5 px-3 leading-relaxed"
                />
              </div>

              {/* Location + quick stats row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-admin-text-muted">
                {scraped.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-admin-text-faint" />
                    {scraped.address}
                  </span>
                )}
                {ps.space_type && (
                  <span className="px-2 py-0.5 rounded-admin-sm bg-admin-bg-hover text-xs">{ps.space_type}</span>
                )}
              </div>

              {/* Stats pills */}
              <div className="flex flex-wrap gap-2">
                {ps.pricing && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-admin-sm bg-admin-bg-hover text-xs text-admin-text-primary">
                    ${ps.pricing.amount}/{ps.pricing.unit}
                    {ps.min_hours && <span className="text-admin-text-faint">· {ps.min_hours}hr min</span>}
                  </span>
                )}
                {ps.capacity && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-admin-sm bg-admin-bg-hover text-xs text-admin-text-primary">
                    <Users size={10} className="text-admin-text-faint" />
                    {ps.capacity} people
                  </span>
                )}
                {ps.sqft && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-admin-sm bg-admin-bg-hover text-xs text-admin-text-primary">
                    <Ruler size={10} className="text-admin-text-faint" />
                    {ps.sqft.toLocaleString()} sqft
                  </span>
                )}
                {ps.rating && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-admin-sm bg-admin-bg-hover text-xs text-admin-text-primary">
                    <Star size={10} className="text-admin-warning" fill="currentColor" />
                    {ps.rating.score} ({ps.rating.count} reviews)
                  </span>
                )}
              </div>

              {/* Host info */}
              {ps.host && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-admin-sm bg-admin-bg-hover">
                  {ps.host.avatar && (
                    <img src={ps.host.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  )}
                  <div className="text-xs">
                    <span className="text-admin-text-primary font-medium">{ps.host.name}</span>
                    {ps.host.response_time && (
                      <span className="text-admin-text-faint ml-1.5">· responds in {ps.host.response_time}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {ps.amenities && ps.amenities.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ps.amenities.map(a => (
                      <span key={a} className="px-2 py-0.5 rounded-admin-sm bg-admin-bg-hover text-xs text-admin-text-muted">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Venue details (if any scraped) */}
              {(ps.parking || ps.lighting || ps.sound || ps.electrical || ps.space_access || ps.host_rules) && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Venue Details</p>
                  <div className="space-y-1 text-xs">
                    {ps.parking && <div><span className="text-admin-text-faint">Parking:</span> <span className="text-admin-text-muted">{ps.parking}</span></div>}
                    {ps.lighting && <div><span className="text-admin-text-faint">Lighting:</span> <span className="text-admin-text-muted">{ps.lighting}</span></div>}
                    {ps.sound && <div><span className="text-admin-text-faint">Sound:</span> <span className="text-admin-text-muted">{ps.sound}</span></div>}
                    {ps.electrical && <div><span className="text-admin-text-faint">Electrical:</span> <span className="text-admin-text-muted">{ps.electrical}</span></div>}
                    {ps.space_access && <div><span className="text-admin-text-faint">Access:</span> <span className="text-admin-text-muted">{ps.space_access}</span></div>}
                    {ps.host_rules && <div><span className="text-admin-text-faint">Rules:</span> <span className="text-admin-text-muted">{ps.host_rules}</span></div>}
                  </div>
                </div>
              )}

              {/* Operating hours */}
              {ps.hours && Object.keys(ps.hours).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Hours</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                    {Object.entries(ps.hours).map(([day, time]) => (
                      <div key={day} className="flex justify-between">
                        <span className="text-admin-text-faint capitalize">{day}</span>
                        <span className="text-admin-text-muted">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Health & Safety */}
              {ps.health_safety && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Health & Safety</p>
                  <p className="text-xs text-admin-text-muted leading-relaxed">{ps.health_safety}</p>
                </div>
              )}

              {/* Cancellation */}
              {ps.cancellation_tier && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Cancellation</p>
                  <p className="text-xs text-admin-text-muted">
                    <span className="text-admin-text-primary font-medium">{ps.cancellation_tier}</span>
                    {ps.cancellation_policy && <span className="ml-1">— {ps.cancellation_policy}</span>}
                  </p>
                </div>
              )}

              {/* Reviews preview */}
              {ps.reviews && ps.reviews.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">
                    Reviews ({ps.reviews.length})
                  </p>
                  <div className="space-y-2">
                    {ps.reviews.slice(0, 3).map((r, idx) => (
                      <div key={idx} className="px-3 py-2 rounded-admin-sm bg-admin-bg-hover space-y-0.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-admin-text-primary">{r.reviewer_name}</span>
                          {r.reviewer_role && <span className="text-admin-text-faint">· {r.reviewer_role}</span>}
                          {r.date && <span className="text-admin-text-faint ml-auto">{r.date}</span>}
                        </div>
                        <p className="text-xs text-admin-text-muted leading-relaxed">{r.text}</p>
                      </div>
                    ))}
                    {ps.reviews.length > 3 && (
                      <p className="text-xs text-admin-text-faint text-center">+{ps.reviews.length - 3} more reviews</p>
                    )}
                  </div>
                </div>
              )}

              {/* Image selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">
                    Images ({selectedCount}/{images.length} selected)
                  </p>
                  <button onClick={toggleAll} className="text-xs text-admin-info hover:underline">
                    {images.every(i => i.selected) ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                {images.length === 0 ? (
                  <p className="text-sm text-admin-text-faint py-4 text-center">
                    No images found on this listing.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                      <button
                        key={`${img.url}-${idx}`}
                        onClick={() => toggleImage(idx)}
                        className={`relative aspect-square rounded-admin-sm overflow-hidden border-2 transition-colors ${
                          img.selected
                            ? 'border-admin-success'
                            : 'border-transparent opacity-50'
                        }`}
                      >
                        <img src={img.url} alt={img.alt_text ?? ''} loading="lazy" className="w-full h-full object-cover" />
                        {img.selected && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-admin-success text-white flex items-center justify-center">
                            <Check size={10} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            );
          })()}

          {/* Step 4: Saving */}
          {step === 'saving' && (
            <div className="p-6 flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin text-admin-success" />
              <p className="text-sm text-admin-text-muted">{saveProgress}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-6 py-4 border-t border-admin-border flex-shrink-0">
          {(step === 'url' || step === 'error') && (
            <button
              onClick={handleScrape}
              disabled={!url.includes('peerspace.com')}
              className="btn-primary px-5 py-2 text-sm disabled:opacity-40"
            >
              <ExternalLink size={13} />
              Import
            </button>
          )}
          {step === 'preview' && (
            <button onClick={handleSave} className="btn-primary px-5 py-2.5 text-sm">
              <Save size={13} />
              Save Location{selectedCount > 0 ? ` (with ${selectedCount} images)` : ''}
            </button>
          )}
          <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
