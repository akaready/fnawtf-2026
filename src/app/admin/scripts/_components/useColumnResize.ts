import { useCallback, useRef } from 'react';
import { DEFAULT_FRACTIONS } from './gridUtils';

const MIN_FR = 0.3;

export function useColumnResize(
  visibleKeys: string[],
  fractions: Record<string, number>,
  setFractions: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  headerGridRef: React.RefObject<HTMLDivElement | null>,
) {
  const resizingRef = useRef(false);

  const handleResize = useCallback(
    (colKey: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const colIdx = visibleKeys.indexOf(colKey);
      if (colIdx < 0 || colIdx >= visibleKeys.length - 1) return;
      const nextKey = visibleKeys[colIdx + 1];

      const gridEl = headerGridRef.current;
      if (!gridEl) return;
      const cells = Array.from(gridEl.children) as HTMLElement[];
      if (colIdx + 1 >= cells.length) return;

      const startX = e.clientX;
      const startFr = fractions[colKey] ?? 1;
      const nextFr = fractions[nextKey] ?? 1;
      const totalFr = startFr + nextFr;

      const thisPx = cells[colIdx].getBoundingClientRect().width;
      const nextPx = cells[colIdx + 1].getBoundingClientRect().width;
      const pxPerFr = (thisPx + nextPx) / totalFr;

      let didMove = false;

      const onMouseMove = (ev: MouseEvent) => {
        didMove = true;
        resizingRef.current = true;
        const deltaPx = ev.clientX - startX;
        const deltaFr = deltaPx / pxPerFr;
        const newFr = Math.max(MIN_FR, Math.min(totalFr - MIN_FR, startFr + deltaFr));
        const newNextFr = totalFr - newFr;
        setFractions(prev => ({
          ...prev,
          [colKey]: newFr,
          [nextKey]: newNextFr,
        }));
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (didMove) setTimeout(() => { resizingRef.current = false; }, 0);
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [visibleKeys, fractions, setFractions, headerGridRef],
  );

  const resetFractions = useCallback(() => {
    setFractions({ ...DEFAULT_FRACTIONS });
  }, [setFractions]);

  return { handleResize, resetFractions, resizingRef };
}
