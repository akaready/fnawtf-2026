---
title: "Global Parallax Setup"
category: "Scroll Animations"
author: "The Vault"
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
<div class="parallax-demo-wrap">
<div class="parallax-demo-hero">
<div data-parallax-scroll-start="top top" data-parallax="trigger" data-parallax-start="0" data-parallax-end="40" class="parallax-demo-bg"><img src="https://cdn.prod.website-files.com/68348a3398ed51b777cbfd0d/683d928d5346bddfd3ac9f94_pawel-czerwinski-H8kzolaZjIM-unsplash.avif" class="parallax-demo-img"></div>
<h1 class="parallax-demo-h">Osmo Parallax Setup</h1>
<div class="parallax-demo-details">
<p class="parallax-demo-p">data-parallax-start=”0”<br>data-parallax-end=”40”<br>data-parallax-scroll-start=&quot;top top&quot;</p>
</div>
</div>
<div class="parallax-demo-row">
<div class="parallax-demo-row__third">
<div data-parallax-disable="mobileLandscape" data-parallax="trigger" class="parallax-demo-card">
<p class="parallax-demo-p">data-parallax-start=”20”<br>data-parallax-end=”-20”<br>data-parallax-disable=&quot;mobileLandscape&quot;</p>
</div>
</div>
<div class="parallax-demo-row__third">
<div data-parallax-disable="mobileLandscape" data-parallax="trigger" data-parallax-start="30" data-parallax-end="-30" class="parallax-demo-card">
<p class="parallax-demo-p">data-parallax-start=”30”<br>data-parallax-end=”-30”<br>data-parallax-disable=&quot;mobileLandscape&quot;</p>
</div>
</div>
<div class="parallax-demo-row__third">
<div data-parallax-disable="mobileLandscape" data-parallax="trigger" data-parallax-start="40" data-parallax-end="-40" class="parallax-demo-card">
<p class="parallax-demo-p">data-parallax-start=”40”<br>data-parallax-end=”-40”<br>data-parallax-disable=&quot;mobileLandscape&quot;</p>
</div>
</div>
</div>
<div class="parallax-demo-row">
<h1 class="parallax-demo-h">One single function. Fully flexible setup with <span data-parallax-disable="mobile" data-parallax="trigger" data-parallax-end="0" data-parallax-scroll-end="center center" class="data-parallax-span">a</span><span data-parallax-disable="mobile" data-parallax="trigger" data-parallax-start="40" data-parallax-end="0" data-parallax-scroll-end="center center" class="data-parallax-span">t</span><span data-parallax-disable="mobile" data-parallax="trigger" data-parallax-start="60" data-parallax-end="0" data-parallax-scroll-end="center center" class="data-parallax-span">t</span><span data-parallax-disable="mobile" data-parallax="trigger" data-parallax-start="80" data-parallax-end="0" data-parallax-scroll-end="center center" class="data-parallax-span">r</span><span data-parallax-disable="mobile" data-parallax="trigger" data-parallax-start="100" data-parallax-end="0" data-parallax-scroll-end="center center" class="data-parallax-span">i</span><span data-parallax-disable="mobile" data-parallax="trigger" data-parallax-start="120" data-parallax-end="0" data-parallax-scroll-end="center center" class="data-parallax-span">b</span><span data-parallax-disable="mobile" data-parallax="trigger" data-parallax-start="140" data-parallax-end="0" data-parallax-scroll-end="center center" class="data-parallax-span">u</span><span data-parallax-disable="mobile" data-parallax="trigger" data-parallax-start="160" data-parallax-end="0" data-parallax-scroll-end="center center" class="data-parallax-span">t</span><span data-parallax-disable="mobile" data-parallax="trigger" data-parallax-start="180" data-parallax-end="0" data-parallax-scroll-end="center center" class="data-parallax-span">e</span><span data-parallax-disable="mobile" data-parallax="trigger" data-parallax-start="200" data-parallax-end="0" data-parallax-scroll-end="center center" class="data-parallax-span">s</span><span data-parallax-disable="mobile" data-parallax="trigger" data-parallax-start="220" data-parallax-end="0" data-parallax-scroll-end="center center" class="data-parallax-span">.</span></h1>
</div>
<div class="parallax-demo-row">
<div class="parallax-demo-row__half">
<div data-parallax-scrub="2" data-parallax="trigger" data-parallax-start="-30" data-parallax-end="0" class="parallax-demo-bg">
<img src="https://cdn.prod.website-files.com/68348a3398ed51b777cbfd0d/683d928d8799f0d832b9a30c_pawel-czerwinski-V558Lx_ji6I-unsplash.avif" class="parallax-demo-img">
</div>
<div class="parallax-demo-details">
<p class="parallax-demo-p">data-parallax-scrub=&quot;2&quot;<br>data-parallax-start=&quot;-30&quot;<br>data-parallax-end=&quot;0&quot;</p>
</div>
</div>
<div class="parallax-demo-row__half">
<div data-parallax-end="0" data-parallax="trigger" data-parallax-scrub="2" data-parallax-start="-30" class="parallax-demo-bg">
<img src="https://cdn.prod.website-files.com/68348a3398ed51b777cbfd0d/683d928eb38a241d3d8801fe_pawel-czerwinski-d-gcPDVNO1E-unsplash.avif" class="parallax-demo-img">
</div>
<div class="parallax-demo-details">
<p class="parallax-demo-p">data-parallax-scrub=&quot;2&quot;<br>data-parallax-start=&quot;-30&quot;<br>data-parallax-end=&quot;0&quot;</p>
</div>
</div>
</div>
<div class="parallax-demo-row">
<h1 class="parallax-demo-h">Even control the parallax direc<span data-parallax-scroll-start="center 60%" data-parallax="trigger" data-parallax-direction="horizontal" data-parallax-scrub="2" data-parallax-start="0" data-parallax-end="200" class="data-parallax-span">t</span><span data-parallax-scroll-start="center 60%" data-parallax="trigger" data-parallax-direction="horizontal" data-parallax-scrub="2" data-parallax-start="0" data-parallax-end="400" class="data-parallax-span">i</span><span data-parallax-scroll-start="center 60%" data-parallax="trigger" data-parallax-direction="horizontal" data-parallax-scrub="2" data-parallax-start="0" data-parallax-end="600" class="data-parallax-span">o</span><span data-parallax-scroll-start="center 60%" data-parallax="trigger" data-parallax-direction="horizontal" data-parallax-scrub="2" data-parallax-start="0" data-parallax-end="800" class="data-parallax-span">n</span></h1>
</div>
<div class="parallax-demo-row">
<div class="parallax-demo-card__wrap">
<div data-parallax-scroll-end="center center" data-parallax="trigger" data-parallax-direction="horizontal" data-parallax-start="50" data-parallax-end="0" class="parallax-demo-card">
<p class="parallax-demo-p">data-parallax-direction=&quot;horizontal&quot;<br>data-parallax-start=”50”<br>data-parallax-end=”0”<br>data-parallax-scroll-end=&quot;center center&quot;<br>data-parallax-scrub=&quot;true&quot;</p>
</div>
<div data-parallax-scroll-end="center center" data-parallax="trigger" data-parallax-direction="horizontal" data-parallax-start="50" data-parallax-end="0" data-parallax-scrub="0.5" class="parallax-demo-card">
<p class="parallax-demo-p">data-parallax-direction=&quot;horizontal&quot;<br>data-parallax-start=”50”<br>data-parallax-end=”0”<br>data-parallax-scroll-end=&quot;center center&quot;<br>data-parallax-scrub=&quot;0.5&quot;</p>
</div>
<div data-parallax-scroll-end="center center" data-parallax="trigger" data-parallax-direction="horizontal" data-parallax-start="50" data-parallax-end="0" data-parallax-scrub="1" class="parallax-demo-card">
<p class="parallax-demo-p">data-parallax-direction=&quot;horizontal&quot;<br>data-parallax-start=”50”<br>data-parallax-end=”0”<br>data-parallax-scroll-end=&quot;center center&quot;<br>data-parallax-scrub=&quot;1&quot;</p>
</div>
</div>
</div>
<div class="parallax-demo-row">
<h1 class="parallax-demo-h">
<span data-parallax-end="0" data-parallax="trigger" data-parallax-scroll-end="center center" class="data-parallax-span">H</span>
<span data-parallax-start="-100" data-parallax="trigger" data-parallax-scroll-end="center center" data-parallax-end="0" class="data-parallax-span">a</span>
<span data-parallax-start="200" data-parallax="trigger" data-parallax-scroll-end="center center" data-parallax-end="0" class="data-parallax-span">v</span>
<span data-parallax-start="50" data-parallax="trigger" data-parallax-scroll-end="center center" data-parallax-end="0" class="data-parallax-span">e</span>
<span data-parallax-start="-75" data-parallax="trigger" data-parallax-scroll-end="center center" data-parallax-end="0" class="data-parallax-span">f</span>
<span data-parallax-start="-300" data-parallax="trigger" data-parallax-scroll-end="center center" data-parallax-end="0" class="data-parallax-span">u</span>
<span data-parallax-start="400" data-parallax="trigger" data-parallax-scroll-end="center center" data-parallax-end="0" class="data-parallax-span">n</span>
<span data-parallax-start="-100" data-parallax="trigger" data-parallax-scroll-end="center center" data-parallax-end="0" class="data-parallax-span">!</span>
</h1>
</div>
</div>
```

## CSS

```css
.parallax-demo-wrap {
grid-column-gap: 15em;
grid-row-gap: 15em;
flex-flow: column;
width: 100%;
padding-bottom: 50vh;
font-size: min(.85vw, 1rem);
display: flex;
}

