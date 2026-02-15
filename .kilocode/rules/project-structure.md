---
description: Project structure guidelines and organization
globs: 
---

# Project Structure Guidelines

## Directory Organization

- Project Type: single
- Source Directory: src/
- Component Organization: feature-based

## File Naming Conventions

- Components: PascalCase (e.g., `EventCard.tsx`, `VolunteerForm.tsx`)
- Component Files: PascalCase (e.g., `EventCard.tsx` matches component name `EventCard`)
- Utility Files: kebab-case (e.g., `format-date.ts`, `api-client.ts`)
- Import Style: Absolute imports using `@/*` alias (e.g., `@/components/ui/Button`, `@/features/events/components/EventCard`)

## Structure Requirements

- Single application structure
- Clear separation of concerns
- Modular component organization

## Best Practices

- Keep related files together
- Use consistent naming across the project
- Maintain clear import/export patterns
- Document architectural decisions

## Code Examples

```
src/

├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── dashboard/
│       ├── components/
│       ├── hooks/
│       └── services/

```
