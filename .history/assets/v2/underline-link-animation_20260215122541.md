---
title: "Underline Link Animation"
category: "Buttons"
author: "Osmo"
lastUpdated: "2026-02-12"
source: "https://osmo.supply"
tags:
  - CSS
  - Animation
  - Hover
  - Link
---

## HTML

```html
<div class="link-group">
  <a data-underline-link href="#" class="underline-link">Underline Link</a>
  <a data-underline-link="alt" href="#" class="underline-link">Animation</a>
</div>
```

## CSS

```css
.link-group {
  gap: 1em;
  justify-content: center;
  font-size: 3em;
  display: flex;
}

.underline-link {
  color: inherit;
  font-size: 1em;
  line-height: 1.25;
}

[data-underline-link] {
  text-decoration: none;
  position: relative;
}

[data-underline-link]::before,
[data-underline-link="alt"]::before,
[data-underline-link="alt"]::after{
  content: "";
  position: absolute;
  bottom: -0.0625em;
  left: 0;
  width: 100%;
  height: 0.0625em;
  background-color: currentColor;
  transition: transform 0.735s cubic-bezier(0.625, 0.05, 0, 1);
  transform-origin: right;
  transform: scaleX(0) rotate(0.001deg);
}

[data-underline-link="alt"]::before {
  transform-origin: left;
  transform: scaleX(1) rotate(0.001deg);
  transition-delay: 0.3s;
}

[data-underline-link="alt"]::after {
  transform-origin: right;
  transform: scaleX(0) rotate(0.001deg);
  transition-delay: 0s;
}

@media (hover: hover) and (pointer: fine) {
  [data-hover]:hover [data-underline-link]::before,
  [data-underline-link]:hover::before {
    transform-origin: left;
    transform: scaleX(1) rotate(0.001deg);
  }  
  
  [data-hover]:hover [data-underline-link="alt"]::before,
  [data-underline-link="alt"]:hover::before {
    transform-origin: right;
    transform: scaleX(0) rotate(0.001deg);
    transition-delay: 0s;
  }
  
  [data-hover]:hover [data-underline-link="alt"]::after,
  [data-underline-link="alt"]:hover::after {
    transform-origin: left;
    transform: scaleX(1) rotate(0.001deg);
    transition-delay: 0.3s;
  }
}
```