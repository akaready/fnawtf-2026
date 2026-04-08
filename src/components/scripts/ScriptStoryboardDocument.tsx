import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type {
  ComputedScene,
  ScriptRow,
  ScriptBeatReferenceRow,
  ScriptStoryboardFrameRow,
  ScriptColumnConfig,
  ScriptShareCommentRow,
} from '@/types/scripts';
import { stripMarkdown } from '@/lib/scripts/parseContent';

export interface ScriptStoryboardDocProps {
  script: ScriptRow;
  versionLabel: string;
  computedScenes: ComputedScene[];
  columnConfig: ScriptColumnConfig;
  refsByBeat: Record<string, ScriptBeatReferenceRow[]>;
  storyboardFrames: ScriptStoryboardFrameRow[];
  commentsMap: Map<string, ScriptShareCommentRow[]>;
  logoDataUrl?: string;
}

function toPlainText(md: string): string {
  return stripMarkdown(md).replace(/\s+/g, ' ').trim();
}

// Convert 0-based beat index to letter label: 0→A, 1→B, …, 25→Z, 26→AA
function toBeatLetter(i: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (i < 26) return letters[i];
  return letters[Math.floor(i / 26) - 1] + letters[i % 26];
}

// ── Geometry ──────────────────────────────────────────────────────────────
const MARGIN = 30;
const HEADER_H = 30;
const PAGE_PAD_TOP = MARGIN + HEADER_H;
const PAGE_WIDTH = 841.89;   // landscape A4
const COLS = 3;
const CARD_GAP = 8;
const CONTENT_W = PAGE_WIDTH - MARGIN * 2;
const CARD_W = (CONTENT_W - CARD_GAP * (COLS - 1)) / COLS;   // ≈ 253.9pt
const IMG_H = Math.round(CARD_W * 9 / 16);                   // ≈ 143pt (16:9)

