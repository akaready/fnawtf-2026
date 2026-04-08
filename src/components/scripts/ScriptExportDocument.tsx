import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { ComputedScene, ScriptRow, ScriptBeatReferenceRow, ScriptStoryboardFrameRow, ScriptShareCommentRow } from '@/types/scripts';
import type { getOrderedVisibleColumns } from '@/app/admin/scripts/_components/gridUtils';
import { stripMarkdown } from '@/lib/scripts/parseContent';

type VisibleCol = ReturnType<typeof getOrderedVisibleColumns>[number];

export interface ScriptExportProps {
  script: ScriptRow;
  versionLabel: string;
  computedScenes: ComputedScene[];
  visibleCols: VisibleCol[];
  refsByBeat: Record<string, ScriptBeatReferenceRow[]>;
  storyboardFrames: ScriptStoryboardFrameRow[];
  commentsMap: Map<string, ScriptShareCommentRow[]>;
  logoDataUrl?: string;
}

function toPlainText(md: string): string {
  return stripMarkdown(md).replace(/\s+/g, ' ').trim();
}

function toBeatLetter(i: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (i < 26) return letters[i];
  return letters[Math.floor(i / 26) - 1] + letters[i % 26];
}

// Landscape A4: 841.89 × 595.28 pt
const MARGIN = 30;
const HEADER_H = 28;   // branding bar height
const COL_H = 16;      // column header row height
// Top padding = margin + fixed header height
const PAGE_PAD_TOP = MARGIN + HEADER_H + COL_H + 4;
const PAGE_WIDTH = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const ID_COL = 32;
const DATA_WIDTH = CONTENT_WIDTH - ID_COL;

const FRACTIONS: Record<string, number> = {
  audio: 2, visual: 2, notes: 1, reference: 1, storyboard: 1, comments: 2,
};

function computeColWidths(visibleCols: VisibleCol[]): number[] {
  const total = visibleCols.reduce((s, c) => s + (FRACTIONS[c.key] ?? 1), 0);
  return visibleCols.map(c => Math.floor(DATA_WIDTH * (FRACTIONS[c.key] ?? 1) / total));
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'SpaceGrotesk',
    fontSize: 8,
    paddingTop: PAGE_PAD_TOP,
    paddingBottom: MARGIN,
    paddingLeft: MARGIN,
    paddingRight: MARGIN,
    backgroundColor: '#ffffff',
  },

  // ── Fixed header (repeats every page) ──────────────────────────────────
  fixedHeader: {
    position: 'absolute',
    top: MARGIN,
    left: MARGIN,
    right: MARGIN,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111111',
    height: HEADER_H,
    paddingHorizontal: 8,
    marginBottom: 0,
  },
  brandLeft: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 1,
  },
  brandLogo: {
    height: 12,
    width: 31,
    objectFit: 'contain',
  },
  brandUrl: {
    fontSize: 5.5,
    color: '#666',
    fontFamily: 'SpaceGrotesk',
    letterSpacing: 0.3,
  },
  brandRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  brandTitle: {
    fontSize: 8,
    fontFamily: 'SpaceGrotesk',
    fontWeight: 700,
    color: '#ffffff',
  },
  brandMeta: {
    fontSize: 6,
    color: '#666',
    marginTop: 1,
  },

  // ── Column headers ──────────────────────────────────────────────────────
  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: COL_H,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  colHeaderGutter: {
    width: ID_COL,
  },
  colHeaderCell: {
    paddingLeft: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#e8e8e8',
    justifyContent: 'center',
    height: COL_H,
  },
  colHeaderText: {
    fontSize: 5.5,
    fontFamily: 'SpaceGrotesk',
    fontWeight: 700,
    color: '#aaa',
    letterSpacing: 0.8,
  },

  // ── Scene heading ───────────────────────────────────────────────────────
  sceneHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    marginTop: 6,
    minHeight: 16,
  },
  sceneIdCell: {
    width: ID_COL,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 3,
  },
  sceneIdText: {
    fontSize: 6,
    fontFamily: 'SpaceGrotesk',
    fontWeight: 700,
    color: '#999',
  },
  sceneHeadingText: {
    fontSize: 7,
    fontFamily: 'SpaceGrotesk',
    fontWeight: 700,
    color: '#ffffff',
    paddingVertical: 3,
  },

  // ── Beat rows ───────────────────────────────────────────────────────────
  beatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 18,
  },
  beatRowAlt: {
    backgroundColor: '#fafafa',
  },
  beatGutterId: {
    width: ID_COL,
    paddingTop: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  beatGutterText: {
    fontSize: 6,
    color: '#bbb',
    fontFamily: 'SpaceGrotesk',
  },
  beatCell: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
  },
  cellText: {
    fontSize: 7.5,
    color: '#222',
    lineHeight: 1.4,
    fontFamily: 'SpaceGrotesk',
  },
  cellTextMuted: {
    fontSize: 7,
    color: '#bbb',
    fontFamily: 'SpaceGrotesk',
  },
  storyboardImgRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  storyboardImg: {
    width: 48,
    height: 27,
    objectFit: 'cover',
    borderRadius: 1,
  },
});

