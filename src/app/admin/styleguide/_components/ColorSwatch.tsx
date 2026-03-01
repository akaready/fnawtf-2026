'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface ColorSwatchProps {
  variable: string;
  label: string;
  tailwindClass: string;
  value: string;
  onChange: (variable: string, value: string) => void;
}

/* ── HSL ↔ Hex helpers ─────────────────────────────────────────────────── */
function hexToHsl(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100, ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function ColorSwatch({ variable, label, tailwindClass, value, onChange }: ColorSwatchProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);

  const isRgba = value.startsWith('rgba');
  const hsl = !isRgba ? hexToHsl(value) : null;
  const [localH, setLocalH] = useState(hsl?.[0] ?? 0);
  const [localS, setLocalS] = useState(hsl?.[1] ?? 0);
  const [localL, setLocalL] = useState(hsl?.[2] ?? 0);

  // Sync local HSL when value changes externally (e.g. reset)
  const prevValue = useRef(value);
  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      const parsed = hexToHsl(value);
      if (parsed) {
        setLocalH(parsed[0]);
        setLocalS(parsed[1]);
        setLocalL(parsed[2]);
      }
    }
  }, [value]);

  const handleHslChange = useCallback((component: 'h' | 's' | 'l', val: number) => {
    const h = component === 'h' ? val : localH;
    const s = component === 's' ? val : localS;
    const l = component === 'l' ? val : localL;
    if (component === 'h') setLocalH(val);
    if (component === 's') setLocalS(val);
    if (component === 'l') setLocalL(val);
    onChange(variable, hslToHex(h, s, l));
  }, [localH, localS, localL, onChange, variable]);

  const handleTextChange = (v: string) => {
    onChange(variable, v);
    const parsed = hexToHsl(v);
    if (parsed) { setLocalH(parsed[0]); setLocalS(parsed[1]); setLocalL(parsed[2]); }
  };

  const handlePickerChange = (v: string) => {
    onChange(variable, v);
    const parsed = hexToHsl(v);
    if (parsed) { setLocalH(parsed[0]); setLocalS(parsed[1]); setLocalL(parsed[2]); }
  };

  const hexForPicker = isRgba ? '#888888' : value;

  return (
    <div className="py-2 px-3 hover:bg-admin-bg-hover transition-colors group">
      <div className="flex items-center gap-3">
        {/* Color swatch — click to expand HSL */}
        <button
          onClick={() => !isRgba && setExpanded(!expanded)}
          className="w-10 h-10 rounded-lg border border-admin-border flex-shrink-0 relative overflow-hidden cursor-pointer"
          style={{ backgroundColor: value }}
          title={isRgba ? 'RGBA values use the text input' : 'Click to expand HSL controls'}
        />

        {/* Hidden native picker */}
        {!isRgba && (
          <input
            ref={pickerRef}
            type="color"
            value={hexForPicker}
            onChange={(e) => handlePickerChange(e.target.value)}
            className="sr-only"
          />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-admin-text-primary text-admin-sm font-medium truncate">{label}</div>
          <div className="text-admin-text-ghost font-admin-mono text-admin-xs truncate">{variable}</div>
        </div>

        {/* Tailwind class */}
        <div className="hidden group-hover:block text-admin-text-faint font-admin-mono text-admin-xs truncate max-w-[160px]">
          {tailwindClass}
        </div>

        {/* Editable value */}
        <input
          type="text"
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-[140px] text-admin-xs font-admin-mono bg-transparent border border-transparent hover:border-admin-border focus:border-admin-border-focus rounded px-2 py-1 text-admin-text-secondary focus:outline-none focus:text-admin-text-primary transition-colors"
        />
      </div>

      {/* HSL sliders — expanded */}
      {expanded && !isRgba && (
        <div className="mt-2 ml-[52px] space-y-1.5">
          {([
            { key: 'h' as const, lbl: 'H', max: 360, val: localH, suffix: '',
              bg: `linear-gradient(to right, hsl(0,${localS}%,${localL}%), hsl(60,${localS}%,${localL}%), hsl(120,${localS}%,${localL}%), hsl(180,${localS}%,${localL}%), hsl(240,${localS}%,${localL}%), hsl(300,${localS}%,${localL}%), hsl(360,${localS}%,${localL}%))` },
            { key: 's' as const, lbl: 'S', max: 100, val: localS, suffix: '%',
              bg: `linear-gradient(to right, hsl(${localH},0%,${localL}%), hsl(${localH},100%,${localL}%))` },
            { key: 'l' as const, lbl: 'L', max: 100, val: localL, suffix: '%',
              bg: `linear-gradient(to right, hsl(${localH},${localS}%,0%), hsl(${localH},${localS}%,50%), hsl(${localH},${localS}%,100%))` },
          ]).map((sl) => (
            <div key={sl.key} className="flex items-center gap-2">
              <span className="w-4 text-admin-xs text-admin-text-faint font-admin-mono">{sl.lbl}</span>
              <input
                type="range"
                min={0}
                max={sl.max}
                value={sl.val}
                onChange={(e) => handleHslChange(sl.key, Number(e.target.value))}
                className="flex-1 h-1.5 accent-white appearance-none rounded-full cursor-pointer"
                style={{ background: sl.bg }}
              />
              <span className="w-10 text-right text-admin-xs text-admin-text-dim font-admin-mono">{sl.val}{sl.suffix}</span>
            </div>
          ))}
          <button
            onClick={() => pickerRef.current?.click()}
            className="text-admin-xs text-admin-text-faint hover:text-admin-text-muted transition-colors mt-1"
          >
            System picker
          </button>
        </div>
      )}
    </div>
  );
}
