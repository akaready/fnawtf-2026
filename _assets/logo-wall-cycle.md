---
title: "Logo Wall Cycle"
category: "Sections & Layouts"
author: "Dennis Snellenberg"
lastUpdated: "2026-02-12"
externalScripts:
  - "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"
  - "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"
source: "https://osmo.supply"
---

## External Scripts

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
```

## HTML

```html
<div data-logo-wall-shuffle="false" data-logo-wall-cycle-init="" class="logo-wall">
<div class="logo-wall__collection">
<div data-logo-wall-list="" class="logo-wall__list">
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370ea9d37fbceb3be49cb_logo-webflow.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370ea48d4fb0c708dd1dc_logo-microsoft.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370ea9ba384ff47fa5d51_logo-asana.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370eaec918fbd4a0acc12_logo-snapchat.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370ea155a551c08692a03_logo-google.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370eafdf2b295d65f9450_logo-bluesky.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370ea68a433ee5808ed90_logo-codepen.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370ea2ebc0415055d04f3_logo-linkedin.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370ea7699561e6f9f008f_logo-android.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370ea753f2afe2f6b036f_logo-apple.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370eabec1e0c00348b5ed_logo-twitter.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370ea0e0e1dc81a9b5799_logo-osmo.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370ea36c91584afe43e2d_logo-medium.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370ea87b05cdce0387084_logo-eventbrite.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370eaf4465d763c2f9b2a_logo-behance.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
<div data-logo-wall-item="" class="logo-wall__item">
<div data-logo-wall-target-parent="" class="logo-wall__logo">
<div class="logo-wall__logo-before"></div>
<div data-logo-wall-target="" class="logo-wall__logo-target">
<img src="https://cdn.prod.website-files.com/68836e3f51ac98fec14ceed2/688370eaec1d445957d7e3a1_logo-chatgpt.svg" loading="lazy" width="100" alt="" class="logo-wall__logo-img">
</div>
</div>
</div>
</div>
</div>
</div>
```

## CSS

```css
.logo-wall {
display: flex;
justify-content: center;
width: 100%;
}

.logo-wall__collection {
width: 100%;
}

.logo-wall__list {
display: flex;
flex-flow: wrap;
}

.logo-wall__item {
width: 25%;
position: relative;
}

[data-logo-wall-list] [data-logo-wall-item]:nth-child(n+9) {
display: none;
}

.logo-wall__logo {
display: flex;
justify-content: center;
align-items: center;
position: relative;
}

.logo-wall__logo-before {
padding-top: 66.66%;
}

.logo-wall__logo-target {
justify-content: center;
align-items: center;
width: 66.66%;
height: 40%;
display: flex;
position: absolute;
}

.logo-wall__logo-img {
width: 100%;
height: 100%;
max-height: 100%;
}

@media screen and (max-width: 991px) {
.logo-wall__item {
width: 33.333%;
}

[data-logo-wall-list] [data-logo-wall-item]:nth-child(n+7) {
display: none;
}
}
```

## JavaScript

```javascript
function initLogoWallCycle() {
const loopDelay = 1.5;   // Loop Duration
const duration  = 0.9;   // Animation Duration

document.querySelectorAll('[data-logo-wall-cycle-init]').forEach(root => {
const list   = root.querySelector('[data-logo-wall-list]');
const items  = Array.from(list.querySelectorAll('[data-logo-wall-item]'));

const shuffleFront = root.getAttribute('data-logo-wall-shuffle') !== 'false';
const originalTargets = items
.map(item => item.querySelector('[data-logo-wall-target]'))
.filter(Boolean);

let visibleItems   = [];
let visibleCount   = 0;
let pool           = [];
let pattern        = [];
let patternIndex   = 0;
let tl;

function isVisible(el) {
return window.getComputedStyle(el).display !== 'none';
}

function shuffleArray(arr) {
const a = arr.slice();
for (let i = a.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[a[i], a[j]] = [a[j], a[i]];
}
return a;
}

function setup() {
if (tl) {
tl.kill();
}
visibleItems = items.filter(isVisible);
visibleCount = visibleItems.length;

pattern = shuffleArray(
Array.from({ length: visibleCount }, (_, i) => i)
);
patternIndex = 0;

// remove all injected targets
items.forEach(item => {
item.querySelectorAll('[data-logo-wall-target]').forEach(old => old.remove());
});

pool = originalTargets.map(n => n.cloneNode(true));

let front, rest;
if (shuffleFront) {
const shuffledAll = shuffleArray(pool);
front = shuffledAll.slice(0, visibleCount);
rest  = shuffleArray(shuffledAll.slice(visibleCount));
} else {
front = pool.slice(0, visibleCount);
rest  = shuffleArray(pool.slice(visibleCount));
}
pool = front.concat(rest);

for (let i = 0; i < visibleCount; i++) {
const parent =
visibleItems[i].querySelector('[data-logo-wall-target-parent]') ||
visibleItems[i];
parent.appendChild(pool.shift());
}

tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay });
tl.call(swapNext);
tl.play();
}

function swapNext() {
const nowCount = items.filter(isVisible).length;
if (nowCount !== visibleCount) {
setup();
return;
}
if (!pool.length) return;

const idx = pattern[patternIndex % visibleCount];
patternIndex++;

const container = visibleItems[idx];
const parent =
container.querySelector('[data-logo-wall-target-parent]') ||
container.querySelector('*:has(> [data-logo-wall-target])') ||
container;
const existing = parent.querySelectorAll('[data-logo-wall-target]');
if (existing.length > 1) return;

const current  = parent.querySelector('[data-logo-wall-target]');
const incoming = pool.shift();

gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
parent.appendChild(incoming);

if (current) {
gsap.to(current, {
yPercent: -50,
autoAlpha: 0,
duration,
ease: "expo.inOut",
onComplete: () => {
current.remove();
pool.push(current);
}
});
}

gsap.to(incoming, {
yPercent: 0,
autoAlpha: 1,
duration,
delay: 0.1,
ease: "expo.inOut"
});
}

setup();

ScrollTrigger.create({
trigger: root,
start: 'top bottom',
end: 'bottom top',
onEnter:     () => tl.play(),
onLeave:     () => tl.pause(),
onEnterBack: () => tl.play(),
onLeaveBack: () => tl.pause()
});

document.addEventListener('visibilitychange', () =>
document.hidden ? tl.pause() : tl.play()
);
});
}

// Initialize Logo Wall Cycle
document.addEventListener('DOMContentLoaded', () => {
initLogoWallCycle();
});
```

## Implementation

### Container

Add `data-logo-wall-cycle-init` to the outer wrapper to initialize one logo wall instance.

Use optional `data-logo-wall-shuffle` to control whether the first visible set is shuffled.

### Required structure

- `data-logo-wall-list` on the list wrapper.
- `data-logo-wall-item` on each slot.
- `data-logo-wall-target` as the animated logo node.
- optional `data-logo-wall-target-parent` for custom insertion position.

### Responsive visibility rule

The script checks `display: none` to determine which items are inactive on each breakpoint.

```css
/* Desktop: show only first 8 */
[data-logo-wall-list] > [data-logo-wall-item]:nth-child(n+9) {
  display: none;
}

/* Tablet/mobile: show only first 6 */
@media (max-width: 768px) {
  [data-logo-wall-list] > [data-logo-wall-item]:nth-child(n+7) {
    display: none;
  }
}
```

### Animation note

This example uses slide and fade swaps. You can replace the GSAP in or out tweens with another style if needed.
