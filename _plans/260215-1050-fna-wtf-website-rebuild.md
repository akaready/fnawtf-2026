# FNA.WTF Website Rebuild - Comprehensive Plan

**Created**: 2026-02-15 10:50 PST  

**Project**: Friends 'n Allies Agency Portfolio Website  

**Tech Stack**: Next.js 14+, TypeScript, Tailwind CSS, Supabase, GSAP, Bunny CDN, Cal.com, Vercel

---

## Executive Summary

Build a modern, database-driven portfolio website for https://fna.wtf featuring:

- Video production portfolio with **filtering/sorting**
- Web design portfolio (new)
- Services and transparent pricing pages
- Interactive pricing calculators
- Admin dashboard with CMS and proposal generator
- Password-protected client proposal pages (`/p/{client_name}`)
- Dark theme with GSAP/Motion animations
- Mobile-first responsive design

---

## Scraped Data Summary

### Source: https://fna.wtf

**Homepage Portfolio Projects (27+ items**

**Portfolio Item Data Model** (from /tidbyt-gen2):

- Title, subtitle, client quote
- Assets delivered (Flagship, Cutdowns, Broadcast, Long-form, Photography, BTS, Stills)
- Project description
- Style tags: Video Essay, Founder Story, Commercial, Comedy, etc.
- Premium Add-ons: Motion Graphics, Premium Lighting, Visual FX, Animation
- Camera Techniques: Tripod, Gimbal, Drone, Slider, Long Takes
- Production Scope: # of days, # of crew, # of talent, # of locations
- Complete credits: Director, D.P., Gaffer, Grip, PA, Cast, etc.
- Video embed with analytics

**Services/Pricing Tiers** (from /launch):

**Team** (from /contact):

- Ol' Richie - Managing Partner & Director
- Ready - Managing Partner & Editor

---

## osmo.supply Animation Assets

The osmo.supply animation library will be bundled as markdown files with frontmatter in the `/assets/animations/` folder. Code will reference these assets generically rather than importing specific animation code directly.

```
assets/animations/
├── text-reveal.md      # Text reveal effect - frontmatter: { effect: "text-reveal", duration: 0.8 }
├── page-transition.md  # Page transition effect - frontmatter: { effect: "page-transition", type: "fade" }
├── scroll-trigger.md   # Scroll-triggered animations - frontmatter: { effect: "scroll-trigger", trigger: "onEnter" }
└── hover-effects.md    # Hover interaction effects - frontmatter: { effect: "hover", type: "scale" }
```

Agents working on Workstream 2 should:

1. Parse frontmatter from these markdown files to load animation configuration
2. Create reusable animation components that read from asset metadata
3. Use the asset frontmatter to determine animation parameters

---

## System Architecture

```mermaid
graph TB
    subgraph Public Site
        HOME[Home - Portfolio Grid]
        WORK[/work - Video Portfolio]
        WORKID[/work/id - Project Detail]
        SERVICES[/services - Services Page]
        PRICING[/pricing - Interactive Calculators]
        ABOUT[/about - Team & Contact]
        PROPOSAL[/p/client-name - Password Protected]
    end

    subgraph Admin Dashboard
        LOGIN[/admin/login]
        DASH[/admin - Dashboard]
        CMS[/admin/portfolio - CMS]
        PROPOSALS[/admin/proposals - Generator]
        CLIENTS[/admin/clients - Management]
        ANALYTICS[/admin/analytics]
    end

    subgraph External Services
        SUPABASE[(Supabase DB + Auth)]
        BUNNY[Bunny CDN Videos]
        CALCOM[Cal.com Booking]
        VERCEL[Vercel Hosting]
    end

    HOME --> SUPABASE
    WORKID --> BUNNY
    LOGIN --> SUPABASE
    ABOUT --> CALCOM
    DASH --> SUPABASE
```

---

## Database Schema

```mermaid
erDiagram
    PROJECTS ||--o{ PROJECT_TAGS : has
    PROJECTS ||--o{ PROJECT_CREDITS : has
    PROJECTS ||--o{ PROJECT_ASSETS : has
    PROJECTS ||--o{ PROJECT_VIDEOS : has
    TAGS ||--o{ PROJECT_TAGS : referenced_by
    CLIENTS ||--o{ PROPOSALS : has
    PROPOSALS ||--o{ PROPOSAL_ITEMS : contains
    USERS ||--o{ AUDIT_LOGS : creates

    PROJECTS {
        uuid id PK
        string title
        string subtitle
        string slug UK
        text description
        text client_quote
        string client_name
        enum type "video | design"
        jsonb style_tags
        jsonb premium_addons
        jsonb camera_techniques
        int production_days
        int crew_count
        int talent_count
        int location_count
        string thumbnail_url
        boolean featured
        boolean published
        timestamp created_at
        timestamp updated_at
    }

    PROJECT_VIDEOS {
        uuid id PK
        uuid project_id FK
        string bunny_video_id
        string title
        enum video_type "flagship | cutdown | broadcast | bts"
        int sort_order
    }

    PROJECT_CREDITS {
        uuid id PK
        uuid project_id FK
        string role
        string name
        int sort_order
    }

    PROJECT_ASSETS {
        uuid id PK
        uuid project_id FK
        string asset_type
        string url
        string description
    }

    TAGS {
        uuid id PK
        string name UK
        string category "style | technique | addon"
        string color
    }

    PROJECT_TAGS {
        uuid project_id FK
        uuid tag_id FK
    }

    CLIENTS {
        uuid id PK
        string name
        string company
        string email
        text notes
        timestamp created_at
    }

    PROPOSALS {
        uuid id PK
        uuid client_id FK
        string slug UK
        string password_hash
        string title
        text description
        decimal total_amount
        enum status "draft | sent | viewed | accepted | declined"
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    PROPOSAL_ITEMS {
        uuid id PK
        uuid proposal_id FK
        string title
        text description
        decimal price
        int quantity
        int sort_order
    }

    USERS {
        uuid id PK
        string email UK
        string name
        enum role "admin"
        timestamp created_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        string action
        jsonb metadata
        timestamp created_at
    }
```

---

## Project Structure

```
fnawtf-2026/
├── AGENTS.md                    # Agent coordination file
├── README.md                    # Project documentation
├── .env.example                 # Environment variables template
├── .env.local                   # Local environment (gitignored)
│
├── _plans/                      # Planning documents
│   └── 260215-1050-fna-wtf-website-rebuild.md
│
├── assets/                      # Static assets and animation libraries
│   ├── animations/             # osmo.supply animation assets (markdown with frontmatter)
│   │   ├── text-reveal.md      # Text reveal effect
│   │   ├── page-transition.md  # Page transition effect
│   │   ├── scroll-trigger.md   # Scroll-triggered animations
│   │   └── hover-effects.md    # Hover interaction effects
│   ├── portfolio-seed.json     # Scraped portfolio data for seeding
│   └── images/                 # Local images
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with dark theme
│   │   ├── page.tsx            # Home/portfolio grid
│   │   ├── globals.css         # Global styles + Tailwind
│   │   │
│   │   ├── work/               # Video portfolio
│   │   │   ├── page.tsx        # Portfolio listing with filters
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # Project detail
│   │   │
│   │   ├── design/             # Web design portfolio
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── services/
│   │   │   └── page.tsx        # Services overview
│   │   │
│   │   ├── pricing/
│   │   │   └── page.tsx        # Interactive calculators
│   │   │
│   │   ├── about/
│   │   │   └── page.tsx        # Team + Cal.com embed
│   │   │
│   │   ├── p/                  # Client proposals
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # Password-protected proposal
│   │   │
│   │   ├── (admin)/            # Admin route group
│   │   │   ├── layout.tsx      # Admin layout with auth
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx    # Dashboard
│   │   │   │   ├── portfolio/
│   │   │   │   │   ├── page.tsx        # CMS listing
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx    # Create project
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── edit/
│   │   │   │   │           └── page.tsx # Edit project
│   │   │   │   ├── proposals/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── clients/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── analytics/
│   │   │   │       └── page.tsx
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                # API routes
│   │       ├── auth/
│   │       │   └── callback/
│   │       │       └── route.ts
│   │       ├── projects/
│   │       │   └── route.ts
│   │       ├── proposals/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── verify/
│   │       │           └── route.ts
│   │       └── analytics/
│   │           └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── AdminSidebar.tsx
│   │   │
│   │   ├── portfolio/          # Portfolio components
│   │   │   ├── PortfolioGrid.tsx
│   │   │   ├── PortfolioCard.tsx
│   │   │   ├── PortfolioFilters.tsx
│   │   │   ├── ProjectDetail.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   └── CreditsSection.tsx
│   │   │
│   │   ├── pricing/            # Pricing components
│   │   │   ├── PricingCalculator.tsx
│   │   │   ├── ServiceTierCard.tsx
│   │   │   └── AddOnSelector.tsx
│   │   │
│   │   ├── proposals/          # Proposal components
│   │   │   ├── ProposalViewer.tsx
│   │   │   ├── PasswordGate.tsx
│   │   │   └── ProposalItem.tsx
│   │   │
│   │   ├── admin/              # Admin components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ProjectForm.tsx
│   │   │   ├── ProposalBuilder.tsx
│   │   │   └── ClientList.tsx
│   │   │
│   │   └── animations/         # Animation components
│   │       ├── TextReveal.tsx
│   │       ├── PageTransition.tsx
│   │       ├── ScrollTrigger.tsx
│   │       └── HoverEffect.tsx
│   │
│   ├── lib/                    # Utilities
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   └── middleware.ts   # Auth middleware
│   │   │
│   │   ├── bunny/
│   │   │   └── client.ts       # Bunny CDN integration
│   │   │
│   │   ├── animations/
│   │   │   ├── gsap-setup.ts   # GSAP registration
│   │   │   └── motion-config.ts # Motion library config
│   │   │
│   │   └── utils/
│   │       ├── formatters.ts
│   │       └── validators.ts
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useProjects.ts
│   │   ├── useAnimations.ts
│   │   └── useVideoPlayer.ts
│   │
│   └── types/                  # TypeScript types
│       ├── database.types.ts   # Supabase generated types
│       ├── project.ts
│       ├── proposal.ts
│       └── api.ts
│
├── public/
│   ├── fonts/                  # Custom fonts
│   │   ├── Manrope/
│   │   ├── SpaceGrotesk/
│   │   └── SpaceMono/
│   └── images/
│
├── supabase/
│   ├── migrations/             # Database migrations
│   │   └── 001_initial_schema.sql
│   └── seed.sql                # Seed data from scraped content
│
└── config files...
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── package.json
    └── .kilocode/rules/        # Existing rules (keep updated)
```

---

## Parallel Workstreams

The project is organized into **6 parallel workstreams** that can be worked on by independent agents. Each workstream has clear dependencies and deliverables.

### Workstream 1: Foundation & Infrastructure

**Dependencies**: None (start first)

**Agent Focus**: Project setup, database, auth

1. Initialize Next.js 14+ project with TypeScript
2. Configure Tailwind CSS with dark theme defaults
3. Install and configure shadcn/ui
4. Create Supabase project and configure environment
5. Create database schema migrations
6. Seed database with scraped portfolio data
7. Configure Supabase Auth with email/password
8. Create auth middleware for admin routes
9. Set up Vercel project and deployment pipeline
10. Create AGENTS.md coordination file

### Workstream 2: Design System & Animations

**Dependencies**: Workstream 1 (project initialized)

**Agent Focus**: UI/UX, animations, theming

1. Configure dark theme color palette in Tailwind
2. Set up custom fonts (Manrope, Space Grotesk, Space Mono)
3. Create base layout components (Header, Footer, Navigation)
4. Integrate osmo.supply animation library from assets/osmo_assets.md
5. Configure GSAP with ScrollTrigger
6. Create reusable animation components (TextReveal, PageTransition)
7. Build responsive mobile navigation
8. Implement page transitions
9. Create loading states and skeletons
10. Ensure Vercel Web Interface Guidelines compliance

### Workstream 3: Public Portfolio Pages

**Dependencies**: Workstreams 1 & 2

**Agent Focus**: Public-facing pages, video integration

1. Build home page with portfolio grid
2. Create PortfolioCard with hover animations
3. Implement portfolio filtering and sorting
4. Build /work video portfolio listing page
5. Create video project detail page template
6. Integrate Bunny CDN video player
7. Build /design web design portfolio listing
8. Create design project detail page template
9. Build credits and assets sections
10. Add related projects recommendations

### Workstream 4: Services & Pricing

**Dependencies**: Workstreams 1 & 2

**Agent Focus**: Services, pricing calculators

1. Build /services page with tier cards
2. Create animated service tier components
3. Build /pricing page layout
4. Create interactive pricing calculator component
5. Build add-on selector with live price updates
6. Implement pitch package calculator
7. Create quote summary component
8. Add Cal.com booking integration
9. Build /about team page
10. Add contact form with Supabase

### Workstream 5: Admin Dashboard & CMS

**Dependencies**: Workstream 1 (auth ready)

**Agent Focus**: Admin area, content management

1. Build admin layout with sidebar navigation
2. Create admin dashboard with analytics overview
3. Build portfolio CMS listing page
4. Create project create/edit forms
5. Implement video upload to Bunny CDN
6. Build tag management interface
7. Create credits editor component
8. Implement draft/publish workflow
9. Add bulk actions for projects
10. Create activity audit log viewer

### Workstream 6: Proposals & Client Management

**Dependencies**: Workstreams 1 & 5

**Agent Focus**: Proposal system, client portal

1. Build client management listing page
2. Create client create/edit forms
3. Build proposal builder interface
4. Create proposal item components
5. Implement proposal preview
6. Build password-protected proposal pages (/p/[slug])
7. Create password gate component
8. Add proposal status tracking
9. Implement proposal expiration
10. Build proposal analytics (views, downloads)