# FNA.WTF Homepage - Revised Execution Plan for Haiku

**Created**: 2026-02-16 02:00 PST  
**Original Plan**: [`plans/260215-2215-homepage-implementation-plan.md`](plans/260215-2215-homepage-implementation-plan.md)  
**Status**: Ready for execution

---

## Current State Analysis

### What Exists
- ✅ `.env.local` - Environment variables configured
- ✅ `public/images/clients/` - 30+ client logo PNGs ready
- ✅ `resources/` - Animation implementation guides (was `_assets/` in original plan)
- ✅ `plans/` - Planning documents
- ✅ `AGENTS.md` - Project coordination file

### What's Missing (Critical Blockers)
- ❌ `package.json` - No dependencies installed
- ❌ `tsconfig.json` - TypeScript not configured
- ❌ `tailwind.config.ts` - Tailwind not configured
- ❌ `next.config.ts` - Next.js not configured
- ❌ `src/app/` directory - App Router structure missing
- ❌ All source files - Zero components or pages exist

### Terminal Errors
```
ENOENT: no such file or directory, scandir 'src/app'
ENOENT: no such file or directory, stat 'src/app/layout.tsx'
ENOENT: no such file or directory, lstat 'tailwind.config.ts'
```

---

## Key Changes from Original Plan

### 1. Resource File Path Correction
**Original**: References `_assets/willem-loading-animation.md`  
**Actual**: Files are in `resources/willem-loading-animation.md`  
**Impact**: All animation resource references need correcting

### 2. Foundation Files Must Come First
**Original**: Assumed foundation existed, jumped to components  
**Revised**: Must create entire Next.js project structure first

### 3. Execution Order Restructured
**Original**: 7 parallel implementation phases  
**Revised**: 12 sequential steps with clear dependencies

---

## Revised Execution Steps

### Phase 1: Project Foundation (Steps 1-3)

#### Step 1: Create Core Configuration Files
**Dependencies**: None  
**Outputs**: Project is properly configured

Create these files:

1. **`package.json`**
   - Next.js 14.2.x
   - React 18.x
   - TypeScript 5.x
   - Tailwind CSS 3.x
   - Required: `@supabase/ssr`, `gsap` (3.13.0), `hls.js`, `@barba/core`, `lucide-react`
   - Dev deps: `@types/node`, `@types/react`, `typescript`, `postcss`, `autoprefixer`

2. **`tsconfig.json`**
   - Strict mode enabled
   - Path aliases: `@/*` → `./src/*`
   - Include: `src/**/*`

3. **`next.config.ts`**
   - Enable App Router
   - Image domains: Bunny CDN, Supabase storage
   - TypeScript strict mode

4. **`tailwind.config.ts`**
   - Content paths: `./src/**/*.{ts,tsx}`
   - Purple theme colors (from design system)
   - Dark mode: 'class'
   - Font family variables

5. **`postcss.config.js`**
   - Tailwind CSS plugin
   - Autoprefixer

6. **`.env.example`**
   - Template for required environment variables

