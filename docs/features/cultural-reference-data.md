# Feature Requirement Document: Cultural Reference Data Management

## Feature Name

Cultural Reference Data Management

## Goal

Provide standardized, read-only cultural scores for countries across three frameworks (Lewis, Hall, Hofstede) to enable consistent cultural distance calculations for participant grouping.

## User Story

As a system, I need access to standardized cultural dimension scores for each country, so that I can compute cultural distances between participants accurately and consistently.

## Functional Requirements

- Maintain canonical country list with ISO codes and names
- Store cultural dimension scores for each framework:
  - **Lewis Framework**: Linear-active, Multi-active, Reactive scores
  - **Hall Framework**: Context (High/Low), Time (Monochronic/Polychronic), Space (Private/Public) scores
  - **Hofstede Framework**: Power Distance, Individualism, Masculinity, Uncertainty Avoidance, Long-term Orientation, Indulgence scores
- All scores normalized to [0,1] range for consistent distance calculations
- Reference data is read-only at runtime (populated via seed migrations)
- Country selection component uses this data
- Support for countries with partial data (some frameworks may be missing)
- Data integrity maintained via foreign key constraints

## Data Requirements

**Countries Table**
- `iso_code` (text, primary key - ISO 3166-1 alpha-2, e.g., "US", "GB")
- `name` (text, required, e.g., "United States", "United Kingdom")
- `created_at` (timestamp, default: now)

**Lewis Scores Table**
- `country_code` (text, primary key, foreign key -> countries.iso_code)
- `linear_active` (numeric, range 0-1, required)
- `multi_active` (numeric, range 0-1, required)
- `reactive` (numeric, range 0-1, required)
- Constraint: linear_active + multi_active + reactive ≈ 1.0

**Hall Scores Table**
- `country_code` (text, primary key, foreign key -> countries.iso_code)
- `context_high` (numeric, range 0-1, required)
- `time_polychronic` (numeric, range 0-1, required)
- `space_private` (numeric, range 0-1, required)

**Hofstede Scores Table**
- `country_code` (text, primary key, foreign key -> countries.iso_code)
- `power_distance` (numeric, range 0-1, required)
- `individualism` (numeric, range 0-1, required)
- `masculinity` (numeric, range 0-1, required)
- `uncertainty_avoidance` (numeric, range 0-1, required)
- `long_term_orientation` (numeric, range 0-1, required)
- `indulgence` (numeric, range 0-1, required)

## User Flow

- Not directly user-facing; used internally by the system
- Data is seeded via migration during setup
- Accessed via queries when:
  1. Participant selects country during join
  2. Cultural distance calculations are performed
  3. Country selection dropdown is populated

## Acceptance Criteria

- All countries in the selection list have corresponding records
- Cultural scores are properly normalized to [0,1] range
- Data integrity maintained via foreign key constraints
- Queries retrieve complete cultural data efficiently
- Missing data for a country is handled gracefully (no crashes)
- Seed migration populates data correctly
- Data cannot be modified at runtime (read-only)
- Country selection component displays all available countries

## Edge Cases

- Missing cultural data for a country (handle gracefully, exclude from calculations or use defaults)
- Deprecated or renamed countries (maintain backward compatibility)
- Countries with partial framework data (some frameworks may be missing)
- Invalid country codes (validation prevents insertion)
- Data inconsistencies in source data (normalize during seed)
- Query performance with large country dataset (indexed lookups)

## Non-Functional Requirements

- Seed migration completes in reasonable time (< 30 seconds)
- Queries execute in < 50ms for single country lookup
- Data storage efficient (normalized structure)
- Country list includes at least 50+ countries with complete data
- Data updates require migration (no runtime edits)

## Technical Implementation Details

### Key Files

- `lib/db/schema/countries.ts` - Country schema definition
- `lib/db/schema/cultural-frameworks.ts` - Cultural framework schemas
- `migrations/seed-cultural-data.ts` - Seed migration script
- `lib/queries/country-queries.ts` - Query functions for countries
- `components/country-select.tsx` - Country selection component

### Dependencies

- Drizzle ORM for schema and queries
- CSV or JSON seed data files for cultural scores

### Schema Definitions

```typescript
// lib/db/schema/countries.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const countries = pgTable("countries", {
  isoCode: text("iso_code").primaryKey(), // ISO 3166-1 alpha-2
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

```typescript
// lib/db/schema/cultural-frameworks.ts
import { pgTable, text, numeric } from "drizzle-orm/pg-core";
import { countries } from "./countries";

