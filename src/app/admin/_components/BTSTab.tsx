'use client';

import { useState, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Upload, Loader2, ImageIcon } from 'lucide-react';
import { saveProjectBTSImages, uploadBTSImage } from '../actions';

interface BTSImage {
  image_url: string;
  caption: string | null;
  sort_order: number;
}

interface Props {
  projectId: string;
  initialImages: BTSImage[];
}

export type BTSTabHandle = {
  save: () => Promise<void>;
  isDirty: boolean;
};

const inputClass =
  'w-full px-3 py-2 bg-admin-bg-base border border-border rounded-lg text-sm text-admin-text-primary placeholder:text-admin-text-ghost focus:outline-none focus:border-admin-border-focus transition-colors';

export const BTSTab = forwardRef<BTSTabHandle, Props>(function BTSTab({ projectId, initialImages }, ref) {
  const [images, setImages] = useState<BTSImage[]>(initialImages);
  const [isDirty, setIsDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (index: number, key: keyof BTSImage, value: string | null) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, [key]: value } : img)));
    setIsDirty(true);
  };

  const remove = (index: number) => {
    setImages((prev) =>
      prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, sort_order: i }))
    );
    setIsDirty(true);
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next.map((img, i) => ({ ...img, sort_order: i })));
    setIsDirty(true);
  };

  const handleUploadFiles = useCallback(async (files: FileList | File[]) => {
    const jpegs = Array.from(files).filter((f) =>
      f.type === 'image/jpeg' || f.type === 'image/jpg' || f.type === 'image/png' || f.type === 'image/webp'
    );
    if (jpegs.length === 0) return;

    setUploading(true);
    setUploadCount(0);
    setUploadTotal(jpegs.length);

    const newImages: BTSImage[] = [];
    for (let i = 0; i < jpegs.length; i++) {
      try {
        const fd = new FormData();
        fd.append('file', jpegs[i]);
        const url = await uploadBTSImage(projectId, fd);
        newImages.push({ image_url: url, caption: null, sort_order: 0 });
        setUploadCount(i + 1);
      } catch (err) {
        console.error('Upload failed for', jpegs[i].name, err);
      }
    }

    if (newImages.length > 0) {
      setImages((prev) => {
        const merged = [...prev, ...newImages];
        return merged.map((img, i) => ({ ...img, sort_order: i }));
      });
      setIsDirty(true);
    }
    setUploading(false);
  }, [projectId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  }, [handleUploadFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  async function handleSave(): Promise<void> {
    await saveProjectBTSImages(projectId, images);
    setIsDirty(false);
  }

  useImperativeHandle(ref, () => ({ save: handleSave, isDirty }));

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 px-6 py-10 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
          dragOver
            ? 'border-admin-info bg-admin-info/5'
            : 'border-admin-border hover:border-admin-border-emphasis hover:bg-admin-bg-hover'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleUploadFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {uploading ? (
          <>
            <Loader2 size={24} className="text-admin-text-muted animate-spin" />
            <p className="text-sm text-admin-text-muted">
              Uploading {uploadCount}/{uploadTotal}…
            </p>
          </>
        ) : (
          <>
            <Upload size={24} className="text-admin-text-faint" />
            <p className="text-sm text-admin-text-muted">
              Drop images here or <span className="text-admin-text-primary underline">browse</span>
            </p>
            <p className="text-xs text-admin-text-faint">JPG, PNG, WebP — multiple files accepted</p>
          </>
        )}
      </div>

      {/* Image list */}
      {images.length === 0 ? (
        <p className="text-sm text-admin-text-faint py-2">No BTS images yet.</p>
      ) : (
        <div className="space-y-2">
          {images.map((img, i) => (
            <div
              key={`${img.image_url}-${i}`}
              className="group/bts flex gap-3 p-2.5 border border-admin-border-subtle rounded-lg bg-admin-bg-subtle hover:bg-admin-bg-hover transition-colors"
            >
              <div className="flex flex-col gap-0.5 pt-1 opacity-0 group-hover/bts:opacity-100 transition-opacity">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-admin-text-ghost hover:text-admin-text-muted disabled:opacity-20 transition-colors">
                  <ArrowUp size={12} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="text-admin-text-ghost hover:text-admin-text-muted disabled:opacity-20 transition-colors">
                  <ArrowDown size={12} />
                </button>
              </div>

              {img.image_url ? (
                <div className="w-20 h-14 rounded overflow-hidden border border-admin-border-subtle flex-shrink-0 bg-admin-bg-base">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-14 rounded border border-admin-border-subtle flex-shrink-0 bg-admin-bg-base flex items-center justify-center text-admin-text-ghost">
                  <ImageIcon size={16} />
                </div>
              )}

              <div className="flex-1 min-w-0 flex items-center">
                <input
                  type="text"
                  value={img.caption ?? ''}
                  onChange={(e) => update(i, 'caption', e.target.value || null)}
                  placeholder="Caption (optional)"
                  className={inputClass}
                />
              </div>

              <button
                type="button"
                onClick={() => remove(i)}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-muted opacity-0 group-hover/bts:opacity-100 hover:text-admin-danger hover:bg-red-500/8 transition-all mt-2"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Manual add (for pasting URLs) */}
      <button
        type="button"
        onClick={() => {
          setImages((prev) => [...prev, { image_url: '', caption: null, sort_order: prev.length }]);
          setIsDirty(true);
        }}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-white/[0.06] text-admin-text-muted hover:bg-admin-bg-hover-strong hover:text-admin-text-primary transition-colors"
      >
        <Plus size={14} /> Add via URL
      </button>
    </div>
  );
});
