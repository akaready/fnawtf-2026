---
title: "Variable Font Weight Hover"
category: "Text Animations"
author: "The Vault"
lastUpdated: "2026-02-12"
externalScripts:
  - "https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js"
  - "https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/SplitText.min.js"
source: "https://osmo.supply"
---

This script creates a 'variable font weight hover' effect by splitting text into characters and smoothly adjusting each character’s variable weight based on how close the pointer is to it. For the effect to work, the font used on the target element needs to be a variable font that supports the wght axis.

## External Scripts

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/SplitText.min.js"></script>
```

## HTML

```html
<h1 data-font-weight-hover data-radius="400" data-min="200" data-max="1000" class="font-weight__heading">
Looooook at this!<br>It&#x27;s so smooth.
</h1>
```

## CSS

```css
.font-weight__heading {
font-variation-settings: "wght" 540;
letter-spacing: -.02em;
margin-top: 0;
margin-bottom: 0;
font-family: Haffer VF, Arial, sans-serif;
font-size: clamp(2em, 6vw, 8em);
line-height: 1;
}
```

## JavaScript

```javascript
function initVariableFontWeightHover() {
// Return on touchscreens or when user prefers reduced motion
const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (isTouch || reduceMotion) return;

const targets = document.querySelectorAll("[data-font-weight-hover]");
if (!targets.length) return;

const rangeDefault = 500;

const mouse = { x: 0, y: 0 };
let hasPointer = false;
let isActive = false;

const chars = [];

function clamp(v, min, max) {
return v < min ? min : v > max ? max : v;
}

function numAttr(el, key, fallback) {
const v = parseFloat(el.dataset[key]);
return Number.isFinite(v) ? v : fallback;
}

function readFontWeight(el) {
const fw = getComputedStyle(el).fontWeight;
const parsed = parseFloat(fw);
if (Number.isFinite(parsed)) return parsed;
if (fw === "bold") return 700;
return 400; // "normal" fallback
}

function weightFromDistance(dist, minw, maxw, range) {
if (dist >= range) return minw;
const t = 1 - dist / range;
return minw + (maxw - minw) * t;
}

function calculatePositions() {
for (let i = 0; i < chars.length; i++) {
const r = chars[i].el.getBoundingClientRect();
chars[i].cx = r.left + r.width / 2 + window.scrollX;
chars[i].cy = r.top + r.height / 2 + window.scrollY;
}
}

function splitChars(el) {
if (el.dataset.fontWeightHoverInit === "true") return null;
el.dataset.fontWeightHoverInit = "true";

el.fontWeightHoverSplit =
el.fontWeightHoverSplit ||
new SplitText(el, { type: "chars,words", charsClass: "char" });

return el.fontWeightHoverSplit.chars || [];
}

function activate() {
if (isActive) return;
isActive = true;

// Apply variable-font wiring without changing the visible weight
for (let i = 0; i < chars.length; i++) {
const d = chars[i];
d.el.style.setProperty("--wght", d.startw);
d.el.style.fontVariationSettings = "'wght' var(--wght)";
}

calculatePositions();
}

targets.forEach((el) => {
const minw = numAttr(el, "min", 300);
const maxw = numAttr(el, "max", 900);
const range = numAttr(el, "range", rangeDefault);

const split = splitChars(el);
if (!split) return;

split.forEach((ch) => {
const startw = readFontWeight(ch);

chars.push({
el: ch,
cx: 0,
cy: 0,
startw,
minw,
maxw,
range,
setw: gsap.quickTo(ch, "--wght", {
duration: 0.4,
ease: "power2.out",
overwrite: "auto",
}),
});
});
});

window.addEventListener(
"pointermove",
(e) => {
hasPointer = true;
mouse.x = e.pageX;
mouse.y = e.pageY;

if (!isActive) activate();
},
{ passive: true }
);

window.addEventListener("resize", () => isActive && calculatePositions(), { passive: true });
window.addEventListener("scroll", () => isActive && calculatePositions(), { passive: true });

if (document.fonts?.ready) {
document.fonts.ready.then(() => isActive && calculatePositions()).catch(() => {});
}

if ("ResizeObserver" in window) {
const ro = new ResizeObserver(() => isActive && calculatePositions());
targets.forEach((el) => ro.observe(el));
}

gsap.ticker.add(() => {
if (!hasPointer || !isActive) return;

for (let i = 0; i < chars.length; i++) {
const d = chars[i];
const dist = Math.hypot(mouse.x - d.cx, mouse.y - d.cy);
const w = weightFromDistance(dist, d.minw, d.maxw, d.range);
d.setw(clamp(w, d.minw, d.maxw));
}
});
}

// Init Variable Font Weight Hover
document.addEventListener("DOMContentLoaded", () => {
initVariableFontWeightHover();
});
```

## Implementation

This interaction splits text into characters and animates each character’s variable font weight based on pointer proximity.

### Target

Use `data-font-weight-hover` to mark a text element as interactive.

```html
<h2 data-font-weight-hover data-min="300" data-max="900" data-range="500">
  Variable font heading
</h2>
```

### Variable font requirement

Use a variable font that supports the `wght` axis so changes to `font-variation-settings` can interpolate smoothly.

### Minimum weight

Use `data-min="300"` (default `300`) to set the lowest weight when the pointer is outside range.

### Maximum weight

Use `data-max="900"` (default `900`) to set the highest weight when the pointer is closest.

### Influence range

Use `data-range="500"` (default `500px`) to control how far the pointer can affect each character.

- Higher value: effect responds from farther away.
- Lower value: pointer must be closer to characters.

### Starting weight from CSS

The script reads each character’s computed `font-weight` as its baseline value.

### Touch and accessibility

- On touch/coarse pointers, the effect is disabled.
- If `prefers-reduced-motion: reduce` is set, the effect is also disabled.
