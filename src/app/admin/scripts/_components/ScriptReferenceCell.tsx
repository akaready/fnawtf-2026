'use client';

import { useState, useRef, useCallback } from 'react';
import { ImagePlus, Trash2, Expand, Download, Check, X } from 'lucide-react';
import type { ScriptBeatReferenceRow } from '@/types/scripts';
import { ImageActionButton } from '@/app/admin/_components/ImageActionButton';
import { downloadSingleImage } from '@/lib/scripts/downloadStoryboards';
import { StoryboardLightbox } from './StoryboardLightbox';

interface Props {
  beatId: string;
  references: ScriptBeatReferenceRow[];
  onUpload: (files: FileList) => void;
  onDelete: (refId: string) => void;
}

export function ScriptReferenceCell({ beatId, references, onUpload, onDelete }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = '';
    }
  }, [onUpload]);

  const hasImages = references.length > 0;

  return (
    <div
      className="relative min-h-[2.5rem] border-b border-b-[#0e0e0e] group/ref"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      data-beat-ref={beatId}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {hasImages ? (
        <>
          {/* Image grid */}
          <div className={`grid ${references.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-0.5 p-1`}>
            {references.map((ref, i) => (
              <div key={ref.id} className="relative group/img aspect-video rounded overflow-hidden">
                <img
                  src={ref.image_url}
                  alt=""
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/30 rounded"
                  onMouseLeave={() => setConfirmDeleteId(null)}
                >
                  <ImageActionButton icon={Expand} color="info" title="View fullscreen" onClick={() => setLightboxIndex(i)} />
                  <ImageActionButton icon={Download} color="info" title="Download" onClick={() => void downloadSingleImage(ref.image_url, `reference-${i + 1}.jpg`)} />
                  {confirmDeleteId === ref.id ? (
                    <>
                      <ImageActionButton icon={Check} color="danger" title="Confirm delete" onClick={() => onDelete(ref.id)} />
                      <ImageActionButton icon={X} color="neutral" title="Cancel" onClick={() => setConfirmDeleteId(null)} />
                    </>
                  ) : (
                    <ImageActionButton icon={Trash2} color="danger" title="Delete" onClick={() => setConfirmDeleteId(ref.id)} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Drag-over indicator */}
          {dragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-admin-success-bg border-2 border-dashed border-admin-success-border rounded pointer-events-none">
              <ImagePlus size={16} className="text-admin-text-faint" />
            </div>
          )}
        </>
      ) : (
        /* Empty state — drop zone fills cell */
        <div
          className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-colors ${
            dragOver
              ? 'bg-admin-success-bg border-2 border-dashed border-admin-success-border'
              : 'hover:bg-admin-bg-hover'
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus size={14} className="text-admin-text-ghost" />
        </div>
      )}

      {lightboxIndex !== null && (
        <StoryboardLightbox
          frames={references.map((r, i) => ({
            imageUrl: r.image_url,
            label: `Reference ${i + 1} of ${references.length}`,
            filename: `reference-${i + 1}.jpg`,
          }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
