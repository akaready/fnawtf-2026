---
title: "Custom Bunny HLS Player (Advanced)"
category: "Video & Audio"
tags:
  - "Video"
  - "Player"
  - "Custom"
  - "Play"
  - "Pause"
  - "Autoplay"
  - "Mute"
  - "Fullscreen"
  - "Media"
  - "Image"
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
<div data-player-muted="false" class="bunny-player" data-player-fullscreen="false" data-player-activated="false" data-player-autoplay="false" data-bunny-player-init="" data-player-hover="idle" data-player-src="https://vz-6ed806ff-5e5.b-cdn.net/b6a663de-07c1-4c37-8bb6-0e79fef7fb3c/playlist.m3u8" data-player-status="idle" data-player-update-size="false" data-player-lazy="meta">
<div data-player-before="" class="bunny-player__before"></div>
<video preload="auto" width="1920" height="1080" playsinline="" class="bunny-player__video"></video>
<img src="https://cdn.prod.website-files.com/68b14d8b0d705811e0f931cf/68bb2d31856462ca9660c546_player-placeholder.jpg" alt="" class="bunny-player__placeholder">
<div class="bunny-player__dark"></div>
<div data-player-control="playpause" class="bunny-player__playpause">
<div class="bunny-player__big-btn">
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-player__pause-svg"><path d="M16 5V19" stroke="currentColor" stroke-width="3" stroke-miterlimit="10"></path><path d="M8 5V19" stroke="currentColor" stroke-width="3" stroke-miterlimit="10"></path></svg>
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-player__play-svg"><path d="M6 12V5.01109C6 4.05131 7.03685 3.4496 7.87017 3.92579L14 7.42855L20.1007 10.9147C20.9405 11.3945 20.9405 12.6054 20.1007 13.0853L14 16.5714L7.87017 20.0742C7.03685 20.5503 6 19.9486 6 18.9889V12Z" fill="currentColor"></path></svg>
</div>
</div>
<div class="bunny-player__interface">
<div class="bunny-player__interface-fade"></div>
<div class="bunny-player__interface-bottom">
<div data-player-control="playpause" class="bunny-player__toggle-playpause">
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-player__pause-svg"><path d="M16 5V19" stroke="currentColor" stroke-width="3" stroke-miterlimit="10"></path><path d="M8 5V19" stroke="currentColor" stroke-width="3" stroke-miterlimit="10"></path></svg>
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-player__play-svg"><path d="M6 12V5.01109C6 4.05131 7.03685 3.4496 7.87017 3.92579L14 7.42855L20.1007 10.9147C20.9405 11.3945 20.9405 12.6054 20.1007 13.0853L14 16.5714L7.87017 20.0742C7.03685 20.5503 6 19.9486 6 18.9889V12Z" fill="currentColor"></path></svg>
</div>
<div class="bunny-player__time">
<p data-player-time-progress="" class="bunny-player__text">00:00</p>
<p class="bunny-player__text is--transparent">/</p>
<p data-player-time-duration="" class="bunny-player__text is--transparent">00:00</p>
</div>
<div data-player-timeline="" class="bunny-player__timeline">
<div class="bunny-player__timeline-bar">
<div class="bunny-player__timeline-bg"></div>
<div data-player-buffered="" class="bunny-player__timeline-buffered"></div>
<div data-player-progress="" class="bunny-player__timeline-progress"></div>
</div>
<div data-player-timeline-handle="" class="bunny-player__timeline-handle"></div>
</div>
<div class="bunny-player__interface-btns">
<div data-player-control="mute" class="bunny-player__toggle-mute">
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-player__volume-up-svg"><path d="M3 8.99998V15H7L12 20V3.99998L7 8.99998H3ZM16.5 12C16.5 10.23 15.48 8.70998 14 7.96998V16.02C15.48 15.29 16.5 13.77 16.5 12ZM14 3.22998V5.28998C16.89 6.14998 19 8.82998 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.71998 18.01 4.13998 14 3.22998Z" fill="currentColor"></path></svg>
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-player__volume-mute-svg"><path d="M16.5 12C16.5 10.23 15.48 8.71 14 7.97V10.18L16.45 12.63C16.48 12.43 16.5 12.22 16.5 12ZM19 12C19 12.94 18.8 13.82 18.46 14.64L19.97 16.15C20.63 14.91 21 13.5 21 12C21 7.72 18.01 4.14 14 3.23V5.29C16.89 6.15 19 8.83 19 12ZM4.27 3L3 4.27L7.73 9H3V15H7L12 20V13.27L16.25 17.52C15.58 18.04 14.83 18.45 14 18.7V20.76C15.38 20.45 16.63 19.81 17.69 18.95L19.73 21L21 19.73L12 10.73L4.27 3ZM12 4L9.91 6.09L12 8.18V4Z" fill="currentColor"></path></svg>
</div>
<div data-player-control="fullscreen" class="bunny-player__toggle-fullscreen">
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-player__fullscreen-scale-svg"><rect x="3" y="14" width="2" height="7" fill="currentColor"></rect><rect x="3" y="3" width="2" height="7" fill="currentColor"></rect><rect x="19" y="3" width="2" height="7" fill="currentColor"></rect><rect x="19" y="14" width="2" height="7" fill="currentColor"></rect><rect x="3" y="19" width="7" height="2" fill="currentColor"></rect><rect x="14" y="19" width="7" height="2" fill="currentColor"></rect><rect x="3" y="3" width="7" height="2" fill="currentColor"></rect><rect x="14" y="3" width="7" height="2" fill="currentColor"></rect></svg>
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="bunny-player__fullscreen-shrink-svg"><rect x="7" y="2" width="2" height="7" fill="currentColor"></rect><rect x="15" y="2" width="2" height="7" fill="currentColor"></rect><rect x="15" y="15" width="2" height="7" fill="currentColor"></rect><rect x="8" y="15" width="2" height="7" fill="currentColor"></rect><rect x="2" y="7" width="7" height="2" fill="currentColor"></rect><rect x="3" y="15" width="7" height="2" fill="currentColor"></rect><rect x="15" y="7" width="7" height="2" fill="currentColor"></rect><rect x="15" y="15" width="7" height="2" fill="currentColor"></rect></svg>
</div>
</div>
</div>
</div>
<div class="bunny-player__loading">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="L9" x="0px" y="0px" viewbox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve" width="100%" class="bunny-player__loading-svg" fill="none"><path fill="currentColor" d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50"></path><animatetransform attributename="transform" attributetype="XML" type="rotate" dur="1s" from="0 50 50" to="360 50 50" repeatcount="indefinite"></animatetransform></svg>
</div>
</div>
```

## CSS

```css
.bunny-player {
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
transform: translateX(0);
}

