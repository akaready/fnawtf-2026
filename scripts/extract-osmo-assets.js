#!/usr/bin/env node

/**
 * Osmo Supply Asset Extraction Script
 * 
 * Reads assets/demo.txt and generates individual markdown files in /assets/
 * with YAML frontmatter metadata.
 * 
 * Usage: node scripts/extract-osmo-assets.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = path.join(__dirname, '../assets/demo.txt');
const OUTPUT_DIR = path.join(__dirname, '../assets/v2');
const SOURCE_URL = 'https://osmo.supply';

// Categories to identify real assets (vs pagination markers)
const CATEGORIES = [
  'Buttons', 'Cursor Animations', 'Dropdowns & Information', 'Filters & Sorting',
  'Forms', 'Gallery & Images', 'Gimmicks', 'Hover Interactions', 'Loaders',
  'Navigation', 'Page Transitions', 'Scroll Animations', 'Sections & Layouts',
  'Sliders & Marquees', 'Text Animations', 'Utilities & Scripts', 'Video & Audio'
];

function escYaml(str) {
  return String(str ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Convert title to kebab-case filename
 */
function toKebabCase(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse date string to YYYY-MM-DD format
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const months = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };
  const match = dateStr.toLowerCase().match(/(\w+)\s+(\d+),\s+(\d+)/);
  if (match) {
    const month = months[match[1]] || '01';
    const day = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return null;
}

/**
 * Extract external script URLs from content
 */
function extractExternalScripts(content) {
  const scriptRegex = /<script\s+src="([^"]+)"><\/script>/g;
  const scripts = [];
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    scripts.push(match[1]);
  }
  return scripts;
}

/**
 * Split content into asset sections
 */
function splitIntoAssetSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = [];
  let inAsset = false;
  let lastVaultIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect start of new asset (The Vault followed by a category)
    if (line === 'The Vault' && i + 1 < lines.length) {
      const nextLine = lines[i + 1]?.trim();
      if (nextLine && CATEGORIES.includes(nextLine)) {
        // Save previous section if exists
        if (currentSection.length > 0 && inAsset) {
          sections.push(currentSection.join('\n'));
        }
        currentSection = [line];
        inAsset = true;
        lastVaultIndex = i;
      }
    } else if (inAsset) {
      currentSection.push(line);
    }
  }
  
  // Don't forget the last section
  if (currentSection.length > 0 && inAsset) {
    sections.push(currentSection.join('\n'));
  }
  
  return sections;
}

/**
 * Parse a single asset section
 */
