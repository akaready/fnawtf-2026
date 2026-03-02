'use client';

import { MapPin, Image as ImageIcon, ExternalLink } from 'lucide-react';
import type { LocationWithImages } from '@/types/locations';

interface Props {
  location: LocationWithImages;
  onClick: () => void;
  isActive: boolean;
}

export function LocationCard({ location, onClick, isActive }: Props) {
  const imageCount = location.location_images.length;

  return (
    <button
      onClick={onClick}
      className={`group/card text-left w-full rounded-admin-lg overflow-hidden border transition-all ${
        isActive
          ? 'border-admin-accent ring-1 ring-admin-accent'
          : 'border-admin-border hover:border-admin-border-hover'
      }`}
    >
      {/* Image */}
      <div className="aspect-[16/10] bg-admin-bg-hover relative overflow-hidden">
        {location.featured_image ? (
          <img
            src={location.featured_image}
            alt={location.name}
            className="w-full h-full object-cover group-hover/card:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin size={32} strokeWidth={1} className="text-admin-text-faint opacity-40" />
          </div>
        )}

        {/* Image count badge */}
        {imageCount > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-admin-sm bg-black/60 text-white text-xs backdrop-blur-sm">
            <ImageIcon size={10} />
            {imageCount}
          </div>
        )}

        {/* Peerspace indicator */}
        {location.peerspace_url && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-admin-sm bg-admin-info/20 text-admin-info text-xs backdrop-blur-sm">
            <ExternalLink size={10} />
            Peerspace
          </div>
        )}

        {/* Status badge */}
        {location.status === 'archived' && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-admin-sm bg-admin-bg-overlay text-admin-text-faint text-xs backdrop-blur-sm">
            Archived
          </div>
        )}
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-1.5">
        <h3 className="text-sm font-semibold text-admin-text-primary truncate">{location.name}</h3>
        {(location.address || location.city) && (
          <p className="text-xs text-admin-text-muted truncate">
            {location.address || [location.city, location.state].filter(Boolean).join(', ')}
          </p>
        )}
        {location.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {location.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded-admin-sm bg-admin-bg-hover text-[10px] text-admin-text-muted">
                {tag}
              </span>
            ))}
            {location.tags.length > 3 && (
              <span className="text-[10px] text-admin-text-faint">+{location.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