.bunny-player__before {
padding-top: 62.5%;
}

/* Animation */
[data-bunny-player-init] :is(.bunny-player__placeholder, .bunny-player__dark, .bunny-player__playpause, .bunny-player__loading) {
transition: opacity 0.3s linear, visibility 0.3s linear;
}

/* Placeholder */
.bunny-player__placeholder {
object-fit: cover;
width: 100%;
height: 100%;
position: absolute;
}

[data-bunny-player-init][data-player-status="playing"] .bunny-player__placeholder,
[data-bunny-player-init][data-player-status="paused"] .bunny-player__placeholder,
[data-bunny-player-init][data-player-activated="true"][data-player-status="ready"] .bunny-player__placeholder {
opacity: 0;
visibility: hidden;
}

/* Dark Overlay */
.bunny-player__dark {
opacity: .1;
background-color: #000;
width: 100%;
height: 100%;
position: absolute;
}

[data-bunny-player-init][data-player-status="paused"] .bunny-player__dark,
[data-bunny-player-init][data-player-status="playing"][data-player-hover="active"] .bunny-player__dark{
opacity: 0.3;
}

[data-bunny-player-init][data-player-status="playing"] .bunny-player__dark {
opacity: 0;
}

.bunny-player__video {
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
.bunny-player__playpause {
pointer-events: auto;
justify-content: center;
align-items: center;
width: 100%;
height: 100%;
display: flex;
position: absolute;
}

[data-bunny-player-init][data-player-status="playing"] .bunny-player__playpause,
[data-bunny-player-init][data-player-status="loading"] .bunny-player__playpause {
opacity: 0;
}

[data-bunny-player-init][data-player-status="playing"][data-player-hover="active"] .bunny-player__playpause {
opacity: 1;
}

[data-bunny-player-init][data-player-status="playing"] .bunny-player__play-svg,
[data-bunny-player-init][data-player-status="loading"] .bunny-player__play-svg {
display: none;
}

[data-bunny-player-init][data-player-status="playing"] .bunny-player__pause-svg,
[data-bunny-player-init][data-player-status="loading"] .bunny-player__pause-svg{
display: block;
}

/* Loading */
.bunny-player__loading {
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

[data-bunny-player-init][data-player-status="loading"] .bunny-player__loading {
opacity: 1;
visibility: visible;
}

/* Interface */
.bunny-player__interface {
flex-flow: column;
justify-content: flex-end;
align-items: baseline;
width: 100%;
height: 100%;
display: flex;
position: absolute;
transition: all 0.6s cubic-bezier(0.625, 0.05, 0, 1);
}

[data-bunny-player-init][data-player-status="playing"] .bunny-player__interface,
[data-bunny-player-init][data-player-status="loading"] .bunny-player__interface{
opacity: 0;
transform: translateY(1em) rotate(0.001deg);
}

[data-bunny-player-init][data-player-status="playing"][data-player-hover="active"] .bunny-player__interface,
[data-bunny-player-init][data-player-status="loading"][data-player-hover="active"] .bunny-player__interface {
opacity: 1;
transform: translateY(0em) rotate(0.001deg);
}

.bunny-player__interface-bottom {
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

.bunny-player__toggle-mute,
.bunny-player__toggle-fullscreen {
cursor: pointer;
width: 1.5em;
height: 1.5em;
}

.bunny-player__timeline {
cursor: pointer;
flex: 1;
align-items: center;
height: 1em;
margin-left: .5em;
margin-right: .5em;
display: flex;
position: relative;
}

[data-bunny-player-init][data-player-status="idle"][data-player-activated="false"] .bunny-player__timeline,
[data-bunny-player-init][data-player-status="ready"][data-player-activated="false"] .bunny-player__timeline {
pointer-events: none;
}

.bunny-player__timeline-progress {
pointer-events: none;
background-color: #ff4c24;
border-radius: 1em;
width: 100%;
height: 100%;
position: absolute;
transform: translateX(-100%);
}

.bunny-player__timeline-buffered {
opacity: .2;
pointer-events: none;
background-color: #fff;
border-radius: 1em;
width: 100%;
height: 100%;
position: absolute;
transform: translateX(-100%);
}

.bunny-player__timeline-handle {
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

[data-bunny-player-init][data-timeline-drag="true"] .bunny-player__timeline-handle {
transform: translate(-50%, -50%) scale(1);
}

.bunny-player__timeline-bar {
border-radius: 1em;
width: 100%;
height: 30%;
position: absolute;
overflow: hidden;
}

.bunny-player__time {
grid-column-gap: .125em;
grid-row-gap: .125em;
flex: none;
justify-content: center;
align-items: center;
width: 5.75em;
display: flex;
}

.bunny-player__timeline-bg {
background-color: #ffffff26;
border-radius: 1em;
width: 100%;
height: 100%;
position: absolute;
}

.bunny-player__toggle-playpause {
cursor: pointer;
width: 1.5em;
height: 1.5em;
}

.bunny-player__text {
white-space: nowrap;
margin-bottom: 0;
font-size: .9375em;
line-height: 1;
}

.bunny-player__big-btn {
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

.bunny-player__loading-svg {
width: 6em;
}

.bunny-player__pause-svg {
display: none;
}

.bunny-player__interface-fade {
opacity: .5;
background-image: linear-gradient(#0000, #000);
width: 100%;
height: 25%;
position: absolute;
bottom: 0;
}

.bunny-player__interface-btns {
grid-column-gap: .5em;
grid-row-gap: .5em;
align-items: center;
display: flex;
}

[data-bunny-player-init][data-player-muted="true"] .bunny-player__volume-mute-svg {
display: block;
}

[data-bunny-player-init][data-player-muted="true"] .bunny-player__volume-up-svg {
display: none;
}

.bunny-player__volume-mute-svg {
display: none;
}

.bunny-player__volume-up-svg {
display: block;
}

.bunny-player__fullscreen-shrink-svg {
display: none;
}

.bunny-player__fullscreen-scale-svg {
display: block;
}

[data-bunny-player-init][data-player-fullscreen="true"] .bunny-player__fullscreen-shrink-svg {
display: block;
}

[data-bunny-player-init][data-player-fullscreen="true"] .bunny-player__fullscreen-scale-svg {
display: none;
}

/* Cover Mode */
[data-bunny-player-init][data-player-update-size="cover"] {
height: 100%;
top: 0;
left: 0;
position: absolute;
}

[data-bunny-player-init][data-player-update-size="cover"] [data-player-before] {
display: none;
}

[data-bunny-player-init][data-player-update-size="cover"][data-player-fullscreen="false"] .bunny-player__video {
object-fit: cover;
}
```

## JavaScript

```javascript
function initBunnyPlayer() {
document.querySelectorAll('[data-bunny-player-init]').forEach(function(player) {
var src = player.getAttribute('data-player-src');
if (!src) return;

var video = player.querySelector('video');
if (!video) return;

try { video.pause(); } catch(_) {}
try { video.removeAttribute('src'); video.load(); } catch(_) {}

// Attribute helpers
function setStatus(s) {
if (player.getAttribute('data-player-status') !== s) {
player.setAttribute('data-player-status', s);
}
}
function setMutedState(v) {
video.muted = !!v;
player.setAttribute('data-player-muted', video.muted ? 'true' : 'false');
}
function setFsAttr(v) { player.setAttribute('data-player-fullscreen', v ? 'true' : 'false'); }
function setActivated(v) { player.setAttribute('data-player-activated', v ? 'true' : 'false'); }
if (!player.hasAttribute('data-player-activated')) setActivated(false);

// Elements
var timeline = player.querySelector('[data-player-timeline]');
var progressBar = player.querySelector('[data-player-progress]');
var bufferedBar = player.querySelector('[data-player-buffered]');
var handle = player.querySelector('[data-player-timeline-handle]');
var timeDurationEls = player.querySelectorAll('[data-player-time-duration]');
var timeProgressEls = player.querySelectorAll('[data-player-time-progress]');

// Flags
var updateSize = player.getAttribute('data-player-update-size'); // "true" | "cover" | null
var lazyMode = player.getAttribute('data-player-lazy');          // "true" | "meta" | null
var isLazyTrue = lazyMode === 'true';
var isLazyMeta = lazyMode === 'meta';
var autoplay = player.getAttribute('data-player-autoplay') === 'true';
var initialMuted = player.getAttribute('data-player-muted') === 'true';

// Used to suppress 'ready' flicker when user just pressed play in lazy modes
var pendingPlay = false;

// Autoplay forces muted; IO will trigger "fake click"
if (autoplay) { setMutedState(true); video.loop = true; } else { setMutedState(initialMuted); }

video.setAttribute('muted', '');
video.setAttribute('playsinline', '');
video.setAttribute('webkit-playsinline', '');
video.playsInline = true;
if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
if (autoplay) video.autoplay = false;

var isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl');
var canUseHlsJs = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

// Minimal ratio fetch when requested (and not already handled by lazy meta)
if (updateSize === 'true' && !isLazyMeta) {
if (isLazyTrue) {
// Do nothing: no fetch, no <video> touch when lazy=true
} else {
var prev = video.preload;
video.preload = 'metadata';
var onMeta2 = function() {
setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
video.removeEventListener('loadedmetadata', onMeta2);
video.preload = prev || '';
};
video.addEventListener('loadedmetadata', onMeta2, { once: true });
video.src = src;
}
}

//  Lazy meta fetch (duration + aspect) without attaching playback
function fetchMetaOnce() {
getSourceMeta(src, canUseHlsJs).then(function(meta){
if (meta.width && meta.height) setBeforeRatio(player, updateSize, meta.width, meta.height);
if (timeDurationEls.length && isFinite(meta.duration) && meta.duration > 0) {
setText(timeDurationEls, formatTime(meta.duration));
}
readyIfIdle(player, pendingPlay);
});
}

// Attach media only once (for actual playback)
var isAttached = false;
var userInteracted = false;
var lastPauseBy = '';
function attachMediaOnce() {
if (isAttached) return;
isAttached = true;

if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }

if (isSafariNative) {
video.preload = (isLazyTrue || isLazyMeta) ? 'auto' : video.preload;
video.src = src;
video.addEventListener('loadedmetadata', function() {
readyIfIdle(player, pendingPlay);
if (updateSize === 'true') setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
if (timeDurationEls.length) setText(timeDurationEls, formatTime(video.duration));
}, { once: true });
} else if (canUseHlsJs) {
var hls = new Hls({ maxBufferLength: 10 });
hls.attachMedia(video);
hls.on(Hls.Events.MEDIA_ATTACHED, function() { hls.loadSource(src); });
hls.on(Hls.Events.MANIFEST_PARSED, function() {
readyIfIdle(player, pendingPlay);
if (updateSize === 'true') {
var lvls = hls.levels || [];
var best = bestLevel(lvls);
if (best && best.width && best.height) setBeforeRatio(player, updateSize, best.width, best.height);
}
});
hls.on(Hls.Events.LEVEL_LOADED, function(e, data) {
if (data && data.details && isFinite(data.details.totalduration)) {
if (timeDurationEls.length) setText(timeDurationEls, formatTime(data.details.totalduration));
}
});
player._hls = hls;
} else {
video.src = src;
}
}

// Initialize based on lazy mode
if (isLazyMeta) {
fetchMetaOnce();
video.preload = 'none';
} else if (isLazyTrue) {
video.preload = 'none';
} else {
attachMediaOnce();
}

// Toggle play/pause
function togglePlay() {
userInteracted = true;
if (video.paused || video.ended) {
if ((isLazyTrue || isLazyMeta) && !isAttached) attachMediaOnce();
pendingPlay = true;
lastPauseBy = '';
setStatus('loading');
safePlay(video);
} else {
lastPauseBy = 'manual';
video.pause();
}
}

// Toggle mute
function toggleMute() {
video.muted = !video.muted;
player.setAttribute('data-player-muted', video.muted ? 'true' : 'false');
}

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

// Controls (delegated)
player.addEventListener('click', function(e) {
var btn = e.target.closest('[data-player-control]');
if (!btn || !player.contains(btn)) return;
var type = btn.getAttribute('data-player-control');
if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
else if (type === 'mute') toggleMute();
else if (type === 'fullscreen') toggleFullscreen();
});

// Time text (not in rAF)
function updateTimeTexts() {
if (timeDurationEls.length) setText(timeDurationEls, formatTime(video.duration));
if (timeProgressEls.length) setText(timeProgressEls, formatTime(video.currentTime));
}
video.addEventListener('timeupdate', updateTimeTexts);
video.addEventListener('loadedmetadata', function(){ updateTimeTexts(); maybeSetRatioFromVideo(player, updateSize, video); });
video.addEventListener('loadeddata', function(){ maybeSetRatioFromVideo(player, updateSize, video); });
video.addEventListener('playing', function(){ maybeSetRatioFromVideo(player, updateSize, video); });
video.addEventListener('durationchange', updateTimeTexts);

// rAF visuals (progress + handle only)
var rafId;
function updateProgressVisuals() {
if (!video.duration) return;
var playedPct = (video.currentTime / video.duration) * 100;
if (progressBar) progressBar.style.transform = 'translateX(' + (-100 + playedPct) + '%)';
if (handle) handle.style.left = playedPct + '%';
}
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
video.addEventListener('ended', function() { pendingPlay = false; cancelAnimationFrame(rafId); updateProgressVisuals(); setStatus('paused'); setActivated(false); });

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

// In-view auto play/pause (only when autoplay is true)
if (autoplay) {
var io = new IntersectionObserver(function(entries) {
entries.forEach(function(entry) {
var inView = entry.isIntersecting && entry.intersectionRatio > 0;

if (inView) {
if ((isLazyTrue || isLazyMeta) && !isAttached) attachMediaOnce();

if (video.paused) {
// we will attempt to play -> show loading until events flip to playing
lastPauseBy = '';
pendingPlay = true;
setStatus('loading');
safePlay(video);
} else {
// already playing; don't flash loading
setStatus('playing');
}
} else {
if (!video.paused && !video.ended) {
lastPauseBy = 'io';
video.pause();
setStatus('paused'); // keep UI honest while out of view
}
}
});
}, { threshold: 0.1 });

io.observe(player);
}
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

// Helper: simple URL resolver
function resolveUrl(base, rel) { try { return new URL(rel, base).toString(); } catch(_) { return rel; } }

// Helper: Unified meta fetch (hls.js or native fetch)
function getSourceMeta(src, useHlsJs) {
return new Promise(function(resolve) {
if (useHlsJs && window.Hls && Hls.isSupported()) {
try {
var tmp = new Hls();
var out = { width: 0, height: 0, duration: NaN };
var haveLvls = false, haveDur = false;

tmp.on(Hls.Events.MANIFEST_PARSED, function(e, data) {
var lvls = (data && data.levels) || tmp.levels || [];
var best = bestLevel(lvls);
if (best && best.width && best.height) { out.width = best.width; out.height = best.height; haveLvls = true; }
});
tmp.on(Hls.Events.LEVEL_LOADED, function(e, data) {
if (data && data.details && isFinite(data.details.totalduration)) { out.duration = data.details.totalduration; haveDur = true; }
});
tmp.on(Hls.Events.ERROR, function(){ try { tmp.destroy(); } catch(_) {} resolve(out); });
tmp.on(Hls.Events.LEVEL_LOADED, function(){ try { tmp.destroy(); } catch(_) {} resolve(out); });

tmp.loadSource(src);
return;
} catch(_) {
resolve({ width:0, height:0, duration:NaN });
return;
}
}

function parseMaster(masterText) {
var lines = masterText.split(/\r?\n/);
var bestW = 0, bestH = 0, firstMedia = null, lastInf = null;
for (var i=0;i<lines.length;i++) {
var line = lines[i];
if (line.indexOf('#EXT-X-STREAM-INF:') === 0) {
lastInf = line;
} else if (lastInf && line && line[0] !== '#') {
if (!firstMedia) firstMedia = line.trim();
var m = /RESOLUTION=(\d+)x(\d+)/.exec(lastInf);
if (m) {
var w = parseInt(m[1],10), h = parseInt(m[2],10);
if (w > bestW) { bestW = w; bestH = h; }
}
lastInf = null;
}
}
return { bestW: bestW, bestH: bestH, media: firstMedia };
}
function sumDuration(mediaText) {
var dur = 0, re = /#EXTINF:([\d.]+)/g, m;
while ((m = re.exec(mediaText))) dur += parseFloat(m[1]);
return dur;
}

fetch(src, { credentials: 'omit', cache: 'no-store' }).then(function(r){
if (!r.ok) throw new Error('master');
return r.text();
}).then(function(master){
var info = parseMaster(master);
if (!info.media) { resolve({ width: info.bestW||0, height: info.bestH||0, duration: NaN }); return; }
var mediaUrl = resolveUrl(src, info.media);
return fetch(mediaUrl, { credentials: 'omit', cache: 'no-store' }).then(function(r){
if (!r.ok) throw new Error('media');
return r.text();
}).then(function(mediaText){
resolve({ width: info.bestW||0, height: info.bestH||0, duration: sumDuration(mediaText) });
});
}).catch(function(){ resolve({ width:0, height:0, duration:NaN }); });
});
}
}

// Initialize Bunny HTML HLS Player (Advanced)
document.addEventListener('DOMContentLoaded', function() {
initBunnyPlayer();
});
```

## Implementation

### Hosting and source format

Host your videos on Bunny as HLS playlists and use a `.m3u8` URL in `data-player-src`.

- This player supports HLS only.
- Safari uses native HLS playback.
- Other supported browsers use `hls.js`.
- Standard `.mp4` URLs are not supported by this implementation.

### Core container

The root wrapper is `data-bunny-player-init`. All controls and status attributes are scoped to this element.

```html
<div data-bunny-player-init data-player-src="https://.../playlist.m3u8"></div>
```

### Status attributes

`data-player-status` is managed automatically:

- `idle`: initialized, media not ready
- `ready`: metadata/manifest available
- `loading`: buffering or startup
- `playing`: active playback
- `paused`: paused or ended

`data-player-activated="true|false"` tracks whether playback has started at least once.

### Control attributes

Attach `data-player-control` to buttons:

- `play`, `pause`, or `playpause`
- `mute`
- `fullscreen`

Example:

```html
<button data-player-control="playpause">Play/Pause</button>
<button data-player-control="mute">Mute</button>
<button data-player-control="fullscreen">Fullscreen</button>
```

### Timeline and time display

- `data-player-timeline`: seek/scrub area
- `data-player-progress`: played portion
- `data-player-buffered`: buffered portion
- `data-player-timeline-handle`: scrub handle
- `data-timeline-drag="true|false"`: set during dragging
- `data-player-time-duration`: total time output
- `data-player-time-progress`: current time output

### Lazy modes

Use `data-player-lazy`:

- `true`: attach/fetch only after user play
- `meta`: preload duration/ratio only
- `false` or unset: eager attach on init

### Size behavior

Use `data-player-update-size`:

- `true`: compute ratio and set `padding-top` on `data-player-before`
- `cover`: skip ratio padding and use cover behavior in CSS

### Interaction and autoplay

- `data-player-hover="active|idle"` is toggled by pointer activity and idle timeout.
- `data-player-autoplay="true"` enables in-view autoplay behavior.
- Autoplay is muted to satisfy browser policies.
- In this advanced setup, autoplay videos are looped.
