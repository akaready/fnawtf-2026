---
description: Technology stack patterns and best practices for Next.js, Supabase, Shadcn/ui, Framer Motion, and Lucide icons
globs: 
---

# Technology Stack Patterns

## Next.js 14+ App Router

### Project Structure
- Use `src/app` directory for routing
- Each folder represents a route segment
- Only `page.tsx` and `route.ts` files create accessible routes
- Colocate related files in route segments
- Use route groups `(groupName)` for organization without affecting URLs

### Server and Client Components
- Default to Server Components (async, data fetching)
- Use `'use client'` directive only when interactivity is needed
- Keep client boundaries minimal - mark only interactive components
- Server Components can fetch data directly without API routes
- Client Components are needed for: useState, useEffect, event handlers, browser APIs

### API Routes
- Use `route.ts` files in `app/api` directory
- Export named functions: GET, POST, PUT, DELETE, PATCH
- Use Next.js `NextRequest` and `NextResponse` types
- Handle errors and return appropriate status codes
- Use route handlers for external API integrations or server-side logic

### Data Fetching
- Fetch data directly in Server Components
- Use async/await for data fetching
- Handle errors appropriately
- Use Suspense boundaries for loading states
- Cache data when appropriate using Next.js caching

## Supabase Integration

### Client Setup
- **Browser Client**: Use `createBrowserClient` from `@supabase/ssr`
- **Server Client**: Use `createServerClient` from `@supabase/ssr` with cookies
- Store Supabase URL and anon key in environment variables
- Use cookie-based authentication for server components
- RLS policies automatically apply based on authenticated user

### Data Fetching Patterns
- Fetch data in Server Components using server Supabase client
- RLS automatically filters queries by tenant/user context
- Handle errors appropriately
- Use TypeScript types for query results
- Leverage Supabase's query builder for filtering, sorting, pagination

### Authentication
- Use Supabase Auth for user authentication
- Get current user with `supabase.auth.getUser()` in server components
- Handle authentication state in client components
- Use middleware for route protection
- Store session in cookies for server-side access

### Best Practices
- Always use server client in Server Components
- Always use browser client in Client Components
- Let RLS handle data filtering - don't manually filter by tenant_id
- Use TypeScript for type safety
- Handle loading and error states

## Shadcn/ui Components

### Installation and Usage
- Components are copied into your project (not installed as npm package)
- Use CLI to add components: `npx shadcn@latest add [component-name]`
- Components live in `components/ui/` directory
- Import using `@/components/ui/` alias
- Customize components by editing the copied files

### Component Patterns
- Use shadcn/ui components as base, customize as needed
- Components are built on Radix UI primitives
- Styled with Tailwind CSS
- Fully accessible by default
- TypeScript support out of the box

### Form Integration
- Use with React Hook Form for form management
- Use Zod for schema validation
- Use `zodResolver` to connect Zod schemas to forms
- Use FormField, FormItem, FormLabel, FormControl, FormMessage components
- Handle form submission and validation errors

### Best Practices
- Copy components into project, don't install as package
- Customize components to match design system
- Use composition patterns for complex UIs
- Leverage Radix UI primitives for accessibility
- Follow shadcn/ui patterns for consistency

## Framer Motion

### Basic Animation Patterns
- Use `motion` components instead of regular HTML elements
- Define `initial`, `animate`, and `exit` props for animations
- Use `transition` prop to control animation timing and easing
- Animate common properties: opacity, scale, x, y, rotate

### Layout Animations
- Use `layout` prop for automatic layout animations
- Use `AnimatePresence` for exit animations
- Animate list changes with `layout` prop on list items
- Use `layoutId` for shared element transitions

### Gesture Animations
- Use `whileHover` for hover animations
- Use `whileTap` for click/tap animations
- Use `whileInView` for scroll-triggered animations
- Use `drag` prop for draggable elements

### Performance Optimization
- Use `useMotionValue` for values that don't need React re-renders
- Use `animate` function for programmatic animations
- Avoid animating properties that cause layout shifts when possible
- Use `layout` prop instead of animating width/height directly

### Best Practices
- Keep animations subtle and purposeful
- Use motion values for performance-critical animations
- Prefer layout animations over manual position calculations
- Test animations on lower-end devices
- Respect user's motion preferences

## Lucide Icons

### Usage Pattern
- **Always use Lucide React icons** - no other icon libraries
- Import icons from `lucide-react` package
- Icons are React components - use as JSX elements
- Pass `size`, `className`, and other props as needed
- Use consistent icon sizes throughout the application

### Icon Sizing
- Small: `w-4 h-4` (16px) - inline with text, small buttons
- Medium: `w-5 h-5` (20px) - buttons, cards, navigation
- Large: `w-6 h-6` (24px) - headers, prominent features
- Use `size` prop for programmatic sizing when needed

### Common Icon Categories
- **Navigation**: Home, Calendar, Users, Settings, Menu
- **Actions**: Plus, Edit, Trash2, Save, X, Check
- **Status**: CheckCircle, AlertCircle, Info, XCircle
- **Direction**: ChevronLeft, ChevronRight, ArrowUp, ArrowDown
- **Communication**: Mail, MessageSquare, Bell, Share

### Best Practices
- Use Lucide icons exclusively - no mixing with other icon libraries
- Maintain consistent sizing within UI sections
- Use semantic icon choices (e.g., Calendar for date-related features)
- Apply appropriate colors via className (e.g., `text-gray-500`)
- Import only needed icons to keep bundle size small

## Integration Patterns

### Combining Technologies
- Use Server Components for data fetching with Supabase
- Use Client Components for interactive UI with Framer Motion
- Use shadcn/ui components as building blocks
- Use Lucide icons for consistent iconography
- Layer animations on top of shadcn/ui components

### Component Structure
- Server Components: Fetch data, render initial UI
- Client Components: Handle interactivity, animations, form state
- Use composition to combine shadcn/ui, Framer Motion, and Lucide icons
- Keep components focused and composable

### Performance Considerations
- Server Components reduce client bundle size
- Framer Motion animations run on GPU when possible
- Lucide icons are tree-shakeable (import only what you need)
- Shadcn/ui components are lightweight and customizable
- Use Next.js Image component for optimized images
