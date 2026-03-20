import type { CropConfig } from '@/types/scripts';

export interface LayoutDefinition {
  id: string;
  label: string;
  slotCount: number;
  /** CSS grid-template shorthand (rows / columns) */
  gridTemplate: string;
  /** Named grid areas per slot; index 0 = slot 1 */
  gridAreas: string[];
  /** CSS grid-template-areas string */
  templateAreas: string;
}

export const STORYBOARD_LAYOUTS: LayoutDefinition[] = [
  // ── 1-frame ──────────────────────────────────────────────────────────
  { id: 'single', label: 'Single', slotCount: 1,
    gridTemplate: '1fr / 1fr', gridAreas: ['a'],
    templateAreas: '"a"' },

  // ── 2-frame ──────────────────────────────────────────────────────────
  { id: 'two-equal', label: 'Two Equal', slotCount: 2,
    gridTemplate: '1fr / 1fr 1fr', gridAreas: ['a', 'b'],
    templateAreas: '"a b"' },
  { id: 'two-wide-left', label: 'Wide Left', slotCount: 2,
    gridTemplate: '1fr / 2fr 1fr', gridAreas: ['a', 'b'],
    templateAreas: '"a b"' },
  { id: 'two-wide-right', label: 'Wide Right', slotCount: 2,
    gridTemplate: '1fr / 1fr 2fr', gridAreas: ['a', 'b'],
    templateAreas: '"a b"' },

  // ── 3-frame ──────────────────────────────────────────────────────────
  { id: 'three-equal-row', label: 'Three Rows', slotCount: 3,
    gridTemplate: '1fr 1fr 1fr / 1fr', gridAreas: ['a', 'b', 'c'],
    templateAreas: '"a" "b" "c"' },
  { id: 'three-big-left', label: 'Big Left', slotCount: 3,
    gridTemplate: '1fr 1fr / 2fr 1fr', gridAreas: ['a', 'b', 'c'],
    templateAreas: '"a b" "a c"' },
  { id: 'three-big-right', label: 'Big Right', slotCount: 3,
    gridTemplate: '1fr 1fr / 1fr 2fr', gridAreas: ['a', 'b', 'c'],
    templateAreas: '"a b" "c b"' },
  { id: 'three-big-top', label: 'Big Top', slotCount: 3,
    gridTemplate: '2fr 1fr / 1fr 1fr', gridAreas: ['a', 'b', 'c'],
    templateAreas: '"a a" "b c"' },
  { id: 'three-big-bottom', label: 'Big Bottom', slotCount: 3,
    gridTemplate: '1fr 2fr / 1fr 1fr', gridAreas: ['a', 'b', 'c'],
    templateAreas: '"a b" "c c"' },
  { id: 'three-comic-stagger', label: 'Stagger', slotCount: 3,
    gridTemplate: '1fr 1fr / 2fr 1fr', gridAreas: ['a', 'b', 'c'],
    templateAreas: '"a b" "c c"' },

  // ── 4-frame ──────────────────────────────────────────────────────────
  { id: 'four-grid', label: '2×2 Grid', slotCount: 4,
    gridTemplate: '1fr 1fr / 1fr 1fr', gridAreas: ['a', 'b', 'c', 'd'],
    templateAreas: '"a b" "c d"' },
  { id: 'four-big-left', label: 'Big Left', slotCount: 4,
    gridTemplate: '1fr 1fr 1fr / 2fr 1fr', gridAreas: ['a', 'b', 'c', 'd'],
    templateAreas: '"a b" "a c" "a d"' },
  { id: 'four-big-right', label: 'Big Right', slotCount: 4,
    gridTemplate: '1fr 1fr 1fr / 1fr 2fr', gridAreas: ['a', 'b', 'c', 'd'],
    templateAreas: '"a b" "c b" "d b"' },
  { id: 'four-banner-top', label: 'Banner Top', slotCount: 4,
    gridTemplate: '2fr 1fr / 1fr 1fr 1fr', gridAreas: ['a', 'b', 'c', 'd'],
    templateAreas: '"a a a" "b c d"' },
  { id: 'four-banner-bottom', label: 'Banner Bottom', slotCount: 4,
    gridTemplate: '1fr 2fr / 1fr 1fr 1fr', gridAreas: ['a', 'b', 'c', 'd'],
    templateAreas: '"a b c" "d d d"' },
  { id: 'four-L-top-left', label: 'L-Shape', slotCount: 4,
    gridTemplate: '1fr 1fr / 2fr 1fr 1fr', gridAreas: ['a', 'b', 'c', 'd'],
    templateAreas: '"a b c" "a d d"' },
  { id: 'four-comic-stagger', label: 'Comic Stagger', slotCount: 4,
    gridTemplate: '1fr 1fr / 1fr 1fr 1fr', gridAreas: ['a', 'b', 'c', 'd'],
    templateAreas: '"a a b" "c d d"' },
  { id: 'four-feature', label: 'Feature', slotCount: 4,
    gridTemplate: '1fr 1fr 1fr / 2fr 1fr', gridAreas: ['a', 'b', 'c', 'd'],
    templateAreas: '"a b" "a c" "d d"' },
];

export function getLayout(id: string | null | undefined): LayoutDefinition {
  return STORYBOARD_LAYOUTS.find(l => l.id === id) ?? STORYBOARD_LAYOUTS[0];
}

export const DEFAULT_CROP_CONFIG: CropConfig = { x: 0.5, y: 0.5, scale: 1.0 };
