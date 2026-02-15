---
description: Development workflow and command reference
globs: 
---

# Development Workflow Guide

## Getting Started

1. Install dependencies: `npm install`
2. Start development: `npm dev`
3. Build project: `npm build`

## Core Commands

- `npm dev`: Start Next.js development server (runs `next dev`)
- `npm build`: Build for production (runs `next build`)
- `npm start`: Start production server (runs `next start`)

## Package Management

- `npm install`: Install dependencies
- `npm install <package>`: Add new dependency
- `npm install <package> --save-dev`: Add dev dependency
- `npm update`: Update all dependencies
- `npm outdated`: Check for outdated packages
- `npm prune`: Remove unused dependencies

## Type Checking

- `npm type-check`: Run TypeScript type checking
- `npm type-check:watch`: Run type checking in watch mode

## Code Quality

- `npm lint`: Run linting checks
- `npm lint:fix`: Fix auto-fixable lint issues

## Testing

- `npm test:e2e`: Run Playwright end-to-end tests
- `npm test:e2e:ui`: Run Playwright tests with UI

## Clean Commands

- `npm clean`: Clean all build artifacts and dependencies
- `npm clean:build`: Clean build artifacts only
- `npm clean:deps`: Clean node_modules and reinstall
- `npm clean:install`: Complete clean and fresh install

## Development Guidelines

1. Always run type-checking before committing: `npm type-check`
2. Format code before committing: `npm format`
3. Fix lint issues: `npm lint:fix`
4. Run tests before pushing: `npm test`
5. Use the appropriate build command for your environment
8. Keep the development environment up to date with `npm clean:install`

## Environment Setup

- Development: `npm dev`
- Vercel Preview: `vercel`
- Vercel Production: `vercel --prod`

## Troubleshooting

- If dependencies are acting up: `npm clean:install`
- If builds are failing: `npm clean:build && npm build`
- If types are incorrect: `npm type-check`
- If Next.js cache is causing issues: Delete `.next` folder and restart dev server
- If hot reload isn't working: Restart the dev server with `npm dev`
