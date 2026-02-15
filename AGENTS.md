# AGENTS.md - Multi-Agent Coordination File

**Project**: FNA.WTF Website Rebuild  
**Last Updated**: 2026-02-15

---

## Project Overview

Building a modern, database-driven portfolio website for Friends 'n Allies (FNA) video production agency at https://fna.wtf

**Tech Stack**:
- Next.js 14+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS (dark theme)
- Supabase (database + auth)
- GSAP + Motion (animations)
- Bunny CDN (video hosting)
- Cal.com (booking integration)
- Vercel (deployment)

---

## Directory Structure

```
fnawtf-2026/
├── AGENTS.md                   # This file - coordination hub
├── _plans/                     # Planning documents
├── assets/
│   └── animations/             # Animation assets (markdown with frontmatter)
├── src/
│   ├── app/                   # Next.js App Router
│   ├── components/            # React components
│   ├── lib/                   # Utilities and clients
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript types
├── supabase/
│   ├── migrations/            # Database migrations
│   └── seed.sql               # Seed data
└── public/                    # Static assets
```

---

## Workstream Assignments

### Workstream 1: Foundation & Infrastructure
**Status**: NOT STARTED  
**Dependencies**: None  
**Files to create/modify**:
- `package.json`, `tsconfig.json`, `next.config.ts`
- `tailwind.config.ts`, `src/app/globals.css`
- `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
- `supabase/migrations/*.sql`
- `.env.example`, `.env.local`

### Workstream 2: Design System & Animations
**Status**: NOT STARTED  
**Dependencies**: Workstream 1 complete  
**Files to create/modify**:
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/Navigation.tsx`
- `src/components/animations/*.tsx`
- `src/lib/animations/gsap-setup.ts`
- `public/fonts/`

### Workstream 3: Public Portfolio Pages
**Status**: NOT STARTED  
**Dependencies**: Workstreams 1 & 2 complete  
**Files to create/modify**:
- `src/app/page.tsx` (home)
- `src/app/work/page.tsx`, `src/app/work/[slug]/page.tsx`
- `src/app/design/page.tsx`, `src/app/design/[slug]/page.tsx`
- `src/components/portfolio/*.tsx`
- `src/lib/bunny/client.ts`

### Workstream 4: Services & Pricing
**Status**: NOT STARTED  
**Dependencies**: Workstreams 1 & 2 complete  
**Files to create/modify**:
- `src/app/services/page.tsx`
- `src/app/pricing/page.tsx`
- `src/app/about/page.tsx`
- `src/components/pricing/*.tsx`

### Workstream 5: Admin Dashboard & CMS
**Status**: NOT STARTED  
**Dependencies**: Workstream 1 complete  
**Files to create/modify**:
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/admin/page.tsx`
- `src/app/(admin)/admin/portfolio/*.tsx`
- `src/components/admin/*.tsx`
- `src/lib/supabase/middleware.ts`

### Workstream 6: Proposals & Client Management
**Status**: NOT STARTED  
**Dependencies**: Workstreams 1 & 5 complete  
**Files to create/modify**:
- `src/app/p/[slug]/page.tsx`
- `src/app/(admin)/admin/proposals/*.tsx`
- `src/app/(admin)/admin/clients/*.tsx`
- `src/components/proposals/*.tsx`

---

## Coding Standards

### File Naming
- Components: PascalCase (`PortfolioCard.tsx`)
- Utilities: kebab-case (`format-date.ts`)
- Types: camelCase in files, PascalCase for type names

### Import Pattern
```typescript
// Use absolute imports with @/ alias
import { Button } from '@/components/ui/button';
import { createServerClient } from '@/lib/supabase/server';
```

### Component Pattern
```typescript
// Server Component (default)
export default async function PageName() {
  const data = await fetchData();
  return <div>{/* JSX */}</div>;
}

// Client Component (only when needed)
'use client';
import { useState } from 'react';
export function InteractiveComponent() {
  const [state, setState] = useState();
  return <div>{/* JSX */}</div>;
}
```

### TypeScript Rules
- No `any` types
- All props must be typed
- Use `interface` for component props
- Use `type` for unions/intersections
- Export types from `src/types/`

### Tailwind Guidelines
- Use dark theme classes: `bg-gray-900`, `text-gray-100`
- Mobile-first: start with mobile styles, add `md:`, `lg:` breakpoints
- Use design tokens from `tailwind.config.ts`

### Animation Rules
- Use GSAP for scroll-triggered animations
- Use Motion for layout animations and gestures
- Always check `prefers-reduced-motion`
- Animate only `transform` and `opacity` when possible

---

## Database Schema

Tables (see full schema in `_plans/260215-1050-fna-wtf-website-rebuild.md`):
- `projects` - Portfolio items
- `project_videos` - Video assets per project
- `project_credits` - Credits per project
- `project_assets` - Delivered assets
- `tags` - Filterable tags
- `project_tags` - Many-to-many join
- `clients` - Client information
- `proposals` - Generated proposals
- `proposal_items` - Line items in proposals
- `users` - Admin users
- `audit_logs` - Activity tracking

---

## Environment Variables

Required variables (see `.env.example`):
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BUNNY_API_KEY=
BUNNY_LIBRARY_ID=
BUNNY_CDN_HOSTNAME=
NEXT_PUBLIC_CALCOM_USERNAME=
NEXT_PUBLIC_SITE_URL=https://fna.wtf
```

---

## Communication Protocol

### Claiming Work
Before starting a task:
1. Check this file for workstream status
2. Update status to "IN PROGRESS" with your agent ID
3. List specific files you will modify

### Completing Work
After finishing a task:
1. Update status to "COMPLETE"
2. List all files created/modified
3. Note any issues or blockers for dependent workstreams

### Conflict Prevention
- Do not modify files outside your workstream
- If you need to modify a shared file, coordinate via this AGENTS.md
- Database migrations should be sequentially numbered (001, 002, etc.)

### Blocked Status
If blocked:
1. Update status to "BLOCKED"
2. Describe the blocker
3. Tag the workstream that needs to complete

---

## Quick Reference

### Common Commands
```bash
npm dev          # Start development server
npm build        # Build for production
npm lint         # Run linting
npm type-check   # TypeScript checking
```

### Adding shadcn/ui Components
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
```

### Supabase Commands
```bash
npx supabase migration new <name>
npx supabase db push
npx supabase gen types typescript --local > src/types/database.types.ts
```

---

## Change Log

| Date | Agent | Workstream | Changes |
|------|-------|------------|---------|
| 2026-02-15 | architect | - | Initial AGENTS.md created |