.parallax-demo-hero {
justify-content: center;
align-items: center;
width: 100%;
height: 100vh;
padding-left: 2em;
padding-right: 2em;
display: flex;
position: relative;
overflow: clip;
}

.parallax-demo-bg {
z-index: 0;
width: 100%;
height: 120%;
position: absolute;
}

.parallax-demo-img {
object-fit: cover;
width: 100%;
height: 100%;
}

.parallax-demo-h {
z-index: 1;
text-align: center;
max-width: 15ch;
margin-top: 0;
margin-bottom: 0;
font-size: 4em;
font-weight: 500;
line-height: 1;
position: relative;
}

.parallax-demo-row {
grid-column-gap: 1.25em;
grid-row-gap: 1.25em;
justify-content: center;
align-items: center;
width: 100%;
padding-left: 2em;
padding-right: 2em;
display: flex;
position: relative;
}

.parallax-demo-row__third {
aspect-ratio: 1;
width: calc(33.3333% - .833333em);
}

.parallax-demo-card {
grid-column-gap: 2rem;
grid-row-gap: 2rem;
background-color: #ffffff0d;
border: 1px solid #fff3;
border-radius: .75em;
flex-flow: row;
justify-content: flex-start;
align-items: flex-end;
width: 100%;
height: 100%;
padding: 2em;
display: flex;
}