**Files Created**: 6 config files  
**Commands to Run**: None yet (can't run npm until package.json exists)

---

#### Step 2: Initialize App Router Structure
**Dependencies**: Step 1 complete  
**Outputs**: Basic Next.js app structure

Create directory structure and base files:

```
src/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage (placeholder)
│   ├── globals.css          # Global styles + CSS variables
│   ├── loading.tsx          # Loading state
│   ├── error.tsx            # Error boundary
│   ├── work/
│   │   └── page.tsx         # Placeholder
│   ├── services/
│   │   └── page.tsx         # Placeholder
│   ├── pricing/
│   │   └── page.tsx         # Placeholder
│   └── about/
│       └── page.tsx         # Placeholder
├── components/
│   └── .gitkeep
├── lib/
│   └── .gitkeep
├── hooks/
│   └── .gitkeep
├── types/
│   └── .gitkeep
└── styles/
    └── fonts.css
```

**Key Files**:

1. **`src/app/layout.tsx`** - Root layout with:
   - Metadata (title, description)
   - Font imports (Space Grotesk, Manrope, Space Mono)
   - HTML structure with dark mode class
   - Import `globals.css`

2. **`src/app/globals.css`** - CSS variables from design system:
   - Purple palette variables
   - Dark theme variables
   - Tailwind directives
   - Base typography styles

3. **`src/app/page.tsx`** - Simple placeholder:
   ```tsx
   export default function Home() {
     return <div className="min-h-screen">Homepage placeholder</div>
   }
   ```

**Files Created**: 13 files  
**Commands to Run**: `npm install` (now package.json exists)

---

#### Step 3: Install Dependencies and Verify Setup
**Dependencies**: Step 2 complete  
**Outputs**: Working Next.js dev server

**Commands**:
1. `npm install` - Install all dependencies
2. `npm run dev` - Start dev server
3. Verify `http://localhost:3000` loads without errors

**Expected Result**: 
- No ENOENT errors in terminal
- Browser shows "Homepage placeholder" text
- Tailwind CSS loads correctly

---

### Phase 2: Design System & Layout (Steps 4-5)

#### Step 4: Create Typography & Font System
**Dependencies**: Step 3 complete  
**Outputs**: Fonts loaded and available

1. **Download Google Fonts**:
   - Space Grotesk (weights: 400, 500, 700)
   - Manrope (weights: 400, 500, 600, 700)
   - Space Mono (weights: 400, 700)

2. **Add to `public/fonts/`**:
   ```
   public/fonts/
   ├── space-grotesk/
   ├── manrope/
   └── space-mono/
   ```

3. **Update `src/styles/fonts.css`** with `@font-face` declarations

4. **Update `src/app/globals.css`** with font variable assignments

**Files Modified**: 2  
**Assets Added**: Font files in `/public/fonts/`

---

#### Step 5: Create Layout Components
**Dependencies**: Step 4 complete  
**Outputs**: Reusable layout components

Create these components:

1. **`src/components/layout/Navigation.tsx`** (Client Component)
   - Desktop nav: Centered links with directional hover (from `resources/directional-button-hover.md`)
   - Mobile nav: Hamburger menu (from `resources/burger-menu-button.md`)
   - "Let's talk" CTA button in purple
   - Props: `currentPage?: string`

2. **`src/components/layout/NavButton.tsx`** (Client Component)
   - Implements directional fill animation
   - Uses data attributes: `data-btn-hover`, `data-theme`
   - References `resources/directional-button-hover.md`

3. **`src/components/layout/MobileMenu.tsx`** (Client Component)
   - Full-screen overlay
   - Animated hamburger to X
   - References `resources/burger-menu-button.md`

4. **`src/components/layout/Footer.tsx`** (Server Component)
   - Multi-column layout
   - Logo and mission statement left
   - Nav links right
   - Copyright and legal links

5. **`src/components/layout/FooterCTA.tsx`** (Server Component)
   - Call to action section above footer
   - Link to Cal.com scheduling

**Files Created**: 5 components  
**Resource Files Referenced**: 2

---

### Phase 3: Animation Infrastructure (Steps 6-7)

#### Step 6: Set Up GSAP Foundation
**Dependencies**: Step 5 complete  
**Outputs**: GSAP ready for use across components

1. **`src/lib/animations/gsap-setup.ts`**
   - Register GSAP plugins: ScrollTrigger, CustomEase
   - Export configured gsap instance
   - Set default ease
   - Handle `prefers-reduced-motion`

2. **`src/hooks/useGsap.ts`**
   - Custom hook for GSAP animations
   - Automatic cleanup on unmount
   - Returns gsap instance

3. **`src/hooks/useReducedMotion.ts`**
   - Detects user's motion preferences
   - Returns boolean

4. **`src/hooks/useIntersectionObserver.ts`**
   - For lazy loading and scroll triggers
   - Reusable across components

**Files Created**: 4 (1 lib, 3 hooks)

---

#### Step 7: Create Global Animation Providers
**Dependencies**: Step 6 complete  
**Outputs**: Animation systems available app-wide

1. **`src/components/animations/ParallaxProvider.tsx`** (Client Component)
   - Implements `resources/global-parallax-setup.md`
   - Data attributes: `data-parallax`, `data-parallax-start`, `data-parallax-end`
   - Uses GSAP ScrollTrigger

2. **`src/components/animations/ScrollRevealProvider.tsx`** (Client Component)
   - Implements `resources/elements-reveal-on-scroll.md`
   - Data attributes: `data-reveal-group`, `data-stagger`, `data-distance`
   - Staggered fade-in animations

3. **`src/components/animations/ScrollProgressBar.tsx`** (Client Component)
   - Implements `resources/scroll-progress-bar.md`
   - Fixed at bottom of viewport
   - Purple (#a14dfd) progress fill

4. **`src/components/animations/PageTransition.tsx`** (Client Component)
   - Implements `resources/page-name-transition-wipe.md`
   - Barba.js integration
   - Wipe panel with page name label

**Files Created**: 4 animation components  
**Resource Files Referenced**: 4

---

### Phase 4: Homepage Core Sections (Steps 8-9)

#### Step 8: Build Hero & Loading Animation
**Dependencies**: Step 7 complete  
**Outputs**: Homepage loader and hero section working

1. **`src/components/animations/FnaLoader.tsx`** (Client Component)
   - Adapt `resources/willem-loading-animation.md`
   - Text: "fna.wtf" instead of default
   - Dot expands to preview box
   - Text fades during site reveal
   - Props: `onComplete?: () => void`, `previewImageSrc?: string`

2. **`src/components/homepage/HeroSection.tsx`** (Server Component with client parts)
   - Background: Looping Bunny CDN video (ID: `a7a33b5c-afea-4623-95e3-d7756fd7985c`)
   - Dark overlay (60-70% opacity)
   - Text reveal animation using `resources/masked-text-reveal-gsap-splittext.md`
   - Headline: "We craft visual stories for ambitious brands."
   - Subheadline: "Friends n Allies is a boutique agency that helps build brands, launch products, and scale startups."

3. **`src/components/homepage/LocationsRow.tsx`** (Server Component)
   - Small centered text
   - Content: "San Francisco • Los Angeles • Austin • New York • Global"
   - Muted color (#a1a1aa)
   - Scroll reveal animation

**Files Created**: 3 components  
**Resource Files Referenced**: 2

---

#### Step 9: Create Services & Marquee Sections
**Dependencies**: Step 8 complete  
**Outputs**: Middle homepage sections complete

1. **`src/components/homepage/ServicesMarquee.tsx`** (Client Component)
   - Implements `resources/css-marquee.md`
   - Content: "digital storytelling • branding • video production • pitch videos • launch pages • copywriting • ai integrations • automations"
   - Infinite horizontal scroll
   - Pause when off-screen (IntersectionObserver)
   - Speed: 75px/second

2. **`src/components/homepage/ServicesCards.tsx`** (Server Component)
   - Three cards: Build, Launch, Scale
   - Links to `/services`
   - Grid: 1 col mobile, 3 col desktop
   - Purple accent hover states
   - Scroll reveal with stagger

3. **`src/components/homepage/ReelPlayer.tsx`** (Client Component)
   - Implements `resources/custom-bunny-hls-player-advanced.md`
   - HLS.js for video streaming
   - Custom controls: play/pause, mute, fullscreen, timeline
   - Lazy loading with placeholder image
   - Data attributes: `data-bunny-player-init`, `data-player-src`

**Files Created**: 3 components  
**Resource Files Referenced**: 2

---

### Phase 5: Data-Driven Components (Steps 10-11)

#### Step 10: Set Up Supabase Client
**Dependencies**: Step 9 complete  
**Outputs**: Supabase ready for data fetching

1. **`src/lib/supabase/client.ts`** (Browser client)
   - `createBrowserClient` from `@supabase/ssr`
   - Use env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **`src/lib/supabase/server.ts`** (Server client)
   - `createServerClient` from `@supabase/ssr`
   - Cookie-based auth for server components
   - Proper cookie handling

3. **`src/types/project.ts`**
   ```typescript
   export interface FeaturedProject {
     id: string;
     title: string;
     subtitle: string;
     slug: string;
     thumbnailUrl: string;
     hoverVideoSrc?: string;
   }
   ```

4. **`src/types/client.ts`**
   ```typescript
   export interface Client {
     id: string;
     name: string;
     logoUrl: string;
   }
   ```

**Files Created**: 4 (2 lib, 2 types)

---

#### Step 11: Build Portfolio & Client Sections
**Dependencies**: Step 10 complete  
**Outputs**: Featured work and client logos functional

1. **`src/components/homepage/FeaturedWork.tsx`** (Server Component)
   - Fetch from Supabase: `projects` table where `featured=true`
   - Masonry/dynamic grid layout
   - Pass data to FeaturedWorkCard components
   - Scroll reveal animation

2. **`src/components/homepage/FeaturedWorkCard.tsx`** (Client Component)
   - Implements `resources/play-video-on-hover-lazy.md`
   - Video preview on hover (lazy loaded)
   - Text expands on hover
   - Link to `/work/[slug]`
   - Data attribute: `data-video-on-hover`

3. **`src/components/homepage/ClientLogos.tsx`** (Server Component)
   - Fetch from Supabase: `clients` table
   - Implements `resources/logo-wall-cycle.md`
   - Grid of client logos with cycling fade animation
   - ScrollTrigger starts animation on viewport enter
   - Props: `shuffle?: boolean`

**Files Created**: 3 components  
**Resource Files Referenced**: 2

**Supabase Queries**:
```typescript
// Featured projects
const { data: projects } = await supabase
  .from('projects')
  .select('id, title, subtitle, slug, thumbnail_url')
  .eq('featured', true)
  .eq('published', true)
  .order('created_at', { ascending: false })
  .limit(6);

// Client logos
const { data: clients } = await supabase
  .from('clients')
  .select('id, name, logo_url')
  .order('name');
```

---

### Phase 6: Final Integration (Step 12)

#### Step 12: Assemble Homepage & Test
**Dependencies**: All previous steps complete  
**Outputs**: Fully functional homepage

1. **Update `src/app/page.tsx`** to import and compose all sections:
   ```tsx
   import FnaLoader from '@/components/animations/FnaLoader';
   import HeroSection from '@/components/homepage/HeroSection';
   import LocationsRow from '@/components/homepage/LocationsRow';
   import ServicesMarquee from '@/components/homepage/ServicesMarquee';
   import ReelPlayer from '@/components/homepage/ReelPlayer';
   import ServicesCards from '@/components/homepage/ServicesCards';
   import FeaturedWork from '@/components/homepage/FeaturedWork';
   import ClientLogos from '@/components/homepage/ClientLogos';
   import FooterCTA from '@/components/layout/FooterCTA';
   
   // Server Component - fetch data
   // Compose sections in order
   ```

2. **Update `src/app/layout.tsx`** to include:
   - Navigation component in header
   - ScrollProgressBar
   - ParallaxProvider wrapper
   - ScrollRevealProvider wrapper
   - PageTransition wrapper
   - Footer component

3. **Create `src/lib/bunny/client.ts`** for Bunny CDN video URLs:
   ```typescript
   export function getBunnyVideoUrl(videoId: string): string {
     return `https://${process.env.BUNNY_CDN_HOSTNAME}/${videoId}/playlist.m3u8`;
   }
   ```

4. **Test checklist**:
   - [ ] Loader animation plays on first visit
   - [ ] Hero video loops with text overlay
   - [ ] Navigation works (desktop + mobile)
   - [ ] All sections scroll reveal correctly
   - [ ] Parallax effects work smoothly
   - [ ] Services marquee scrolls infinitely
   - [ ] Reel player controls work
   - [ ] Featured work cards show video on hover
   - [ ] Client logos cycle animation
   - [ ] Footer CTA and links work
   - [ ] Scroll progress bar updates
   - [ ] Page transitions work (when navigating)
   - [ ] Mobile responsive on all sections
   - [ ] No console errors
   - [ ] Reduced motion respected

**Files Modified**: 2 (page.tsx, layout.tsx)  
**Files Created**: 1 (bunny/client.ts)

---

## Implementation Notes for Haiku

### Component Type Guidelines
- **Server Components** (default): For static content, data fetching, SEO
  - HeroSection, LocationsRow, ServicesCards, FeaturedWork, ClientLogos, Footer, FooterCTA
  
- **Client Components** (`'use client'`): For interactivity, animations, browser APIs
  - FnaLoader, Navigation, MobileMenu, NavButton, ServicesMarquee, ReelPlayer, FeaturedWorkCard
  - All animation providers (ParallaxProvider, ScrollRevealProvider, ScrollProgressBar, PageTransition)

### Data Attribute Patterns
Each animation component uses specific data attributes for configuration. Reference the implementation guides in `resources/` for exact syntax.

**Examples**:
- Parallax: `data-parallax="trigger" data-parallax-start="20" data-parallax-end="-20"`
- Reveal: `data-reveal-group data-stagger="100" data-distance="2em"`
- Video hover: `data-video-on-hover="not-active" data-video-src="..."`
- Directional button: `data-btn-hover data-theme="light"`

### Resource File Cross-Reference

| Component | Resource File |
|-----------|---------------|
| FnaLoader | `resources/willem-loading-animation.md` |
| NavButton | `resources/directional-button-hover.md` |
| MobileMenu | `resources/burger-menu-button.md` |
| HeroSection text | `resources/masked-text-reveal-gsap-splittext.md` |
| ServicesMarquee | `resources/css-marquee.md` |
| ReelPlayer | `resources/custom-bunny-hls-player-advanced.md` |
| FeaturedWorkCard | `resources/play-video-on-hover-lazy.md` |
| ClientLogos | `resources/logo-wall-cycle.md` |
| ParallaxProvider | `resources/global-parallax-setup.md` |
| ScrollRevealProvider | `resources/elements-reveal-on-scroll.md` |
| ScrollProgressBar | `resources/scroll-progress-bar.md` |
| PageTransition | `resources/page-name-transition-wipe.md` |

### Environment Variables Required
From `.env.local` (already exists):
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
BUNNY_CDN_HOSTNAME=...
NEXT_PUBLIC_SITE_URL=https://fna.wtf
```

### Design System Quick Reference

**Colors** (in `globals.css`):
```css
--purple-400: #a14dfd; /* PRIMARY */
--background: #0a0a0b;
--foreground: #fafafa;
--muted: #171717;
--muted-foreground: #a1a1aa;
--border: #262626;
--accent: #a14dfd;
```

**Fonts**:
- Display (headings): Space Grotesk
- Body: Manrope
- Mono (code): Space Mono

**Spacing**:
- Mobile-first with `md:` and `lg:` breakpoints
- Consistent padding/gap using Tailwind utilities

---

## Success Criteria

After completing all 12 steps, the homepage should:

1. **Load smoothly** with FNA loader animation
2. **Display hero** with looping background video and animated text
3. **Show all sections** in correct order with proper spacing
4. **Animate on scroll** with parallax and reveal effects
5. **Play videos** on hover in featured work section
6. **Cycle client logos** with smooth transitions
7. **Navigate** between pages with wipe transitions
8. **Respond to mobile** with appropriate layouts
9. **Respect motion preferences** for accessible experience
10. **Perform well** with no console errors or warnings

---

## Next Steps After Homepage

Once homepage is complete and tested:
1. Build out placeholder pages (`/work`, `/services`, `/pricing`, `/about`)
2. Create project detail pages (`/work/[slug]`)
3. Set up Supabase database and migrations
4. Build admin dashboard for content management
5. Implement Cal.com scheduling integration
6. Add SEO metadata and Open Graph tags
7. Deploy to Vercel for staging review

---

## File Count Summary

**Configuration Files**: 6  
**App Router Pages**: 7 (1 homepage + 4 placeholders + layout + globals.css)  
**Layout Components**: 5  
**Animation Components**: 4 providers + 1 loader  
**Homepage Components**: 8 sections  
**Utility/Library Files**: 4 (gsap, supabase, bunny)  
**Hooks**: 3  
**Type Definitions**: 2  
**Resource References**: 12 markdown files

**Total New Files**: ~40 files across 12 implementation steps
