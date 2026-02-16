# Resource File Compatibility Assessment

**Date**: 2026-02-16 02:20 PST  
**Purpose**: Determine which `/resources/` files are compatible with our Next.js 14+ + TypeScript + React + GSAP tech stack

---

## Summary

**Total Resources**: 23 files  
**✅ Usable**: 15 files  
**📚 Reference-Only**: 1 file  
**⚠️ Adaptable**: 4 files (need React conversion)  
**❌ Unusable**: 3 files (to be moved to `_unusable/`)

---

## Tech Stack Compatibility Criteria

### ✅ Compatible:
- Pure CSS animations
- GSAP + ScrollTrigger (in stack)
- GSAP + SplitText (in stack, Club GSAP)
- HLS.js (in stack)  
- Barba.js (in stack)
- React-friendly vanilla JS patterns

### ❌ Incompatible:
- Vanilla JS DOM manipulation (`querySelector`, `addEventListener`)
- External libraries NOT in stack (List.js, Physics2D)
- Manual element creation/destruction

---

## Detailed Assessment

### ✅ USABLE (15 files)

These can be used as-is or with minimal React adaptations:

1. **`burger-menu-button.md`**
   - Pure CSS + minimal JS
   - Mobile navigation

2. **`centered-looping-slider.md`** ⭐ NEW HOMEPAGE COMPONENT
   - **Testimonials slider for homepage**
   - Requires: Draggable, Inertia, CustomEase plugins
   - **Action**: ADD InertiaPlugin + CustomEase to GSAP setup

3. **`css-marquee.md`**
   - CSS animation + IntersectionObserver
   - Services marquee

4. **`custom-bunny-hls-player-advanced.md`**
   - HLS.js player (in stack)
   - Video player component

5. **`directional-button-hover.md`**
   - Pure JS hover effects
   - Navigation buttons

6. **`directional-list-hover.md`**
   - Pure JS hover effects
   - Interactive lists

7. **`elements-reveal-on-scroll.md`**
   - GSAP + ScrollTrigger ✓
   - Scroll animations

8. **`global-parallax-setup.md`**
   - GSAP + ScrollTrigger ✓
   - Parallax effects

9. **`logo-wall-cycle.md`**
   - GSAP + ScrollTrigger ✓
   - Client logos

10. **`masked-text-reveal-gsap-splittext.md`**
    - GSAP + SplitText ✓
    - Hero text reveal

11. **`page-name-transition-wipe.md`**
    - Barba.js + GSAP ✓
    - Page transitions

12. **`play-video-on-hover-lazy.md`**
    - Vanilla JS video control
    - Featured work cards

13. **`scroll-progress-bar.md`**
    - GSAP + ScrollTrigger ✓
    - Progress indicator

14. **`underline-link-animation.md`**
    - Pure CSS
    - Link hovers

15. **`willem-loading-animation.md`**
    - GSAP animation
    - Loading screen

---

### 📚 REFERENCE-ONLY (1 file)

16. **`live-form-validation-advanced.md`**
    - Keep as reference
    - Use React Hook Form + Zod instead

---

### ⚠️ ADAPTABLE (4 files)

These use GSAP/SplitText correctly but need React conversion from vanilla JS patterns:

17. **`rotating-text.md`**
    - Uses: SplitText ✓
    - Issue: Manual DOM element creation
    - Needs: React component adaptation

18. **`sticky-features.md`**
    - Uses: GSAP + ScrollTrigger ✓
    - Issue: Vanilla JS `querySelectorAll` patterns
    - Needs: React hooks + refs adaptation

19. **`variable-font-weight-hover.md`**
    - Uses: SplitText ✓
    - Issue: Complex pointer tracking, manual DOM updates
    - Needs: React + hooks adaptation

20. **`custom-bunny-hls-lightbox-advanced.md`** (1179 lines)
    - Uses: HLS.js ✓
    - Issue: Massive vanilla JS implementation
    - Note: Already have `custom-bunny-hls-player-advanced.md`
    - Recommendation: SKIP - use player instead

---

### ❌ UNUSABLE (3 files)

**Action**: Move to `/resources/_unusable/`

21. **`404-error-minigame.md`**
    - Requires: Draggable, Inertia, Physics2D plugins
    - Issue: Physics2D NOT in stack
    - Reason: Complex game unsuitable for production site

22. **`live-search-listjs.md`**
    - Requires: List.js library
    - Issue: NOT in stack
    - Reason: Use React state management instead

23. **`multi-filter-setup-multi-match.md`**
    - Issue: Heavy vanilla JS DOM manipulation
    - Reason: React incompatible patterns

---

## Updated GSAP Plugin Requirements

### Original Plugins:
- GSAP 3.13.0 (core)
- ScrollTrigger
- SplitText (Club GSAP)

### ⭐ NEW ADDITIONS (for testimonials slider):
- **InertiaPlugin** (Club GSAP)
- **CustomEase** (Club GSAP)

### License:
All plugins require [GSAP Club membership](https://gsap.com/pricing/)

---

## Implementation Priority

### Homepage Components (from usable resources):

1. **FnaLoader** → `willem-loading-animation.md`
2. **Navigation** → `directional-button-hover.md` + `burger-menu-button.md`
3. **HeroSection** → `masked-text-reveal-gsap-splittext.md`
4. **ServicesMarquee** → `css-marquee.md`
5. **ReelPlayer** → `custom-bunny-hls-player-advanced.md`
6. **FeaturedWork** → `play-video-on-hover-lazy.md`
7. **ClientLogos** → `logo-wall-cycle.md`
8. **TestimonialsSlider** → `centered-looping-slider.md` ⭐ NEW
9. **ParallaxProvider** → `global-parallax-setup.md`
10. **ScrollRevealProvider** → `elements-reveal-on-scroll.md`
11. **ScrollProgressBar** → `scroll-progress-bar.md`
12. **PageTransition** → `page-name-transition-wipe.md`

---

## Next Actions

1. ✅ **Create** `/resources/_unusable/` directory
2. ✅ **Move** 3 unusable files to `_unusable/`
3. ✅ **Update** `plans/260216-0200-homepage-execution-plan-revised.md` with:
   - Updated GSAP plugin list
   - Testimonials slider component
   - Final resource file breakdown
4. 🔵 **Get user approval** before switching to code mode
5. 🔵 **Execute** Step 1: Create config files (package.json, tsconfig.json, etc.)

---

## Notes

- **Resource Path**: All files are in `resources/` (NOT `_assets/` as in original plan)
- **Adaptable Files**: Keep for future React conversion but NOT priority for homepage
- **Lightbox**: Skip `custom-bunny-hls-lightbox-advanced.md` - already have player
- **Forms**: Skip `live-form-validation-advanced.md` - use React Hook Form + Zod
