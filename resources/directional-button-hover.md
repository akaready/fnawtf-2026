---
title: "Directional Button Hover"
category: "Buttons"
tags:
  - "Button"
  - "Directional"
  - "Hover"
  - "Bubble"
  - "Animation"
author: "Dennis Snellenberg"
lastUpdated: "2026-02-12"
source: "https://osmo.supply"
---

## HTML

```html
<div class="btn-wrap">
  <a href="#" data-theme="dark" data-btn-hover="" class="btn w-inline-block">
    <div class="btn__bg"></div>
    <div class="btn__circle-wrap">
      <div class="btn__circle">
        <div class="before__100"></div>
      </div>
    </div>
    <div class="btn__text">
      <p class="btn-text-p">Hover these</p>
    </div>
  </a>
  <a data-theme="light" data-btn-hover="" href="#" class="btn w-inline-block">
    <div class="btn__bg"></div>
    <div class="btn__circle-wrap">
      <div class="btn__circle">
        <div class="before__100"></div>
      </div>
    </div>
    <div class="btn__text">
      <p class="btn-text-p">Directional</p>
    </div>
  </a>
  <a data-theme="primary" data-btn-hover="" href="#" class="btn w-inline-block">
    <div class="btn__bg"></div>
    <div class="btn__circle-wrap">
      <div class="btn__circle">
        <div class="before__100"></div>
      </div>
    </div>
    <div class="btn__image"><img width="72" loading="eager" alt="Photo of Founder" src="" class="img__founder"></div>
    <div class="btn__text">
      <p class="btn-text-p">Buttons</p>
    </div>
  </a>
</div>
```

## CSS

```css
.btn {
  cursor: pointer;
  border-radius: 1em;
  border-radius: calc(var(--btn-height) * .5);
  grid-template-rows: auto auto;
  grid-template-columns: 1fr 1fr;
  grid-auto-columns: 1fr;
  justify-content: center;
  align-items: center;
  height: 3em;
  padding-left: 1.25em;
  padding-right: 1.25em;
  text-decoration: none;
  display: flex;
  position: relative;
}

.btn__text {
  color: #efede3;
  justify-content: flex-start;
  align-items: center;
  display: flex;
  position: relative;
  transition: color 0.7s cubic-bezier(0.625, 0.05, 0, 1);
}

.btn-text-p {
  color: currentColor;
  white-space: nowrap;
  margin-bottom: 0;
  padding-bottom: .05em;
  font-family: PP Neue Montreal, Arial, sans-serif;
  font-size: 1em;
  font-weight: 500;
  line-height: 1.2;
}

.btn__bg {
  background-color: #08181b;
  border-radius: 1.5em;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.btn__image {
  border-radius: 50%;
  width: 2.25em;
  height: 2.25em;
  margin-left: -.75em;
  margin-right: .5em;
  position: relative;
  overflow: hidden;
}

.img__founder {
  object-fit: cover;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.btn__circle-wrap {
  border-radius: 1.5em;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
}

.btn__circle {
  pointer-events: none;
  background-color: #d1fd88;
  border-radius: 50%;
  width: 100%;
  display: block;
  position: absolute;
  top: 50%;
  left: 50%;
  transition: transform 0.7s cubic-bezier(0.625, 0.05, 0, 1), background-color 0.4s cubic-bezier(0.625, 0.05, 0, 1);
  transform: translate(-50%, -50%) scale(0) rotate(0.001deg);
  background-color: #D1FD88;
}

.before__100 {
  padding-top: 100%;
  display: block;
}

.btn .btn__text {
  transition: color 0.7s cubic-bezier(0.625, 0.05, 0, 1);
}

.btn:hover .btn__circle {
  transform: translate(-50%, -50%) scale(1) rotate(0.001deg);
}

/* Dark */
.btn[data-theme="dark"] .btn__circle {
  background-color: #D1FD88;
}

.btn[data-theme="dark"]:hover .btn__text {
  color: #031819;
}

/* Light */
.btn[data-theme="light"] .btn__bg {
  background-color: #EFEDE3;
}

.btn[data-theme="light"] .btn__text {
  color: #031819;
}

.btn[data-theme="light"] .btn__circle {
  background-color: #9FCCC8;
}

/* Primary */
.btn[data-theme="primary"] .btn__bg {
  background-color: #D1FD88;
}

.btn[data-theme="primary"] .btn__text {
  color: #031819;
}

.btn[data-theme="primary"] .btn__circle {
  background-color: #b8ec6f;
}
```

## JavaScript

```javascript
function initDirectionalButtonHover() {
  // Button hover animation
  document.querySelectorAll('[data-btn-hover]').forEach(button => {
    button.addEventListener('mouseenter', handleHover);
    button.addEventListener('mouseleave', handleHover);
  });

  function handleHover(event) {
    const button = event.currentTarget;
    const buttonRect = button.getBoundingClientRect();

    // Get the button's dimensions and center
    const buttonWidth = buttonRect.width;
    const buttonHeight = buttonRect.height;
    const buttonCenterX = buttonRect.left + buttonWidth / 2;
    const buttonCenterY = buttonRect.top + buttonHeight / 2;

    // Calculate mouse position
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    // Offset from the top-left corner in percentage
    const offsetXFromLeft = ((mouseX - buttonRect.left) / buttonWidth) * 100;
    const offsetYFromTop = ((mouseY - buttonRect.top) / buttonHeight) * 100;

    // Offset from the center in percentage
    let offsetXFromCenter = ((mouseX - buttonCenterX) / (buttonWidth / 2)) * 50;

    // Convert to absolute values
    offsetXFromCenter = Math.abs(offsetXFromCenter);

    // Update position and size of .btn__circle
    const circle = button.querySelector('.btn__circle');
    if (circle) {
      circle.style.left = `${offsetXFromLeft.toFixed(1)}%`;
      circle.style.top = `${offsetYFromTop.toFixed(1)}%`;
      circle.style.width = `${115 + offsetXFromCenter.toFixed(1) * 2}%`;
    }
  }
}

// Initialize Directional Button Hover
document.addEventListener('DOMContentLoaded', function() {
  initDirectionalButtonHover();
});
```

## Implementation

1. Add the required structure and attributes in the `HTML` section.
2. Add the styles from the `CSS` section to your stylesheet.
3. Add the `JavaScript` section and initialize it on `DOMContentLoaded`.

Use the provided `data-*` hooks exactly as shown to ensure selectors and behavior match.

### Required attributes

- Add `data-btn-hover` to each interactive button.
- Use `data-theme` for style variants such as `dark`, `light`, and `primary`.

```html
<a href="#" data-theme="dark" data-btn-hover class="btn w-inline-block">
  ...
</a>
```