.parallax-demo-p {
margin-bottom: 0;
font-family: RM Mono, Arial, sans-serif;
font-size: 1.25em;
}

.parallax-demo-row__half {
aspect-ratio: 1;
border-radius: .75em;
width: 100%;
position: relative;
overflow: hidden;
}

.parallax-demo-card__wrap {
grid-column-gap: 2rem;
grid-row-gap: 2rem;
background-color: #ffffff0d;
border: 1px solid #fff3;
border-radius: .75em;
flex-flow: row;
justify-content: flex-start;
align-items: flex-end;
width: 100%;
height: 35em;
padding: 2em;
display: flex;
overflow: hidden;
}

.parallax-demo-details {
z-index: 1;
position: absolute;
bottom: 2rem;
left: 2rem;
}

.data-parallax-span {
display: inline-block;
}

@media screen and (max-width: 767px) {
.parallax-demo-wrap {
font-size: 1rem;
}

.parallax-demo-h {
font-size: 3em;
}

.parallax-demo-row {
flex-flow: wrap;
padding-left: 1.25em;
padding-right: 1.25em;
}

.parallax-demo-row__third {
width: 100%;
}

.parallax-demo-card {
padding: 1.25em;
}

.parallax-demo-p {
font-size: .75em;
}

.parallax-demo-card__wrap {
flex-flow: column;
height: auto;
}
}
```

## JavaScript

```javascript
gsap.registerPlugin(ScrollTrigger)

function initGlobalParallax() {
const mm = gsap.matchMedia()

mm.add(
{
isMobile: "(max-width:479px)",
isMobileLandscape: "(max-width:767px)",
isTablet: "(max-width:991px)",
isDesktop: "(min-width:992px)"
},
(context) => {
const { isMobile, isMobileLandscape, isTablet } = context.conditions

const ctx = gsap.context(() => {
document.querySelectorAll('[data-parallax="trigger"]').forEach((trigger) => {
// Check if this trigger has to be disabled on smaller breakpoints
const disable = trigger.getAttribute("data-parallax-disable")
if (
(disable === "mobile" && isMobile) ||
(disable === "mobileLandscape" && isMobileLandscape) ||
(disable === "tablet" && isTablet)
) {
return
}

// Optional: you can target an element inside a trigger if necessary
const target = trigger.querySelector('[data-parallax="target"]') || trigger

// Get the direction value to decide between xPercent or yPercent tween
const direction = trigger.getAttribute("data-parallax-direction") || "vertical"
const prop = direction === "horizontal" ? "xPercent" : "yPercent"

// Get the scrub value, our default is 'true' because that feels nice with Lenis
const scrubAttr = trigger.getAttribute("data-parallax-scrub")
const scrub = scrubAttr ? parseFloat(scrubAttr) : true

// Get the start position in %
const startAttr = trigger.getAttribute("data-parallax-start")
const startVal = startAttr !== null ? parseFloat(startAttr) : 20

// Get the end position in %
const endAttr = trigger.getAttribute("data-parallax-end")
const endVal = endAttr !== null ? parseFloat(endAttr) : -20

// Get the start value of the ScrollTrigger
const scrollStartRaw = trigger.getAttribute("data-parallax-scroll-start") || "top bottom"
const scrollStart = `clamp(${scrollStartRaw})`

// Get the end value of the ScrollTrigger
const scrollEndRaw = trigger.getAttribute("data-parallax-scroll-end") || "bottom top"
const scrollEnd = `clamp(${scrollEndRaw})`

gsap.fromTo(
target,
{ [prop]: startVal },
{
[prop]: endVal,
ease: "none",
scrollTrigger: {
trigger,
start: scrollStart,
end: scrollEnd,
scrub,
},
}
)
})
})

return () => ctx.revert()
}
)
}

