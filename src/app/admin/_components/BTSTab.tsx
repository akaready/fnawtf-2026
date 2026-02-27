'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { saveProjectBTSImages } from '../actions';

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
  'w-full px-3 py-2 bg-black border border-border rounded-lg text-sm text-foreground placeholder:text-[#404044] focus:outline-none focus:border-white/30 transition-colors';

export const BTSTab = forwardRef<BTSTabHandle, Props>(function BTSTab({ projectId, initialImages }, ref) {
  const [images, setImages] = useState<BTSImage[]>(initialImages);
  const [isDirty, setIsDirty] = useState(false);

  const update = (index: number, key: keyof BTSImage, value: string | null) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, [key]: value } : img)));
    setIsDirty(true);
  };

  const add = () => {
    setImages((prev) => [...prev, { image_url: '', caption: null, sort_order: prev.length }]);
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

  async function handleSave(): Promise<void> {
    await saveProjectBTSImages(projectId, images);
    setIsDirty(false);
  }

  useImperativeHandle(ref, () => ({ save: handleSave, isDirty }));

  return (
    <div className="space-y-4">
      {images.length === 0 ? (
        <p className="text-sm text-[#515155] py-4">No BTS images yet.</p>
      ) : (
        <div className="space-y-3">
          {images.map((img, i) => (
            <div
              key={i}
              className="flex gap-3 p-3 border border-border/40 rounded-lg bg-white/[0.02]"
            >
              <div className="flex flex-col gap-0.5 pt-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-[#404044] hover:text-muted-foreground disabled:opacity-20 transition-colors">
                  <ArrowUp size={12} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="text-[#404044] hover:text-muted-foreground disabled:opacity-20 transition-colors">
                  <ArrowDown size={12} />
                </button>
              </div>

              {img.image_url && (
                <div className="w-16 h-12 rounded overflow-hidden border border-border/40 flex-shrink-0">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex-1 space-y-2">
                <input
                  type="url"
                  value={img.image_url}
                  onChange={(e) => update(i, 'image_url', e.target.value)}
                  placeholder="Image URL (https://…)"
                  className={inputClass}
                />
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
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-colors mt-0.5"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-white/[0.06] text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
      >
        <Plus size={14} /> Add Image
      </button>

    </div>
  );
});
