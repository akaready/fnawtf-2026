#!/usr/bin/env bash
# scrape_bts.sh — Scrape BTS images from all fna.wtf project pages
# Uses firecrawl browser to handle JS rendering; outputs JSON per project to .firecrawl/bts/
# Run from project root: bash tools/scrape_bts.sh

set -euo pipefail

OUTDIR=".firecrawl/bts"
mkdir -p "$OUTDIR"

SLUGS=(
  "tilt-5-five"
  "tidbyt-gen2"
  "lumen"
  "daybreak"
  "bread"
  "wildclean"
  "talobrush"
  "tilt-5"
  "erie"
  "nine-arches"
  "keyboardio"
  "otherlab"
  "seismic"
  "crave"
  "tidbyt"
  "lumos"
  "joue-play"
  "etcherlaser"
  "tilt5-og"
  "light-pong"
  "idem"
  "dabby"
  "lumos2"
  "negative"
  "chip"
  "lumen-og"
  "crave-og"
)

MAX_PARALLEL=5
PIDS=()

scrape_page() {
  local slug="$1"
  local outfile="$OUTDIR/${slug}.json"

  echo "⏳  Scraping: $slug"

  # Scrape with JS rendering wait + extract both markdown and links
  if firecrawl scrape "https://fna.wtf/${slug}" \
    --format markdown,links \
    --wait-for 3000 \
    -o "$outfile" 2>/dev/null; then

    # Check if we got any image-like links
    local img_count
    img_count=$(python3 -c "
import json, sys
try:
    data = json.load(open('$outfile'))
    links = data.get('links', [])
    imgs = [l for l in links if any(ext in l.lower() for ext in ['.jpg','.jpeg','.png','.webp','.gif'])]
    print(len(imgs))
except:
    print(0)
" 2>/dev/null || echo "0")

    if [ "$img_count" -gt 0 ]; then
      echo "  ✓  ${slug}: found ${img_count} image URLs"
    else
      echo "  ℹ️  ${slug}: no image URLs in links — trying browser scrape..."
      # Fallback: open in browser, wait, then scrape the rendered HTML
      firecrawl browser "open https://fna.wtf/${slug}" 2>/dev/null || true
      sleep 1
      firecrawl browser "wait 3" 2>/dev/null || true
      firecrawl browser "scrape" -o "$OUTDIR/${slug}_browser.md" 2>/dev/null || true

      # Also try including img tags explicitly
      firecrawl scrape "https://fna.wtf/${slug}" \
        --format markdown,links \
        --include-tags "img,picture,source,figure" \
        --wait-for 5000 \
        -o "$OUTDIR/${slug}_with_imgs.json" 2>/dev/null || true

      echo "  ✓  ${slug}: browser fallback saved to ${slug}_browser.md and ${slug}_with_imgs.json"
    fi
  else
    echo "  ✗  ${slug}: scrape failed"
  fi
}

# Run in parallel with max MAX_PARALLEL concurrent jobs
for slug in "${SLUGS[@]}"; do
  scrape_page "$slug" &
  PIDS+=($!)

  # Throttle to MAX_PARALLEL concurrent
  if [ ${#PIDS[@]} -ge $MAX_PARALLEL ]; then
    wait "${PIDS[0]}"
    PIDS=("${PIDS[@]:1}")
  fi
done

# Wait for remaining jobs
for pid in "${PIDS[@]}"; do
  wait "$pid"
done

echo ""
echo "🎉 Scraping complete. Results in $OUTDIR/"
echo ""
echo "Summary of image URLs found:"
python3 -c "
import json, glob, os

total_imgs = 0
projects_with_imgs = 0

for filepath in sorted(glob.glob('$OUTDIR/*.json')):
    slug = os.path.splitext(os.path.basename(filepath))[0]
    if '_browser' in slug or '_with_imgs' in slug:
        continue
    try:
        data = json.load(open(filepath))
        links = data.get('links', [])
        imgs = [l for l in links if any(ext in l.lower() for ext in ['.jpg','.jpeg','.png','.webp','.gif'])]
        if imgs:
            print(f'  {slug}: {len(imgs)} images')
            total_imgs += len(imgs)
            projects_with_imgs += 1
        else:
            print(f'  {slug}: (none — check browser fallback)')
    except Exception as e:
        print(f'  {slug}: ERROR - {e}')

print(f'')
print(f'Total: {total_imgs} images across {projects_with_imgs} projects')
"