function parseAssetSection(sectionContent) {
  const lines = sectionContent.split('\n').map(l => l.trim()).filter(l => l);
  
  // Extract title (first non-empty line after The Vault + category)
  let title = '';
  let category = '';
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === 'The Vault' && i + 1 < lines.length) {
      category = lines[i + 1];
      // Title is usually 2 lines after category
      if (i + 2 < lines.length) {
        title = lines[i + 2];
        break;
      }
    }
  }
  
  if (!title) {
    console.log('Could not find title in section, skipping...');
    return null;
  }
  
  // Extract code blocks
  let htmlCode = '';
  let cssCode = '';
  let jsCode = '';
  let externalScripts = [];
  let description = '';
  
  // Find step sections (allow assets that may not include CSS step)
  const htmlStart = sectionContent.indexOf('Step 1: Add HTML');
  const step2Css = sectionContent.indexOf('Step 2: Add CSS');
  const step2Js = sectionContent.indexOf('Step 2: Add Javascript');
  const htmlEnd = step2Css !== -1 ? step2Css : step2Js;
  const cssStart = step2Css;
  const cssEnd = sectionContent.indexOf('Step 3: Add Javascript');
  const jsStart = cssEnd !== -1 ? cssEnd : step2Js;
  const jsEnd = sectionContent.indexOf('Related resources');
  const implStart = sectionContent.indexOf('Implementation');
  
  // Extract HTML (between Step 1 and Step 2)
  if (htmlStart !== -1 && htmlEnd !== -1) {
    let htmlBlock = sectionContent.substring(htmlStart, htmlEnd);
    // Find "Copy" and take everything after it until next "Step"
    const copyMatch = htmlBlock.match(/Copy\n([\s\S]*?)(?=Step|$)/);
    if (copyMatch) {
      htmlCode = copyMatch[1].trim();
    }
  }
  
  // Extract CSS (between Step 2 and Step 3)
  if (cssStart !== -1 && cssEnd !== -1) {
    let cssBlock = sectionContent.substring(cssStart, cssEnd);
    const copyMatch = cssBlock.match(/Copy\n([\s\S]*?)(?=Step|$)/);
    if (copyMatch) {
      cssCode = copyMatch[1].trim();
    }
  }
  
  // Extract JavaScript (between JS step and Related resources/Implementation)
  if (jsStart !== -1) {
    let jsBlock = sectionContent.substring(jsStart, jsEnd !== -1 ? jsEnd : sectionContent.length);
    const copyMatch = jsBlock.match(/Copy\n([\s\S]*?)(?=Related resources|Implementation|Resource details|$)/);
    if (copyMatch) {
      jsCode = copyMatch[1].trim();
    }
  }
  
  // Check for external scripts section
  const scriptsMatch = sectionContent.match(/Setup: External Scripts\n([\s\S]*?)(?=Step)/);
  if (scriptsMatch) {
    externalScripts = extractExternalScripts(scriptsMatch[1]);
  }
  
  // Extract implementation body
  let implementation = '';
  if (implStart !== -1) {
    const implEndCandidates = [
      sectionContent.indexOf('Related resources', implStart),
      sectionContent.indexOf('Resource details', implStart),
      sectionContent.indexOf('The Vault', implStart + 1)
    ].filter(i => i !== -1);
    const implEnd = implEndCandidates.length ? Math.min(...implEndCandidates) : sectionContent.length;
    let implBlock = sectionContent.substring(implStart + 'Implementation'.length, implEnd).trim();
    implementation = implBlock;
    const firstMeaningfulLine = implBlock
      .split('\n')
      .map(l => l.trim())
      .find(l => l && !/^\d+\.$/.test(l));
    if (firstMeaningfulLine) {
      description = firstMeaningfulLine;
    }
  }
  
  // Extract metadata from footer
  let lastUpdated = '';
  let tags = [];
  let author = '';
  
  // Find "Last updated" section
  const lastUpdatedMatch = sectionContent.match(/Last updated\n\n(\w+ \d+, \d+)/);
  if (lastUpdatedMatch) {
    lastUpdated = parseDate(lastUpdatedMatch[1]);
  }
  
  // Find tags (lines after "Join Slack" until author name)
  const joinSlackMatch = sectionContent.match(/Join Slack\n\n([\s\S]*?)(?=\n\n(\w+ \w+))/);
  if (joinSlackMatch) {
    tags = joinSlackMatch[1]
      .split('\n')
      .map(t => t.trim())
      .filter(t => t && t.length > 0 && t.length < 30);
  }
  
  // Find author (last capitalized names, often repeated twice)
  const authorMatch = sectionContent.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)?)\n\1\s*$/m);
  if (authorMatch) {
    author = authorMatch[1];
  } else {
    // Try another pattern - just two capitalized names at end
    const simpleAuthorMatch = sectionContent.match(/([A-Z][a-z]+ [A-Z][a-z]+)\s*$/m);
    if (simpleAuthorMatch) {
      author = simpleAuthorMatch[1];
    }
  }
  
  // Get category from footer if not found in header
  if (!category) {
    const categoryMatch = sectionContent.match(/Category\n\n(\w+(?: & \w+)?)/);
    if (categoryMatch) {
      category = categoryMatch[1];
    }
  }
  
  return {
    title,
    category: category || 'Uncategorized',
    tags,
    author: author || 'Unknown',
    lastUpdated: lastUpdated || new Date().toISOString().split('T')[0],
    externalScripts,
    htmlCode,
    cssCode,
    jsCode,
    description,
    implementation
  };
}

