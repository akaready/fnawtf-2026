---
title: "CSS Marquee"
category: "Sliders & Marquees"
tags:
  - "CSS"
  - "Marquee"
  - "Banner"
  - "Looping"
  - "Basic"
  - "Setup"
author: "Dennis Snellenberg"
lastUpdated: "2026-02-12"
source: "https://osmo.supply"
---

Attributes

## HTML

```html
<div data-css-marquee="" class="marquee-css">
<div data-css-marquee-list="" class="marquee-css__list">
<div class="marquee-css__item">
<p class="marquee-css__item-p">CSS Marquee</p>
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 50 50" fill="none" class="marquee-css__item-svg"><path d="M17.6777 32.3223C12.9893 27.6339 6.63041 25 0 25C6.63041 25 12.9893 22.3661 17.6777 17.6777C22.3661 12.9893 25 6.63041 25 0C25 6.63041 27.6339 12.9893 32.3223 17.6777C37.0107 22.3661 43.3696 25 50 25C43.3696 25 37.0107 27.6339 32.3223 32.3223C27.6339 37.0107 25 43.3696 25 50C25 43.3696 22.3661 37.0107 17.6777 32.3223Z" fill="#C9FC7D"></path></svg>
</div>
<div class="marquee-css__item">
<p class="marquee-css__item-p">CSS Marquee</p>
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 50 50" fill="none" class="marquee-css__item-svg"><path d="M17.6777 32.3223C12.9893 27.6339 6.63041 25 0 25C6.63041 25 12.9893 22.3661 17.6777 17.6777C22.3661 12.9893 25 6.63041 25 0C25 6.63041 27.6339 12.9893 32.3223 17.6777C37.0107 22.3661 43.3696 25 50 25C43.3696 25 37.0107 27.6339 32.3223 32.3223C27.6339 37.0107 25 43.3696 25 50C25 43.3696 22.3661 37.0107 17.6777 32.3223Z" fill="#C9FC7D"></path></svg>
</div>
<div class="marquee-css__item">
<p class="marquee-css__item-p">CSS Marquee</p>
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 50 50" fill="none" class="marquee-css__item-svg"><path d="M17.6777 32.3223C12.9893 27.6339 6.63041 25 0 25C6.63041 25 12.9893 22.3661 17.6777 17.6777C22.3661 12.9893 25 6.63041 25 0C25 6.63041 27.6339 12.9893 32.3223 17.6777C37.0107 22.3661 43.3696 25 50 25C43.3696 25 37.0107 27.6339 32.3223 32.3223C27.6339 37.0107 25 43.3696 25 50C25 43.3696 22.3661 37.0107 17.6777 32.3223Z" fill="#C9FC7D"></path></svg>
</div>
<div class="marquee-css__item">
<p class="marquee-css__item-p">CSS Marquee</p>
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 50 50" fill="none" class="marquee-css__item-svg"><path d="M17.6777 32.3223C12.9893 27.6339 6.63041 25 0 25C6.63041 25 12.9893 22.3661 17.6777 17.6777C22.3661 12.9893 25 6.63041 25 0C25 6.63041 27.6339 12.9893 32.3223 17.6777C37.0107 22.3661 43.3696 25 50 25C43.3696 25 37.0107 27.6339 32.3223 32.3223C27.6339 37.0107 25 43.3696 25 50C25 43.3696 22.3661 37.0107 17.6777 32.3223Z" fill="#C9FC7D"></path></svg>
</div>
</div>
</div>
```

## CSS

```css
.marquee-css {
color: #efeeec;
background-color: #000;
width: 100%;
max-width: 42em;
display: flex;
position: relative;
overflow: hidden;
}

.marquee-css__list {
flex: none;
align-items: center;
display: flex;
position: relative;
}

.marquee-css__item {
grid-column-gap: 1em;
grid-row-gap: 1em;
flex: 0;
align-items: center;
padding-top: 1em;
padding-bottom: 1em;
padding-right: 1em;
display: flex;
}

.marquee-css__item-p {
white-space: nowrap;
margin-bottom: 0;
font-size: 1.5em;
line-height: 1;
}

.marquee-css__item-svg {
width: 1em;
}

/* CSS Keyframe Animation */
@keyframes translateX {
to {
transform: translateX(-100%);
}
}

[data-css-marquee-list] {
animation: translateX 30s linear;
animation-iteration-count: infinite;
animation-play-state: paused;
}
```

## JavaScript

```javascript
// Note: The Javascript is optional. Read the documentation below how to use the CSS Only version.

function initCSSMarquee() {
const pixelsPerSecond = 75; // Set the marquee speed (pixels per second)
const marquees = document.querySelectorAll('[data-css-marquee]');

// Duplicate each [data-css-marquee-list] element inside its container
marquees.forEach(marquee => {
marquee.querySelectorAll('[data-css-marquee-list]').forEach(list => {
const duplicate = list.cloneNode(true);
marquee.appendChild(duplicate);
});
});

// Create an IntersectionObserver to check if the marquee container is in view
const observer = new IntersectionObserver(entries => {
entries.forEach(entry => {
entry.target.querySelectorAll('[data-css-marquee-list]').forEach(list =>
list.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused'
);
});
}, { threshold: 0 });

// Calculate the width and set the animation duration accordingly
marquees.forEach(marquee => {
marquee.querySelectorAll('[data-css-marquee-list]').forEach(list => {
list.style.animationDuration = (list.offsetWidth / pixelsPerSecond) + 's';
list.style.animationPlayState = 'paused';
});
observer.observe(marquee);
});
}

// Initialize CSS Marquee
document.addEventListener('DOMContentLoaded', function() {
initCSSMarquee();
});
```

## Implementation

### Attributes

- `data-css-marquee`: Marquee container.
- `data-css-marquee-list`: The moving track on the X axis.

### Speed

In JavaScript, speed is controlled by:

```js
const pixelsPerSecond = 75;
```

Increase the value for a faster marquee.

### What the script does

- Pauses animation when the marquee is out of view.
- Calculates `animation-duration` based on each list width.
- Duplicates `data-css-marquee-list` to create a seamless loop.

### CSS-only version

If you do not need JavaScript behavior, remove the script and use a CSS-only setup.

1. Duplicate the `data-css-marquee-list` element in HTML.
2. Fine-tune `animation: translateX 30s linear;` to the desired speed.
3. Remove `animation-play-state: paused;` from CSS.

```css
/* CSS Keyframe Animation */
@keyframes translateX {
  to {
    transform: translateX(-100%);
  }
}

[data-css-marquee-list] {
  animation: translateX 30s linear; /* Tweak this number in seconds */
  animation-iteration-count: infinite;
  /* Removed: animation-play-state: paused; */
}
```
