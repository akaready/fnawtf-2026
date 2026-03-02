'use client';

import { Trash2, Check, X } from 'lucide-react';

interface TwoStateDeleteButtonProps {
  /** ID of the item this button controls */
  itemId: string;
  /** Currently-confirming item ID (null = idle) */
  confirmId: string | null;
  /** Called when trash icon is clicked — set confirmId to this itemId */
  onRequestConfirm: (id: string) => void;
  /** Called when Check (confirm) is clicked — execute deletion */
  onConfirmDelete: (id: string) => void;
  /** Called when X (cancel) is clicked — clear confirmId */
  onCancel: () => void;
  disabled?: boolean;
  /** Lucide icon size (default 13) */
  size?: number;
  /** Wrap the idle trash icon in opacity-0 group-hover for progressive disclosure */
  hideUntilHover?: boolean;
  /** Scoped group name for hideUntilHover (e.g. "row") — uses group-hover/{name} */
  groupName?: string;
}

/**
 * Two-state delete button: trash icon → Check (confirm) + X (cancel).
 * Standardized across all admin pages per CLAUDE.md design system.
 *
 * Usage:
 * ```tsx
 * const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
 *
 * <TwoStateDeleteButton
 *   itemId={item.id}
 *   confirmId={confirmDeleteId}
 *   onRequestConfirm={setConfirmDeleteId}
 *   onConfirmDelete={(id) => { handleDelete(id); setConfirmDeleteId(null); }}
 *   onCancel={() => setConfirmDeleteId(null)}
 *   hideUntilHover
 *   groupName="row"
 * />
 * ```
 */
export function TwoStateDeleteButton({
  itemId,
  confirmId,
  onRequestConfirm,
  onConfirmDelete,
  onCancel,
  disabled = false,
  size = 13,
  hideUntilHover = false,
  groupName,
}: TwoStateDeleteButtonProps) {
  const isConfirming = confirmId === itemId;

  if (isConfirming) {
    return (
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onConfirmDelete(itemId)}
          disabled={disabled}
          className="p-2 text-admin-danger hover:text-red-300 transition-colors"
          title="Confirm delete"
        >
          <Check size={size} />
        </button>
        <button
          onClick={onCancel}
          className="p-2 text-admin-text-faint hover:text-admin-text-primary transition-colors"
          title="Cancel"
        >
          <X size={size} />
        </button>
      </div>
    );
  }

  // Build visibility class for progressive disclosure
  const hoverClass = hideUntilHover
    ? groupName
      ? `opacity-0 group-hover/${groupName}:opacity-100 transition-opacity`
      : 'opacity-0 group-hover:opacity-100 transition-opacity'
    : '';

  return (
    <button
      onClick={() => onRequestConfirm(itemId)}
      disabled={disabled}
      className={`btn-ghost-danger w-8 h-8 ${hoverClass}`}
      title="Delete"
    >
      <Trash2 size={size} />
    </button>
  );
}
