---
title: "Custom Bunny HLS Lightbox (Advanced)"
category: "Video & Audio"
author: "Dennis Snellenberg"
lastUpdated: "2026-02-12"
externalScripts:
  - "https://cdn.jsdelivr.net/npm/hls.js@1.6.11"
source: "https://osmo.supply"
---

Hosting videos on Bunny

## External Scripts

```html
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.6.11"></script>
```

## HTML

```html
<div data-bunny-lightbox-status="not-active" class="bunny-lightbox">
<div data-bunny-lightbox-control="close" class="bunny-lightbox__dark"></div>
<div data-bunny-lightbox-calc-height="" class="bunny-lightbox__calc">
<div data-bunny-lightbox-init="" data-player-muted="false" data-player-fullscreen="false" data-player-activated="false" data-player-autoplay="true" data-player-hover="idle" data-player-src="" data-player-status="idle" data-player-update-size="true" class="bunny-lightbox-player">
<div data-player-before="" class="bunny-lightbox-player__before"></div>
<video preload="auto" width="1920" height="1080" playsinline="" class="bunny-lightbox-player__video"></video>
<img data-bunny-lightbox-placeholder="" src="" alt="" class="bunny-lightbox-player__placeholder">
<div class="bunny-lightbox-player__dark"></div>
<div data-player-control="playpause" class="bunny-lightbox-player__playpause">
<div class="bunny-lightbox-player__big-btn">
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-lightbox-player__pause-svg"><path d="M16 5V19" stroke="currentColor" stroke-width="3" stroke-miterlimit="10"></path><path d="M8 5V19" stroke="currentColor" stroke-width="3" stroke-miterlimit="10"></path></svg>
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-lightbox-player__play-svg"><path d="M6 12V5.01109C6 4.05131 7.03685 3.4496 7.87017 3.92579L14 7.42855L20.1007 10.9147C20.9405 11.3945 20.9405 12.6054 20.1007 13.0853L14 16.5714L7.87017 20.0742C7.03685 20.5503 6 19.9486 6 18.9889V12Z" fill="currentColor"></path></svg>
</div>
</div>
<div class="bunny-lightbox-player__interface">
<div class="bunny-lightbox-player__interface-fade"></div>
<div class="bunny-lightbox-player__interface-bottom">
<div data-player-control="playpause" class="bunny-lightbox-player__toggle-playpause">
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-lightbox-player__pause-svg"><path d="M16 5V19" stroke="currentColor" stroke-width="3" stroke-miterlimit="10"></path><path d="M8 5V19" stroke="currentColor" stroke-width="3" stroke-miterlimit="10"></path></svg>
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-lightbox-player__play-svg"><path d="M6 12V5.01109C6 4.05131 7.03685 3.4496 7.87017 3.92579L14 7.42855L20.1007 10.9147C20.9405 11.3945 20.9405 12.6054 20.1007 13.0853L14 16.5714L7.87017 20.0742C7.03685 20.5503 6 19.9486 6 18.9889V12Z" fill="currentColor"></path></svg>
</div>
<div class="bunny-lightbox-player__time">
<p data-player-time-progress="" class="bunny-lightbox-player__text">00:00</p>
<p class="bunny-lightbox-player__text is--transparent">/</p>
<p data-player-time-duration="" class="bunny-lightbox-player__text is--transparent">00:00</p>
</div>
<div data-player-timeline="" class="bunny-lightbox-player__timeline">
<div class="bunny-lightbox-player__timeline-bar">
<div class="bunny-lightbox-player__timeline-bg"></div>
<div data-player-buffered="" class="bunny-lightbox-player__timeline-buffered"></div>
<div data-player-progress="" class="bunny-lightbox-player__timeline-progress"></div>
</div>
<div data-player-timeline-handle="" class="bunny-lightbox-player__timeline-handle"></div>
</div>
<div class="bunny-lightbox-player__interface-btns">
<div data-player-control="mute" class="bunny-lightbox-player__toggle-mute">
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-lightbox-player__volume-up-svg"><path d="M3 8.99998V15H7L12 20V3.99998L7 8.99998H3ZM16.5 12C16.5 10.23 15.48 8.70998 14 7.96998V16.02C15.48 15.29 16.5 13.77 16.5 12ZM14 3.22998V5.28998C16.89 6.14998 19 8.82998 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.71998 18.01 4.13998 14 3.22998Z" fill="currentColor"></path></svg>
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-lightbox-player__volume-mute-svg"><path d="M16.5 12C16.5 10.23 15.48 8.71 14 7.97V10.18L16.45 12.63C16.48 12.43 16.5 12.22 16.5 12ZM19 12C19 12.94 18.8 13.82 18.46 14.64L19.97 16.15C20.63 14.91 21 13.5 21 12C21 7.72 18.01 4.14 14 3.23V5.29C16.89 6.15 19 8.83 19 12ZM4.27 3L3 4.27L7.73 9H3V15H7L12 20V13.27L16.25 17.52C15.58 18.04 14.83 18.45 14 18.7V20.76C15.38 20.45 16.63 19.81 17.69 18.95L19.73 21L21 19.73L12 10.73L4.27 3ZM12 4L9.91 6.09L12 8.18V4Z" fill="currentColor"></path></svg>
</div>
<div data-player-control="fullscreen" class="bunny-lightbox-player__toggle-fullscreen">
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-lightbox-player__fullscreen-scale-svg"><rect x="3" y="14" width="2" height="7" fill="currentColor"></rect><rect x="3" y="3" width="2" height="7" fill="currentColor"></rect><rect x="19" y="3" width="2" height="7" fill="currentColor"></rect><rect x="19" y="14" width="2" height="7" fill="currentColor"></rect><rect x="3" y="19" width="7" height="2" fill="currentColor"></rect><rect x="14" y="19" width="7" height="2" fill="currentColor"></rect><rect x="3" y="3" width="7" height="2" fill="currentColor"></rect><rect x="14" y="3" width="7" height="2" fill="currentColor"></rect></svg>
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-lightbox-player__fullscreen-shrink-svg"><rect x="7" y="2" width="2" height="7" fill="currentColor"></rect><rect x="15" y="2" width="2" height="7" fill="currentColor"></rect><rect x="15" y="15" width="2" height="7" fill="currentColor"></rect><rect x="8" y="15" width="2" height="7" fill="currentColor"></rect><rect x="2" y="7" width="7" height="2" fill="currentColor"></rect><rect x="3" y="15" width="7" height="2" fill="currentColor"></rect><rect x="15" y="7" width="7" height="2" fill="currentColor"></rect><rect x="15" y="15" width="7" height="2" fill="currentColor"></rect></svg>
</div>
</div>
</div>
</div>
<div class="bunny-lightbox-player__loading">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="L9" x="0px" y="0px" viewbox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve" width="100%" class="bunny-lightbox-player__loading-svg" fill="none"><path fill="currentColor" d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50"></path><animatetransform attributename="transform" attributetype="XML" type="rotate" dur="1s" from="0 50 50" to="360 50 50" repeatcount="indefinite"></animatetransform></svg>
</div>
</div>
</div>
<button data-bunny-lightbox-control="close" class="bunny-lightbox__close">
<div class="bunny-lightbox__close-bar"></div>
<div class="bunny-lightbox__close-bar is--duplicate"></div>
</button>
</div>
```

