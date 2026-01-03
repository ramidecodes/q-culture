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
- **`ALGORITHMS.md`** - Explanation of cultural distance calculations and grouping algorithms
- **`features/`** - Individual feature requirement documents:
  - **`implemented/`** - Documentation for completed features
  - Feature-specific FREDs (workshop creation, participant management, grouping, workshop management, etc.)
- **`Quantifying-Culture-data.csv`** - Reference data for cultural frameworks

## Source Code (`src/`)

### Application Routes (`src/app/`)

Next.js App Router structure defining the application's routes and pages:

- **`page.tsx`** - Landing/home page
- **`layout.tsx`** - Root layout with providers (Clerk, Theme)
- **`globals.css`** - Global styles and Tailwind directives
- **`error.tsx`** - Global error boundary
- **`not-found.tsx`** - 404 page
- **`middleware.ts`** - Next.js middleware for route protection
- **`dashboard/`** - Facilitator dashboard (protected route)
  - **`page.tsx`** - Dashboard home page
  - **`layout.tsx`** - Dashboard layout wrapper
  - **`new-workshop/page.tsx`** - Workshop creation page
  - **`workshop/[id]/`** - Individual workshop management
    - **`page.tsx`** - Workshop overview page
    - **`configure/page.tsx`** - Workshop configuration page
    - **`reflections/page.tsx`** - Participant reflections review page
    - **`not-found.tsx`** - Workshop not found page
- **`join/[code]/page.tsx`** - Participant join page (public route)
- **`participant/[token]/`** - Participant area
  - **`page.tsx`** - Participant view page
  - **`reflect/page.tsx`** - Reflection submission page
- **`sign-in/[[...sign-in]]/page.tsx`** - Authentication sign-in page (Clerk)
- **`sign-up/[[...sign-up]]/page.tsx`** - Authentication sign-up page (Clerk)
- **`api/`** - API route handlers
  - **`participant/[token]/group/route.ts`** - Get participant's group assignment
  - **`workshop/[id]/`** - Workshop-related API endpoints
    - **`country-distribution/route.ts`** - Get country distribution for a workshop
    - **`distance-matrix/route.ts`** - Get distance matrix for cultural visualization
    - **`participants/route.ts`** - Get participants for a workshop

### Components (`src/components/`)

Reusable React components organized by purpose:

- **`ui/`** - ShadCN UI component library (buttons, forms, dialogs, etc.)
  - `badge.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`, `form.tsx`, `input.tsx`, `label.tsx`, `radio-group.tsx`, `select.tsx`, `separator.tsx`, `tabs.tsx`, `textarea.tsx`
- **`auth-controls.tsx`** - Authentication UI controls
- **`cultural-visualizations/`** - Visualization components
  - `distance-matrix-heatmap.tsx` - Heatmap visualization of cultural distances
  - `network-graph.tsx` - Force-directed graph visualization
  - `visualization-container.tsx` - Container handling data loading and state
  - `visualization-skeleton.tsx` - Loading state for visualizations
  - `visualization-view.tsx` - Tabbed view switching between Graph and Heatmap
  - `visualization-wrapper.tsx` - Wrapper component for error handling and layout
- **`country-distribution.tsx`** - Country distribution visualization component
- **`country-select.tsx`** - Country selection dropdown component
- **`generate-groups-button.tsx`** - Button component for triggering group generation
- **`get-started-button.tsx`** - Call-to-action button component
- **`grouping-config-form.tsx`** - Form for configuring group generation parameters
- **`header.tsx`** - Application header/navigation
- **`participant-card.tsx`** - Individual participant card component
- **`participant-join-form.tsx`** - Form for participants to join a workshop
- **`participant-list.tsx`** - List view of workshop participants
- **`reflection-list.tsx`** - Component displaying participant reflections organized by group
- **`theme-provider.tsx`** - Theme context provider (dark/light mode)
- **`theme-toggle.tsx`** - Theme switcher component
- **`workshop-join-code.tsx`** - Component displaying workshop join code
- **`workshop-list.tsx`** - Component displaying facilitator's workshops with delete functionality
- **`workshop-state-controls.tsx`** - Controls for managing workshop state
- **`workshop-status-badge.tsx`** - Badge component for workshop status display

