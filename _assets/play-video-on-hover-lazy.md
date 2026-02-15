---
title: "Play Video on Hover (Lazy)"
category: "Video & Audio"
author: "Osmo"
lastUpdated: "2026-02-12"
source: "https://osmo.supply"
---

## HTML

```html
<div data-video-on-hover="not-active" data-video-src="https://osmo.b-cdn.net/resource-preview/whatsapp-modal-1440x900-v2.mp4" class="video-card">
<div class="video-card-visual">
<img src="https://cdn.prod.website-files.com/68493e75b2d7f03a5fa360af/68495579840e207fe2517a41_video-card-1.avif" class="video-card-visual__img">
<video muted loop webkit-playsinline playsinline src="" class="video-card-visual__video"></video>
</div>
<span class="video-card-title">WhatsApp Modal</span>
</div>
```

## CSS

```css
.video-card {
gap: 1em;
background-color: #f0f0f0;
border-radius: .75em;
flex-flow: column;
width: 22em;
padding: .75em .75em 1.125em;
transition: background-color .2s;
display: flex;
}

.video-card:hover {
background-color: #fff;
}

.video-card-visual {
aspect-ratio: 1.6;
border-radius: .5em;
width: 100%;
position: relative;
overflow: hidden;
}

.video-card-visual__img {
object-fit: cover;
width: 100%;
height: 100%;
}

.video-card-visual__video {
opacity: 0;
width: 100%;
height: 100%;
padding: 0;
transition: opacity .2s;
position: absolute;
inset: 0%;
}

.video-card-title{
padding-left: 0.75em;
}

/* ———— If video is active and hovered, set it to opacity 1 ———— */
[data-video-on-hover="active"] video{ opacity: 1; }
```

## JavaScript

```javascript
function initPlayVideoHover() {
const wrappers = document.querySelectorAll('[data-video-on-hover]');

wrappers.forEach(wrapper => {
const video = wrapper.querySelector('video');
const src = wrapper.getAttribute('data-video-src') || '';
if (!video || !src) return;

wrapper.addEventListener('mouseenter', () => {
if (!video.getAttribute('src')) {
video.setAttribute('src', src);
}
wrapper.dataset.videoOnHover = 'active';
video.play().catch(err => {
console.warn('play on hover is blocked:', err);
});
});

wrapper.addEventListener('mouseleave', () => {
wrapper.dataset.videoOnHover = 'not-active';
setTimeout(() => {
video.pause();
video.currentTime = 0;
}, 200);
});
});
}

document.addEventListener("DOMContentLoaded", () => {
initPlayVideoHover();
});
```

## Implementation

1. Add the required structure and attributes in the `HTML` section.
2. Add the styles from the `CSS` section to your stylesheet.
3. Add the `JavaScript` section and initialize it on `DOMContentLoaded`.

Use the provided `data-*` hooks exactly as shown to ensure selectors and behavior match.

### Required attributes

- Add `data-video-on-hover="not-active"` to each card wrapper.
- Add `data-video-src` with the MP4 URL on the same wrapper.
- Include `muted`, optional `loop`, and `playsinline` plus `webkit-playsinline` on `<video>`.

```html
<div data-video-on-hover="not-active" data-video-src="https://example.com/preview.mp4">
  <video muted loop playsinline webkit-playsinline src=""></video>
</div>
```

### Behavior

- On first hover, the script sets `video.src` from `data-video-src` and plays.
- On leave, it sets state back to `not-active`, then pauses and resets after `200ms`.
