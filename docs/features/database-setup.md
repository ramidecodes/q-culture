# Feature Requirement Document: Database Setup

## Feature Name

Database Setup (Neon Postgres + Drizzle ORM)

## Goal

Configure Neon Postgres database connection and Drizzle ORM with proper schema definitions, migration system, and query utilities to support the workshop application's data persistence needs.

## User Story

As a developer, I want to have a properly configured database with schema definitions and migration system, so that I can store and retrieve workshop, participant, and cultural data reliably.

## Functional Requirements

- Provision Neon Postgres database instance
- Install and configure Drizzle ORM with Neon adapter
- Define database schemas for all core entities (workshops, participants, groups, reflections, countries, cultural frameworks)
- Set up migration system for schema version control
- Configure connection pooling for optimal performance
- Create database utilities and query helpers
- Implement proper type safety with Drizzle's TypeScript integration
- Support for database transactions where needed
- Seed migration for cultural reference data

## Data Requirements

### Core Tables

**workshops**
- `id` (uuid, primary key)
- `title` (text, required)
- `date` (date, optional)
- `join_code` (text, unique, required)
- `facilitator_id` (text, required - Clerk user ID)
- `status` (enum: 'draft' | 'collecting' | 'grouped' | 'closed', default: 'draft')
- `framework` (enum: 'lewis' | 'hall' | 'hofstede' | 'combined', nullable)
- `group_size` (integer, nullable - 3, 4, or flexible)
- `created_at` (timestamp, default: now)
- `updated_at` (timestamp, default: now)

**participants**
- `id` (uuid, primary key)
- `workshop_id` (uuid, foreign key -> workshops.id)
- `name` (text, required)
- `country_code` (text, foreign key -> countries.iso_code)
- `session_token` (text, unique, required)
- `created_at` (timestamp, default: now)

**groups**
- `id` (uuid, primary key)
- `workshop_id` (uuid, foreign key -> workshops.id)
- `group_number` (integer, required)
- `created_at` (timestamp, default: now)

**group_members** (junction table)
- `group_id` (uuid, foreign key -> groups.id)
- `participant_id` (uuid, foreign key -> participants.id)
- Primary key: (group_id, participant_id)

**reflections**
- `id` (uuid, primary key)
- `participant_id` (uuid, foreign key -> participants.id, unique)
- `group_id` (uuid, foreign key -> groups.id)
- `content` (text, required)
- `submitted_at` (timestamp, default: now)

**countries**
- `iso_code` (text, primary key - ISO 3166-1 alpha-2)
- `name` (text, required)
- `created_at` (timestamp, default: now)

**lewis_scores**
- `country_code` (text, primary key, foreign key -> countries.iso_code)
- `linear_active` (numeric, range 0-1)
- `multi_active` (numeric, range 0-1)
- `reactive` (numeric, range 0-1)

**hall_scores**
- `country_code` (text, primary key, foreign key -> countries.iso_code)
- `context_high` (numeric, range 0-1)
- `time_polychronic` (numeric, range 0-1)
- `space_private` (numeric, range 0-1)

**hofstede_scores**
- `country_code` (text, primary key, foreign key -> countries.iso_code)
- `power_distance` (numeric, range 0-1)
- `individualism` (numeric, range 0-1)
- `masculinity` (numeric, range 0-1)
- `uncertainty_avoidance` (numeric, range 0-1)
- `long_term_orientation` (numeric, range 0-1)
- `indulgence` (numeric, range 0-1)

## User Flow

1. Developer provisions Neon Postgres database
2. Developer installs Drizzle ORM and Neon adapter
3. Developer creates schema definitions using Drizzle schema builder
4. Developer configures Drizzle with connection string
5. Developer generates initial migration
6. Developer applies migration to database
7. Developer runs seed migration for cultural data
8. Developer creates query utility functions

## Acceptance Criteria

- Database connection established successfully
- All schema tables created in database
- Migrations can be generated and applied
- TypeScript types are automatically generated from schema
- Connection pooling works correctly
- Transactions work as expected
- Foreign key constraints are enforced
- Unique constraints prevent duplicate data
- Cultural reference data is seeded correctly

## Edge Cases

- Database connection failures
- Migration rollback scenarios
- Concurrent migration attempts
- Missing foreign key references
- Duplicate key violations
- Transaction deadlocks
- Connection pool exhaustion

## Non-Functional Requirements

- Database queries should execute in under 100ms for simple reads
- Connection pooling should support at least 10 concurrent connections
- Migrations should be idempotent (safe to run multiple times)
- Schema changes should maintain backward compatibility where possible
- Type safety should be enforced at compile time

## Technical Implementation Details

### Key Files

- `drizzle.config.ts` - Drizzle configuration
- `src/lib/db/index.ts` - Database connection and client
- `src/lib/db/schema/workshops.ts` - Workshop schema definition
- `src/lib/db/schema/participants.ts` - Participant schema definition
- `src/lib/db/schema/groups.ts` - Group schema definitions
- `src/lib/db/schema/reflections.ts` - Reflection schema definition
- `src/lib/db/schema/countries.ts` - Country schema definitions
- `src/lib/db/schema/cultural-frameworks.ts` - Cultural framework schemas
- `src/lib/db/queries/` - Query helper functions
- `migrations/` - Database migration files

### Dependencies

- drizzle-orm@^0.29.0
- drizzle-kit@^0.20.0 (dev dependency)
- postgres@^3.4.0 (via Neon)
- @neondatabase/serverless@^0.7.0

### Schema Definition Example

```typescript
// Using Drizzle schema syntax
export const workshops = pgTable("workshops", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  date: date("date"),
  joinCode: text("join_code").notNull().unique(),
  facilitatorId: text("facilitator_id").notNull(),
  status: pgEnum("workshop_status", ["draft", "collecting", "grouped", "closed"])
    .default("draft")
    .notNull(),
  framework: pgEnum("framework", ["lewis", "hall", "hofstede", "combined"]),
  groupSize: integer("group_size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

## Migration Strategy

1. Use Drizzle Kit to generate migrations from schema changes
2. Store migrations in `migrations/` directory
3. Apply migrations via CLI or programmatically during deployment
4. Seed data migrations separate from schema migrations
5. Version control all migration files