### Library Code (`src/lib/`)

Core application logic and utilities:

- **`auth.ts`** - Authentication utilities and helpers (Clerk integration)
- **`utils.ts`** - Shared utility functions (e.g., `cn()` for class merging)
- **`actions/`** - Server actions for data mutations:
  - **`grouping-actions.ts`** - Actions for group generation and management
  - **`participant-actions.ts`** - Actions for participant operations
  - **`workshop-actions.ts`** - Actions for workshop CRUD operations (create, update status, delete with cascade)
- **`db/`** - Database layer:
  - **`index.ts`** - Database connection and client setup (Drizzle + Supabase)
  - **`queries/`** - Database query functions:
    - `country-queries.ts` - Country data queries
    - `participant-queries.ts` - Participant data queries
    - `reflection-queries.ts` - Reflection data queries (organized by group)
    - `workshop-queries.ts` - Workshop data queries (list, get by ID, participant counts)
    - `visualization-queries.ts` - Cultural visualization data queries
  - **`schema/`** - Drizzle ORM schema definitions:
    - `countries.ts` - Country reference data
    - `cultural-frameworks.ts` - Cultural framework scores
    - `workshops.ts` - Workshop entities
    - `participants.ts` - Participant entities
    - `groups.ts` - Group assignments
    - `reflections.ts` - Participant reflection submissions
    - `index.ts` - Schema exports
- **`utils/`** - Specialized utility functions:
  - **`country-flag.ts`** - Country flag emoji utilities
  - **`cultural-distance.ts`** - Cultural distance computation algorithms
  - **`distance-matrix.ts`** - Distance matrix generation utilities
  - **`framework-availability.ts`** - Checks for available cultural data
  - **`group-assignment.ts`** - Group assignment algorithm implementations
  - **`join-code.ts`** - Workshop join code generation and validation
  - **`visualization-data.ts`** - Data transformation for visualizations

### Types (`src/types/`)

TypeScript type definitions and interfaces for the application.

## Database Migrations (`migrations/`)

Drizzle ORM migration files:

- **`meta/`** - Migration metadata and journal
- SQL migration files (e.g., `0000_large_devos.sql`, `0001_abandoned_blonde_phantom.sql`)
- **`seed-cultural-data.ts`** - Seed script for cultural framework data
- **`seed-hall-data.ts`** - Seed script for Hall framework data
- **`seed-hofstede-data.ts`** - Seed script for Hofstede framework data
- **`seed-lewis-data.ts`** - Seed script for Lewis framework data

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
- Shared utilities in `lib/utils/` and `lib/utils.ts`
- Server actions in `lib/actions/` for data mutations
- Database queries in `lib/db/queries/` for data fetching

### Database Layer
- Drizzle ORM for type-safe database queries
- Supabase as the PostgreSQL database provider
- Schema definitions separated by domain
- Query functions organized in `db/queries/` directory
- Server actions in `lib/actions/` for data mutations
- Migrations managed through Drizzle Kit
- Seed scripts for cultural reference data

### Authentication
- Clerk for facilitator authentication
- Middleware-based route protection using `clerkMiddleware`
- Public routes: `/`, `/join/*`, `/participant/*`, `/sign-in/*`, `/sign-up/*`
- Protected routes: All dashboard routes require authentication
- Anonymous session management for participants (token-based)

### Styling
- Tailwind CSS for utility-first styling
- ShadCN UI for component primitives
- Theme system with dark/light mode support

## Development Workflow

1. **Database Changes**: Update schema files → Generate migration → Apply migration
2. **Component Development**: Create in `components/` → Use in app routes
3. **Feature Development**: Follow FREDs in `docs/features/` → Implement → Document in `docs/features/implemented/`
4. **Code Quality**: Run `pnpm check` (format + lint) before committing
