import DOMPurify from 'dompurify';
import type { ScriptCharacterRow, ScriptTagRow, ScriptLocationRow, ScriptProductRow } from '@/types/scripts';

/**
 * Convert simple markdown content to HTML for contentEditable display.
 * Supports: **bold**, @[Name](id) character/location mentions, #[slug] tag references.
 * Output is sanitized via DOMPurify.
 */
export function markdownToHtml(
  md: string,
  characters: ScriptCharacterRow[],
  tags: ScriptTagRow[],
  locations: ScriptLocationRow[] = [],
  products: ScriptProductRow[] = []
): string {
  let html = escapeHtml(md);

  // Bold: **text** → <strong>text</strong>
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Inline Lucide icons for mention types — exact SVGs from the toolbar
  const iconWrap = 'display:inline-block;vertical-align:-1px;margin-right:2px;';
  const castIcon = (color: string) =>
    `<span style="${iconWrap}"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></span>`;
  const locIcon = (color: string) =>
    `<span style="${iconWrap}"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></span>`;
  const prodIcon = (color: string) =>
    `<span style="${iconWrap}"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"></path><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" x2="12" y1="22" y2="12"></line></svg></span>`;

  // Mention references: @[Name](id) → icon + colored span (characters, locations, or products)
  html = html.replace(/@\[(.+?)\]\((.+?)\)/g, (_match, name, id) => {
    const loc = locations.find(l => l.id === id);
    if (loc) {
      return `<span class="script-mention script-location" data-location-id="${id}" style="color:${loc.color};font-weight:600;white-space:nowrap" contenteditable="false">${locIcon(loc.color)}${name}</span>`;
    }
    const product = products.find(p => p.id === id);
    if (product) {
      const color = product.color ?? '#a14dfd';
      return `<span class="script-mention script-product" data-product-id="${id}" style="color:${color};font-weight:600;white-space:nowrap" contenteditable="false">${prodIcon(color)}${name}</span>`;
    }
    const char = characters.find(c => c.id === id);
    if (char) {
      return `<span class="script-mention" data-character-id="${id}" style="color:${char.color};font-weight:600;white-space:nowrap" contenteditable="false">${castIcon(char.color)}${name}</span>`;
    }
    // No match found — show warning
    const warnIcon = `<span style="${iconWrap}"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg></span>`;
    return `<span class="script-mention script-broken" style="color:#f59e0b;font-weight:600;opacity:0.7;white-space:nowrap" contenteditable="false" title="Reference not found: ${name}">${warnIcon}${name}</span>`;
  });

  // Tag references: #[slug] → colored span
  html = html.replace(/#\[(.+?)\]/g, (_match, slug) => {
    const tag = tags.find(t => t.slug === slug);
    const color = tag?.color ?? '#38bdf8';
    const name = tag?.name ?? slug;
    return `<span class="script-tag" data-tag-slug="${slug}" style="color:${color};font-weight:600" contenteditable="false">#${name}</span>`;
  });

  // Wrap lines in block elements: ALL CAPS lines get scene-heading styling,
  // consecutive non-heading lines get paragraph styling.
  const lines = html.split('\n');
  const blocks: string[] = [];
  let paraLines: string[] = [];

  const flushParagraph = () => {
    if (paraLines.length > 0) {
      blocks.push(`<div class="scratch-paragraph">${paraLines.join('<br>')}</div>`);
      paraLines = [];
    }
  };

  for (const line of lines) {
    // Strip HTML tags to get plain text for ALL CAPS detection
    const plain = line.replace(/<[^>]+>/g, '').replace(/^@/, '').trim();
    const isSceneHeading = plain.length > 0 && /[A-Z]{2,}/.test(plain) && !/[a-z]/.test(plain);

    if (isSceneHeading) {
      flushParagraph();
      blocks.push(`<div class="scratch-scene-heading">${line}</div>`);
    } else {
      paraLines.push(line);
    }
  }
  flushParagraph();

  html = blocks.join('');

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'b', 'br', 'span', 'div', 'svg', 'path', 'circle', 'polyline', 'line'],
    ALLOWED_ATTR: ['class', 'data-character-id', 'data-location-id', 'data-product-id', 'data-tag-slug', 'style', 'contenteditable', 'xmlns', 'width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'cx', 'cy', 'r', 'd', 'points', 'x1', 'x2', 'y1', 'y2'],
  });
}

/**
 * Convert contentEditable HTML back to simple markdown for storage.
 */
export function htmlToMarkdown(html: string): string {
  let md = html;

  // Scene heading and paragraph divs → newlines
  md = md.replace(/<div class="scratch-scene-heading">([\s\S]*?)<\/div>/gi, '$1\n');
  md = md.replace(/<div class="scratch-paragraph">([\s\S]*?)<\/div>/gi, '$1\n');

  // <br> and block boundaries → newlines
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/div>\s*<div>/gi, '\n');
  md = md.replace(/<\/p>\s*<p>/gi, '\n\n');
  md = md.replace(/<\/?(?:div|p)>/gi, '');

  // <strong>/<b> → **bold**
  md = md.replace(/<(?:strong|b)>(.*?)<\/(?:strong|b)>/gi, '**$1**');

  // Strip inline SVG icons from mentions before extracting names
  md = md.replace(/<span[^>]*style="[^"]*display:inline-block[^"]*"[^>]*><svg[^]*?<\/svg><\/span>/gi, '');

  // Location mention spans → @[Name](id)
  md = md.replace(/<span[^>]*class="script-mention script-location"[^>]*data-location-id="([^"]*)"[^>]*>([^<]*)<\/span>/gi,
    (_match, id, name) => `@[${name.trim()}](${id})`
  );

  // Product mention spans → @[Name](id)
  md = md.replace(/<span[^>]*class="script-mention script-product"[^>]*data-product-id="([^"]*)"[^>]*>([^<]*)<\/span>/gi,
    (_match, id, name) => `@[${name.trim()}](${id})`
  );

  // Character mention spans → @[Name](id)
  md = md.replace(/<span[^>]*class="script-mention"[^>]*data-character-id="([^"]*)"[^>]*>([^<]*)<\/span>/gi,
    (_match, id, name) => `@[${name.trim()}](${id})`
  );

  // Tag spans → #[slug]
  md = md.replace(/<span[^>]*class="script-tag"[^>]*data-tag-slug="([^"]*)"[^>]*>[^<]*<\/span>/gi,
    (_match, slug) => `#[${slug}]`
  );

  // Strip any remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  md = decodeHtml(md);

  return md.replace(/\n+$/, '');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Extract plain text from markdown content (for search/preview).
 */
export function stripMarkdown(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/@\[(.+?)\]\(.+?\)/g, '@$1')
    .replace(/#\[(.+?)\]/g, '#$1');
}
