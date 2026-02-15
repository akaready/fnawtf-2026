---
title: "Elements Reveal on Scroll"
category: "Scroll Animations"
author: "The Vault"
lastUpdated: "2026-02-12"
externalScripts:
  - "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"
  - "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"
source: "https://osmo.supply"
---

This setup gives you a flexible way to reveal content blocks with GSAP + ScrollTrigger, including support for nested groups with independent staggers and distances. You don’t need to set every attribute on each group because defaults are provided for everything. Only add attributes when you need to override the defaults.

## External Scripts

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
```

## JavaScript

```javascript
gsap.registerPlugin(ScrollTrigger);

function initContentRevealScroll(){
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ctx = gsap.context(() => {

document.querySelectorAll('[data-reveal-group]').forEach(groupEl => {
// Config from attributes or defaults (group-level)
const groupStaggerSec = (parseFloat(groupEl.getAttribute('data-stagger')) || 100) / 1000; // ms → sec
const groupDistance = groupEl.getAttribute('data-distance') || '2em';
const triggerStart = groupEl.getAttribute('data-start') || 'top 80%';

const animDuration = 0.8;
const animEase = "power4.inOut";

// Reduced motion: show immediately
if (prefersReduced) {
gsap.set(groupEl, { clearProps: 'all', y: 0, autoAlpha: 1 });
return;
}

// If no direct children, animate the group element itself
const directChildren = Array.from(groupEl.children).filter(el => el.nodeType === 1);
if (!directChildren.length) {
gsap.set(groupEl, { y: groupDistance, autoAlpha: 0 });
ScrollTrigger.create({
trigger: groupEl,
start: triggerStart,
once: true,
onEnter: () => gsap.to(groupEl, {
y: 0,
autoAlpha: 1,
duration: animDuration,
ease: animEase,
onComplete: () => gsap.set(groupEl, { clearProps: 'all' })
})
});
return;
}

// Build animation slots: item or nested (deep layers allowed)
const slots = [];
directChildren.forEach(child => {
const nestedGroup = child.matches('[data-reveal-group-nested]')
? child
: child.querySelector(':scope [data-reveal-group-nested]');

if (nestedGroup) {
const includeParent = child.getAttribute('data-ignore') === 'false' || nestedGroup.getAttribute('data-ignore') === 'false';
slots.push({ type: 'nested', parentEl: child, nestedEl: nestedGroup, includeParent });
} else {
slots.push({ type: 'item', el: child });
}
});

// Initial hidden state
slots.forEach(slot => {
if (slot.type === 'item') {
// If the element itself is a nested group, force group distance (prevents it from using its own data-distance)
const isNestedSelf = slot.el.matches('[data-reveal-group-nested]');
const d = isNestedSelf ? groupDistance : (slot.el.getAttribute('data-distance') || groupDistance);
gsap.set(slot.el, { y: d, autoAlpha: 0 });
} else {
// Parent follows the group's distance when included, regardless of nested's data-distance
if (slot.includeParent) gsap.set(slot.parentEl, { y: groupDistance, autoAlpha: 0 });
// Children use nested group's own distance (fallback to group distance)
const nestedD = slot.nestedEl.getAttribute('data-distance') || groupDistance;
Array.from(slot.nestedEl.children).forEach(target => gsap.set(target, { y: nestedD, autoAlpha: 0 }));
}
});

// Extra safety: if a nested parent is included, re-assert its distance to the group's value
slots.forEach(slot => {
if (slot.type === 'nested' && slot.includeParent) {
gsap.set(slot.parentEl, { y: groupDistance });
}
});

// Reveal sequence
ScrollTrigger.create({
trigger: groupEl,
start: triggerStart,
once: true,
onEnter: () => {
const tl = gsap.timeline();

slots.forEach((slot, slotIndex) => {
const slotTime = slotIndex * groupStaggerSec;

if (slot.type === 'item') {
tl.to(slot.el, {
y: 0,
autoAlpha: 1,
duration: animDuration,
ease: animEase,
onComplete: () => gsap.set(slot.el, { clearProps: 'all' })
}, slotTime);
} else {
// Optionally include the parent at the same slot time (parent uses group distance)
if (slot.includeParent) {
tl.to(slot.parentEl, {
y: 0,
autoAlpha: 1,
duration: animDuration,
ease: animEase,
onComplete: () => gsap.set(slot.parentEl, { clearProps: 'all' })
}, slotTime);
}
// Nested children use nested stagger (ms → sec); fallback to group stagger
const nestedMs = parseFloat(slot.nestedEl.getAttribute('data-stagger'));
const nestedStaggerSec = isNaN(nestedMs) ? groupStaggerSec : nestedMs / 1000;
Array.from(slot.nestedEl.children).forEach((nestedChild, nestedIndex) => {
tl.to(nestedChild, {
y: 0,
autoAlpha: 1,
duration: animDuration,
ease: animEase,
onComplete: () => gsap.set(nestedChild, { clearProps: 'all' })
}, slotTime + nestedIndex * nestedStaggerSec);
});
}
});
}
});
});

});

return () => ctx.revert();
}

// Initialize Elements Reveal on Scroll
document.addEventListener("DOMContentLoaded", () =>{
initContentRevealScroll();
})
```

## Implementation

This setup gives you a flexible way to reveal content blocks with GSAP + ScrollTrigger, including support for nested groups with independent staggers and distances. You do not need to set every attribute on each group because defaults are provided. Only add attributes when you need to override defaults.

1. Wrap reveal items in a container with `data-reveal-group`.
2. Add direct children to animate in sequence.
3. Use `data-reveal-group-nested` for nested child sequences.

### Basic group

```html
<div data-reveal-group>
  <!-- children to reveal -->
</div>
```

### Nested example

```html
<div data-reveal-group>
  <img><!-- this item will reveal --></img>
  <img><!-- this item will reveal --></img>

  <div data-reveal-group-nested><!-- parent skipped by default -->
    <img><!-- this item will reveal --></img>
    <img><!-- this item will reveal --></img>
    <img><!-- this item will reveal --></img>
  </div>

  <div data-reveal-group-nested data-ignore="false"><!-- parent included -->
    <img><!-- this item will reveal --></img>
    <img><!-- this item will reveal --></img>
    <img><!-- this item will reveal --></img>
  </div>
</div>
```

### Available attributes

- `data-reveal-group`: required wrapper for each reveal group.
- `data-reveal-group-nested`: nested child sequence inside a group.
- `data-stagger`: delay in ms between items (default `100`).
- `data-distance`: start offset (default `2em`).
- `data-start`: ScrollTrigger start position (default `top 80%`).
- `data-ignore="false"`: include a nested parent in the main reveal slot.
