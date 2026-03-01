'use client';

import { useState, useRef, useCallback } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import type { ScriptBeatReferenceRow } from '@/types/scripts';

interface Props {
  beatId: string;
  references: ScriptBeatReferenceRow[];
  onUpload: (files: FileList) => void;
  onDelete: (refId: string) => void;
}

export function ScriptReferenceCell({ beatId, references, onUpload, onDelete }: Props) {
  const [dragOver, setDragOver] = useState(false);
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
            {references.map(ref => (
              <div key={ref.id} className="relative group/img aspect-video rounded overflow-hidden">
                <img
                  src={ref.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onDelete(ref.id)}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded opacity-0 group-hover/img:opacity-100 transition-opacity text-admin-danger hover:text-red-300"
                  title="Remove"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>

          {/* Upload overlay on hover */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity cursor-pointer rounded ${
              dragOver
                ? 'bg-admin-success-bg border-2 border-dashed border-admin-success-border opacity-100'
                : 'opacity-0 group-hover/ref:opacity-100 bg-black/30'
            }`}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={16} className="text-admin-text-faint" />
          </div>
        </>
      ) : (
        /* Empty state — drop zone */
        <div
          className={`flex items-center justify-center min-h-[2.5rem] cursor-pointer transition-colors ${
            dragOver
              ? 'bg-admin-success-bg border-2 border-dashed border-admin-success-border'
              : 'hover:bg-admin-bg-hover'
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus size={14} className="text-admin-text-ghost" />
        </div>
      )}
    </div>
  );
}