// Initialize Global Parallax Setup
document.addEventListener("DOMContentLoaded", () => {
initGlobalParallax()
})
Documentation
This setup is aimed at giving you a super flexible function, with which you can make almost any parallax effect you need for your project. The complete GSAP tween is dynamic, even the actual property that we animate. Below is the list of all available attributes you can use. You don't need to specify every attribute on each parallax trigger. This is important to understand, and the reason we have set default values. Only add the attributes you actually need to override the default for.

Trigger element (required)
[data-parallax="trigger"] is the main attribute that the code will look for. By default, the element that we 'tag' as the trigger, will also be the element that we animate, our target. So any other attributes that you want to add, need to go on your trigger.

Target element (optional)
alternatively, if you want to animate a child element of your trigger, you can give it the [data-parallax="target"] attribute. All other attributes still need to go on your trigger. If your trigger is the element you want to animate, you do not need to add this attribute anywhere.

Horizontal or vertical parallax
[data-parallax-direction] Controls the property that we animate, so either the xPercent or yPercent of an element. If you want to move an element vertically (along the y-axis) you don't need to add this, the default will rule. The value can be either horizontal or vertical

Scrub duration
[data-parallax-scrub] links the progress of the animation directly to the scrollbar so it acts like a scrubber. Our default is true because that feels most natural paired with Lenis Scrolling. If you add a number value here, you'll define the amount of seconds it takes for your parallax to "catch up", so data-parallax-scrub="2" would cause the animation's playhead to take 2 seconds to catch up with the scrollbar's position. Default is "true"

Scroll start position
[data-parallax-scroll-start] defines when your parallax trigger or target will start moving. Our default of "top bottom" means the defined target will start moving when the top of the trigger, reaches the bottom of our screen (so when it starts to enter your viewport). Definitely check out the GSAP docs for the full explanation of this option.

Scroll end position
Similar to the previous attribute, except [data-parallax-scroll-end] controls when our parallax element will stop moving. Our default of "bottom top" means our parallax will stop when the bottom of our trigger, reaches the top of our screen.

Parallax start position
[data-parallax-start] is used to define the starting position in % of our target once your target reaches data-parallax-scroll-start. This is either for xPercent or yPercent depending on data-parallax-direction. Example: you have an element with data-parallax-direction="horizontal" and you add data-parallax-start="35". Your target will start 35% to the right of its original position. Our default is 20.

Parallax end position
[data-parallax-end] controls the end position in % of our target once it hits the position defined with data-parallax-scroll-end. Our default is -20.

Responsive disabling
If you have a parallax effect that needs to be disabled on smaller breakpoints, you can add [data-parallax-disable] to it. We have defined 3 breakpoints for you, but feel free to adjust them for your needs. Since we're working with GSAPs MatchMedia function, we don't have to add our own resize handlers, everything is taken care of. Simply don't add this attribute if your parallax should always run. Choose between tablet or mobileLandscape or mobile.

Tip for backgrounds:
A common effect for parallax is to have an image, that seems to move inside of a 'mask'. You can see it in our Live Preview link as well. Here's how to do that:

Create a parent “mask” div with overflow: hidden and give it a position relative. This will be your data-parallax="trigger".
Inside the mask, add a wrapper div that is taller than 100% (e.g. height: 120%). This extra height gives the image room to move without exposing empty space. Give it a position of absolute to sit behind other content.
Place your image inside that taller wrapper so it completely fills the 120%-high area.
On the taller, inner wrapper div, add data-parallax="target".
When GSAP animates the target wrapper’s yPercent (or xPercent), the image has 20% extra height to shift into view inside the masked container. The mask (trigger) stays fixed at its original height, hiding any overflow.
Result: as you scroll, the taller wrapper moves up or down inside the overflow-hidden mask, creating a smooth parallax “image-inside-a-frame” effect without ever showing blank gaps.
```

## Implementation

1. Add the required structure and attributes in the `HTML` section.
2. Add the styles from the `CSS` section to your stylesheet.
3. Include any dependencies listed in `External Scripts` before your custom script.
4. Add the `JavaScript` section and initialize it on `DOMContentLoaded`.

Use the provided `data-*` hooks exactly as shown to ensure selectors and behavior match.