const s = StyleSheet.create({
  page: {
    fontFamily: 'SpaceGrotesk',
    fontSize: 7,
    paddingTop: PAGE_PAD_TOP,
    paddingBottom: MARGIN,
    paddingLeft: MARGIN,
    paddingRight: MARGIN,
    backgroundColor: '#ffffff',
  },

  // ── Fixed header ──────────────────────────────────────────────────────
  fixedHeader: {
    position: 'absolute',
    top: MARGIN,
    left: MARGIN,
    right: MARGIN,
    height: HEADER_H,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 8,
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

  // ── Scene layout ──────────────────────────────────────────────────────
  scenesContainer: {
    flexDirection: 'column',
  },
  sceneHeading: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sceneHeadingText: {
    fontSize: 7,
    fontFamily: 'SpaceGrotesk',
    fontWeight: 700,
    color: '#ffffff',
  },
  cardRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    marginTop: CARD_GAP,
  },

  // ── Beat card ─────────────────────────────────────────────────────────
  card: {
    width: CARD_W,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 2,
    overflow: 'hidden',
  },

  // ── Storyboard image area ─────────────────────────────────────────────
  imgBox: {
    width: CARD_W,
    height: IMG_H,
  },
  imgRow: {
    flexDirection: 'row',
    width: CARD_W,
    height: IMG_H,
  },
  imgCol: {
    flexDirection: 'column',
  },

  // ── Text area ─────────────────────────────────────────────────────────
  textArea: {
    paddingHorizontal: 5,
    paddingTop: 4,
    paddingBottom: 6,
  },
  beatLabel: {
    fontSize: 6,
    fontFamily: 'SpaceGrotesk',
    fontWeight: 700,
    color: '#888',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  audioText: {
    fontSize: 7,
    color: '#222',
    lineHeight: 1.35,
    fontFamily: 'SpaceGrotesk',
  },
  extraLabel: {
    fontSize: 5.5,
    fontFamily: 'SpaceGrotesk',
    fontWeight: 700,
    color: '#aaa',
    letterSpacing: 0.5,
    marginTop: 3,
  },
  extraText: {
    fontSize: 6,
    color: '#555',
    lineHeight: 1.3,
    fontFamily: 'SpaceGrotesk',
  },
});

// ── Storyboard multi-frame renderer ──────────────────────────────────────

function StoryboardCell({ frames }: { frames: ScriptStoryboardFrameRow[] }) {
  if (frames.length === 0) {
    return <View style={{ width: CARD_W, height: IMG_H }} />;
  }

  if (frames.length === 1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Image src={frames[0].image_url} style={{ width: CARD_W, height: IMG_H, objectFit: 'cover' } as any} />;
  }

  if (frames.length === 2) {
    const w = CARD_W / 2;
    return (
      <View style={s.imgRow}>
        {frames.map(f => (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <Image key={f.id} src={f.image_url} style={{ width: w, height: IMG_H, objectFit: 'cover' } as any} />
        ))}
      </View>
    );
  }

  if (frames.length === 3) {
    const leftW = Math.round(CARD_W * 2 / 3);
    const rightW = CARD_W - leftW;
    const halfH = Math.round(IMG_H / 2);
    return (
      <View style={s.imgRow}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Image src={frames[0].image_url} style={{ width: leftW, height: IMG_H, objectFit: 'cover' } as any} />
        <View style={[s.imgCol, { width: rightW }]}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Image src={frames[1].image_url} style={{ width: rightW, height: halfH, objectFit: 'cover' } as any} />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Image src={frames[2].image_url} style={{ width: rightW, height: IMG_H - halfH, objectFit: 'cover' } as any} />
        </View>
      </View>
    );
  }

  // 4 frames: 2×2 grid
  const hw = Math.round(CARD_W / 2);
  const hh = Math.round(IMG_H / 2);
  return (
    <View style={{ width: CARD_W, height: IMG_H, flexDirection: 'row', flexWrap: 'wrap' }}>
      {frames.slice(0, 4).map(f => (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <Image key={f.id} src={f.image_url} style={{ width: hw, height: hh, objectFit: 'cover' } as any} />
      ))}
    </View>
  );
}

// ── Beat card ─────────────────────────────────────────────────────────────

function BeatCard({
  beat,
  bi,
  sceneNumber,
  frames,
  columnConfig,
  refsByBeat,
  commentsMap,
}: {
  beat: ComputedScene['beats'][number];
  bi: number;
  sceneNumber: number;
  frames: ScriptStoryboardFrameRow[];
  columnConfig: ScriptColumnConfig;
  refsByBeat: Record<string, ScriptBeatReferenceRow[]>;
  commentsMap: Map<string, ScriptShareCommentRow[]>;
}) {
  const label = `${sceneNumber}·${toBeatLetter(bi)}`;
  const audio = toPlainText(beat.audio_content);

  return (
    <View style={s.card}>
      <View style={s.imgBox}>
        <StoryboardCell frames={frames} />
      </View>
      <View style={s.textArea}>
        <Text style={s.beatLabel}>{label}</Text>
        {audio ? (
          <View>
            <Text style={s.extraLabel}>AUDIO</Text>
            <Text style={s.audioText}>{audio}</Text>
          </View>
        ) : null}
        {columnConfig.visual && (() => {
          const t = toPlainText(beat.visual_content);
          return t ? (
            <View>
              <Text style={s.extraLabel}>VISUAL</Text>
              <Text style={s.extraText}>{t}</Text>
            </View>
          ) : null;
        })()}
        {columnConfig.notes && (() => {
          const t = toPlainText(beat.notes_content);
          return t ? (
            <View>
              <Text style={s.extraLabel}>NOTES</Text>
              <Text style={s.extraText}>{t}</Text>
            </View>
          ) : null;
        })()}
        {columnConfig.reference && (() => {
          const count = (refsByBeat[beat.id] ?? []).length;
          return count > 0 ? (
            <Text style={[s.extraLabel, { marginTop: 3 }]}>{count} ref image{count !== 1 ? 's' : ''}</Text>
          ) : null;
        })()}
        {columnConfig.comments && (() => {
          const count = commentsMap.get(beat.id)?.length ?? 0;
          return count > 0 ? (
            <Text style={[s.extraLabel, { marginTop: 3 }]}>{count} comment{count !== 1 ? 's' : ''}</Text>
          ) : null;
        })()}
      </View>
    </View>
  );
}

// ── Main document ─────────────────────────────────────────────────────────

export function ScriptStoryboardDocument({
  script,
  versionLabel,
  computedScenes,
  columnConfig,
  refsByBeat,
  storyboardFrames,
  commentsMap,
  logoDataUrl,
}: ScriptStoryboardDocProps) {
  const exportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // Build framesByBeat lookup
  const framesByBeat: Record<string, ScriptStoryboardFrameRow[]> = {};
  for (const f of storyboardFrames) {
    if (!f.beat_id || !f.is_active || f.is_archived) continue;
    if (!framesByBeat[f.beat_id]) framesByBeat[f.beat_id] = [];
    framesByBeat[f.beat_id].push(f);
  }
  for (const id of Object.keys(framesByBeat)) {
    framesByBeat[id].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  }

  const scenes = computedScenes.filter(scene => scene.beats.length > 0);

  return (
    <Document title={`${script.title} — ${versionLabel} — Storyboards`}>
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* Fixed header — repeats every page */}
        <View style={s.fixedHeader} fixed>
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

        {/* Scenes */}
        <View style={s.scenesContainer}>
          {scenes.map((scene, sceneIdx) => {
            const sceneName = `${scene.int_ext} ${scene.location_name}`;
            const headingLabel = `${scene.sceneNumber}  ${sceneName} — ${scene.time_of_day}`;

            // Chunk beats into rows of COLS
            const rows: Array<{ beat: ComputedScene['beats'][number]; bi: number }[]> = [];
            for (let i = 0; i < scene.beats.length; i += COLS) {
              rows.push(scene.beats.slice(i, i + COLS).map((beat, j) => ({ beat, bi: i + j })));
            }

            const cardProps = (beat: ComputedScene['beats'][number], bi: number) => ({
              beat,
              bi,
              sceneNumber: scene.sceneNumber,
              frames: framesByBeat[beat.id] ?? [],
              columnConfig,
              refsByBeat,
              commentsMap,
            });

            return (
              <View key={scene.id} style={sceneIdx > 0 ? { marginTop: CARD_GAP } : undefined}>
                {/* Heading + first card row: always stay together on the same page */}
                <View wrap={false}>
                  <View style={s.sceneHeading}>
                    <Text style={s.sceneHeadingText}>{headingLabel}</Text>
                  </View>
                  <View style={s.cardRow}>
                    {rows[0].map(({ beat, bi }) => (
                      <BeatCard key={beat.id} {...cardProps(beat, bi)} />
                    ))}
                  </View>
                </View>

                {/* Remaining rows flow normally */}
                {rows.slice(1).map((row, ri) => (
                  <View key={ri} style={s.cardRow}>
                    {row.map(({ beat, bi }) => (
                      <BeatCard key={beat.id} {...cardProps(beat, bi)} />
                    ))}
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}
