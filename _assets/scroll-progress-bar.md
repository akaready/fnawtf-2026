---
title: "Scroll Progress Bar"
category: "Scroll Animations"
author: "Osmo"
lastUpdated: "2026-02-12"
externalScripts:
  - "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"
  - "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"
  - "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollToPlugin.min.js"
source: "https://osmo.supply"
---

## External Scripts

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollToPlugin.min.js"></script>
```

## HTML

```html
<div class="progress-bar-wrap">
<div class="progress-bar"></div>
</div>
```

## CSS

```css
.progress-bar-wrap {
z-index: 10;
cursor: pointer;
width: 100%;
height: 1.5rem;
transition: background-color .2s;
position: fixed;
inset: 0% 0% auto;
}

.progress-bar-wrap:hover {
background-color: #0000000d;
}

.progress-bar {
transform-origin: 0%;
transform-style: preserve-3d;
background-color: #ff4c24;
width: 100%;
height: 100%;
transform: scale3d(0, 1, 1);
}
```

## JavaScript

```javascript
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

function initScrollProgressBar() {

const progressBar = document.querySelector('.progress-bar');
const progressBarWrap = document.querySelector('.progress-bar-wrap');

// Animate the progress bar as you scroll
gsap.to(progressBar, {
scaleX: 1,
ease: 'none', // no ease, we control smoothness with the 'scrub' property
scrollTrigger: {
trigger: document.body, // Track the entire page
start: 'top top',
end: 'bottom bottom',
scrub: 0.5, // control the amount of time it takes for the bar to catch up with scroll position
},
});

// Click listener to scroll to a specific position, feel free to remove if you dont want it!
progressBarWrap.addEventListener('click', (event) => {
const clickX = event.clientX;
const progress = clickX / progressBarWrap.offsetWidth;
const scrollPosition = progress * (document.body.scrollHeight - window.innerHeight);

gsap.to(window, {
scrollTo: scrollPosition,
duration: 0.725,
ease: 'power3.out',
});
});
}

// Initialize Scroll Progress Bar
document.addEventListener('DOMContentLoaded', () => {
initScrollProgressBar();
});
```

## Implementation

### Click-to-scroll option

For demo purposes, this setup includes a click listener on `.progress-bar-wrap`.

- If you want click-to-scroll behavior, keep `ScrollToPlugin` and the click listener.
- If you do not want this behavior, remove both:
  - the `ScrollToPlugin` import and registration
  - the `progressBarWrap.addEventListener('click', ...)` block

The progress tracking animation itself only requires `gsap` + `ScrollTrigger`.
