---
title: "Rotating Text"
category: "Text Animations"
author: "Rotating Text"
lastUpdated: "2026-02-12"
externalScripts:
  - "https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js"
  - "https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/SplitText.min.js"
source: "https://osmo.supply"
---

## External Scripts

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/SplitText.min.js"></script>
```

## HTML

```html
<h1 data-rotating-title class="rotating-text__heading">Simple
<span data-rotating-words="routines, tools, systems, help" class="rotating-text__highlight">routines</span>
that give growing and ambitious teams more clarity.
</h1>
```

## CSS

```css
.rotating-text__heading {
text-align: center;
letter-spacing: -.02em;
margin: 0;
font-family: Haffer, Arial, sans-serif;
font-size: clamp(2.5em, 7.5vw, 4.5em);
font-weight: 500;
line-height: 1;
}

.rotating-text__highlight {
color: #33de96;
}

[data-rotating-words] {
display: inline-block;
position: relative;
}

.rotating-text__inner {
display: inline-block;
}

.rotating-text__word {
display: block;
white-space: nowrap;
position: absolute;
top: 0;
left: 0;
}

.rotating-line{
padding-bottom: 0.1em;
margin-bottom: -0.1em;
white-space: nowrap;
}

.rotating-line-mask{
overflow-x: visible !important;
overflow-y: clip !important;
}
```

## JavaScript

```javascript
function initRotatingText() {
document.querySelectorAll('[data-rotating-title]').forEach((heading) => {

const stepDuration = parseFloat(heading.getAttribute('data-step-duration') || '1.75');

SplitText.create(heading, {
type: 'lines',
mask: 'lines',
autoSplit: true,
linesClass: 'rotating-line',
onSplit(instance) {
const rotatingSpan = heading.querySelector('[data-rotating-words]');
if (!rotatingSpan) return;

const rawWords = rotatingSpan.getAttribute('data-rotating-words') || '';
const words = rawWords
.split(',')
.map((w) => w.trim())
.filter(Boolean);

if (!words.length) return;

// Build inner wrapper with stacked words
const wrapper = document.createElement('span');
wrapper.className = 'rotating-text__inner';

const wordEls = words.map((word) => {
const el = document.createElement('span');
el.className = 'rotating-text__word';
el.textContent = word;
wrapper.appendChild(el);
return el;
});

// Replace the original content of the highlight span
rotatingSpan.textContent = '';
rotatingSpan.appendChild(wrapper);

requestAnimationFrame(() => {

// Define duration of your in + out movement
const inDuration = 0.75;
const outDuration = 0.6;

// Initial state: everyone hidden below
gsap.set(wordEls, { yPercent: 150, autoAlpha: 0 });

// Show first word immediately
let activeIndex = 0;
const firstWord = wordEls[activeIndex];
gsap.set(firstWord, { yPercent: 0, autoAlpha: 1 });

// Set initial width to first word
const firstWidth = firstWord.getBoundingClientRect().width;
wrapper.style.width = firstWidth + 'px';

function showNext() {
const nextIndex = (activeIndex + 1) % wordEls.length;
const prev = wordEls[activeIndex];
const current = wordEls[nextIndex];

const targetWidth = current.getBoundingClientRect().width;

// Animate wrapper width to match new word
gsap.to(wrapper, {
width: targetWidth,
duration: inDuration,
ease: 'power4.inOut'
});

// Move old word out
if (prev && prev !== current) {
gsap.to(prev, {
yPercent: -150,
autoAlpha: 0,
duration: outDuration,
ease: 'power4.inOut'
});
}

// Reveal new word
gsap.fromTo(
current,
{ yPercent: 150, autoAlpha: 0 },
{
yPercent: 0,
autoAlpha: 1,
duration: inDuration,
ease: 'power4.inOut'
}
);

activeIndex = nextIndex;

gsap.delayedCall(stepDuration, showNext);
}

// First word is already visible, start rotating after a full step
if (wordEls.length > 1) {
gsap.delayedCall(stepDuration, showNext);
}
});
}
});
});
}

// Initialize Rotating Text
document.addEventListener("DOMContentLoaded", function () {
initRotatingText();
});
```

## Implementation

### Heading target

Use `data-rotating-title` on the heading to initialize SplitText and the rotating words behavior.

### Rotating words

Use `data-rotating-words` on a nested `<span>`. The value is a comma-separated list in display order.

```html
<h1 data-rotating-title>
  Hello
  <span data-rotating-words="word 1, word 2, word 3">word 1</span>
  World
</h1>
```

The script reads the attribute value and builds the rotating stack dynamically.

### Longest word requirement

Set the initial visible word inside the span to the longest word in your list so line width is measured correctly before replacement.

### Step duration

Use `data-step-duration` on the same heading to control delay in seconds between word changes. Default is `1.75`.

```html
<h1 data-rotating-title data-step-duration="2.5">
  Hello
  <span data-rotating-words="word 1, word 2, word 3">word 1</span>
  World
</h1>
```
