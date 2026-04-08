import JSZip from 'jszip';
import type {
  ScriptRow,
  ComputedScene,
  ScriptColumnConfig,
  ScriptBeatReferenceRow,
  ScriptStoryboardFrameRow,
  ScriptShareCommentRow,
} from '@/types/scripts';
import { getOrderedVisibleColumns } from '@/app/admin/scripts/_components/gridUtils';
import { stripMarkdown } from '@/lib/scripts/parseContent';

function toPlainText(md: string): string {
  return stripMarkdown(md).replace(/\s+/g, ' ').trim();
}

function toBeatLetter(i: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (i < 26) return letters[i];
  return letters[Math.floor(i / 26) - 1] + letters[i % 26];
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Human-readable storyboard filename: scene1-beat2-slot1.jpg */
function frameName(sceneNum: number, beatNum: number, slot: number): string {
  return `scene${sceneNum}-beat${beatNum}-slot${slot}.jpg`;
}

export async function exportScriptAsCsv(
  script: ScriptRow,
  computedScenes: ComputedScene[],
  columnConfig: ScriptColumnConfig,
  columnOrder: string[],
  refsByBeat: Record<string, ScriptBeatReferenceRow[]>,
  storyboardFrames: ScriptStoryboardFrameRow[],
  commentsMap: Map<string, ScriptShareCommentRow[]>,
): Promise<void> {
  const visibleCols = getOrderedVisibleColumns(columnConfig, columnOrder);

  // Build beatId → { sceneNumber, beatNumber (1-indexed) } from the scene tree
  const beatPosition: Record<string, { sceneNum: number; beatNum: number }> = {};
  for (const scene of computedScenes) {
    scene.beats.forEach((beat, bi) => {
      beatPosition[beat.id] = { sceneNum: scene.sceneNumber, beatNum: bi + 1 };
    });
  }

  // Build beatId → active slot frames sorted by slot
  const framesByBeat: Record<string, ScriptStoryboardFrameRow[]> = {};
  for (const f of storyboardFrames) {
    if (!f.beat_id || !f.is_active || f.is_archived) continue;
    if (!framesByBeat[f.beat_id]) framesByBeat[f.beat_id] = [];
    framesByBeat[f.beat_id].push(f);
  }
  for (const beatId of Object.keys(framesByBeat)) {
    framesByBeat[beatId].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  }

  // ── CSV ─────────────────────────────────────────────────────────────────
  const csvEscape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const headers = ['Scene #', 'Scene', 'Beat', ...visibleCols.map(c => c.label)];
  const rows: string[][] = [];

  for (const scene of computedScenes) {
    const sceneLabel = `${scene.int_ext} ${scene.location_name} — ${scene.time_of_day}`;
    for (let bi = 0; bi < scene.beats.length; bi++) {
      const beat = scene.beats[bi];
      const beatLetter = toBeatLetter(bi);
      const row: string[] = [String(scene.sceneNumber), sceneLabel, beatLetter];

      for (const col of visibleCols) {
        switch (col.key) {
          case 'audio':   row.push(toPlainText(beat.audio_content));  break;
          case 'visual':  row.push(toPlainText(beat.visual_content)); break;
          case 'notes':   row.push(toPlainText(beat.notes_content));  break;
          case 'reference': {
            const refs = refsByBeat[beat.id] ?? [];
            row.push(refs.length ? `${refs.length} image(s)` : '');
            break;
          }
          case 'storyboard': {
            const frames = framesByBeat[beat.id] ?? [];
            row.push(frames.length
              ? frames.map(f => frameName(scene.sceneNumber, bi + 1, f.slot ?? 0)).join(', ')
              : '',
            );
            break;
          }
          case 'comments': {
            const count = commentsMap.get(beat.id)?.length ?? 0;
            row.push(count ? `${count} comment(s)` : '');
            break;
          }
          default: row.push('');
        }
      }
      rows.push(row);
    }
  }

  const csvContent = [headers, ...rows]
    .map(r => r.map(v => csvEscape(v)).join(','))
    .join('\n');

  // ── ZIP ─────────────────────────────────────────────────────────────────
  const zip = new JSZip();
  zip.file('export.csv', csvContent);

  const allFrames = storyboardFrames.filter(f => f.beat_id && f.is_active && !f.is_archived);

  if (allFrames.length > 0) {
    const folder = zip.folder('storyboards')!;
    await Promise.allSettled(
      allFrames.map(async (f) => {
        try {
          const pos = beatPosition[f.beat_id!];
          if (!pos) return;
          const res = await fetch(f.image_url);
          if (!res.ok) return;
          const buf = await res.arrayBuffer();
          folder.file(frameName(pos.sceneNum, pos.beatNum, f.slot ?? 0), buf);
        } catch {
          // Skip frames that fail to fetch
        }
      }),
    );
  }

  // ── Download ─────────────────────────────────────────────────────────────
  const blob = await zip.generateAsync({ type: 'blob' });
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(script.title)}-v${script.major_version}.${script.minor_version}-${date}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
