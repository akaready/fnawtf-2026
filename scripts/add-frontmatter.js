const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../assets/v2');

// Map filenames to categories based on demo.txt
const categoryMap = {
  '404-error-minigame.md': 'Gimmicks',
  'burger-menu-button.md': 'Navigation',
  'centered-looping-slider.md': 'Sliders & Marquees',
  'css-marquee.md': 'Sliders & Marquees',
  'custom-bunny-hls-lightbox-advanced.md': 'Video & Audio',
  'custom-bunny-hls-player-advanced.md': 'Video & Audio',
  'directional-button-hover.md': 'Buttons',
  'directional-list-hover.md': 'Hover Interactions',
  'elements-reveal-on-scroll.md': 'Scroll Animations',
  'global-parallax-setup.md': 'Scroll Animations',
  'live-form-validation-advanced.md': 'Forms',
  'live-search-listjs.md': 'Filters & Sorting',
  'logo-wall-cycle.md': 'Gallery & Images',
  'masked-text-reveal-gsap-splittext.md': 'Text Animations',
  'multi-filter-setup-multi-match.md': 'Filters & Sorting',
  'page-name-transition-wipe.md': 'Page Transitions',
  'play-video-on-hover-lazy.md': 'Video & Audio',
  'rotating-text.md': 'Text Animations',
  'scroll-progress-bar.md': 'Scroll Animations',
  'sticky-features.md': 'Sections & Layouts',
  'underline-link-animation.md': 'Buttons',
  'variable-font-weight-hover.md': 'Hover Interactions',
  'willem-loading-animation.md': 'Loaders'
};

// Read all markdown files
const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.md'));

files.forEach(filename => {
  const filepath = path.join(assetsDir, filename);
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Use filename as title (without .md extension, converted to Title Case)
  const title = filename.replace('.md', '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Get category from map or default
  const category = categoryMap[filename] || 'Utilities & Scripts';
  
  // Try to extract author
  let author = 'The Vault';
  const authorMatch = content.match(/Author[:\s]+([^\n]+)/i);
  if (authorMatch) {
    author = authorMatch[1].trim();
  }
  
  // Try to extract lastUpdated
  let lastUpdated = new Date().toISOString().split('T')[0];
  const dateMatch = content.match(/Last updated[:\s]+([^\n]+)/i);
  if (dateMatch) {
    const dateStr = dateMatch[1].trim();
    const parsed = new Date(dateStr);
    if (!isNaN(parsed)) {
      lastUpdated = parsed.toISOString().split('T')[0];
    }
  }
  
  // Check for external scripts
  const hasExternalScripts = content.includes('## External Scripts');
  
  // Build frontmatter - escape ampersands in category for YAML
const safeCategory = category.replace(/&/g, '&');
const frontmatter = `---
title: "${title}"
category: "${safeCategory}"
author: "${author}"
lastUpdated: "${lastUpdated}"
source: "https://osmo.supply"
externalScripts: ${hasExternalScripts ? 'true' : 'false'}
tags: []
---

`;
  
  // Remove existing frontmatter if present (between --- and --- at start)
  content = content.replace(/^---\n[\s\S]*?---\n\n?/, '');
  
  // Prepend new frontmatter
  content = frontmatter + content;
  
  fs.writeFileSync(filepath, content);
  console.log(`Updated: ${filename} (${title})`);
});

console.log(`\nDone! Processed ${files.length} files.`);
