'use client';

import { type ReactNode, useState } from 'react';
import { Save } from 'lucide-react';
import { TwoStateDeleteButton } from './TwoStateDeleteButton';

interface PanelFooterProps {
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  /** Set to false to hide the floppy disk icon on the save button */
  saveIcon?: boolean;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  /** Additional buttons between Save and Delete (status dropdowns, fetch buttons, etc.) */
  secondaryActions?: ReactNode;
}

/**
 * Universal footer for all admin side panels.
 * All buttons are left-aligned in a single row: [Save] [Secondary...] [Delete]
 */
export function PanelFooter({
  onSave,
  saveLabel = 'Save',
  saveDisabled = false,
  saveIcon = true,
  onDelete,
  deleteDisabled = false,
  secondaryActions,
}: PanelFooterProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2 px-6 py-4 border-t border-admin-border flex-shrink-0 bg-admin-bg-wash">
      {onSave && (
        <button
          onClick={onSave}
          disabled={saveDisabled}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
        >
          {saveIcon && <Save size={14} />}
          {saveLabel}
        </button>
      )}
      {secondaryActions}
      {onDelete && (
        <TwoStateDeleteButton
          itemId="panel"
          confirmId={confirmDeleteId}
          onRequestConfirm={setConfirmDeleteId}
          onConfirmDelete={() => {
            onDelete();
            setConfirmDeleteId(null);
          }}
          onCancel={() => setConfirmDeleteId(null)}
          disabled={deleteDisabled}
          size={14}
          cancelFirst
        />
      )}
    </div>
  );
}
