'use client';

// Smooth hue rotation — evenly spaced across the spectrum + neutrals
export const PRESET_COLORS_LIGHT = [
  '#f87171', // red         ~0°
  '#fb923c', // orange      ~30°
  '#fbbf24', // amber       ~45°
  '#a3e635', // lime        ~80°
  '#4ade80', // green       ~140°
  '#2dd4bf', // teal        ~170°
  '#22d3ee', // cyan        ~190°
  '#38bdf8', // sky         ~205°
  '#3b82f6', // blue        ~225°
  '#818cf8', // indigo      ~245°
  '#a78bfa', // violet      ~265°
  '#e879f9', // fuchsia     ~295°
  '#d4d4d4', // light grey
  '#a3a3a3', // mid grey
  '#737373', // dark grey
];

export const PRESET_COLORS_DARK = [
  '#7f1d1d', // red         ~0°
  '#7c2d12', // orange      ~30°
  '#713f12', // amber       ~45°
  '#3f6212', // lime        ~80°
  '#14532d', // green       ~140°
  '#134e4a', // teal        ~170°
  '#164e63', // cyan        ~190°
  '#0c4a6e', // sky         ~205°
  '#1e40af', // blue        ~225°
  '#312e81', // indigo      ~245°
  '#4c1d95', // violet      ~265°
  '#701a75', // fuchsia     ~295°
  '#525252', // light grey
  '#404040', // mid grey
  '#262626', // dark grey
];

export const PRESET_COLORS = [...PRESET_COLORS_LIGHT, ...PRESET_COLORS_DARK];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Color</label>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {PRESET_COLORS_LIGHT.map(color => (
            <button
              key={color}
              onClick={() => onChange(color)}
              className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                value === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-admin-bg-base' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {PRESET_COLORS_DARK.map(color => (
            <button
              key={color}
              onClick={() => onChange(color)}
              className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                value === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-admin-bg-base' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
