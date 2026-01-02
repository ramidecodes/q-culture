# Project Structure

This document provides a high-level overview of the Quantifying Culture project structure. The project is a Next.js 15 application built with TypeScript, using the App Router pattern.

## Root Directory

```
q-culture/
├── docs/              # Project documentation and feature specifications
├── migrations/        # Database migration files (Drizzle ORM)
├── public/            # Static assets (images, fonts, etc.)
├── src/               # Source code
├── [config files]     # Configuration files for tools and frameworks
```

## Configuration Files

- **`package.json`** - Project dependencies and scripts
- **`tsconfig.json`** - TypeScript configuration
- **`next.config.ts`** - Next.js configuration
- **`tailwind.config.ts`** - Tailwind CSS configuration
- **`drizzle.config.ts`** - Drizzle ORM database configuration
- **`biome.json`** - Biome formatter and linter configuration
- **`components.json`** - ShadCN UI component configuration
- **`postcss.config.mjs`** - PostCSS configuration for Tailwind

## Documentation (`docs/`)

The `docs/` directory contains project documentation and feature specifications:

- **`base-project.md`** - Main project documentation with PRD and FREDs (Feature Requirement Documents)
- **`features/`** - Individual feature requirement documents:
  - **`implemented/`** - Documentation for completed features
  - Feature-specific FREDs (workshop creation, participant management, grouping, etc.)
- **`Quantifying-Culture-data.csv`** - Reference data for cultural frameworks

## Source Code (`src/`)

### Application Routes (`src/app/`)

Next.js App Router structure defining the application's routes and pages:

- **`page.tsx`** - Landing/home page
- **`layout.tsx`** - Root layout with providers (Clerk, Theme)
- **`globals.css`** - Global styles and Tailwind directives
- **`error.tsx`** - Global error boundary
- **`not-found.tsx`** - 404 page
- **`dashboard/`** - Facilitator dashboard (protected route)
- **`sign-in/`** - Authentication sign-in page (Clerk)
- **`sign-up/`** - Authentication sign-up page (Clerk)
- **`middleware.ts`** - Next.js middleware for route protection

### Components (`src/components/`)

Reusable React components organized by purpose:

- **`ui/`** - ShadCN UI component library (buttons, forms, dialogs, etc.)
- **`auth-controls.tsx`** - Authentication UI controls
- **`get-started-button.tsx`** - Call-to-action button component
- **`header.tsx`** - Application header/navigation
- **`theme-provider.tsx`** - Theme context provider (dark/light mode)
- **`theme-toggle.tsx`** - Theme switcher component

### Library Code (`src/lib/`)

Core application logic and utilities:

- **`auth.ts`** - Authentication utilities and helpers
- **`utils.ts`** - Shared utility functions (e.g., `cn()` for class merging)
- **`db/`** - Database layer:
  - **`index.ts`** - Database connection and client setup
  - **`schema/`** - Drizzle ORM schema definitions:
    - `countries.ts` - Country reference data
    - `cultural-frameworks.ts` - Cultural framework scores
    - `workshops.ts` - Workshop entities
    - `participants.ts` - Participant entities
    - `groups.ts` - Group assignments
    - `reflections.ts` - Participant reflection submissions
    - `index.ts` - Schema exports

### Types (`src/types/`)

TypeScript type definitions and interfaces for the application.

## Database Migrations (`migrations/`)

Drizzle ORM migration files:

- **`meta/`** - Migration metadata and journal
- SQL migration files (e.g., `0000_large_devos.sql`)

## Public Assets (`public/`)

Static files served directly by Next.js (images, icons, etc.).

## Key Architectural Patterns

### Server-First Approach
- Default to Server Components (no `"use client"` unless needed)
- Minimal client-side JavaScript
- Server-side data fetching and rendering

### Component Organization
- UI components in `components/ui/` (ShadCN)
- Feature-specific components at `components/` root
- Shared utilities in `lib/`

### Database Layer
- Drizzle ORM for type-safe database queries
- Schema definitions separated by domain
- Migrations managed through Drizzle Kit

### Authentication
- Clerk for facilitator authentication
- Middleware-based route protection
- Anonymous session management for participants

### Styling
- Tailwind CSS for utility-first styling
- ShadCN UI for component primitives
- Theme system with dark/light mode support

## Development Workflow

1. **Database Changes**: Update schema files → Generate migration → Apply migration
2. **Component Development**: Create in `components/` → Use in app routes
3. **Feature Development**: Follow FREDs in `docs/features/` → Implement → Document in `docs/features/implemented/`
4. **Code Quality**: Run `pnpm check` (format + lint) before committing
