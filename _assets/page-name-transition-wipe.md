---
title: "Page Name Transition (Wipe)"
category: "Page Transitions"
author: "Osmo"
lastUpdated: "2026-02-12"
externalScripts:
  - "https://cdn.jsdelivr.net/npm/@barba/core@2.10.3/dist/barba.umd.min.js"
  - "https://cdn.jsdelivr.net/npm/lenis@1.3.17/dist/lenis.min.js"
  - "https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js"
  - "https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/CustomEase.min.js"
source: "https://osmo.supply"
---

## External Scripts

```html
<script src="https://cdn.jsdelivr.net/npm/@barba/core@2.10.3/dist/barba.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.17/dist/lenis.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/CustomEase.min.js"></script>
```

## HTML

```html
<div data-transition-wrap class="transition">
<div data-transition-panel class="transition__panel">
<span data-transition-label class="transition__label">
<span>[ </span>
<span data-transition-label-text>Welcome</span>
<span> ]</span>
</span>
</div>
</div>
```

## CSS

```css
.transition {
z-index: 100;
pointer-events: none;
position: fixed;
inset: 0;
overflow: clip;
}

.transition__panel {
background-color: #30463e;
justify-content: center;
align-items: center;
width: 100%;
height: 100%;
display: flex;
position: absolute;
top: 100%;
left: 0;
}

.transition__label {
color: #cbe88a;
text-transform: uppercase;
font-family: Haffer Mono, Arial, sans-serif;
font-size: 2.5em;
}
```

## JavaScript

```javascript
// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

function runPageOnceAnimation(next) {
const tl = gsap.timeline();

tl.call(() => {
resetPage(next);
}, null, 0);

return tl;
}

function runPageLeaveAnimation(current, next) {
const transitionWrap = document.querySelector("[data-transition-wrap]");
const transitionPanel = transitionWrap.querySelector("[data-transition-panel]");
const transitionLabel = transitionWrap.querySelector("[data-transition-label]");
const transitionLabelText = transitionWrap.querySelector("[data-transition-label-text]");

const nextPageName = next.getAttribute("data-page-name")
transitionLabelText.innerText = nextPageName || "Hi there";

const tl = gsap.timeline({
onComplete: () => { current.remove() }
});

if (reducedMotion) {
// Immediate swap behavior if user prefers reduced motion
return tl.set(current, { autoAlpha: 0 });
}

tl.set(transitionPanel, {
autoAlpha: 1
}, 0);

tl.set(next,{
autoAlpha: 0
}, 0);

tl.fromTo(transitionPanel,{
yPercent: 0
},{
yPercent: -100,
duration: 0.8,
}, 0);

tl.fromTo(transitionLabel, {
autoAlpha: 0
},{
autoAlpha: 1
}, "<+=0.2");

tl.fromTo(current,{
y: "0vh"
},{
y: "-15vh",
duration: 0.8,
}, 0);
}

function runPageEnterAnimation(next){
const transitionWrap = document.querySelector("[data-transition-wrap]");
const transitionPanel = transitionWrap.querySelector("[data-transition-panel]");
const transitionLabel = transitionWrap.querySelector("[data-transition-label]");
const transitionLabelText = transitionWrap.querySelector("[data-transition-label-text]");

const tl = gsap.timeline();

if (reducedMotion) {
// Immediate swap behavior if user prefers reduced motion
tl.set(next, { autoAlpha: 1 });
tl.add("pageReady")
tl.call(resetPage, [next], "pageReady");
return new Promise(resolve => tl.call(resolve, null, "pageReady"));
}

tl.add("startEnter", 1.25);

tl.set(next, {
autoAlpha: 1,
}, "startEnter");

tl.fromTo(transitionPanel, {
yPercent: -100,
},{
yPercent: -200,
duration: 1,
overwrite: "auto",
immediateRender: false
}, "startEnter");

tl.set(transitionPanel, {
autoAlpha: 0
}, ">");

tl.fromTo(transitionLabel, {
autoAlpha: 1
},{
autoAlpha: 0,
duration: 0.4,
overwrite: "auto",
immediateRender: false
}, "startEnter+=0.1");

tl.from(next, {
y: "15vh",
duration: 1,
}, "startEnter");

tl.add("pageReady");
tl.call(resetPage, [next], "pageReady");

return new Promise(resolve => {
tl.call(resolve, null, "pageReady");
});
}
```

## Implementation

1. Add the required structure and attributes in the `HTML` section.
2. Add the styles from the `CSS` section to your stylesheet.
3. Include any dependencies listed in `External Scripts` before your custom script.
4. Add the `JavaScript` section and initialize it on `DOMContentLoaded`.

Use the provided `data-*` hooks exactly as shown to ensure selectors and behavior match.

### Template setup

- Keep `<nav>` inside the Barba container.
- Place the transition overlay outside the container.

```html
<body data-barba="wrapper">
  <div data-transition-wrap>...</div>

  <main data-barba="container" data-page-name="Homepage">
    <nav>...</nav>
    <!-- page content -->
  </main>
</body>
```

### Required page name attribute

Add `data-page-name` to every Barba container so the incoming page label can be shown during transition.

### Transition behavior

- Panel moves from `yPercent: 0` to `-100` to cover.
- Label fades in with the incoming page name.
- Panel continues to `yPercent: -200` to reveal the next page.
- Incoming page enters from `y: 15vh` while panel exits.