export const lewisScores = pgTable("lewis_scores", {
  countryCode: text("country_code")
    .primaryKey()
    .references(() => countries.isoCode),
  linearActive: numeric("linear_active", { precision: 4, scale: 3 }).notNull(),
  multiActive: numeric("multi_active", { precision: 4, scale: 3 }).notNull(),
  reactive: numeric("reactive", { precision: 4, scale: 3 }).notNull(),
});

export const hallScores = pgTable("hall_scores", {
  countryCode: text("country_code")
    .primaryKey()
    .references(() => countries.isoCode),
  contextHigh: numeric("context_high", { precision: 4, scale: 3 }).notNull(),
  timePolychronic: numeric("time_polychronic", { precision: 4, scale: 3 }).notNull(),
  spacePrivate: numeric("space_private", { precision: 4, scale: 3 }).notNull(),
});

export const hofstedeScores = pgTable("hofstede_scores", {
  countryCode: text("country_code")
    .primaryKey()
    .references(() => countries.isoCode),
  powerDistance: numeric("power_distance", { precision: 4, scale: 3 }).notNull(),
  individualism: numeric("individualism", { precision: 4, scale: 3 }).notNull(),
  masculinity: numeric("masculinity", { precision: 4, scale: 3 }).notNull(),
  uncertaintyAvoidance: numeric("uncertainty_avoidance", { precision: 4, scale: 3 }).notNull(),
  longTermOrientation: numeric("long_term_orientation", { precision: 4, scale: 3 }).notNull(),
  indulgence: numeric("indulgence", { precision: 4, scale: 3 }).notNull(),
});
```

### Query Functions

```typescript
// lib/queries/country-queries.ts
import { db } from "@/lib/db";
import { countries, lewisScores, hallScores, hofstedeScores } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getAllCountries() {
  return await db.query.countries.findMany({
    orderBy: (countries, { asc }) => [asc(countries.name)],
  });
}

export async function getCountryCulturalData(countryCode: string) {
  const [lewis, hall, hofstede] = await Promise.all([
    db.query.lewisScores.findFirst({
      where: eq(lewisScores.countryCode, countryCode),
    }),
    db.query.hallScores.findFirst({
      where: eq(hallScores.countryCode, countryCode),
    }),
    db.query.hofstedeScores.findFirst({
      where: eq(hofstedeScores.countryCode, countryCode),
    }),
  ]);
  
  return { lewis, hall, hofstede };
}
```

### Seed Migration

```typescript
// migrations/seed-cultural-data.ts
import { db } from "@/lib/db";
import { countries, lewisScores, hallScores, hofstedeScores } from "@/lib/db/schema";

// Seed data structure (example)
const seedData = [
  {
    country: { isoCode: "US", name: "United States" },
    lewis: { linearActive: 0.7, multiActive: 0.2, reactive: 0.1 },
    hall: { contextHigh: 0.3, timePolychronic: 0.2, spacePrivate: 0.8 },
    hofstede: {
      powerDistance: 0.4,
      individualism: 0.91,
      masculinity: 0.62,
      uncertaintyAvoidance: 0.46,
      longTermOrientation: 0.26,
      indulgence: 0.68,
    },
  },
  // ... more countries
];

export async function seedCulturalData() {
  for (const data of seedData) {
    await db.insert(countries).values(data.country).onConflictDoNothing();
    await db.insert(lewisScores).values({
      countryCode: data.country.isoCode,
      ...data.lewis,
    }).onConflictDoNothing();
    // ... similar for hall and hofstede
  }
}
```

## Data Sources

- **Lewis Framework**: Richard D. Lewis's cultural model
- **Hall Framework**: Edward T. Hall's cultural dimensions
- **Hofstede Framework**: Geert Hofstede's cultural dimensions (6D model)
- Data should be normalized and validated before seeding

## Normalization

All scores are normalized to [0,1] range:
- Original scores may be on different scales (e.g., 0-100, 1-120)
- Normalization formula: `normalized = (value - min) / (max - min)`
- Applied during seed migration process

## Country Selection Component

The country select component should:
- Display countries alphabetically by name
- Support search/filter functionality
- Show country name with flag emoji (optional)
- Handle missing cultural data gracefully

## Data Integrity

- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate entries
- Check constraints validate score ranges (0-1)
- Cascade deletes not recommended (preserve historical data)

## Future Enhancements

- Additional cultural frameworks
- Historical cultural data (temporal changes)
- Regional/city-level cultural data
- Cultural data visualization tools
- Data update mechanisms (admin interface with migration approval)
