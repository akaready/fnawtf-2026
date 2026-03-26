'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import type { AutoSaveStatus } from '@/app/admin/_hooks/useAutoSave';
import { getPipelineSettings, updatePipelineSetting } from '@/app/admin/actions';

const PROMPT_SECTIONS = [
  { key: 'general_prompt', label: 'General' },
  { key: 'welcome_prompt', label: 'Welcome' },
  { key: 'approach_prompt', label: 'Approach' },
  { key: 'timeline_prompt', label: 'Timeline' },
  { key: 'samples_prompt', label: 'Samples' },
  { key: 'pricing_prompt', label: 'Pricing' },
] as const;

interface PipelineSettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function PipelineSettingsPanel({ open, onClose }: PipelineSettingsPanelProps) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saveStatuses, setSaveStatuses] = useState<Record<string, AutoSaveStatus>>({});
  const [autoGenerate, setAutoGenerate] = useState(false);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!open) return;
    getPipelineSettings().then((data) => {
      setSettings(data);
      setAutoGenerate(data['auto_generate'] === 'true');
    });
  }, [open]);

  const saveValue = useCallback(async (key: string, value: string) => {
    setSaveStatuses((prev) => ({ ...prev, [key]: 'saving' }));
    try {
      await updatePipelineSetting(key, value);
      setSaveStatuses((prev) => ({ ...prev, [key]: 'saved' }));
    } catch {
      setSaveStatuses((prev) => ({ ...prev, [key]: 'error' }));
    }
  }, []);

  const handleChange = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveStatuses((prev) => ({ ...prev, [key]: 'pending' }));

    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(() => {
      saveValue(key, value);
    }, 1500);
  }, [saveValue]);

  const handleBlur = useCallback((key: string) => {
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
      delete debounceTimers.current[key];
    }
    const value = settings[key];
    if (value !== undefined) {
      saveValue(key, value);
    }
  }, [settings, saveValue]);

  const handleAutoGenerateToggle = useCallback(() => {
    const next = !autoGenerate;
    setAutoGenerate(next);
    setSettings((prev) => ({ ...prev, auto_generate: String(next) }));
    saveValue('auto_generate', String(next));
  }, [autoGenerate, saveValue]);

  const aggregateStatus: AutoSaveStatus = Object.values(saveStatuses).some((s) => s === 'error')
    ? 'error'
    : Object.values(saveStatuses).some((s) => s === 'saving')
      ? 'saving'
      : Object.values(saveStatuses).some((s) => s === 'pending')
        ? 'pending'
        : Object.values(saveStatuses).some((s) => s === 'saved')
          ? 'saved'
          : 'idle';

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[480px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border bg-admin-bg-sidebar flex-shrink-0">
          <h2 className="text-admin-base font-semibold text-admin-text-primary">Proposal Settings</h2>
          <div className="flex items-center gap-1">
            <SaveDot status={aggregateStatus} />
            <button onClick={onClose} className="btn-ghost w-8 h-8 flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex items-center gap-1 border-b border-admin-border px-6 py-2 flex-shrink-0 bg-admin-bg-wash">
          <button className="px-3 py-1.5 rounded-admin-md text-admin-sm font-medium bg-admin-bg-active text-admin-text-primary">
            Intake to Proposal Pipeline
          </button>
        </div>

        {/* Body — all prompts stacked */}
        <div className="flex-1 overflow-y-auto admin-scrollbar px-6 py-5 space-y-6">
          {PROMPT_SECTIONS.map((section) => (
            <div key={section.key}>
              <label className="admin-label">{section.label}</label>
              <textarea
                value={settings[section.key] ?? ''}
                onChange={(e) => handleChange(section.key, e.target.value)}
                onBlur={() => handleBlur(section.key)}
                className="w-full min-h-[120px] rounded-admin-md border border-admin-border bg-admin-bg-overlay px-4 py-3 text-admin-sm text-admin-text-primary placeholder:text-admin-text-dim focus:outline-none focus:border-admin-border-emphasis resize-y"
                placeholder={`Enter ${section.label.toLowerCase()} prompt...`}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border bg-admin-bg-wash flex-shrink-0">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoGenerate}
              onChange={handleAutoGenerateToggle}
              className="rounded border-admin-border text-admin-accent focus:ring-admin-accent"
            />
            <span className="text-admin-sm text-admin-text-secondary">Auto-generate on new intake</span>
          </label>
        </div>
      </div>
    </PanelDrawer>
  );
}
