'use client';

interface Props {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

/**
 * Shared "discard unsaved changes?" overlay for side panels.
 * Rendered inside a PanelDrawer (absolute positioning within the drawer).
 */
export function DiscardChangesDialog({ open, onKeepEditing, onDiscard }: Props) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 mx-6 max-w-sm space-y-3 shadow-2xl">
        <h3 className="text-base font-semibold text-foreground">Discard changes?</h3>
        <p className="text-sm text-muted-foreground">Closing will discard unsaved changes.</p>
        <div className="flex items-center gap-2 justify-end pt-1">
          <button
            onClick={onKeepEditing}
            className="px-4 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            Keep Editing
          </button>
          <button
            onClick={onDiscard}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
