'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Check, X, Loader2, ImagePlus, Package, Pencil, RefreshCw, Sparkles } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { PanelFooter } from '@/app/admin/_components/PanelFooter';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import { ColorPicker, PRESET_COLORS } from './ColorPicker';
import {
  createProduct, updateProduct, deleteProduct,
  uploadProductReference, deleteProductReference,
} from '@/app/admin/actions';
import type { ScriptProductRow, ProductReferenceRow } from '@/types/scripts';

interface Props {
  open: boolean;
  onClose: () => void;
  scriptGroupId: string;
  products: ScriptProductRow[];
  onProductsChange: (products: ScriptProductRow[]) => void;
  productReferenceMap: Record<string, ProductReferenceRow[]>;
  onProductReferenceMapChange: (map: Record<string, ProductReferenceRow[]>) => void;
}

// ── Main Panel ────────────────────────────────────────────────────────────

export function ScriptProductsPanel({
  open, onClose, scriptGroupId, products, onProductsChange,
  productReferenceMap, onProductReferenceMapChange,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [editingAppearance, setEditingAppearance] = useState(false);
  const [appearanceDraft, setAppearanceDraft] = useState('');
  const refUploadInputRef = useRef<HTMLInputElement>(null);

  // Draft state for selected product
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftColor, setDraftColor] = useState('');

  // Refs for autoSave closure
  const draftNameRef = useRef(draftName);
  const draftDescriptionRef = useRef(draftDescription);
  const draftColorRef = useRef(draftColor);
  const selectedIdRef = useRef(selectedId);
  useEffect(() => { draftNameRef.current = draftName; });
  useEffect(() => { draftDescriptionRef.current = draftDescription; });
  useEffect(() => { draftColorRef.current = draftColor; });
  useEffect(() => { selectedIdRef.current = selectedId; });

  // Auto-select first product, or clear if deleted
  useEffect(() => {
    if (selectedId && !products.find(p => p.id === selectedId)) {
      setSelectedId(products[0]?.id ?? null);
    }
    if (!selectedId && products.length > 0) {
      setSelectedId(products[0].id);
    }
  }, [products, selectedId]);

  const selected = products.find(p => p.id === selectedId) ?? null;

  // Sync draft from selected product
  useEffect(() => {
    if (selected) {
      setDraftName(selected.name);
      setDraftDescription(selected.description ?? '');
      setDraftColor(selected.color);
      setConfirmDeleteId(null);
      setEditingAppearance(false);
    }
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save ─────────────────────────────────────────────────────
  const autoSave = useAutoSave(async () => {
    const productId = selectedIdRef.current;
    if (!productId) return;
    const updates = {
      name: draftNameRef.current,
      description: draftDescriptionRef.current || null,
      color: draftColorRef.current,
    };
    await updateProduct(productId, updates);
    onProductsChange(products.map(p =>
      p.id === productId ? { ...p, ...updates } : p,
    ));
  });

  const handleClose = useCallback(() => {
    autoSave.flush();
    onClose();
  }, [autoSave, onClose]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      const color = PRESET_COLORS[products.length % PRESET_COLORS.length];
      const id = await createProduct(scriptGroupId, {
        name: 'New Product',
        color,
        sort_order: products.length,
      });
      const newProduct: ScriptProductRow = {
        id,
        script_group_id: scriptGroupId,
        project_id: null,
        name: 'New Product',
        description: null,
        appearance_prompt: null,
        color,
        sort_order: products.length,
        created_at: new Date().toISOString(),
      };
      onProductsChange([...products, newProduct]);
      setSelectedId(id);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = useCallback(async (productId: string) => {
    setDeleting(true);
    try {
      await deleteProduct(productId);
      onProductsChange(products.filter(p => p.id !== productId));
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }, [products, onProductsChange]);

  // ── Reference image handlers ──────────────────────────────────────

  const handleUploadReference = useCallback(async (file: File) => {
    if (!selected) return;
    const currentRefs = productReferenceMap[selected.id] ?? [];
    if (currentRefs.length >= 8) return;
    setUploadingRef(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const row = await uploadProductReference(selected.id, fd);
      const updatedRefs = [...currentRefs, row];
      onProductReferenceMapChange({ ...productReferenceMap, [selected.id]: updatedRefs });

      // Auto-generate appearance on first upload (or if no description yet)
      const currentProduct = products.find(p => p.id === selected.id);
      if (!currentProduct?.appearance_prompt) {
        await extractAppearance(selected.id, updatedRefs, currentProduct?.name ?? '', currentProduct?.description ?? undefined);
      }
    } finally {
      setUploadingRef(false);
    }
  }, [selected, products, productReferenceMap, onProductReferenceMapChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteReference = useCallback(async (ref: ProductReferenceRow) => {
    if (!selected) return;
    await deleteProductReference(ref.id, ref.storage_path);
    const updated = (productReferenceMap[selected.id] ?? []).filter(r => r.id !== ref.id);
    onProductReferenceMapChange({ ...productReferenceMap, [selected.id]: updated });
  }, [selected, productReferenceMap, onProductReferenceMapChange]);

  // ── Gemini appearance extraction ──────────────────────────────────

  const extractAppearance = useCallback(async (
    productId: string,
    refs: ProductReferenceRow[],
    name: string,
    description?: string,
  ) => {
    if (refs.length === 0) return;
    setExtracting(true);
    try {
      const res = await fetch('/api/admin/product-appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls: refs.map(r => r.image_url),
          metadata: { name, description },
        }),
      });
      if (!res.ok) return;
      const { appearancePrompt } = await res.json();
      await updateProduct(productId, { appearance_prompt: appearancePrompt });
      onProductsChange(products.map(p =>
        p.id === productId ? { ...p, appearance_prompt: appearancePrompt } : p,
      ));
    } catch (err) {
      console.error('Product appearance extraction error:', err);
    } finally {
      setExtracting(false);
    }
  }, [products, onProductsChange]);

  const handleSaveAppearance = useCallback(async () => {
    if (!selected) return;
    await updateProduct(selected.id, { appearance_prompt: appearanceDraft });
    onProductsChange(products.map(p =>
      p.id === selected.id ? { ...p, appearance_prompt: appearanceDraft } : p,
    ));
    setEditingAppearance(false);
  }, [selected, appearanceDraft, products, onProductsChange]);

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[580px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-[4rem] border-b border-admin-border bg-admin-bg-sidebar">
          <h2 className="text-admin-lg font-semibold text-admin-text-primary">Products</h2>
          <div className="flex items-center">
            <SaveDot status={autoSave.status} />
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Product list */}
          <div className="w-[220px] flex-shrink-0 border-r border-admin-border flex flex-col">
            <div className="flex-shrink-0 border-b border-admin-border px-3 py-3 flex items-center">
              <button
                onClick={handleAdd}
                disabled={adding}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-admin-text-muted hover:text-admin-text-primary bg-admin-bg-active hover:bg-admin-bg-hover-strong border border-transparent rounded-lg h-[36px] transition-colors"
              >
                {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Add Product
              </button>
            </div>
            <div className="flex-1 overflow-y-auto admin-scrollbar py-2">
              {products.length === 0 && (
                <p className="text-xs text-admin-text-faint text-center py-6 px-3">
                  No products yet.
                </p>
              )}
              {products.map(product => {
                const isSelected = selectedId === product.id;
                const refs = productReferenceMap[product.id] ?? [];
                return (
                  <div
                    key={product.id}
                    className={`group/row w-full flex items-center px-4 py-2.5 gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-admin-bg-active text-admin-text-primary'
                        : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-primary'
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (selectedId !== product.id) autoSave.flush();
                        setSelectedId(product.id);
                      }}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                    >
                      {refs[0]?.image_url ? (
                        <img
                          src={refs[0].image_url}
                          alt=""
                          className="w-6 h-6 rounded-admin-sm object-cover flex-shrink-0"
                          style={{ boxShadow: `0 0 0 2px ${product.color}` }}
                        />
                      ) : (
                        <Package
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: product.color }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{product.name}</div>
                        {refs.length > 0 && (
                          <div className="text-[10px] text-admin-text-faint">{refs.length} image{refs.length !== 1 ? 's' : ''}</div>
                        )}
                      </div>
                    </button>
                    {/* Two-step delete */}
                    {confirmDeleteId === product.id ? (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1 text-admin-danger hover:text-red-300 transition-colors"
                          title="Confirm delete"
                        >
                          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1 text-admin-text-faint hover:text-admin-text-primary transition-colors"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(product.id)}
                        className="opacity-0 group-hover/row:opacity-100 p-1 text-admin-text-ghost hover:text-admin-danger transition-all flex-shrink-0"
                        title="Delete product"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Detail pane */}
          <div className="flex-1 min-w-0 overflow-y-auto admin-scrollbar">
            {selected ? (
              <div className="p-6 space-y-5">
                {/* Name + Color */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Name</label>
                  <div className="flex items-center gap-2">
                    <input
                      value={draftName}
                      onChange={e => { setDraftName(e.target.value); autoSave.trigger(); }}
                      className="admin-input flex-1 min-w-0 text-base font-semibold py-2 px-3"
                      placeholder="Product name"
                    />
                    <ColorPicker value={draftColor} onChange={c => { setDraftColor(c); autoSave.trigger(); }} />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Description</label>
                  <textarea
                    value={draftDescription}
                    onChange={e => { setDraftDescription(e.target.value); autoSave.trigger(); }}
                    placeholder="Notes about this product…"
                    rows={3}
                    className="admin-input w-full text-sm resize-none py-2.5 px-3 leading-relaxed"
                  />
                </div>

                {/* Reference Images */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Reference Images</label>
                  <input
                    ref={refUploadInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleUploadReference(file);
                      e.target.value = '';
                    }}
                  />
                  <div className="flex gap-2 flex-wrap">
                    {(productReferenceMap[selected.id] ?? []).map(ref => (
                      <div key={ref.id} className="group/refslot relative w-20 h-20 flex-shrink-0">
                        <img
                          src={ref.image_url}
                          alt=""
                          className="w-full h-full object-cover rounded-admin-md"
                        />
                        <button
                          onClick={() => handleDeleteReference(ref)}
                          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover/refslot:opacity-100 transition-opacity hover:bg-admin-danger"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {(productReferenceMap[selected.id] ?? []).length < 8 && (
                      <button
                        onClick={() => refUploadInputRef.current?.click()}
                        disabled={uploadingRef}
                        className="w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center gap-1 rounded-admin-md border-2 border-dashed border-admin-border text-admin-text-faint hover:border-admin-text-faint hover:text-admin-text-muted hover:bg-admin-bg-hover transition-colors disabled:opacity-50"
                      >
                        {uploadingRef ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <ImagePlus size={16} />
                            <span className="text-[10px]">Add</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-admin-sm text-admin-text-faint">
                    Up to 8 images used as visual references for storyboard generation.
                  </p>
                </div>

                {/* Appearance Prompt */}
                {(productReferenceMap[selected.id] ?? []).length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Visual Description</label>
                    {extracting ? (
                      <div className="flex items-center gap-1.5 text-xs text-admin-text-faint">
                        <Loader2 size={11} className="animate-spin" />
                        Generating description…
                      </div>
                    ) : editingAppearance ? (
                      <div className="space-y-1.5">
                        <textarea
                          value={appearanceDraft}
                          onChange={e => setAppearanceDraft(e.target.value)}
                          rows={6}
                          className="admin-input w-full text-xs resize-none py-2 px-2.5 leading-relaxed"
                        />
                        <div className="flex items-center gap-2">
                          <button onClick={handleSaveAppearance} className="btn-primary px-4 py-2 text-xs">Save</button>
                          <button onClick={() => setEditingAppearance(false)} className="btn-secondary px-4 py-2 text-xs">Cancel</button>
                        </div>
                      </div>
                    ) : selected.appearance_prompt ? (
                      <div className="group/appearance space-y-1.5">
                        <p className="text-xs text-admin-text-muted leading-relaxed line-clamp-4">
                          {selected.appearance_prompt}
                        </p>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/appearance:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setAppearanceDraft(selected.appearance_prompt ?? ''); setEditingAppearance(true); }}
                            className="w-6 h-6 flex items-center justify-center rounded-admin-sm text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                            title="Edit description"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => extractAppearance(selected.id, productReferenceMap[selected.id] ?? [], draftName, draftDescription || undefined)}
                            className="w-6 h-6 flex items-center justify-center rounded-admin-sm text-admin-text-faint hover:text-admin-info hover:bg-admin-bg-hover transition-colors"
                            title="Regenerate description"
                          >
                            <RefreshCw size={12} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => extractAppearance(selected.id, productReferenceMap[selected.id] ?? [], draftName, draftDescription || undefined)}
                        className="text-xs text-admin-text-ghost hover:text-admin-info transition-colors flex items-center gap-1.5"
                      >
                        <Sparkles size={12} />
                        Generate description…
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-admin-text-faint">
                <Package size={32} className="opacity-30" />
                <p className="text-sm">
                  {products.length === 0 ? 'Add a product to get started.' : 'Select a product to edit.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <PanelFooter onSave={handleClose} />
      </div>
    </PanelDrawer>
  );
}
