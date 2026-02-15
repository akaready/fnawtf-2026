# Osmo Supply Asset Extraction - Plan

## Context

We have a raw data dump of Osmo Supply assets in `assets/demo.txt` (~447KB). The goal is to extract each animation/component into its own markdown file with proper YAML frontmatter.

## Current State

- **Input**: `assets/demo.txt` - Contains ~140+ assets across 16 categories
- **Existing Output**: 24 incomplete files in `/assets/` - Missing HTML, CSS, JS code sections
- **Extraction Script**: `scripts/extract-osmo-assets.js` - Exists but output is incomplete

## Problem

The existing files in `/assets/` have frontmatter but are missing the implementation code (HTML, CSS, JavaScript). The demo.txt contains all this data but it's not being extracted properly.

## Goal

Create a robust extraction process that:
1. Reads `assets/demo.txt`
2. Extracts ALL code sections for each asset
3. Generates individual markdown files with complete frontmatter + code

## YAML Frontmatter Schema

Each output file should have:

```yaml
---
title: "Asset Title"
category: "Category Name"
author: "The Vault"
lastUpdated: "YYYY-MM-DD"
source: "https://osmo.supply"
externalScripts:
  - "https://cdn.example.com/script.js"
tags:
  - gsap
  - animation
  - hover
---
```

## File Structure

Each markdown file should contain:

```markdown
---
title: "Directional Button Hover"
category: "Buttons"
author: "The Vault"
lastUpdated: "2024-01-15"
source: "https://osmo.supply"
externalScripts:
  - "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"
tags:
  - gsap
  - button
  - hover
---

## External Scripts

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
```

## HTML

```html
<!-- HTML code here -->
```

## CSS

```css
/* CSS code here */
```

## JavaScript

```javascript
// JavaScript code here
```

## Implementation Notes

Any additional implementation details from the source...
```

## Extraction Pattern from demo.txt

Based on analyzing `demo.txt`:

1. **Asset starts** with: `The Vault` followed by category name
2. **Title** appears after category (usually line after)
3. **Step 1: Add HTML** - Contains HTML code
4. **Step 2: Add CSS** - Contains CSS code
5. **Step 3: Add Javascript** - Contains JavaScript code
6. **External Scripts** - Between "Setup: External Scripts" and "Step 1"
7. **Related resources** - End of asset section
8. **Resource details** - Contains lastUpdated date, category, author, tags

## Categories (from demo.txt)

- Buttons (12)
- Cursor Animations (7)
- Dropdowns & Information (4)
- Filters & Sorting (2)
- Forms (6)
- Gallery & Images (9)
- Gimmicks (6)
- Hover Interactions (5)
- Loaders (8)
- Navigation (7)
- Page Transitions (14)
- Scroll Animations (4)
- Sections & Layouts (14)
- Sliders & Marquees (10)
- Text Animations (17)
- Utilities & Scripts (13)

## Action Items

1. **Update extraction script** to properly parse and extract:
   - External scripts (before "Step 1")
   - HTML code (between "Step 1" and "Step 2")
   - CSS code (between "Step 2" and "Step 3")
   - JavaScript code (between "Step 3" and "Related resources")
   - Metadata (author, date, tags)

2. **Regenerate all asset files** with complete code

3. **Verify output** matches the desired schema

## Output Location

All files should be created in `/assets/` directory with kebab-case filenames:
- `directional-button-hover.md`
- `burger-menu-button.md`
- `underline-link-animation.md`
- etc.

## Notes

- Some assets may not have JavaScript (CSS-only animations)
- Some assets may have external scripts, some may not
- Tags need to be extracted from the "Resource details" section
- Author is typically "The Vault" or "Adam Richman"
