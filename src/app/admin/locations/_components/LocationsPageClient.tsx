'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  Plus, MapPin, LayoutGrid, Table2,
  Loader2, ExternalLink, Image as ImageIcon,
} from 'lucide-react';
import { AdminPageHeader } from '../../_components/AdminPageHeader';
import { ViewSwitcher, type ViewDef } from '../../_components/ViewSwitcher';
import { useViewMode } from '../../_hooks/useViewMode';
import { AdminDataTable, type ColDef } from '../../_components/table';
import {
  createLocationRecord,
  updateLocationRecord,
  batchDeleteLocations,
} from '../../actions';
import type { LocationWithImages } from '@/types/locations';
import { LocationCard } from './LocationCard';
import { LocationDetailPanel } from './LocationDetailPanel';
import { PeerspaceImportModal } from './PeerspaceImportModal';

type ViewMode = 'gallery' | 'table';

const VIEWS: ViewDef<ViewMode>[] = [
  { key: 'gallery', icon: LayoutGrid, label: 'Gallery view' },
  { key: 'table', icon: Table2, label: 'Table view' },
];

interface Props {
  initialLocations: LocationWithImages[];
  projects: { id: string; title: string }[];
}

export function LocationsPageClient({ initialLocations, projects }: Props) {
  const [locations, setLocations] = useState(initialLocations);
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useViewMode<ViewMode>('fna-locations-viewMode', 'gallery');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Column definitions for table view
  const columns: ColDef<LocationWithImages>[] = useMemo(() => [
    {
      key: 'thumbnail',
      label: '',
      defaultWidth: 60,
      sortable: false,
      render: (row) => (
        <div className="w-10 h-10 rounded-admin-sm overflow-hidden bg-admin-bg-hover flex items-center justify-center">
          {row.featured_image ? (
            <img src={row.featured_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <MapPin size={14} className="text-admin-text-faint" />
          )}
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      defaultWidth: 220,
      sortable: true,
      searchable: true,
      sortValue: (r) => r.name.toLowerCase(),
      onEdit: (id, val) => handleUpdate(id, 'name', val as string),
    },
    {
      key: 'address',
      label: 'Address',
      defaultWidth: 200,
      sortable: true,
      searchable: true,
      sortValue: (r) => r.address?.toLowerCase() ?? '',
      render: (r) => <span className="text-admin-text-muted text-sm">{r.address || '—'}</span>,
    },
    {
      key: 'city',
      label: 'City / State',
      defaultWidth: 150,
      sortable: true,
      sortValue: (r) => `${r.city ?? ''} ${r.state ?? ''}`.toLowerCase(),
      render: (r) => (
        <span className="text-admin-text-muted text-sm">
          {[r.city, r.state].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      defaultWidth: 110,
      sortable: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
      ],
      onEdit: (id, val) => handleUpdate(id, 'status', val as string),
    },
    {
      key: 'tags',
      label: 'Tags',
      type: 'tags' as const,
      defaultWidth: 180,
      onEdit: (id, val) => handleUpdate(id, 'tags', val),
    },
    {
      key: 'images',
      label: 'Images',
      defaultWidth: 80,
      sortable: true,
      sortValue: (r) => r.location_images.length,
      render: (r) => (
        <span className="text-admin-text-muted text-sm flex items-center gap-1.5">
          <ImageIcon size={12} />
          {r.location_images.length}
        </span>
      ),
    },
    {
      key: 'peerspace',
      label: 'Peerspace',
      defaultWidth: 80,
      render: (r) => r.peerspace_url ? (
        <a
          href={r.peerspace_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-admin-info hover:underline text-sm inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={12} /> Link
        </a>
      ) : <span className="text-admin-text-faint text-sm">—</span>,
    },
  ], []);

  // Gallery search filter
  const galleryData = useMemo(() => {
    if (!search) return locations;
    const q = search.toLowerCase();
    return locations.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.address?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [locations, search]);

  const activeLocation = locations.find(l => l.id === activeId) ?? null;

  // Handlers
  const handleUpdate = (id: string, field: string, value: unknown) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
    startTransition(async () => {
      await updateLocationRecord(id, { [field]: value });
    });
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const id = await createLocationRecord({ name: 'New Location', status: 'active', tags: [] });
      const newLoc: LocationWithImages = {
        id,
        name: 'New Location',
        description: null,
        address: null,
        city: null,
        state: null,
        zip: null,
        google_maps_url: null,
        featured_image: null,
        status: 'active',
        peerspace_url: null,
        peerspace_id: null,
        peerspace_data: {},
        tags: [],
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        location_images: [],
      };
      setLocations(prev => [...prev, newLoc]);
      setActiveId(id);
    } finally {
      setCreating(false);
    }
  };

  const handleImportComplete = (loc: LocationWithImages) => {
    setLocations(prev => [...prev, loc]);
    setShowImport(false);
    setActiveId(loc.id);
  };

  const handleBatchDelete = async (ids: string[]) => {
    setLocations(prev => prev.filter(l => !ids.includes(l.id)));
    await batchDeleteLocations(ids);
  };

  const handleLocationUpdate = (updated: LocationWithImages) => {
    setLocations(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const handleLocationDelete = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
    setActiveId(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Locations"
        subtitle={`${locations.length} location${locations.length !== 1 ? 's' : ''}`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search locations…"
        rightContent={
          <ViewSwitcher views={VIEWS} activeView={viewMode} onChange={setViewMode} />
        }
        actions={
          <>
            <button onClick={() => setShowImport(true)} className="btn-secondary px-4 py-2.5 text-sm inline-flex items-center gap-2">
              <ExternalLink size={14} />
              Import from Peerspace
            </button>
            <button onClick={handleCreate} disabled={creating} className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2">
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Location
            </button>
          </>
        }
        mobileActions={
          <>
            <button onClick={() => setShowImport(true)} className="btn-secondary p-2.5">
              <ExternalLink size={16} />
            </button>
            <button onClick={handleCreate} disabled={creating} className="btn-primary p-2.5">
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            </button>
          </>
        }
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto admin-scrollbar">
        {viewMode === 'table' ? (
          <AdminDataTable
            data={locations}
            columns={columns}
            storageKey="fna-locations-table"
            toolbar
            sortable
            filterable
            columnVisibility
            columnResize
            selectable
            onRowClick={(row) => setActiveId(row.id)}
            selectedId={activeId ?? undefined}
            onBatchDelete={handleBatchDelete}
            search={search}
            emptyMessage="No locations yet. Add one or import from Peerspace."
          />
        ) : (
          <div className="p-6">
            {galleryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-admin-text-faint">
                <MapPin size={40} strokeWidth={1} className="mb-3 opacity-40" />
                <p className="text-sm">No locations yet.</p>
                <p className="text-xs mt-1">Add one or import from Peerspace.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {galleryData.map(loc => (
                  <LocationCard
                    key={loc.id}
                    location={loc}
                    onClick={() => setActiveId(loc.id)}
                    isActive={activeId === loc.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      <LocationDetailPanel
        location={activeLocation}
        open={activeId !== null}
        onClose={() => setActiveId(null)}
        onUpdate={handleLocationUpdate}
        onDelete={handleLocationDelete}
        projects={projects}
      />

      {/* Peerspace import modal */}
      {showImport && (
        <PeerspaceImportModal
          onClose={() => setShowImport(false)}
          onImport={handleImportComplete}
        />
      )}
    </div>
  );
}