## CSS

```css
/* Lightbox */

.bunny-lightbox {
z-index: 300;
pointer-events: none;
justify-content: center;
align-items: center;
padding: 5vw;
display: flex;
position: fixed;
inset: 0;
overflow: hidden;
}

.bunny-lightbox__calc {
transition: transform 0.3s cubic-bezier(0.625, 0.05, 0, 1), opacity 0.3s linear, visibility 0.3s linear;
width: 100%;
height: 100%;
position: relative;
opacity: 0;
visibility: hidden;
transform: scale(0.9) rotate(0.001deg);
}

[data-bunny-lightbox-status="active"] .bunny-lightbox__calc {
opacity: 1;
visibility: visible;
transform: scale(1) rotate(0.001deg);
}

.bunny-lightbox__dark {
opacity: .95;
pointer-events: auto;
background-color: #191512;
justify-content: center;
align-items: center;
width: 100%;
height: 100%;
display: flex;
position: absolute;
top: 0;
left: 0;
}

.bunny-lightbox__close {
z-index: 600;
pointer-events: auto;
border-radius: 50%;
justify-content: center;
align-items: center;
width: 3em;
height: 3em;
display: flex;
position: absolute;
top: 2.5vw;
right: 2.5vw;
}

.bunny-lightbox__close-bar {
background-color: currentColor;
width: 1em;
height: .125em;
position: absolute;
transform: rotate(-45deg);
}

.bunny-lightbox__close-bar.is--duplicate {
transform: rotate(45deg);
}

[data-bunny-lightbox-status] .bunny-lightbox__dark,
[data-bunny-lightbox-status] .bunny-lightbox__close {
transition: opacity 0.3s linear, visibility 0.3s linear;
opacity: 0;
visibility: hidden;
}

[data-bunny-lightbox-status="active"] .bunny-lightbox__dark,
[data-bunny-lightbox-status="active"] .bunny-lightbox__close {
opacity: 1;
visibility: visible;
}

/* Player */

.bunny-lightbox-player {
pointer-events: none;
color: #fff;
isolation: isolate;
border-radius: 1em;
justify-content: center;
align-items: center;
width: 100%;
display: flex;
position: relative;
overflow: hidden;
-webkit-mask-image: radial-gradient(#fff, #000);
mask-image: radial-gradient(#fff, #000);
}

.bunny-lightbox-player__before {
padding-top: 62.5%;
}

/* Animation */
[data-bunny-lightbox-init] :is(.bunny-lightbox-player__placeholder, .bunny-lightbox-player__dark, .bunny-lightbox-player__playpause, .bunny-lightbox-player__loading) {
transition: opacity 0.3s linear, visibility 0.3s linear;
}

/* Placeholder */
.bunny-lightbox-player__placeholder {
object-fit: cover;
width: 100%;
height: 100%;
position: absolute;
}

[data-bunny-lightbox-init][data-player-status="playing"] .bunny-lightbox-player__placeholder,
[data-bunny-lightbox-init][data-player-status="paused"] .bunny-lightbox-player__placeholder,
[data-bunny-lightbox-init][data-player-activated="true"][data-player-status="ready"] .bunny-lightbox-player__placeholder {
opacity: 0;
visibility: hidden;
}

/* Dark Overlay */
.bunny-lightbox-player__dark {
opacity: .1;
background-color: #000;
width: 100%;
height: 100%;
position: absolute;
}

[data-bunny-lightbox-init][data-player-status="paused"] .bunny-lightbox-player__dark,
[data-bunny-lightbox-init][data-player-status="playing"][data-player-hover="active"] .bunny-lightbox-player__dark{
opacity: 0.3;
}

[data-bunny-lightbox-init][data-player-status="playing"] .bunny-lightbox-player__dark {
opacity: 0;
}

.bunny-lightbox-player__video {
width: 100%;
height: 100%;
padding-bottom: 0;
padding-right: 0;
display: block;
position: absolute;
top: 0;
left: 0;
}

/* Play/Pause */
.bunny-lightbox-player__playpause {
pointer-events: auto;
justify-content: center;
align-items: center;
width: 100%;
height: 100%;
display: flex;
position: absolute;
}

[data-bunny-lightbox-init][data-player-status="playing"] .bunny-lightbox-player__playpause,
[data-bunny-lightbox-init][data-player-status="loading"] .bunny-lightbox-player__playpause {
opacity: 0;
}

[data-bunny-lightbox-init][data-player-status="playing"][data-player-hover="active"] .bunny-lightbox-player__playpause {
opacity: 1;
}

[data-bunny-lightbox-init][data-player-status="playing"] .bunny-lightbox-player__play-svg,
[data-bunny-lightbox-init][data-player-status="loading"] .bunny-lightbox-player__play-svg {
display: none;
}

[data-bunny-lightbox-init][data-player-status="playing"] .bunny-lightbox-player__pause-svg,
[data-bunny-lightbox-init][data-player-status="loading"] .bunny-lightbox-player__pause-svg{
display: block;
}

/* Loading */
.bunny-lightbox-player__loading {
opacity: 0;
visibility: hidden;
background-color: #00000054;
justify-content: center;
align-items: center;
width: 100%;
height: 100%;
display: flex;
position: absolute;
}

[data-bunny-lightbox-init][data-player-status="loading"] .bunny-lightbox-player__loading {
opacity: 1;
visibility: visible;
}

/* Interface */
.bunny-lightbox-player__interface {
flex-flow: column;
justify-content: flex-end;
align-items: baseline;
width: 100%;
height: 100%;
display: flex;
position: absolute;
transition: all 0.6s cubic-bezier(0.625, 0.05, 0, 1);
}

[data-bunny-lightbox-init][data-player-status="playing"] .bunny-lightbox-player__interface,
[data-bunny-lightbox-init][data-player-status="loading"] .bunny-lightbox-player__interface{
opacity: 0;
transform: translateY(1em) rotate(0.001deg);
}

[data-bunny-lightbox-init][data-player-status="playing"][data-player-hover="active"] .bunny-lightbox-player__interface,
[data-bunny-lightbox-init][data-player-status="loading"][data-player-hover="active"] .bunny-lightbox-player__interface {
opacity: 1;
transform: translateY(0em) rotate(0.001deg);
}

.bunny-lightbox-player__interface-bottom {
grid-column-gap: 1em;
grid-row-gap: 1em;
pointer-events: auto;
justify-content: space-between;
align-items: center;
width: 100%;
padding: min(2em, 4vw);
display: flex;
position: relative;
}

.bunny-lightbox-player__toggle-mute,
.bunny-lightbox-player__toggle-fullscreen {
cursor: pointer;
width: 1.5em;
height: 1.5em;
}

.bunny-lightbox-player__timeline {
cursor: pointer;
flex: 1;
align-items: center;
height: 1em;
margin-left: .5em;
margin-right: .5em;
display: flex;
position: relative;
}

[data-bunny-lightbox-init][data-player-status="idle"][data-player-activated="false"] .bunny-lightbox-player__timeline,
[data-bunny-lightbox-init][data-player-status="ready"][data-player-activated="false"] .bunny-lightbox-player__timeline {
pointer-events: none;
}

.bunny-lightbox-player__timeline-progress {
pointer-events: none;
background-color: #ff4c24;
border-radius: 1em;
width: 100%;
height: 100%;
position: absolute;
transform: translateX(-100%);
}

.bunny-lightbox-player__timeline-buffered {
opacity: .2;
pointer-events: none;
background-color: #fff;
border-radius: 1em;
width: 100%;
height: 100%;
position: absolute;
transform: translateX(-100%);
}

.bunny-lightbox-player__timeline-handle {
transition: transform 0.15s ease-in-out;
pointer-events: none;
background-color: #ff4c24;
border-radius: 1em;
width: 1em;
height: 1em;
position: absolute;
top: 50%;
transform: translate(-50%, -50%)scale(0);
}

[data-bunny-lightbox-init][data-timeline-drag="true"] .bunny-lightbox-player__timeline-handle {
transform: translate(-50%, -50%) scale(1);
}

.bunny-lightbox-player__timeline-bar {
border-radius: 1em;
width: 100%;
height: 30%;
position: absolute;
overflow: hidden;
}

.bunny-lightbox-player__time {
grid-column-gap: .125em;
grid-row-gap: .125em;
flex: none;
justify-content: center;
align-items: center;
width: 5.75em;
display: flex;
}

.bunny-lightbox-player__timeline-bg {
background-color: #ffffff26;
border-radius: 1em;
width: 100%;
height: 100%;
position: absolute;
}

.bunny-lightbox-player__toggle-playpause {
cursor: pointer;
width: 1.5em;
height: 1.5em;
}

.bunny-lightbox-player__text {
white-space: nowrap;
margin-bottom: 0;
font-size: .9375em;
line-height: 1;
}

.bunny-lightbox-player__big-btn {
-webkit-backdrop-filter: blur(1em);
backdrop-filter: blur(1em);
cursor: pointer;
background-color: #64646433;
border: 1px solid #ffffff1a;
border-radius: 50%;
justify-content: center;
align-items: center;
width: 6em;
height: 6em;
padding: 2em;
display: flex;
position: relative;
}

.bunny-lightbox-player__loading-svg {
width: 6em;
}

.bunny-lightbox-player__pause-svg {
display: none;
}

.bunny-lightbox-player__interface-fade {
opacity: .5;
background-image: linear-gradient(#0000, #000);
width: 100%;
height: 25%;
position: absolute;
bottom: 0;
}

.bunny-lightbox-player__interface-btns {
grid-column-gap: .5em;
grid-row-gap: .5em;
align-items: center;
display: flex;
}

[data-bunny-lightbox-init][data-player-muted="true"] .bunny-lightbox-player__volume-mute-svg {
display: block;
}

[data-bunny-lightbox-init][data-player-muted="true"] .bunny-lightbox-player__volume-up-svg {
display: none;
}

.bunny-lightbox-player__volume-mute-svg {
display: none;
}

.bunny-lightbox-player__volume-up-svg {
display: block;
}

.bunny-lightbox-player__fullscreen-shrink-svg {
display: none;
}

.bunny-lightbox-player__fullscreen-scale-svg {
display: block;
}

[data-bunny-lightbox-init][data-player-fullscreen="true"] .bunny-lightbox-player__fullscreen-shrink-svg {
display: block;
}

[data-bunny-lightbox-init][data-player-fullscreen="true"] .bunny-lightbox-player__fullscreen-scale-svg {
display: none;
}

/* Cover Mode */
[data-bunny-lightbox-init][data-player-update-size="cover"] {
height: 100%;
top: 0;
left: 0;
position: absolute;
}

[data-bunny-lightbox-init][data-player-update-size="cover"] [data-player-before] {
display: none;
}

[data-bunny-lightbox-init][data-player-update-size="cover"][data-player-fullscreen="false"] .bunny-lightbox-player__video {
object-fit: cover;
}
```

