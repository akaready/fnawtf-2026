'use client';

import { useState } from 'react';
import { Download, Film } from 'lucide-react';
import type { CallSheetSceneJoined } from '@/types/callsheet-admin';
import { importScenesFromScript, updateCallSheetScene } from '../../../actions';

interface Props {
  scenes: CallSheetSceneJoined[];
  callSheetId: string | null;
  scriptId: string | null;
  onChanged: () => void;
}

export function ScheduleTab({ scenes, callSheetId, scriptId, onChanged }: Props) {
  const [importing, setImporting] = useState(false);

  async function handleImport() {
    if (!callSheetId || !scriptId) return;
    setImporting(true);
    try {
      await importScenesFromScript(callSheetId, scriptId);
      onChanged();
    } finally {
      setImporting(false);
    }
  }

  async function handleToggle(id: string, selected: boolean) {
    await updateCallSheetScene(id, { selected });
    onChanged();
  }

  async function handleUpdate(id: string, field: string, value: unknown) {
    await updateCallSheetScene(id, { [field]: value });
    onChanged();
  }

  if (!scriptId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <Film size={32} className="text-admin-text-ghost" />
        <p className="text-admin-text-muted">Connect a script on the Details tab to import scenes</p>
      </div>
    );
  }

  return (
    <>
      {/* Import button */}
      <div className="flex items-center justify-between">
        <label className="admin-label mb-0">
          Scene Schedule ({scenes.filter((s) => s.selected).length} of {scenes.length} selected)
        </label>
        <button
          onClick={handleImport}
          disabled={importing}
          className="btn-secondary px-3 py-2 text-xs inline-flex items-center gap-1.5"
        >
          <Download size={13} />
          {importing ? 'Importing...' : 'Import from Script'}
        </button>
      </div>

      {/* Scene list */}
      <div className="space-y-2">
        {scenes.map((s) => (
          <div
            key={s.id}
            className={`rounded-admin-md border border-admin-border p-4 space-y-3 transition-opacity ${
              s.selected ? 'bg-admin-bg-overlay' : 'bg-admin-bg-base opacity-50'
            }`}
          >
            {/* Header: checkbox + scene info */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={s.selected}
                onChange={(e) => handleToggle(s.id, e.target.checked)}
                className="mt-1 rounded border-admin-border"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {s.int_ext && (
                    <span className="px-1.5 py-0.5 rounded-admin-sm text-admin-xs font-medium bg-admin-bg-active text-admin-text-dim">
                      {s.int_ext}
                    </span>
                  )}
                  {s.location_name && (
                    <span className="font-medium text-admin-text-primary text-admin-sm">{s.location_name}</span>
                  )}
                  {s.time_of_day && (
                    <span className="text-admin-xs text-admin-text-muted">— {s.time_of_day}</span>
                  )}
                </div>
                {s.scene_notes && (
                  <p className="text-admin-xs text-admin-text-muted mt-1 line-clamp-2">{s.scene_notes}</p>
                )}
                {/* Characters */}
                {s.characters.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {s.characters.map((ch) => (
                      <span
                        key={ch.id}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-admin-sm bg-admin-bg-active text-admin-xs text-admin-text-dim"
                      >
                        {ch.headshot_url && (
                          <img src={ch.headshot_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                        )}
                        {ch.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Time fields (only when selected) */}
            {s.selected && (
              <div className="grid grid-cols-2 gap-3 pl-7">
                <div>
                  <label className="admin-label">Start</label>
                  <input
                    type="text"
                    defaultValue={s.start_time ?? ''}
                    onBlur={(e) => {
                      if (e.target.value !== (s.start_time ?? '')) handleUpdate(s.id, 'start_time', e.target.value || null);
                    }}
                    placeholder="10:00 AM"
                    className="admin-input w-full"
                  />
                </div>
                <div>
                  <label className="admin-label">End</label>
                  <input
                    type="text"
                    defaultValue={s.end_time ?? ''}
                    onBlur={(e) => {
                      if (e.target.value !== (s.end_time ?? '')) handleUpdate(s.id, 'end_time', e.target.value || null);
                    }}
                    placeholder="11:30 AM"
                    className="admin-input w-full"
                  />
                </div>
                <div className="col-span-2">
                  <label className="admin-label">Notes</label>
                  <textarea
                    defaultValue={s.notes ?? ''}
                    onBlur={(e) => {
                      if (e.target.value !== (s.notes ?? '')) handleUpdate(s.id, 'notes', e.target.value || null);
                    }}
                    rows={2}
                    placeholder="Scene notes..."
                    className="admin-input w-full resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
