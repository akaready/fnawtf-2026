'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Trash2, Upload, Star, MapPin, ExternalLink, Camera, Save,
  Image as ImageIcon, Loader2, Link2, Unlink, Download, Expand, Check,
} from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { AdminLightbox } from '@/app/admin/_components/AdminLightbox';
import { ImageActionButton } from '@/app/admin/_components/ImageActionButton';
import { downloadSingleImage, downloadStoryboardZip } from '@/lib/scripts/downloadStoryboards';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { DiscardChangesDialog } from '@/app/admin/_components/DiscardChangesDialog';
import { AdminCombobox } from '@/app/admin/_components/AdminCombobox';
import {
  updateLocationRecord,
  deleteLocationRecord,
  uploadLocationImage,
  deleteLocationImage,
  setFeaturedImage,
  linkLocationToProject,
  unlinkLocationFromProject,
  getLocationProjects,
} from '@/app/admin/actions';
import type { LocationWithImages, LocationImageRow, PeerspaceData } from '@/types/locations';

type Tab = 'details' | 'images' | 'scout' | 'peerspace' | 'projects';

interface Props {
  location: LocationWithImages | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (loc: LocationWithImages) => void;
  onDelete: (id: string) => void;
  projects: { id: string; title: string }[];
}

export function LocationDetailPanel({ location, open, onClose, onUpdate, onDelete, projects }: Props) {
  const [tab, setTab] = useState<Tab>('details');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkedProjects, setLinkedProjects] = useState<{ id: string; title: string }[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [scoutDragOver, setScoutDragOver] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: { url: string; label?: string }[]; index: number } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scoutInputRef = useRef<HTMLInputElement>(null);

  // Local editable state
  const [local, setLocal] = useState<LocationWithImages | null>(null);

  // Ref for auto-save closure to read current state
  const stateRef = useRef<LocationWithImages | null>(null);
  useEffect(() => { stateRef.current = local; });

  const autoSave = useAutoSave(async () => {
    const current = stateRef.current;
    if (!current || !location) return;
    const changes: Record<string, unknown> = {};
    for (const key of ['name', 'description', 'address', 'city', 'state', 'zip', 'notes', 'peerspace_url'] as const) {
      if (current[key] !== location[key]) changes[key] = current[key];
    }
    if (Object.keys(changes).length > 0) {
      await updateLocationRecord(location.id, changes);
    }
    onUpdate(current);
  });

  // Sync local state when location prop changes
  useEffect(() => {
    setLocal(location ? { ...location } : null);
    setConfirmDelete(false);
    setConfirmClose(false);
    setTab('details');
    autoSave.reset();
  }, [location?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load linked projects when tab changes
  useEffect(() => {
    if (tab === 'projects' && location) {
      setLoadingProjects(true);
      getLocationProjects(location.id).then(p => {
        setLinkedProjects(p);
        setLoadingProjects(false);
      });
    }
  }, [tab, location?.id]);

  const updateField = useCallback((field: string, value: unknown) => {
    setLocal(prev => prev ? { ...prev, [field]: value } as LocationWithImages : prev);
    autoSave.trigger();
  }, [autoSave]);

  const handleSave = async () => {
    await autoSave.flush();
    onClose();
  };

  const handleClose = useCallback(() => {
    if (autoSave.hasPending) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  }, [autoSave.hasPending, onClose]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !local) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const img = await uploadLocationImage(local.id, fd);
      const updated = { ...local, location_images: [...local.location_images, img] };
      if (!local.featured_image) {
        updated.featured_image = img.image_url;
      }
      setLocal(updated);
      onUpdate(updated);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (img: LocationImageRow) => {
    if (!local) return;
    const updated = {
      ...local,
      location_images: local.location_images.filter(i => i.id !== img.id),
    };
    if (local.featured_image === img.image_url) {
      updated.featured_image = updated.location_images[0]?.image_url ?? null;
    }
    setLocal(updated);
    onUpdate(updated);
    await deleteLocationImage(img.id, img.storage_path ?? undefined);
  };

  const handleSetFeatured = async (img: LocationImageRow) => {
    if (!local) return;
    const updated = { ...local, featured_image: img.image_url };
    setLocal(updated);
    onUpdate(updated);
    await setFeaturedImage(local.id, img.id);
  };

  const handleLinkProject = async (projectId: string) => {
    if (!local) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    setLinkedProjects(prev => [...prev, project]);
    await linkLocationToProject(local.id, projectId);
  };

  const handleUnlinkProject = async (projectId: string) => {
    if (!local) return;
    setLinkedProjects(prev => prev.filter(p => p.id !== projectId));
    await unlinkLocationFromProject(local.id, projectId);
  };

  const handleScoutUpload = async (files: FileList | File[]) => {
    if (!files.length || !local) return;
    setUploading(true);
    try {
      let current = local;
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set('file', file);
        const img = await uploadLocationImage(current.id, fd);
        current = { ...current, location_images: [...current.location_images, img] };
        setLocal(current);
        onUpdate(current);
      }
    } finally {
      setUploading(false);
      if (scoutInputRef.current) scoutInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!local) return;
    setDeleting(true);
    await deleteLocationRecord(local.id);
    onDelete(local.id);
  };

  if (!local) return <PanelDrawer open={false} onClose={onClose}><div /></PanelDrawer>;

  const hasPeerspace = !!local.peerspace_url;
  const ps = local.peerspace_data as PeerspaceData;

  const scoutImages = local.location_images.filter(i => i.source === 'uploaded');
  const tabs: { key: Tab; label: string; show: boolean; count?: number }[] = [
    { key: 'details', label: 'Details', show: true },
    { key: 'peerspace', label: 'Peerspace', show: hasPeerspace },
    { key: 'images', label: 'Images', show: true, count: local.location_images.length },
    { key: 'scout', label: 'Scout', show: true, count: scoutImages.length },
    { key: 'projects', label: 'Projects', show: true },
  ];

  const googleMapsUrl = local.google_maps_url ||
    (local.address ? `https://www.google.com/maps/search/${encodeURIComponent([local.address, local.city, local.state, local.zip].filter(Boolean).join(', '))}` : null);

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[600px]">
      <div className="flex flex-col h-full relative">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-admin-border bg-admin-bg-sidebar">
          {local.featured_image ? (
            <img src={local.featured_image} alt="" className="w-10 h-10 rounded-admin-sm object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-admin-sm bg-admin-bg-hover flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-admin-text-faint" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-admin-text-primary truncate">{local.name}</h2>
          </div>
          <div className="flex items-center flex-shrink-0">
            <SaveDot status={autoSave.status} />
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-ghost hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex items-center gap-1 border-b border-admin-border px-6 py-2 flex-shrink-0 bg-admin-bg-wash">
          {tabs.filter(t => t.show).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                tab === t.key
                  ? 'bg-admin-bg-active text-admin-text-primary'
                  : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="text-xs text-admin-text-faint ml-0.5">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-6 py-5">
          {tab === 'details' && (
            <div className="space-y-5">
              <Field label="Name">
                <input
                  value={local.name}
                  onChange={e => updateField('name', e.target.value)}
                  className="admin-input w-full"
                  placeholder="Location name"
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={local.description ?? ''}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder="Description of the space…"
                  rows={4}
                  className="admin-input w-full resize-none leading-relaxed"
                />
              </Field>

              <Field label="Street Address">
                <div className="flex items-center gap-2">
                  <input
                    value={local.address ?? ''}
                    onChange={e => updateField('address', e.target.value)}
                    className="admin-input flex-1"
                    placeholder="123 Main St"
                  />
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-info w-[38px] h-[38px] !p-0 flex-shrink-0 justify-center"
                      title="View on Google Maps"
                    >
                      <MapPin size={14} />
                    </a>
                  )}
                </div>
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="City">
                  <input
                    value={local.city ?? ''}
                    onChange={e => updateField('city', e.target.value)}
                    className="admin-input w-full"
                    placeholder="City"
                  />
                </Field>
                <Field label="State">
                  <input
                    value={local.state ?? ''}
                    onChange={e => updateField('state', e.target.value)}
                    className="admin-input w-full"
                    placeholder="State"
                  />
                </Field>
                <Field label="ZIP">
                  <input
                    value={local.zip ?? ''}
                    onChange={e => updateField('zip', e.target.value)}
                    className="admin-input w-full"
                    placeholder="ZIP"
                  />
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  value={local.notes ?? ''}
                  onChange={e => updateField('notes', e.target.value)}
                  placeholder="Internal notes…"
                  rows={3}
                  className="admin-input w-full resize-none leading-relaxed"
                />
              </Field>

              <Field label="Peerspace URL">
                <input
                  value={local.peerspace_url ?? ''}
                  onChange={e => updateField('peerspace_url', e.target.value || null)}
                  className="admin-input w-full"
                  placeholder="https://www.peerspace.com/pages/listings/…"
                />
              </Field>

            </div>
          )}

          {tab === 'images' && (
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <p className="text-admin-xs font-semibold uppercase tracking-widest text-admin-text-faint">
                  {local.location_images.length} image{local.location_images.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  {local.location_images.length > 0 && (
                    <button
                      onClick={() => downloadStoryboardZip(
                        local.location_images.map((img, i) => ({ imageUrl: img.image_url, filename: `${local.name || 'location'}-image-${i + 1}.jpg` })),
                        `${local.name || 'location'}-images.zip`
                      )}
                      className="btn-secondary px-3 py-1.5 text-admin-sm inline-flex items-center gap-1.5"
                    >
                      <Download size={12} /> Download All
                    </button>
                  )}
                  <label className={`btn-secondary px-3 py-1.5 text-admin-sm inline-flex items-center gap-1.5 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    Upload
                    <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
                  </label>
                </div>
              </div>

              {local.location_images.length === 0 ? (
                <div className="text-center py-12 text-admin-text-faint">
                  <ImageIcon size={32} strokeWidth={1} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No images yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {local.location_images
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map(img => (
                    <div key={img.id} className="group/img relative aspect-square rounded-admin-sm overflow-hidden bg-admin-bg-hover" onMouseLeave={() => setConfirmDeleteId(null)}>
                      <img src={img.image_url} alt={img.alt_text ?? ''} loading="lazy" className="w-full h-full object-cover" />
                      {img.is_featured && (
                        <div className="absolute top-1 left-1 p-1 rounded-admin-sm bg-admin-warning/20 text-admin-warning">
                          <Star size={10} fill="currentColor" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover/img:opacity-100">
                        {!img.is_featured && (
                          <ImageActionButton icon={Star} color="warning" title="Set as featured" onClick={() => handleSetFeatured(img)} hidden={confirmDeleteId === img.id} />
                        )}
                        <ImageActionButton icon={Download} color="info" title="Download image" onClick={() => downloadSingleImage(img.image_url, `${local.name || 'location'}-${img.id}.jpg`)} hidden={confirmDeleteId === img.id} />
                        {confirmDeleteId === img.id ? (
                          <ImageActionButton icon={Check} color="danger" title="Confirm delete" onClick={() => { handleDeleteImage(img); setConfirmDeleteId(null); }} />
                        ) : (
                          <ImageActionButton icon={Expand} color="neutral" title="View fullscreen" onClick={() => {
                            const sorted = [...local.location_images].sort((a, b) => a.sort_order - b.sort_order);
                            setLightbox({
                              images: sorted.map(i => ({ url: i.image_url, label: i.alt_text ?? undefined })),
                              index: sorted.findIndex(i => i.id === img.id),
                            });
                          }} />
                        )}
                        {confirmDeleteId === img.id ? (
                          <ImageActionButton icon={X} color="neutral" title="Cancel" onClick={() => setConfirmDeleteId(null)} />
                        ) : (
                          <ImageActionButton icon={Trash2} color="danger" title="Delete image" onClick={() => setConfirmDeleteId(img.id)} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'peerspace' && hasPeerspace && (
            <div className="space-y-5">
              {/* Top stats — compact 4-col grid */}
              <div className="grid grid-cols-4 gap-3">
                {ps.space_type && <InfoRow label="Space Type">{ps.space_type}</InfoRow>}
                {ps.pricing && (
                  <InfoRow label="Pricing">
                    ${ps.pricing.amount}/{ps.pricing.unit}
                    {ps.pricing.minimum && <span className="text-admin-text-faint ml-1">({ps.pricing.minimum} min)</span>}
                  </InfoRow>
                )}
                {ps.capacity && <InfoRow label="Capacity">{ps.capacity}</InfoRow>}
                {ps.sqft && <InfoRow label="Size">{ps.sqft.toLocaleString()} sqft</InfoRow>}
              </div>

              {ps.host && (
                <InfoRow label="Host">
                  <span className="flex items-center gap-2">
                    {ps.host.avatar && (
                      <img src={ps.host.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    )}
                    {ps.host.profile_url ? (
                      <a href={ps.host.profile_url} target="_blank" rel="noopener noreferrer" className="text-admin-info hover:underline">
                        {ps.host.name}
                      </a>
                    ) : ps.host.name}
                    {ps.host.response_time && <span className="text-admin-text-faint">· responds in {ps.host.response_time}</span>}
                  </span>
                </InfoRow>
              )}
              {ps.amenities && ps.amenities.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-admin-xs font-semibold uppercase tracking-widest text-admin-text-faint">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ps.amenities.map(a => (
                      <span key={a} className="px-3 py-1 rounded-admin-md bg-admin-bg-hover text-sm text-admin-text-muted">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {ps.parking && <InfoRow label="Parking">{ps.parking}</InfoRow>}
              {ps.lighting && <InfoRow label="Lighting">{ps.lighting}</InfoRow>}
              {ps.sound && <InfoRow label="Sound">{ps.sound}</InfoRow>}
              {ps.electrical && <InfoRow label="Electrical">{ps.electrical}</InfoRow>}
              {ps.space_access && <InfoRow label="Space Access">{ps.space_access}</InfoRow>}
              {ps.host_rules && <InfoRow label="Host Rules">{ps.host_rules}</InfoRow>}
              {ps.hours && Object.keys(ps.hours).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-admin-xs font-semibold uppercase tracking-widest text-admin-text-faint">Hours</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                    <div className="space-y-0.5">
                      {Object.entries(ps.hours).filter(([day]) => ['monday','tuesday','wednesday','thursday','friday'].includes(day.toLowerCase())).map(([day, time]) => (
                        <div key={day} className="flex items-center gap-2 text-xs">
                          <span className="text-admin-text-muted capitalize w-12">{day.slice(0, 3)}</span>
                          <span className="text-admin-text-primary">{time}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-0.5">
                      {Object.entries(ps.hours).filter(([day]) => ['saturday','sunday'].includes(day.toLowerCase())).map(([day, time]) => (
                        <div key={day} className="flex items-center gap-2 text-xs">
                          <span className="text-admin-text-muted capitalize w-12">{day.slice(0, 3)}</span>
                          <span className="text-admin-text-primary">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {ps.health_safety && <InfoRow label="Health & Safety">{ps.health_safety}</InfoRow>}
              {ps.cancellation_tier && (
                <InfoRow label="Cancellation">
                  <span className="font-medium">{ps.cancellation_tier}</span>
                  {ps.cancellation_policy && (
                    <span className="text-admin-text-faint ml-1">— {ps.cancellation_policy}</span>
                  )}
                </InfoRow>
              )}
              {ps.reviews && ps.reviews.length > 0 && (
                <div className="space-y-2">
                  <p className="text-admin-xs font-semibold uppercase tracking-widest text-admin-text-faint">Reviews</p>
                  {ps.rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} size={14}
                            className={i < Math.round(ps.rating!.score) ? 'text-amber-400 fill-amber-400' : 'text-admin-text-faint'}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-admin-text-primary">{ps.rating.score}</span>
                      <span className="text-xs text-admin-text-faint">({ps.rating.count} review{ps.rating.count !== 1 ? 's' : ''})</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    {ps.reviews.map((r, idx) => (
                      <div key={idx} className="px-3 py-2.5 rounded-admin-sm bg-admin-bg-hover space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          {r.date && <span className="text-admin-text-faint">{r.date}</span>}
                          {r.booking_type && <span className="text-admin-text-faint">· {r.booking_type}</span>}
                          {r.guest_count && <span className="text-admin-text-faint">· {r.guest_count} people</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-admin-text-primary">{r.reviewer_name}</span>
                          {r.reviewer_role && <span className="text-admin-text-faint">· {r.reviewer_role}</span>}
                        </div>
                        <p className="text-sm text-admin-text-muted leading-relaxed">{r.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {ps.scraped_at && (
                <p className="text-admin-xs text-admin-text-faint">
                  Scraped {new Date(ps.scraped_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {tab === 'scout' && (
            <div className="space-y-5">
              {/* Dropzone */}
              <div
                onDrop={e => { e.preventDefault(); setScoutDragOver(false); if (e.dataTransfer.files.length) handleScoutUpload(e.dataTransfer.files); }}
                onDragOver={e => { e.preventDefault(); setScoutDragOver(true); }}
                onDragLeave={() => setScoutDragOver(false)}
                onClick={() => !uploading && scoutInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2 px-6 py-10 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                  scoutDragOver
                    ? 'border-admin-info bg-admin-info/5'
                    : 'border-admin-border hover:border-admin-border-emphasis hover:bg-admin-bg-hover'
                }`}
              >
                <input
                  ref={scoutInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={e => { if (e.target.files?.length) handleScoutUpload(e.target.files); e.target.value = ''; }}
                />
                {uploading ? (
                  <>
                    <Loader2 size={24} className="text-admin-text-muted animate-spin" />
                    <p className="text-sm text-admin-text-muted">Uploading…</p>
                  </>
                ) : (
                  <>
                    <Camera size={24} className="text-admin-text-faint" />
                    <p className="text-sm text-admin-text-muted">
                      Drop scout photos here or click to browse
                    </p>
                    <p className="text-xs text-admin-text-faint">JPG, PNG, WebP — multiple files accepted</p>
                  </>
                )}
              </div>

              {/* Photo grid */}
              {scoutImages.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-admin-xs font-semibold uppercase tracking-widest text-admin-text-faint">
                      {scoutImages.length} scout photo{scoutImages.length !== 1 ? 's' : ''}
                    </p>
                    <button
                      onClick={() => downloadStoryboardZip(
                        scoutImages.map((img, i) => ({ imageUrl: img.image_url, filename: `${local.name || 'location'}-scout-${i + 1}.jpg` })),
                        `${local.name || 'location'}-scout-photos.zip`
                      )}
                      className="btn-secondary px-3 py-1.5 text-admin-sm inline-flex items-center gap-1.5"
                    >
                      <Download size={12} /> Download All
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {scoutImages
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map(img => (
                      <div key={img.id} className="group/img relative aspect-square rounded-admin-sm overflow-hidden bg-admin-bg-hover" onMouseLeave={() => setConfirmDeleteId(null)}>
                        <img src={img.image_url} alt={img.alt_text ?? ''} loading="lazy" className="w-full h-full object-cover" />
                        {img.is_featured && (
                          <div className="absolute top-1 left-1 p-1 rounded-admin-sm bg-admin-warning/20 text-admin-warning">
                            <Star size={10} fill="currentColor" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover/img:opacity-100">
                          {!img.is_featured && (
                            <ImageActionButton icon={Star} color="warning" title="Set as featured" onClick={() => handleSetFeatured(img)} hidden={confirmDeleteId === img.id} />
                          )}
                          <ImageActionButton icon={Download} color="info" title="Download image" onClick={() => downloadSingleImage(img.image_url, `${local.name || 'location'}-scout-${img.id}.jpg`)} hidden={confirmDeleteId === img.id} />
                          {confirmDeleteId === img.id ? (
                            <ImageActionButton icon={Check} color="danger" title="Confirm delete" onClick={() => { handleDeleteImage(img); setConfirmDeleteId(null); }} />
                          ) : (
                            <ImageActionButton icon={Expand} color="neutral" title="View fullscreen" onClick={() => {
                              const sorted = [...scoutImages].sort((a, b) => a.sort_order - b.sort_order);
                              setLightbox({
                                images: sorted.map(i => ({ url: i.image_url, label: i.alt_text ?? undefined })),
                                index: sorted.findIndex(i => i.id === img.id),
                              });
                            }} />
                          )}
                          {confirmDeleteId === img.id ? (
                            <ImageActionButton icon={X} color="neutral" title="Cancel" onClick={() => setConfirmDeleteId(null)} />
                          ) : (
                            <ImageActionButton icon={Trash2} color="danger" title="Delete image" onClick={() => setConfirmDeleteId(img.id)} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'projects' && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <p className="text-admin-xs font-semibold uppercase tracking-widest text-admin-text-faint">Linked Projects</p>
                {loadingProjects ? (
                  <div className="flex items-center gap-2 py-4 text-admin-text-faint text-sm">
                    <Loader2 size={14} className="animate-spin" /> Loading…
                  </div>
                ) : linkedProjects.length === 0 ? (
                  <p className="text-sm text-admin-text-faint py-4">No projects linked yet.</p>
                ) : (
                  <div className="space-y-1">
                    {linkedProjects.map(p => (
                      <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-admin-sm bg-admin-bg-hover group/proj">
                        <Link2 size={12} className="text-admin-text-faint" />
                        <span className="text-sm text-admin-text-primary flex-1">{p.title}</span>
                        <button
                          onClick={() => handleUnlinkProject(p.id)}
                          className="opacity-0 group-hover/proj:opacity-100 transition-opacity text-admin-text-faint hover:text-admin-danger"
                          title="Unlink project"
                        >
                          <Unlink size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-admin-xs font-semibold uppercase tracking-widest text-admin-text-faint">Add Project</p>
                <AdminCombobox
                  value={null}
                  options={projects
                    .filter(p => !linkedProjects.some(lp => lp.id === p.id))
                    .map(p => ({ id: p.id, label: p.title }))
                  }
                  onChange={(v) => { if (v) handleLinkProject(v); }}
                  placeholder="Select a project…"
                  nullable={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border flex-shrink-0 bg-admin-bg-wash">
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm">
              <Save size={14} />
              Save
            </button>
            {local.peerspace_url && (
              <a
                href={local.peerspace_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-info px-4 py-2.5 text-sm"
              >
                <ExternalLink size={12} /> Peerspace
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-xs text-admin-danger mr-1">Delete?</span>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-admin-border text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 text-xs rounded-lg bg-admin-danger text-white hover:bg-red-700 transition-colors"
                >
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : 'Delete'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-danger/60 hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
                title="Delete location"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Discard changes overlay */}
        <DiscardChangesDialog
          open={confirmClose}
          onKeepEditing={() => setConfirmClose(false)}
          onDiscard={() => {
            setConfirmClose(false);
            autoSave.reset();
            onClose();
          }}
        />

        {lightbox && (
          <AdminLightbox
            images={lightbox.images}
            startIndex={lightbox.index}
            onClose={() => setLightbox(null)}
          />
        )}
      </div>
    </PanelDrawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-admin-xs font-semibold uppercase tracking-widest text-admin-text-faint">{label}</p>
      {children}
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-admin-xs font-semibold uppercase tracking-widest text-admin-text-faint">{label}</p>
      <div className="text-sm text-admin-text-primary">{children}</div>
    </div>
  );
}