## JavaScript

```javascript
function initBunnyLightboxPlayer() {
var player = document.querySelector('[data-bunny-lightbox-init]');
if (!player) return;

var wrapper = player.closest('[data-bunny-lightbox-status]');
if (!wrapper) return;

var video = player.querySelector('video');
if (!video) return;

try { video.pause(); } catch(_) {}
try { video.removeAttribute('src'); video.load(); } catch(_) {}

// Attribute helpers (collapsed)
function setAttr(el, name, val) {
var str = (typeof val === 'boolean') ? (val ? 'true' : 'false') : String(val);
if (el.getAttribute(name) !== str) el.setAttribute(name, str);
}
function setStatus(s) { setAttr(player, 'data-player-status', s); }
function setMutedState(v) { video.muted = !!v; setAttr(player, 'data-player-muted', video.muted); }
function setFsAttr(v) { setAttr(player, 'data-player-fullscreen', !!v); }
function setActivated(v) { setAttr(player, 'data-player-activated', !!v); }
if (!player.hasAttribute('data-player-activated')) setActivated(false);

// Elements
var timeline = player.querySelector('[data-player-timeline]');
var progressBar = player.querySelector('[data-player-progress]');
var bufferedBar = player.querySelector('[data-player-buffered]');
var handle = player.querySelector('[data-player-timeline-handle]');
var timeDurationEls = player.querySelectorAll('[data-player-time-duration]');
var timeProgressEls = player.querySelectorAll('[data-player-time-progress]');
var playerPlaceholderImg = player.querySelector('[data-bunny-lightbox-placeholder]');

// Flags
var updateSize = player.getAttribute('data-player-update-size'); // "true" | "cover" | "false" | null
var autoplay = player.getAttribute('data-player-autoplay') === 'true';
var initialMuted = player.getAttribute('data-player-muted') === 'true';

var pendingPlay = false;

video.loop = false;
setMutedState(initialMuted);

video.setAttribute('playsinline', '');
video.setAttribute('webkit-playsinline', '');
video.playsInline = true;
if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
if (autoplay) video.autoplay = false;

var isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl');
var canUseHlsJs = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

// Load/attach only when opened
var isAttached = false;
var currentSrc = '';
var lastPauseBy = '';
var rafId;
var autoStartOnReady = false;

// Clamp setup for [data-bunny-lightbox-calc-height]
function setupLightboxClamp(player, wrapper, video, updateSize) {
var calcBox = wrapper.querySelector('[data-bunny-lightbox-calc-height]');
if (!calcBox) return;

function getRatio() {
if (updateSize === 'cover') return null;

if (updateSize === 'true') {
if (video.videoWidth && video.videoHeight) return video.videoWidth / video.videoHeight;
var before = player.querySelector('[data-player-before]');
if (before && before.style && before.style.paddingTop) {
var pct = parseFloat(before.style.paddingTop);
if (pct > 0) return 100 / pct;
}
var r = player.getBoundingClientRect();
if (r.height > 0) return r.width / r.height;
return 16/9;
}

var beforeFalse = player.querySelector('[data-player-before]');
if (beforeFalse && beforeFalse.style && beforeFalse.style.paddingTop) {
var pad = parseFloat(beforeFalse.style.paddingTop);
if (pad > 0) return 100 / pad;
}
var rb = player.getBoundingClientRect();
if (rb.height > 0) return rb.width / rb.height;
return 16/9;
}

function applyClamp() {
if (updateSize === 'cover') {
calcBox.style.maxWidth = '';
calcBox.style.maxHeight = '';
return;
}

var parent = wrapper;
var cs = getComputedStyle(parent);
var pt = parseFloat(cs.paddingTop)    || 0;
var pb = parseFloat(cs.paddingBottom) || 0;
var pl = parseFloat(cs.paddingLeft)   || 0;
var pr = parseFloat(cs.paddingRight)  || 0;

var cw = (parent.clientWidth  - pl - pr);
var ch = (parent.clientHeight - pt - pb);
if (cw <= 0 || ch <= 0) return;

var ratio = getRatio();
if (!ratio) {
calcBox.style.maxWidth = '';
calcBox.style.maxHeight = '';
return;
}

var hIfFullWidth = cw / ratio;

if (hIfFullWidth <= ch) {
calcBox.style.maxWidth  = '100%';
calcBox.style.maxHeight = (hIfFullWidth / ch * 100) + '%';
} else {
calcBox.style.maxHeight = '100%';
calcBox.style.maxWidth  = ((ch * ratio) / cw * 100) + '%';
}
}

var rafPending = false;
function debouncedApply() {
if (rafPending) return;
if (wrapper.getAttribute('data-bunny-lightbox-status') !== 'active') return;
rafPending = true;
requestAnimationFrame(function(){
rafPending = false;
applyClamp();
});
}

var ro = new ResizeObserver(debouncedApply);
ro.observe(wrapper);

window.addEventListener('resize', debouncedApply);
window.addEventListener('orientationchange', debouncedApply);

if (updateSize === 'true') {
video.addEventListener('loadedmetadata', debouncedApply);
video.addEventListener('loadeddata', debouncedApply);
video.addEventListener('playing', debouncedApply);
}

player._applyClamp = debouncedApply;
debouncedApply();
}

setupLightboxClamp(player, wrapper, video, updateSize);

// Unified attach pipeline
function withAttach(src, onReady) {
if (isSafariNative) {
video.preload = 'auto';
video.src = src;
video.addEventListener('loadedmetadata', onReady, { once: true });
return;
}
if (canUseHlsJs) {
var hls = new Hls({ maxBufferLength: 10 });
player._hls = hls;
hls.attachMedia(video);
hls.on(Hls.Events.MEDIA_ATTACHED, function(){ hls.loadSource(src); });
hls.on(Hls.Events.MANIFEST_PARSED, function(){ onReady(); });
hls.on(Hls.Events.LEVEL_LOADED, function(e, data){
if (data && data.details && isFinite(data.details.totalduration) && timeDurationEls.length) {
setText(timeDurationEls, formatTime(data.details.totalduration));
}
});
return;
}
video.preload = 'auto';
video.src = src;
video.addEventListener('loadedmetadata', onReady, { once: true });
}

function attachMediaFor(src) {
if (currentSrc === src && isAttached) return;
if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }
if (timeDurationEls.length) setText(timeDurationEls, '00:00');

currentSrc = src;
isAttached = true;

withAttach(src, function onReady(){
readyIfIdle(player, pendingPlay);
updateBeforeRatioIOSSafe();
if (typeof player._applyClamp === 'function') player._applyClamp();
if (timeDurationEls.length && video.duration) setText(timeDurationEls, formatTime(video.duration));

if (autoStartOnReady && wrapper.getAttribute('data-bunny-lightbox-status') === 'active') {
setStatus('loading');
safePlay(video);
autoStartOnReady = false;
}
});
}

function ensureOpenUI(isActive) {
var state = isActive ? 'active' : 'not-active';
if (wrapper.getAttribute('data-bunny-lightbox-status') !== state) {
wrapper.setAttribute('data-bunny-lightbox-status', state);
}
if (isActive && typeof player._applyClamp === 'function') player._applyClamp();
}

// Centralized open policy
function isSameSrc(next){ return currentSrc && currentSrc === next; }
function planOnOpen(next) {
var same = isSameSrc(next);
if (!same) {
try { if (!video.paused && !video.ended) video.pause(); } catch(_) {}
if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }
isAttached = false; currentSrc = '';
if (timeDurationEls.length) setText(timeDurationEls, '00:00');
setActivated(false);
setStatus('idle');

attachMediaFor(next);
autoStartOnReady = !!autoplay;
pendingPlay = !!autoplay;
return;
}
autoStartOnReady = !!autoplay;
if (autoplay) {
setStatus('loading');
safePlay(video);
} else {
try { if (!video.paused && !video.ended) video.pause(); } catch(_) {}
setActivated(false);
setStatus('paused');
}
}

// Open/Close API
function openLightbox(src, placeholderUrl) {
if (!src) return;

function activate() {
ensureOpenUI(true);
planOnOpen(src);
}

if (playerPlaceholderImg && placeholderUrl) {
var needsSwap = playerPlaceholderImg.getAttribute('src') !== placeholderUrl;
if (needsSwap || !playerPlaceholderImg.complete || !playerPlaceholderImg.naturalWidth) {
playerPlaceholderImg.onload = function(){ playerPlaceholderImg.onload = null; activate(); };
playerPlaceholderImg.onerror = function(){ playerPlaceholderImg.onerror = null; activate(); };
if (needsSwap) playerPlaceholderImg.setAttribute('src', placeholderUrl);
else playerPlaceholderImg.dispatchEvent(new Event('load'));
} else {
activate();
}
} else {
activate();
}
}

function togglePlay() {
if (video.paused || video.ended) {
pendingPlay = true;
lastPauseBy = '';
setStatus('loading');
safePlay(video);
} else {
lastPauseBy = 'manual';
video.pause();
}
}
function toggleMute() { setMutedState(!video.muted); }

player.addEventListener('click', function(e) {
var btn = e.target.closest('[data-player-control]');
if (!btn || !player.contains(btn)) return;
var type = btn.getAttribute('data-player-control');
if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
else if (type === 'mute') toggleMute();
else if (type === 'fullscreen') toggleFullscreen();
});

// Fullscreen helpers
function isFsActive() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function enterFullscreen() {
if (player.requestFullscreen) return player.requestFullscreen();
if (video.requestFullscreen) return video.requestFullscreen();
if (video.webkitSupportsFullscreen && typeof video.webkitEnterFullscreen === 'function') return video.webkitEnterFullscreen();
}
function exitFullscreen() {
if (document.exitFullscreen) return document.exitFullscreen();
if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
if (video.webkitDisplayingFullscreen && typeof video.webkitExitFullscreen === 'function') return video.webkitExitFullscreen();
}
function toggleFullscreen() { if (isFsActive() || video.webkitDisplayingFullscreen) exitFullscreen(); else enterFullscreen(); }
document.addEventListener('fullscreenchange', function() { setFsAttr(isFsActive()); });
document.addEventListener('webkitfullscreenchange', function() { setFsAttr(isFsActive()); });
video.addEventListener('webkitbeginfullscreen', function() { setFsAttr(true); });
video.addEventListener('webkitendfullscreen', function() { setFsAttr(false); });

// Time text (not in rAF)
function updateTimeTexts() {
if (timeDurationEls.length) setText(timeDurationEls, formatTime(video.duration));
if (timeProgressEls.length) setText(timeProgressEls, formatTime(video.currentTime));
}
video.addEventListener('timeupdate', updateTimeTexts);
video.addEventListener('loadedmetadata', function(){ updateTimeTexts(); updateBeforeRatioIOSSafe(); });
video.addEventListener('loadeddata', function(){ updateBeforeRatioIOSSafe(); });
video.addEventListener('playing', function(){ updateBeforeRatioIOSSafe(); });
video.addEventListener('durationchange', updateTimeTexts);

// rAF visuals (progress + handle only)
function updateProgressVisuals() {
if (!video.duration) return;
var playedPct = (video.currentTime / video.duration) * 100;
if (progressBar) progressBar.style.transform = 'translateX(' + (-100 + playedPct) + '%)';
if (handle) handle.style.left = pctClamp(playedPct) + '%';
}
function pctClamp(p) { return p < 0 ? 0 : p > 100 ? 100 : p; }
function loop() {
updateProgressVisuals();
if (!video.paused && !video.ended) rafId = requestAnimationFrame(loop);
}

// Buffered bar (not in rAF)
function updateBufferedBar() {
if (!bufferedBar || !video.duration || !video.buffered.length) return;
var end = video.buffered.end(video.buffered.length - 1);
var buffPct = (end / video.duration) * 100;
bufferedBar.style.transform = 'translateX(' + (-100 + buffPct) + '%)';
}
video.addEventListener('progress', updateBufferedBar);
video.addEventListener('loadedmetadata', updateBufferedBar);
video.addEventListener('durationchange', updateBufferedBar);

// Media event wiring
video.addEventListener('play', function() { setActivated(true); cancelAnimationFrame(rafId); loop(); setStatus('playing'); });
video.addEventListener('playing', function() { pendingPlay = false; setStatus('playing'); });
video.addEventListener('pause', function() { pendingPlay = false; cancelAnimationFrame(rafId); updateProgressVisuals(); setStatus('paused'); });
video.addEventListener('waiting', function() { setStatus('loading'); });
video.addEventListener('canplay', function() { readyIfIdle(player, pendingPlay); });

// Video ended
video.addEventListener('ended', function () {
pendingPlay = false;
cancelAnimationFrame(rafId);
updateProgressVisuals();
setActivated(false);
video.currentTime = 0;

// Exit fullscreen if active
if (document.fullscreenElement || document.webkitFullscreenElement || video.webkitDisplayingFullscreen) {
if (document.exitFullscreen) document.exitFullscreen();
else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
else if (video.webkitExitFullscreen) video.webkitExitFullscreen();
}

closeLightbox();
});

// Scrubbing (pointer events)
if (timeline) {
var dragging = false, wasPlaying = false, targetTime = 0, lastSeekTs = 0, seekThrottle = 180, rect = null;
window.addEventListener('resize', function() { if (!dragging) rect = null; });
function getFractionFromX(x) {
if (!rect) rect = timeline.getBoundingClientRect();
var f = (x - rect.left) / rect.width; if (f < 0) f = 0; if (f > 1) f = 1; return f;
}
function previewAtFraction(f) {
if (!video.duration) return;
var pct = f * 100;
if (progressBar) progressBar.style.transform = 'translateX(' + (-100 + pct) + '%)';
if (handle) handle.style.left = pct + '%';
if (timeProgressEls.length) setText(timeProgressEls, formatTime(f * video.duration));
}
function maybeSeek(now) {
if (!video.duration) return;
if ((now - lastSeekTs) < seekThrottle) return;
lastSeekTs = now; video.currentTime = targetTime;
}
function onPointerDown(e) {
if (!video.duration) return;
dragging = true; wasPlaying = !video.paused && !video.ended; if (wasPlaying) video.pause();
player.setAttribute('data-timeline-drag', 'true'); rect = timeline.getBoundingClientRect();
var f = getFractionFromX(e.clientX); targetTime = f * video.duration; previewAtFraction(f); maybeSeek(performance.now());
timeline.setPointerCapture && timeline.setPointerCapture(e.pointerId);
window.addEventListener('pointermove', onPointerMove, { passive: false });
window.addEventListener('pointerup', onPointerUp, { passive: true });
e.preventDefault();
}
function onPointerMove(e) {
if (!dragging) return;
var f = getFractionFromX(e.clientX); targetTime = f * video.duration; previewAtFraction(f); maybeSeek(performance.now()); e.preventDefault();
}
function onPointerUp() {
if (!dragging) return;
dragging = false; player.setAttribute('data-timeline-drag', 'false'); rect = null; video.currentTime = targetTime;
if (wasPlaying) safePlay(video); else { updateProgressVisuals(); updateTimeTexts(); }
window.removeEventListener('pointermove', onPointerMove);
window.removeEventListener('pointerup', onPointerUp);
}
timeline.addEventListener('pointerdown', onPointerDown, { passive: false });
if (handle) handle.addEventListener('pointerdown', onPointerDown, { passive: false });
}

// Hover/idle detection (pointer-based)
var hoverTimer;
var hoverHideDelay = 3000;
function setHover(state) {
if (player.getAttribute('data-player-hover') !== state) {
player.setAttribute('data-player-hover', state);
}
}
function scheduleHide() { clearTimeout(hoverTimer); hoverTimer = setTimeout(function() { setHover('idle'); }, hoverHideDelay); }
function wakeControls() { setHover('active'); scheduleHide(); }
player.addEventListener('pointerdown', wakeControls);
document.addEventListener('fullscreenchange', wakeControls);
document.addEventListener('webkitfullscreenchange', wakeControls);
var trackingMove = false;
function onPointerMoveGlobal(e) {
var r = player.getBoundingClientRect();
if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) wakeControls();
}
player.addEventListener('pointerenter', function() {
wakeControls();
if (!trackingMove) { trackingMove = true; window.addEventListener('pointermove', onPointerMoveGlobal, { passive: true }); }
});
player.addEventListener('pointerleave', function() {
setHover('idle'); clearTimeout(hoverTimer);
if (trackingMove) { trackingMove = false; window.removeEventListener('pointermove', onPointerMoveGlobal); }
});

// Close Function
function closeLightbox() {
ensureOpenUI(false);

var hasPlayed = false;
try {
if (video.played && video.played.length) {
for (var i = 0; i < video.played.length; i++) {
if (video.played.end(i) > 0) { hasPlayed = true; break; }
}
} else {
hasPlayed = video.currentTime > 0;
}
} catch (_) {}

try { if (!video.paused && !video.ended) video.pause(); } catch (_) {}

setActivated(false);
setStatus(hasPlayed ? 'paused' : 'idle');
}

// Global open/close controls + ESC
document.addEventListener('click', function(e) {
var openBtn = e.target.closest('[data-bunny-lightbox-control="open"]');
if (openBtn) {
var src = openBtn.getAttribute('data-bunny-lightbox-src') || '';
if (!src) return;
var imgEl = openBtn.querySelector('[data-bunny-lightbox-placeholder]');
var placeholderUrl = imgEl ? imgEl.getAttribute('src') : '';
openLightbox(src, placeholderUrl);
return;
}
var closeBtn = e.target.closest('[data-bunny-lightbox-control="close"]');
if (closeBtn) {
var closeInWrapper = closeBtn.closest('[data-bunny-lightbox-status]');
if (closeInWrapper === wrapper) closeLightbox();
return;
}
});

document.addEventListener('keydown', function(e) {
if (e.key === 'Escape') closeLightbox();
});

// Helper: time/text/meta/ratio utilities
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function formatTime(sec) {
if (!isFinite(sec) || sec < 0) return '00:00';
var s = Math.floor(sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
return h > 0 ? (h + ':' + pad2(m) + ':' + pad2(r)) : (pad2(m) + ':' + pad2(r));
}
function setText(nodes, text) { nodes.forEach(function(n){ n.textContent = text; }); }

// Helper: Choose best HLS level by resolution --- */
function bestLevel(levels) {
if (!levels || !levels.length) return null;
return levels.reduce(function(a, b) { return ((b.width||0) > (a.width||0)) ? b : a; }, levels[0]);
}

// Helper: Safe programmatic play
function safePlay(video) {
var p = video.play();
if (p && typeof p.then === 'function') p.catch(function(){});
}

// Helper: Ready status guard
function readyIfIdle(player, pendingPlay) {
if (!pendingPlay &&
player.getAttribute('data-player-activated') !== 'true' &&
player.getAttribute('data-player-status') === 'idle') {
player.setAttribute('data-player-status', 'ready');
}
}

// Helper: Ratio Setter
function setBeforeRatio(player, updateSize, w, h) {
if (updateSize !== 'true' || !w || !h) return;
var before = player.querySelector('[data-player-before]');
if (!before) return;
before.style.paddingTop = (h / w * 100) + '%';
}
function maybeSetRatioFromVideo(player, updateSize, video) {
if (updateSize !== 'true') return;
var before = player.querySelector('[data-player-before]');
if (!before) return;
var hasPad = before.style.paddingTop && before.style.paddingTop !== '0%';
if (!hasPad && video.videoWidth && video.videoHeight) {
setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
}
}

// Helper: robust ratio setter for iOS Safari (with HLS fallback)
function updateBeforeRatioIOSSafe() {
if (updateSize !== 'true') return;
var before = player.querySelector('[data-player-before]');
if (!before) return;

function apply(w, h) {
if (!w || !h) return;
before.style.paddingTop = (h / w * 100) + '%';
if (typeof player._applyClamp === 'function') player._applyClamp();
}

if (video.videoWidth && video.videoHeight) { apply(video.videoWidth, video.videoHeight); return; }

if (player._hls && player._hls.levels && player._hls.levels.length) {
var lvls = player._hls.levels;
var best = lvls.reduce(function(a, b) { return ((b.width||0) > (a.width||0)) ? b : a; }, lvls[0]);
if (best && best.width && best.height) { apply(best.width, best.height); return; }
}

requestAnimationFrame(function () {
if (video.videoWidth && video.videoHeight) { apply(video.videoWidth, video.videoHeight); return; }

var master = (typeof currentSrc === 'string' && currentSrc) ? currentSrc : '';
if (!master || master.indexOf('blob:') === 0) {
var attrSrc = player.getAttribute('data-bunny-lightbox-src') || player.getAttribute('data-player-src') || '';
if (attrSrc && attrSrc.indexOf('blob:') !== 0) master = attrSrc;
}
if (!master || !/^https?:/i.test(master)) return;

fetch(master, { credentials: 'omit', cache: 'no-store' })
.then(function (r) { if (!r.ok) throw new Error(); return r.text(); })
.then(function (txt) {
var lines = txt.split(/\r?\n/);
var bestW = 0, bestH = 0, last = null;
for (var i = 0; i < lines.length; i++) {
var line = lines[i];
if (line.indexOf('#EXT-X-STREAM-INF:') === 0) {
last = line;
} else if (last && line && line[0] !== '#') {
var m = /RESOLUTION=(\d+)x(\d+)/.exec(last);
if (m) {
var W = parseInt(m[1], 10), H = parseInt(m[2], 10);
if (W > bestW) { bestW = W; bestH = H; }
}
last = null;
}
}
if (bestW && bestH) apply(bestW, bestH);
})
.catch(function () {});
});
}
}

// Initialize Bunny HTML HLS Lightbox
document.addEventListener('DOMContentLoaded', function() {
initBunnyLightboxPlayer();
});
```

