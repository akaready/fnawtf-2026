---
title: "Burger Menu Button"
category: "Buttons"
tags:
  - "Button"
  - "GSAP"
  - "Transform"
  - "Transition"
  - "Animation"
author: "The Vault"
lastUpdated: "2026-02-12"
externalScripts:
  - "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"
  - "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/CustomEase.min.js"
source: "https://osmo.supply"
---

## External Scripts

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/CustomEase.min.js"></script>
```

## HTML

```html
<button data-menu-button="burger" class="menu-button">
<div class="menu-button-line"></div>
<div class="menu-button-line"></div>
<div class="menu-button-line"></div>
</button>
```

## CSS

```css
.menu-button {
grid-column-gap: .1875em;
grid-row-gap: .1875em;
flex-flow: column;
padding: 1em;
font-size: 1em;
display: flex;
background: transparent;
-webkit-appearance: none;
border: none;
}

.menu-button-line {
background-color: #e7dddb;
width: 2em;
height: .1875em;
}
```

## JavaScript

```javascript
gsap.registerPlugin(CustomEase)
CustomEase.create("button-ease", "0.5, 0.05, 0.05, 0.99")

function initMenuButton() {
// Select elements
const menuButton = document.querySelector("[data-menu-button]");
const lines = document.querySelectorAll(".menu-button-line");
const [line1, line2, line3] = lines;

// Define one global timeline
let menuButtonTl = gsap.timeline({
defaults:{
overwrite:"auto",
ease: "button-ease",
duration: 0.3
}
})

const menuOpen = () => {
menuButtonTl.clear() // Stop any previous tweens, if any
.to(line2, { scaleX: 0, opacity: 0 }) // Step 1: Hide middle line
.to(line1, { x: "-1.3em", opacity: 0 }, "<") // Step 1: Movetop line
.to(line3, { x: "1.3em", opacity: 0 }, "<") // Step 1: Move bottom line
.to([line1,line3],{opacity:0, duration: 0.1},"<+=0.2") // Step 2: Quickly fade top and bottom lines
.set(line1, { rotate: -135, y: "-1.3em", scaleX: 0.9 }) // Step 3: Instantly rotate and scale top line
.set(line3, { rotate: 135, y: "-1.4em", scaleX: 0.9 }, "<") // Step 3: Instantly rotate and scale bottom line
.to(line1, { opacity: 1, x: "0em", y: "0.5em"}) // Step 4: Move top line to final position
.to(line3, { opacity: 1, x: "0em", y: "-0.25em" }, "<+=0.1"); // Step 4: Move bottom line to final position
}

const menuClose = () => {
menuButtonTl.clear() // Stop any previous tweens, if any
.to([line1, line2, line3], { // Move all lines back in a different animation
scaleX: 1,
rotate: 0,
x: "0em",
y: "0em",
opacity: 1,
duration: 0.45,
overwrite: "auto",
})
}

// Toggle Animation
menuButton.addEventListener("click", () => {
const currentState = menuButton.getAttribute("data-menu-button");

if (currentState === "burger") {
menuOpen()
menuButton.setAttribute("data-menu-button", "close");
} else {
menuClose()
menuButton.setAttribute("data-menu-button", "burger");
}
});
}

// Initialize Burger Menu Button
document.addEventListener('DOMContentLoaded', () => {
initMenuButton();
});
```

## Implementation

1. Add the required structure and attributes in the `HTML` section.
2. Add the styles from the `CSS` section to your stylesheet.
3. Include any dependencies listed in `External Scripts` before your custom script.
4. Add the `JavaScript` section and initialize it on `DOMContentLoaded`.

Use the provided `data-*` hooks exactly as shown to ensure selectors and behavior match.

### Required attribute

- Use `data-menu-button` on the button.
- Initial value should be `burger`.

```html
<button data-menu-button="burger" class="menu-button">
  <div class="menu-button-line"></div>
  <div class="menu-button-line"></div>
  <div class="menu-button-line"></div>
</button>
```

### Behavior

- On click, state toggles between `burger` and `close`.
- The GSAP timeline animates the three lines into an X shape and back.
