#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets/v2');

function hasSection(content, title) {
  const re = new RegExp(`^## ${title}$`, 'm');
  return re.test(content);
}

function extractSection(content, title) {
  const sectionRe = new RegExp(`(^## ${title}\\n[\\s\\S]*?)(?=^## \\w|\\Z)`, 'm');
  const m = content.match(sectionRe);
  return m ? m[1] : null;
}

function inferInitFunction(jsSection) {
  if (!jsSection) return null;
  const m = jsSection.match(/function\s+(init[A-Za-z0-9_]+)/);
  return m ? m[1] : null;
}

function inlineCodeify(text) {
  return text
    .replace(/\[(data-[^\]]+)\]/g, (_m, p1) => `\`${p1}\``)
    .replace(/\b(Step\s+\d+:\s+Add\s+[A-Za-z ]+)\b/g, '`$1`')
    .replace(/\b(init[A-Za-z0-9_]+)\b/g, '`$1`')
    .replace(/\b(data-[a-z0-9-]+)\b/g, '`$1`');
}

function formatImplementationSection(section) {
  const lines = section.split('\n');
  const out = [];

  for (const line of lines) {
    // Preserve headings and empty lines
    if (line.startsWith('## ') || line.trim() === '') {
      out.push(line);
      continue;
    }

    // Normalize list-like implementation lines
    if (/^\d+\.\s+/.test(line.trim())) {
      out.push(inlineCodeify(line.trim()));
      continue;
    }

    // Keep bullet lists as bullets and add inline-code formatting
    if (/^-\s+/.test(line.trim())) {
      out.push(inlineCodeify(line));
      continue;
    }

    out.push(inlineCodeify(line));
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function buildFallbackImplementation(content) {
  const hasExternal = hasSection(content, 'External Scripts');
  const hasHtml = hasSection(content, 'HTML');
  const hasCss = hasSection(content, 'CSS');
  const hasJs = hasSection(content, 'JavaScript');
  const jsSection = extractSection(content, 'JavaScript');
  const initFn = inferInitFunction(jsSection);

  const lines = ['## Implementation', ''];
  lines.push('1. Add the required structure and attributes in the `HTML` section.');

  if (hasCss) {
    lines.push('2. Add the styles from the `CSS` section to your stylesheet.');
  }

  if (hasExternal) {
    lines.push('3. Include any dependencies listed in `External Scripts` before your custom script.');
  }

  if (hasJs) {
    if (initFn) {
      lines.push(`4. Add the ` + '`JavaScript`' + ` section and initialize with \`${initFn}\` on ` + '`DOMContentLoaded`' + '.');
    } else {
      lines.push('4. Add the `JavaScript` section and initialize it on `DOMContentLoaded`.');
    }
  }

  lines.push('');
  lines.push('Use the provided `data-*` hooks exactly as shown to ensure selectors and behavior match.');

  return lines.join('\n');
}

function run() {
  const files = fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith('.md'));
  let updated = 0;

  for (const file of files) {
    const filePath = path.join(ASSETS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (hasSection(content, 'Implementation')) {
      const section = extractSection(content, 'Implementation');
      if (section) {
        const formatted = formatImplementationSection(section);
        content = content.replace(section, formatted);
      }
    } else {
      const fallback = buildFallbackImplementation(content);
      content = `${content.trimEnd()}\n\n${fallback}\n`;
    }

    fs.writeFileSync(filePath, content);
    updated++;
  }

  console.log(`Formatted/added Implementation sections in ${updated} files.`);
}

run();

