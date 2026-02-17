'use client';

interface RangeFilterProps {
  label: string;
  min: number;
  max: number;
  value: [number, number] | null;
  onChange: (range: [number, number] | null) => void;
  unit?: string;
}

export function RangeFilter({
  label,
  min,
  max,
  value,
  onChange,
  unit = '',
}: RangeFilterProps) {
  const [localMin, localMax] = value || [min, max];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          {label}
        </h3>
        {value && (
          <button
            onClick={() => onChange(null)}
            className="text-xs text-muted-foreground hover:text-accent transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={min}
            max={max}
            value={localMin}
            onChange={(e) => onChange([Number(e.target.value), localMax])}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground min-w-[60px] text-right">
            {localMin}
            {unit}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={min}
            max={max}
            value={localMax}
            onChange={(e) => onChange([localMin, Number(e.target.value)])}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground min-w-[60px] text-right">
            {localMax}
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}
