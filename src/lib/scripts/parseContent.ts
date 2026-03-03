import DOMPurify from 'dompurify';
import type { ScriptCharacterRow, ScriptTagRow, ScriptLocationRow } from '@/types/scripts';

/**
 * Convert simple markdown content to HTML for contentEditable display.
 * Supports: **bold**, @[Name](id) character/location mentions, #[slug] tag references.
 * Output is sanitized via DOMPurify.
 */
export function markdownToHtml(
  md: string,
  characters: ScriptCharacterRow[],
  tags: ScriptTagRow[],
  locations: ScriptLocationRow[] = []
): string {
  let html = escapeHtml(md);

  // Bold: **text** → <strong>text</strong>
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Mention references: @[Name](id) → colored span (characters or locations)
  html = html.replace(/@\[(.+?)\]\((.+?)\)/g, (_match, name, id) => {
    const char = characters.find(c => c.id === id);
    const loc = locations.find(l => l.id === id);
    if (loc) {
      return `<span class="script-mention script-location" data-location-id="${id}" style="color:${loc.color};font-weight:600" contenteditable="false">@${name}</span>`;
    }
    const color = char?.color ?? '#a14dfd';
    return `<span class="script-mention" data-character-id="${id}" style="color:${color};font-weight:600" contenteditable="false">@${name}</span>`;
  });

  // Tag references: #[slug] → colored span
  html = html.replace(/#\[(.+?)\]/g, (_match, slug) => {
    const tag = tags.find(t => t.slug === slug);
    const color = tag?.color ?? '#38bdf8';
    const name = tag?.name ?? slug;
    return `<span class="script-tag" data-tag-slug="${slug}" style="color:${color};font-weight:600" contenteditable="false">#${name}</span>`;
  });

  // Newlines → <br>
  html = html.replace(/\n/g, '<br>');

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'b', 'br', 'span'],
    ALLOWED_ATTR: ['class', 'data-character-id', 'data-location-id', 'data-tag-slug', 'style', 'contenteditable'],
  });
}

/**
 * Convert contentEditable HTML back to simple markdown for storage.
 */
export function htmlToMarkdown(html: string): string {
  let md = html;

  // <br> and block boundaries → newlines
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/div>\s*<div>/gi, '\n');
  md = md.replace(/<\/p>\s*<p>/gi, '\n\n');
  md = md.replace(/<\/?(?:div|p)>/gi, '');

  // <strong>/<b> → **bold**
  md = md.replace(/<(?:strong|b)>(.*?)<\/(?:strong|b)>/gi, '**$1**');

  // Location mention spans → @[Name](id)
  md = md.replace(/<span[^>]*class="script-mention script-location"[^>]*data-location-id="([^"]*)"[^>]*>@([^<]*)<\/span>/gi,
    (_match, id, name) => `@[${name}](${id})`
  );

  // Character mention spans → @[Name](id)
  md = md.replace(/<span[^>]*class="script-mention"[^>]*data-character-id="([^"]*)"[^>]*>@([^<]*)<\/span>/gi,
    (_match, id, name) => `@[${name}](${id})`
  );

  // Tag spans → #[slug]
  md = md.replace(/<span[^>]*class="script-tag"[^>]*data-tag-slug="([^"]*)"[^>]*>[^<]*<\/span>/gi,
    (_match, slug) => `#[${slug}]`
  );

  // Strip any remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  md = decodeHtml(md);

  return md;
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