function ColHeaders({ visibleCols, colWidths }: { visibleCols: VisibleCol[]; colWidths: number[] }) {
  return (
    <View style={s.colHeaderRow}>
      <View style={s.colHeaderGutter} />
      {visibleCols.map((col, i) => (
        <View key={col.key} style={[s.colHeaderCell, { width: colWidths[i] }]}>
          <Text style={s.colHeaderText}>{col.label}</Text>
        </View>
      ))}
    </View>
  );
}

function BeatRow({
  beat,
  sceneId,
  visibleCols,
  colWidths,
  alt,
  refsByBeat,
  framesByBeat,
  commentsMap,
}: {
  beat: ComputedScene['beats'][number];
  sceneId: string;
  visibleCols: VisibleCol[];
  colWidths: number[];
  alt: boolean;
  refsByBeat: Record<string, ScriptBeatReferenceRow[]>;
  framesByBeat: Record<string, ScriptStoryboardFrameRow[]>;
  commentsMap: Map<string, ScriptShareCommentRow[]>;
}) {
  function cellContent(col: VisibleCol): React.ReactElement {
    switch (col.key) {
      case 'audio':
        return <Text style={s.cellText}>{toPlainText(beat.audio_content)}</Text>;
      case 'visual':
        return <Text style={s.cellText}>{toPlainText(beat.visual_content)}</Text>;
      case 'notes':
        return <Text style={s.cellText}>{toPlainText(beat.notes_content)}</Text>;
      case 'reference': {
        const refs = refsByBeat[beat.id] ?? [];
        return <Text style={refs.length ? s.cellText : s.cellTextMuted}>{refs.length ? `${refs.length} image(s)` : '—'}</Text>;
      }
      case 'storyboard': {
        const frames = framesByBeat[beat.id] ?? [];
        if (frames.length === 0) return <Text style={s.cellTextMuted}>—</Text>;
        return (
          <View style={s.storyboardImgRow}>
            {frames.map((f) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Image key={f.id} src={f.image_url} style={s.storyboardImg as any} />
            ))}
          </View>
        );
      }
      case 'comments': {
        const count = commentsMap.get(beat.id)?.length ?? 0;
        return <Text style={count ? s.cellText : s.cellTextMuted}>{count ? `${count} comment(s)` : '—'}</Text>;
      }
      default:
        return <Text style={s.cellTextMuted}>—</Text>;
    }
  }

  return (
    <View style={[s.beatRow, alt ? s.beatRowAlt : {}]}>
      <View style={s.beatGutterId}>
        <Text style={s.beatGutterText}>{sceneId}</Text>
      </View>
      {visibleCols.map((col, i) => (
        <View key={col.key} style={[s.beatCell, { width: colWidths[i] }]}>
          {cellContent(col)}
        </View>
      ))}
    </View>
  );
}

export function ScriptExportDocument({
  script,
  versionLabel,
  computedScenes,
  visibleCols,
  refsByBeat,
  storyboardFrames,
  commentsMap,
  logoDataUrl,
}: ScriptExportProps) {
  const colWidths = computeColWidths(visibleCols);
  const exportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const framesByBeat: Record<string, ScriptStoryboardFrameRow[]> = {};
  for (const f of storyboardFrames) {
    if (!f.beat_id || !f.is_active || f.is_archived) continue;
    if (!framesByBeat[f.beat_id]) framesByBeat[f.beat_id] = [];
    framesByBeat[f.beat_id].push(f);
  }

  return (
    <Document title={`${script.title} — ${versionLabel}`}>
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* Fixed header — branding + column labels, repeats every page */}
        <View style={s.fixedHeader} fixed>
          <View style={s.brandRow}>
            <View style={s.brandLeft}>
              {logoDataUrl
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? <Image src={logoDataUrl} style={s.brandLogo as any} />
                : <Text style={[s.brandTitle, { fontSize: 7 }]}>FRIENDS & ALLIES</Text>
              }
              <Text style={s.brandUrl}>fna.wtf</Text>
            </View>
            <View style={s.brandRight}>
              <Text style={s.brandTitle}>{script.title}</Text>
              <Text style={s.brandMeta} render={({ pageNumber, totalPages }) =>
                `${versionLabel} · ${exportDate} · Page ${pageNumber}/${totalPages}`
              } />
            </View>
          </View>
          <ColHeaders visibleCols={visibleCols} colWidths={colWidths} />
        </View>

        {/* Scenes */}
        {computedScenes.map((scene) => (
          <View key={scene.id} wrap={false}>
            <View style={s.sceneHeading}>
              <View style={s.sceneIdCell}>
                <Text style={s.sceneIdText}>{scene.sceneNumber}</Text>
              </View>
              <Text style={s.sceneHeadingText}>
                {scene.int_ext} {scene.location_name} — {scene.time_of_day}
              </Text>
            </View>

            {scene.beats.map((beat, bi) => (
              <BeatRow
                key={beat.id}
                beat={beat}
                sceneId={scene.beats.length > 1 ? `${scene.sceneNumber}${toBeatLetter(bi)}` : String(scene.sceneNumber)}
                visibleCols={visibleCols}
                colWidths={colWidths}
                alt={bi % 2 === 1}
                refsByBeat={refsByBeat}
                framesByBeat={framesByBeat}
                commentsMap={commentsMap}
              />
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