/**
 * Generate markdown content from asset data
 */
function generateMarkdown(asset) {
  let md = `---
title: "${escYaml(asset.title)}"
category: "${escYaml(asset.category)}"
`;
  
  if (asset.tags.length > 0) {
    md += `tags:\n`;
    asset.tags.forEach(tag => {
      md += `  - "${escYaml(tag)}"\n`;
    });
  }
  
  md += `author: "${escYaml(asset.author).replace(/^\"+|\"+$/g, '')}"
lastUpdated: "${escYaml(asset.lastUpdated)}"
`;
  
  if (asset.externalScripts.length > 0) {
    md += `externalScripts:\n`;
    asset.externalScripts.forEach(script => {
      md += `  - "${escYaml(script)}"\n`;
    });
  }
  
  md += `source: "${escYaml(SOURCE_URL)}"
---

`;
  
  if (asset.description) {
    md += `${asset.description}\n\n`;
  }
  
  if (asset.externalScripts.length > 0) {
    md += `## External Scripts\n\n`;
    md += "```html\n";
    asset.externalScripts.forEach(script => {
      md += `<script src="${script}"></script>\n`;
    });
    md += "```\n\n";
  }
  
  if (asset.htmlCode) {
    md += `## HTML\n\n`;
    md += "```html\n";
    md += asset.htmlCode + "\n";
    md += "```\n\n";
  }
  
  if (asset.cssCode) {
    md += `## CSS\n\n`;
    md += "```css\n";
    md += asset.cssCode + "\n";
    md += "```\n\n";
  }
  
  if (asset.jsCode) {
    md += `## JavaScript\n\n`;
    md += "```javascript\n";
    md += asset.jsCode + "\n";
    md += "```\n";
  }

  if (asset.implementation) {
    md += `\n## Implementation\n\n`;
    md += asset.implementation.trim() + "\n";
  }
  
  return md;
}

/**
 * Main extraction function
 */
function extractAssets() {
  console.log('Starting Osmo Supply asset extraction...\n');
  
  // Read input file
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Error: Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(INPUT_FILE, 'utf-8');
  console.log(`Read ${content.length} characters from demo.txt`);
  
  // Split into asset sections
  const sections = splitIntoAssetSections(content);
  console.log(`Found ${sections.length} potential asset sections\n`);
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  let successCount = 0;
  let skipCount = 0;
  
  // Process each section
  sections.forEach((section, index) => {
    const asset = parseAssetSection(section);
    
    if (!asset || !asset.title) {
      console.log(`  [${index + 1}] Skipping invalid section`);
      skipCount++;
      return;
    }
    
    // Generate filename
    const filename = toKebabCase(asset.title) + '.md';
    const filepath = path.join(OUTPUT_DIR, filename);
    
    // Generate markdown
    const markdown = generateMarkdown(asset);
    
    // Write file
    fs.writeFileSync(filepath, markdown, 'utf-8');
    
    console.log(`  [${index + 1}] Created: ${filename}`);
    console.log(`       Title: ${asset.title}`);
    console.log(`       Category: ${asset.category}`);
    console.log(`       Author: ${asset.author}`);
    console.log(`       Tags: ${asset.tags.slice(0, 3).join(', ')}${asset.tags.length > 3 ? '...' : ''}`);
    console.log('');
    
    successCount++;
  });
  
  console.log(`\n✅ Extraction complete!`);
  console.log(`   Created: ${successCount} files`);
  console.log(`   Skipped: ${skipCount} sections`);
  console.log(`   Output directory: ${OUTPUT_DIR}`);
}

// Run the extraction
extractAssets();