## Implementation

Hosting videos on Bunny
For hosting .m3u8 HLS files we use Bunny.net. It provides a straightforward interface for uploading and managing videos, automatically generating the HLS streams needed by this player.

About HLS (.m3u8)
This player is built exclusively for HTTP Live Streaming (HLS) sources, which use a .m3u8 playlist file. An .m3u8 playlist describes a sequence of small media chunks (usually .ts or .mp4 segments) and can include multiple quality levels for adaptive streaming. Playback is handled through hls.j on most browsers, or through Safari’s native HLS support on macOS and iOS. Because of this design, the player will not work with regular MP4 files or any format other than .m3u8.

Open the lightbox
Add [data-bunny-lightbox-control="open"] to any element. When the user clicks this element that will open the lightbox.
To load the correct video locate the HLS Playlist URL in the Bunny Stream section of the dashboard (e.g., https://vz-6c19fa58-db3.b-cdn.net/8505a43d-08ba-41b8-a579-31c524e2c854/playlist.m3u8). Add this url to the attribute [data-bunny-lightbox-src].
To show a placeholder image when loading the video add a <img> element with the attr [data-bunny-lightbox-placeholder] attached as a child of the [data-bunny-lightbox-control="open"]. This image can be hidden with display: none; and will only be used as data.
<button data-bunny-lightbox-control="open" data-bunny-lightbox-src="https://vz-6ed806ff-5e5.b-cdn.net/b6a663de-07c1-4c37-8bb6-0e79fef7fb3c/playlist.m3u8">
<img data-bunny-lightbox-placeholder="" src="image.jpg" alt="">
<span>Open Video</span>
</button>
Close the lightbox
Add [data-bunny-lightbox-control="close"] to any element. When the user clicks this element it will close the lightbox and pause the video. Clicking the esc button on your keyboard will also close the lightbox.

<button data-bunny-lightbox-control="close">Close Video</button>
Lightbox Container
The lightbox wrapper is defined with [data-bunny-lightbox-status="not-active"]. Inside it, the video player is placed within [data-bunny-lightbox-calc-height], which manages its sizing. The wrapper also contains the dark background overlay and the close button.

When the status is set to [data-bunny-lightbox-status="active"] the player is opened. This attribute can be used to show/hide the player inside with CSS.

<div data-bunny-lightbox-status="not-active">
<div class="dark-background" data-bunny-lightbox-control="close"></div>
<div data-bunny-lightbox-calc-height>

<!-- Video Player -->
<div class="bunny-player" data-bunny-lightbox-init></div>

</div>
</div>
Video Player
The player is always marked witht the attribute[data-bunny-lightbox-init]. Inside this player, the [data-player-src] attribute points to an HLS .m3u8 source. This container becomes the root for all other attributes and UI.

Status
The [data-player-status] attribute reflects the live playback state of the video. This value is never set manually, it updates automatically as the player changes state. You can style your UI based on these statuses to show or hide placeholders, loaders, and controls.

idle → The player has been initialized but no media is attached or ready yet. This is the starting state, often where you show a poster or placeholder image.
ready → Metadata or manifest information has been loaded, so the video is prepared to start instantly. At this stage, you can show a “ready to play” UI but playback hasn’t started yet.
loading → The video is buffering, either while starting playback or resuming from a stall. This is the moment to display a loading indicator or spinner.
playing → Playback is running actively. Controls for pause and timeline progress should be visible, and overlays like placeholders should be hidden.
paused → Playback has been stopped by the user or has reached the end. Controls for resuming can be emphasized, and depending on your design, the placeholder or play button can reappear.
In addition, the attribute [data-player-activated=“true|false”] tracks whether the video has ever started once. It switches to true after the first play and resets back to false when the video ends. This lets you hide placeholders only after first play, then bring them back when playback finishes.

Play / Pause
Elements with [data-player-control=“play”] or [data-player-control=“pause”] control playback explicitly. A play button always attempts to start playback, while a pause button always stops it.

PlayPause Toggle
An element with [data-player-control=“playpause”] acts as a toggle. When the video is paused, clicking it will start playback; when the video is playing, clicking it will pause. This is the simplest control if you want just one button.

Mute
An element with [data-player-control=“mute”] toggles the mute state. The status attribute [data-player-muted=“true|false”] is updated automatically to reflect the current mute state, so you can style your mute/unmute icon accordingly.

Fullscreen
An element with [data-player-control=“fullscreen”] toggles fullscreen. The status attribute [data-player-fullscreen=“true|false”] is updated automatically whenever the player enters or exits fullscreen, so your UI can adjust to fullscreen mode.

Timeline
The interactive seek area is marked with [data-player-timeline]. This is where users can click or drag to change playback position.

The element [data-player-progress] shows the portion of the video already played. It updates with a CSS transform (translateX) for smooth animation.
The element [data-player-buffered] shows how much of the video is buffered ahead of playback.
The element [data-player-timeline-handle] is a draggable knob that follows the current time. Users can drag this handle to scrub through the video.
While scrubbing, the player sets [data-timeline-drag=“true”], which you can use to style the timeline differently during user interaction.
Duration & Progress
Two attributes provide formatted playback times for display:

The attribute [data-player-time-duration] shows the total length of the video. It is automatically formatted as mm:ss for short clips or hh:mm:ss if longer than an hour.
The attribute [data-player-time-progress] shows the current playback position, updating continuously during playback and also while scrubbing.
Both values are updated automatically, so you can place them anywhere in your interface.

Aspect Ratio
The layout of the player can be stabilized before playback begins:

The attribute [data-player-update-size=“true”] calculates the video’s aspect ratio and applies inline padding-top to [data-player-before] to preserve layout.
The attribute [data-player-update-size=“cover”] disables this calculation, leaving it up to CSS to cover the container.
Hover
The [data-player-hover=“active|idle”] attribute reflects whether the user is currently interacting with the player. When the mouse or touch is active, it switches to active, and after a few seconds of inactivity, it returns to idle. This allows you to fade controls in and out automatically depending on interaction.

Autoplay
Enable autoplay by setting the attribute [data-player-autoplay=“true”]. The video will start playing automatically when the lightbox is opened.
