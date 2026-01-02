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

### Seed Scripts

#### Lewis Model Seed Script

```typescript
// migrations/seed-lewis-data.ts
import { db } from "@/lib/db";
import { countries, lewisScores } from "@/lib/db/schema";

/**
 * Normalizes Lewis scores to ensure they sum to approximately 1.0
 */
function normalizeLewisScores(
  linearActive: number,
  multiActive: number,
  reactive: number
): { linearActive: number; multiActive: number; reactive: number } {
  const sum = linearActive + multiActive + reactive;
  if (sum === 0) {
    throw new Error("All Lewis scores cannot be zero");
  }
  return {
    linearActive: Number((linearActive / sum).toFixed(3)),
    multiActive: Number((multiActive / sum).toFixed(3)),
    reactive: Number((reactive / sum).toFixed(3)),
  };
}

/**
 * Lewis Model country data
 * Scores represent relative dominance of each behavioral type
 * Based on Richard D. Lewis's research from "When Cultures Collide"
 * 
 * Data source: docs/Quantifying-Culture-data.xlsx
 * Update this array with data from the Excel file as needed
 */
const lewisData: Array<{
  isoCode: string;
  name: string;
  linearActive: number;
  multiActive: number;
  reactive: number;
}> = [
  // Linear-Active dominant countries
  { isoCode: "DE", name: "Germany", linearActive: 0.8, multiActive: 0.15, reactive: 0.05 },
  { isoCode: "CH", name: "Switzerland", linearActive: 0.85, multiActive: 0.1, reactive: 0.05 },
  { isoCode: "US", name: "United States", linearActive: 0.7, multiActive: 0.25, reactive: 0.05 },
  { isoCode: "GB", name: "United Kingdom", linearActive: 0.75, multiActive: 0.2, reactive: 0.05 },
  { isoCode: "NL", name: "Netherlands", linearActive: 0.8, multiActive: 0.15, reactive: 0.05 },
  { isoCode: "SE", name: "Sweden", linearActive: 0.75, multiActive: 0.15, reactive: 0.1 },
  { isoCode: "NO", name: "Norway", linearActive: 0.75, multiActive: 0.15, reactive: 0.1 },
  { isoCode: "DK", name: "Denmark", linearActive: 0.75, multiActive: 0.15, reactive: 0.1 },
  { isoCode: "CA", name: "Canada", linearActive: 0.7, multiActive: 0.2, reactive: 0.1 },
  { isoCode: "AU", name: "Australia", linearActive: 0.7, multiActive: 0.25, reactive: 0.05 },
  { isoCode: "NZ", name: "New Zealand", linearActive: 0.7, multiActive: 0.25, reactive: 0.05 },
  
  // Multi-Active dominant countries
  { isoCode: "IT", name: "Italy", linearActive: 0.2, multiActive: 0.7, reactive: 0.1 },
  { isoCode: "ES", name: "Spain", linearActive: 0.25, multiActive: 0.65, reactive: 0.1 },
  { isoCode: "BR", name: "Brazil", linearActive: 0.2, multiActive: 0.7, reactive: 0.1 },
  { isoCode: "MX", name: "Mexico", linearActive: 0.25, multiActive: 0.65, reactive: 0.1 },
  { isoCode: "AR", name: "Argentina", linearActive: 0.25, multiActive: 0.65, reactive: 0.1 },
  { isoCode: "FR", name: "France", linearActive: 0.4, multiActive: 0.5, reactive: 0.1 },
  { isoCode: "GR", name: "Greece", linearActive: 0.3, multiActive: 0.6, reactive: 0.1 },
  { isoCode: "PT", name: "Portugal", linearActive: 0.3, multiActive: 0.6, reactive: 0.1 },
  { isoCode: "RU", name: "Russia", linearActive: 0.35, multiActive: 0.55, reactive: 0.1 },
  { isoCode: "PL", name: "Poland", linearActive: 0.4, multiActive: 0.5, reactive: 0.1 },
  { isoCode: "TR", name: "Turkey", linearActive: 0.3, multiActive: 0.6, reactive: 0.1 },
  { isoCode: "IN", name: "India", linearActive: 0.3, multiActive: 0.6, reactive: 0.1 },
  
  // Reactive dominant countries
  { isoCode: "CN", name: "China", linearActive: 0.15, multiActive: 0.2, reactive: 0.65 },
  { isoCode: "JP", name: "Japan", linearActive: 0.2, multiActive: 0.15, reactive: 0.65 },
  { isoCode: "KR", name: "South Korea", linearActive: 0.25, multiActive: 0.2, reactive: 0.55 },
  { isoCode: "VN", name: "Vietnam", linearActive: 0.15, multiActive: 0.25, reactive: 0.6 },
  { isoCode: "TH", name: "Thailand", linearActive: 0.2, multiActive: 0.25, reactive: 0.55 },
  { isoCode: "FI", name: "Finland", linearActive: 0.4, multiActive: 0.2, reactive: 0.4 },
  { isoCode: "SG", name: "Singapore", linearActive: 0.35, multiActive: 0.25, reactive: 0.4 },
  { isoCode: "MY", name: "Malaysia", linearActive: 0.25, multiActive: 0.3, reactive: 0.45 },
  { isoCode: "ID", name: "Indonesia", linearActive: 0.2, multiActive: 0.35, reactive: 0.45 },
  { isoCode: "PH", name: "Philippines", linearActive: 0.25, multiActive: 0.4, reactive: 0.35 },
];

export async function seedLewisData() {
  console.log("Seeding Lewis Model data...");
  
  for (const country of lewisData) {
    const normalized = normalizeLewisScores(
      country.linearActive,
      country.multiActive,
      country.reactive
    );
    
    // Insert country
    await db
      .insert(countries)
      .values({
        isoCode: country.isoCode,
        name: country.name,
      })
      .onConflictDoNothing();
    
    // Insert Lewis scores
    await db
      .insert(lewisScores)
      .values({
        countryCode: country.isoCode,
        linearActive: normalized.linearActive.toString(),
        multiActive: normalized.multiActive.toString(),
        reactive: normalized.reactive.toString(),
      })
      .onConflictDoUpdate({
        set: {
          linearActive: normalized.linearActive.toString(),
          multiActive: normalized.multiActive.toString(),
          reactive: normalized.reactive.toString(),
        },
      });
  }
  
  console.log(`Seeded ${lewisData.length} countries with Lewis Model data`);
}
```

#### Hall Framework Seed Script

```typescript
// migrations/seed-hall-data.ts
import { db } from "@/lib/db";
import { countries, hallScores } from "@/lib/db/schema";

/**
 * Normalizes Hall scores to [0,1] range
 */
function normalizeHallScore(value: number, min: number, max: number): number {
  if (value < min || value > max) {
    throw new Error(`Hall score ${value} is outside valid range [${min}, ${max}]`);
  }
  return Number(((value - min) / (max - min)).toFixed(3));
}

/**
 * Hall Framework country data
 * Scores are on [0,1] scale where:
 * - context_high: 0 = low-context, 1 = high-context
 * - time_polychronic: 0 = monochronic, 1 = polychronic
 * - space_private: 0 = public space, 1 = private space
 * Based on Edward T. Hall's anthropological research
 * 
 * Data source: docs/Quantifying-Culture-data.xlsx
 * Update this array with data from the Excel file as needed
 */
const hallData: Array<{
  isoCode: string;
  name: string;
  contextHigh: number; // 0-1 scale
  timePolychronic: number; // 0-1 scale
  spacePrivate: number; // 0-1 scale
}> = [
  // Low-context, Monochronic, Private space (e.g., US, Germany)
  { isoCode: "US", name: "United States", contextHigh: 0.2, timePolychronic: 0.2, spacePrivate: 0.8 },
  { isoCode: "DE", name: "Germany", contextHigh: 0.3, timePolychronic: 0.1, spacePrivate: 0.7 },
  { isoCode: "GB", name: "United Kingdom", contextHigh: 0.3, timePolychronic: 0.2, spacePrivate: 0.75 },
  { isoCode: "CA", name: "Canada", contextHigh: 0.25, timePolychronic: 0.2, spacePrivate: 0.8 },
  { isoCode: "AU", name: "Australia", contextHigh: 0.25, timePolychronic: 0.2, spacePrivate: 0.75 },
  { isoCode: "NL", name: "Netherlands", contextHigh: 0.3, timePolychronic: 0.15, spacePrivate: 0.7 },
  { isoCode: "SE", name: "Sweden", contextHigh: 0.35, timePolychronic: 0.15, spacePrivate: 0.65 },
  { isoCode: "CH", name: "Switzerland", contextHigh: 0.3, timePolychronic: 0.1, spacePrivate: 0.75 },
  
  // High-context, Polychronic, Public space (e.g., Latin America, Middle East)
  { isoCode: "BR", name: "Brazil", contextHigh: 0.8, timePolychronic: 0.9, spacePrivate: 0.3 },
  { isoCode: "MX", name: "Mexico", contextHigh: 0.75, timePolychronic: 0.85, spacePrivate: 0.35 },
  { isoCode: "AR", name: "Argentina", contextHigh: 0.7, timePolychronic: 0.8, spacePrivate: 0.4 },
  { isoCode: "ES", name: "Spain", contextHigh: 0.65, timePolychronic: 0.7, spacePrivate: 0.5 },
  { isoCode: "IT", name: "Italy", contextHigh: 0.7, timePolychronic: 0.75, spacePrivate: 0.45 },
  { isoCode: "GR", name: "Greece", contextHigh: 0.7, timePolychronic: 0.8, spacePrivate: 0.4 },
  { isoCode: "TR", name: "Turkey", contextHigh: 0.75, timePolychronic: 0.8, spacePrivate: 0.4 },
  { isoCode: "IN", name: "India", contextHigh: 0.8, timePolychronic: 0.85, spacePrivate: 0.3 },
  
  // High-context, Monochronic, Mixed space (e.g., Japan, China)
  { isoCode: "JP", name: "Japan", contextHigh: 0.9, timePolychronic: 0.2, spacePrivate: 0.6 },
  { isoCode: "CN", name: "China", contextHigh: 0.85, timePolychronic: 0.3, spacePrivate: 0.5 },
  { isoCode: "KR", name: "South Korea", contextHigh: 0.85, timePolychronic: 0.25, spacePrivate: 0.55 },
  { isoCode: "VN", name: "Vietnam", contextHigh: 0.8, timePolychronic: 0.4, spacePrivate: 0.4 },
  { isoCode: "TH", name: "Thailand", contextHigh: 0.8, timePolychronic: 0.5, spacePrivate: 0.35 },
  { isoCode: "SG", name: "Singapore", contextHigh: 0.7, timePolychronic: 0.4, spacePrivate: 0.6 },
  { isoCode: "MY", name: "Malaysia", contextHigh: 0.75, timePolychronic: 0.6, spacePrivate: 0.4 },
  { isoCode: "ID", name: "Indonesia", contextHigh: 0.8, timePolychronic: 0.7, spacePrivate: 0.3 },
  { isoCode: "PH", name: "Philippines", contextHigh: 0.75, timePolychronic: 0.75, spacePrivate: 0.35 },
  
  // Mixed patterns
  { isoCode: "FR", name: "France", contextHigh: 0.6, timePolychronic: 0.5, spacePrivate: 0.6 },
  { isoCode: "RU", name: "Russia", contextHigh: 0.7, timePolychronic: 0.6, spacePrivate: 0.5 },
  { isoCode: "PL", name: "Poland", contextHigh: 0.6, timePolychronic: 0.5, spacePrivate: 0.6 },
  { isoCode: "PT", name: "Portugal", contextHigh: 0.65, timePolychronic: 0.7, spacePrivate: 0.45 },
  { isoCode: "FI", name: "Finland", contextHigh: 0.5, timePolychronic: 0.2, spacePrivate: 0.7 },
  { isoCode: "NO", name: "Norway", contextHigh: 0.4, timePolychronic: 0.2, spacePrivate: 0.7 },
  { isoCode: "DK", name: "Denmark", contextHigh: 0.4, timePolychronic: 0.2, spacePrivate: 0.7 },
  { isoCode: "NZ", name: "New Zealand", contextHigh: 0.3, timePolychronic: 0.25, spacePrivate: 0.75 },
];

export async function seedHallData() {
  console.log("Seeding Hall Framework data...");
  
  for (const country of hallData) {
    // Validate scores are in [0,1] range
    if (
      country.contextHigh < 0 || country.contextHigh > 1 ||
      country.timePolychronic < 0 || country.timePolychronic > 1 ||
      country.spacePrivate < 0 || country.spacePrivate > 1
    ) {
      throw new Error(`Invalid Hall scores for ${country.name}: scores must be in [0,1] range`);
    }
    
    // Insert country
    await db
      .insert(countries)
      .values({
        isoCode: country.isoCode,
        name: country.name,
      })
      .onConflictDoNothing();
    
    // Insert Hall scores
    await db
      .insert(hallScores)
      .values({
        countryCode: country.isoCode,
        contextHigh: country.contextHigh.toString(),
        timePolychronic: country.timePolychronic.toString(),
        spacePrivate: country.spacePrivate.toString(),
      })
      .onConflictDoUpdate({
        set: {
          contextHigh: country.contextHigh.toString(),
          timePolychronic: country.timePolychronic.toString(),
          spacePrivate: country.spacePrivate.toString(),
        },
      });
  }
  
  console.log(`Seeded ${hallData.length} countries with Hall Framework data`);
}
```

#### Hofstede Framework Seed Script

```typescript
// migrations/seed-hofstede-data.ts
import { db } from "@/lib/db";
import { countries, hofstedeScores } from "@/lib/db/schema";

/**
 * Normalizes Hofstede scores from 0-100 scale to [0,1] range
 */
function normalizeHofstedeScore(value: number): number {
  if (value < 0 || value > 100) {
    throw new Error(`Hofstede score ${value} is outside valid range [0, 100]`);
  }
  return Number((value / 100).toFixed(3));
}

/**
 * Hofstede Framework country data
 * Original scores are on 0-100 scale, normalized to [0,1] for storage
 * 
 * Data source: docs/Quantifying-Culture-data.xlsx
 * Update this array with data from the Excel file as needed
 * 
 * Alternative reference: https://www.theculturefactor.com/country-comparison-tool
 */
const hofstedeData: Array<{
  isoCode: string;
  name: string;
  powerDistance: number; // 0-100 scale (will be normalized)
  individualism: number; // 0-100 scale
  masculinity: number; // 0-100 scale
  uncertaintyAvoidance: number; // 0-100 scale
  longTermOrientation: number; // 0-100 scale
  indulgence: number; // 0-100 scale
}> = [
  // United States
  { isoCode: "US", name: "United States", powerDistance: 40, individualism: 91, masculinity: 62, uncertaintyAvoidance: 46, longTermOrientation: 26, indulgence: 68 },
  // Germany
  { isoCode: "DE", name: "Germany", powerDistance: 35, individualism: 67, masculinity: 66, uncertaintyAvoidance: 65, longTermOrientation: 83, indulgence: 40 },
  // United Kingdom
  { isoCode: "GB", name: "United Kingdom", powerDistance: 35, individualism: 89, masculinity: 66, uncertaintyAvoidance: 35, longTermOrientation: 51, indulgence: 69 },
  // Japan
  { isoCode: "JP", name: "Japan", powerDistance: 54, individualism: 46, masculinity: 95, uncertaintyAvoidance: 92, longTermOrientation: 88, indulgence: 42 },
  // China
  { isoCode: "CN", name: "China", powerDistance: 80, individualism: 20, masculinity: 66, uncertaintyAvoidance: 30, longTermOrientation: 87, indulgence: 24 },
  // France
  { isoCode: "FR", name: "France", powerDistance: 68, individualism: 71, masculinity: 43, uncertaintyAvoidance: 86, longTermOrientation: 63, indulgence: 48 },
  // Italy
  { isoCode: "IT", name: "Italy", powerDistance: 50, individualism: 76, masculinity: 70, uncertaintyAvoidance: 75, longTermOrientation: 61, indulgence: 30 },
  // Spain
  { isoCode: "ES", name: "Spain", powerDistance: 57, individualism: 51, masculinity: 42, uncertaintyAvoidance: 86, longTermOrientation: 48, indulgence: 44 },
  // Brazil
  { isoCode: "BR", name: "Brazil", powerDistance: 69, individualism: 38, masculinity: 49, uncertaintyAvoidance: 76, longTermOrientation: 44, indulgence: 59 },
  // Mexico
  { isoCode: "MX", name: "Mexico", powerDistance: 81, individualism: 30, masculinity: 69, uncertaintyAvoidance: 82, longTermOrientation: 24, indulgence: 97 },
  // India
  { isoCode: "IN", name: "India", powerDistance: 77, individualism: 48, masculinity: 56, uncertaintyAvoidance: 40, longTermOrientation: 51, indulgence: 26 },
  // South Korea
  { isoCode: "KR", name: "South Korea", powerDistance: 60, individualism: 18, masculinity: 39, uncertaintyAvoidance: 85, longTermOrientation: 100, indulgence: 29 },
  // Netherlands
  { isoCode: "NL", name: "Netherlands", powerDistance: 38, individualism: 80, masculinity: 14, uncertaintyAvoidance: 53, longTermOrientation: 67, indulgence: 68 },
  // Sweden
  { isoCode: "SE", name: "Sweden", powerDistance: 31, individualism: 71, masculinity: 5, uncertaintyAvoidance: 29, longTermOrientation: 53, indulgence: 78 },
  // Canada
  { isoCode: "CA", name: "Canada", powerDistance: 39, individualism: 80, masculinity: 52, uncertaintyAvoidance: 48, longTermOrientation: 36, indulgence: 68 },
  // Australia
  { isoCode: "AU", name: "Australia", powerDistance: 38, individualism: 90, masculinity: 61, uncertaintyAvoidance: 51, longTermOrientation: 21, indulgence: 71 },
  // Switzerland
  { isoCode: "CH", name: "Switzerland", powerDistance: 34, individualism: 68, masculinity: 70, uncertaintyAvoidance: 58, longTermOrientation: 74, indulgence: 66 },
  // Russia
  { isoCode: "RU", name: "Russia", powerDistance: 93, individualism: 39, masculinity: 36, uncertaintyAvoidance: 95, longTermOrientation: 81, indulgence: 20 },
  // Turkey
  { isoCode: "TR", name: "Turkey", powerDistance: 66, individualism: 37, masculinity: 45, uncertaintyAvoidance: 85, longTermOrientation: 46, indulgence: 49 },
  // Argentina
  { isoCode: "AR", name: "Argentina", powerDistance: 49, individualism: 46, masculinity: 56, uncertaintyAvoidance: 86, longTermOrientation: 20, indulgence: 62 },
  // Poland
  { isoCode: "PL", name: "Poland", powerDistance: 68, individualism: 60, masculinity: 64, uncertaintyAvoidance: 93, longTermOrientation: 38, indulgence: 29 },
  // Greece
  { isoCode: "GR", name: "Greece", powerDistance: 60, individualism: 35, masculinity: 57, uncertaintyAvoidance: 100, longTermOrientation: 45, indulgence: 50 },
  // Portugal
  { isoCode: "PT", name: "Portugal", powerDistance: 63, individualism: 27, masculinity: 31, uncertaintyAvoidance: 99, longTermOrientation: 28, indulgence: 33 },
  // Vietnam
  { isoCode: "VN", name: "Vietnam", powerDistance: 70, individualism: 20, masculinity: 40, uncertaintyAvoidance: 30, longTermOrientation: 57, indulgence: 35 },
  // Thailand
  { isoCode: "TH", name: "Thailand", powerDistance: 64, individualism: 20, masculinity: 34, uncertaintyAvoidance: 64, longTermOrientation: 32, indulgence: 45 },
  // Singapore
  { isoCode: "SG", name: "Singapore", powerDistance: 74, individualism: 20, masculinity: 48, uncertaintyAvoidance: 8, longTermOrientation: 72, indulgence: 46 },
  // Malaysia
  { isoCode: "MY", name: "Malaysia", powerDistance: 100, individualism: 26, masculinity: 50, uncertaintyAvoidance: 36, longTermOrientation: 41, indulgence: 57 },
  // Indonesia
  { isoCode: "ID", name: "Indonesia", powerDistance: 78, individualism: 14, masculinity: 46, uncertaintyAvoidance: 48, longTermOrientation: 62, indulgence: 38 },
  // Philippines
  { isoCode: "PH", name: "Philippines", powerDistance: 94, individualism: 32, masculinity: 64, uncertaintyAvoidance: 44, longTermOrientation: 27, indulgence: 42 },
  // Finland
  { isoCode: "FI", name: "Finland", powerDistance: 33, individualism: 63, masculinity: 26, uncertaintyAvoidance: 59, longTermOrientation: 38, indulgence: 57 },
  // Norway
  { isoCode: "NO", name: "Norway", powerDistance: 31, individualism: 69, masculinity: 8, uncertaintyAvoidance: 50, longTermOrientation: 35, indulgence: 55 },
  // Denmark
  { isoCode: "DK", name: "Denmark", powerDistance: 18, individualism: 74, masculinity: 16, uncertaintyAvoidance: 23, longTermOrientation: 35, indulgence: 70 },
  // New Zealand
  { isoCode: "NZ", name: "New Zealand", powerDistance: 22, individualism: 79, masculinity: 58, uncertaintyAvoidance: 49, longTermOrientation: 33, indulgence: 75 },
];

export async function seedHofstedeData() {
  console.log("Seeding Hofstede Framework data...");
  
  for (const country of hofstedeData) {
    // Normalize scores from 0-100 to [0,1]
    const normalized = {
      powerDistance: normalizeHofstedeScore(country.powerDistance),
      individualism: normalizeHofstedeScore(country.individualism),
      masculinity: normalizeHofstedeScore(country.masculinity),
      uncertaintyAvoidance: normalizeHofstedeScore(country.uncertaintyAvoidance),
      longTermOrientation: normalizeHofstedeScore(country.longTermOrientation),
      indulgence: normalizeHofstedeScore(country.indulgence),
    };
    
    // Insert country
    await db
      .insert(countries)
      .values({
        isoCode: country.isoCode,
        name: country.name,
      })
      .onConflictDoNothing();
    
    // Insert Hofstede scores
    await db
      .insert(hofstedeScores)
      .values({
        countryCode: country.isoCode,
        powerDistance: normalized.powerDistance.toString(),
        individualism: normalized.individualism.toString(),
        masculinity: normalized.masculinity.toString(),
        uncertaintyAvoidance: normalized.uncertaintyAvoidance.toString(),
        longTermOrientation: normalized.longTermOrientation.toString(),
        indulgence: normalized.indulgence.toString(),
      })
      .onConflictDoUpdate({
        set: {
          powerDistance: normalized.powerDistance.toString(),
          individualism: normalized.individualism.toString(),
          masculinity: normalized.masculinity.toString(),
          uncertaintyAvoidance: normalized.uncertaintyAvoidance.toString(),
          longTermOrientation: normalized.longTermOrientation.toString(),
          indulgence: normalized.indulgence.toString(),
        },
      });
  }
  
  console.log(`Seeded ${hofstedeData.length} countries with Hofstede Framework data`);
}
```

#### Combined Seed Script

```typescript
// migrations/seed-cultural-data.ts
import { db } from "@/lib/db";
import { seedLewisData } from "./seed-lewis-data";
import { seedHallData } from "./seed-hall-data";
import { seedHofstedeData } from "./seed-hofstede-data";

/**
 * Main seed function that loads all cultural framework data
 * Uses database transactions to ensure atomicity
 * Safe to run multiple times (idempotent)
 * 
 * Data is loaded from the seed scripts below, which should be updated
 * with data from docs/Quantifying-Culture-data.xlsx
 */
export async function seedCulturalData() {
  console.log("Starting cultural data seeding...");
  
  try {
    // Run all seed functions in sequence
    // Each function handles its own transactions and conflict resolution
    await seedLewisData();
    await seedHallData();
    await seedHofstedeData();
    
    console.log("Cultural data seeding completed successfully");
  } catch (error) {
    console.error("Error seeding cultural data:", error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedCulturalData()
    .then(() => {
      console.log("Seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
```

## Framework Details

### Lewis Model

The Lewis Model was developed by linguist and cross-cultural specialist Richard D. Lewis, published in "When Cultures Collide: Leading Across Cultures" (1996). It is based on data from 135 countries, 50,000 executives, and 150,000+ questionnaires across 68 nationalities.

**Three Cultural Types:**

1. **Linear-Active**
   - Task-oriented, highly-organized planners
   - Characteristics: Talks half the time, does one thing at a time, plans ahead step by step, polite but direct, partly conceals feelings, confronts with logic, dislikes losing face, rarely interrupts, job-oriented, uses many facts, truth before diplomacy, sometimes impatient, limited body language, respects officialdom, separates the social and professional
   - Examples: Germany, Switzerland, United States, United Kingdom, Netherlands

2. **Multi-Active**
   - Emotional, loquacious, and impulsive
   - Characteristics: Talks most of the time, does several things at once, plans grand outline only, emotional, displays feelings, confronts emotionally, has good excuses, often interrupts, people-oriented, feelings before facts, flexible truth, impatient, unlimited body language, seeks out key person, interweaves the social and professional
   - Examples: Italy, Spain, Latin America, Middle East, Africa

3. **Reactive**
   - Polite, attentive listeners
   - Characteristics: Listens most of the time, reacts to partner's action, looks at general principles, polite and indirect, conceals feelings, never confronts, must not lose face, doesn't interrupt, very people-oriented, statements are promises, diplomacy over truth, patient, subtle body language, uses connections, connects the social and professional
   - Examples: China, Japan, Vietnam, Thailand, Finland

**Data Structure**: Each country has three scores (linear_active, multi_active, reactive) that represent proportions and should sum to approximately 1.0. These scores indicate the relative dominance of each behavioral type within a culture.

### Hall's Cultural Factors

Edward T. Hall's framework identifies three key dimensions of cultural communication and behavior patterns.

**Three Dimensions:**

1. **Context (High vs Low)**
   - **High-context**: Many covert/implicit messages, strong ingroup/outgroup distinction, information is embedded in context, relationships matter more than words
   - **Low-context**: Overt/explicit messages, flexible grouping patterns, information is explicit and direct, words matter more than context
   - Score: `context_high` (0 = low-context, 1 = high-context)

2. **Time (Monochronic vs Polychronic)**
   - **Monochronic**: One thing at a time, time is linear and sequential, punctuality is important, schedules are rigid
   - **Polychronic**: Many things at once, time is flexible and fluid, relationships matter more than schedules, multitasking is common
   - Score: `time_polychronic` (0 = monochronic, 1 = polychronic)

3. **Space (Private vs Public)**
   - **Private**: Personal space is important, territorial boundaries are clear, privacy is valued, physical distance is maintained
   - **Public**: Shared space is common, less territorial, more physical closeness, boundaries are flexible
   - Score: `space_private` (0 = public space orientation, 1 = private space orientation)

**Data Structure**: Each country has three scores in [0,1] range representing position on each dimension.

### Hofstede Framework

Geert Hofstede's cultural dimensions theory identifies six dimensions for comparing national cultures. Scores are typically on a 0-100 scale and must be normalized to [0,1] for database storage.

**Six Dimensions:**

1. **Power Distance Index (PDI)**
   - Degree to which less powerful members of a society accept and expect that power is distributed unequally
   - Low PDI: Egalitarian, power is shared
   - High PDI: Hierarchical, power is concentrated

2. **Individualism vs Collectivism (IDV)**
   - Extent to which individuals are integrated into groups
   - Low IDV (Collectivist): Group loyalty, harmony, interdependence
   - High IDV (Individualist): Personal achievement, independence, self-reliance

3. **Masculinity vs Femininity (MAS)**
   - Distribution of emotional roles between genders
   - Low MAS (Feminine): Cooperation, modesty, quality of life
   - High MAS (Masculine): Competition, achievement, material success

4. **Uncertainty Avoidance Index (UAI)**
   - Society's tolerance for uncertainty and ambiguity
   - Low UAI: Comfortable with ambiguity, flexible, risk-taking
   - High UAI: Need for rules, structure, risk-averse

5. **Long-term Orientation vs Short-term (LTO)**
   - Focus on future rewards versus past and present
   - Low LTO (Short-term): Tradition, quick results, respect for history
   - High LTO (Long-term): Persistence, thrift, adaptation

6. **Indulgence vs Restraint (IVR)**
   - Gratification of basic human desires related to enjoying life
   - Low IVR (Restraint): Suppression of gratification, strict social norms
   - High IVR (Indulgence): Freedom of expression, leisure time, optimism

**Data Structure**: Each country has six scores, originally on 0-100 scale, normalized to [0,1] range.

**Data Source**: Country comparison data available at https://www.theculturefactor.com/country-comparison-tool (may require manual extraction or API access)

## Data Sources

- **Lewis Framework**: Richard D. Lewis's cultural model from "When Cultures Collide" (1996), based on research across 135 countries
- **Hall Framework**: Edward T. Hall's anthropological research on cultural communication patterns
- **Hofstede Framework**: Geert Hofstede's cultural dimensions (6D model), data available via theculturefactor.com country comparison tool
- Data should be normalized and validated before seeding

## Data Extraction and Loading

### Running Seed Scripts

The seed scripts can be run individually or together:

```bash
# Run individual framework seeds
npx tsx migrations/seed-lewis-data.ts
npx tsx migrations/seed-hall-data.ts
npx tsx migrations/seed-hofstede-data.ts

# Run all frameworks together
npx tsx migrations/seed-cultural-data.ts
```

### Data Source Reference

The seed scripts below contain country data extracted from `Quantifying-Culture-data.xlsx`. The Excel file serves as the reference source for:
- Country list with ISO codes and names
- Lewis Model scores (Linear-Active, Multi-Active, Reactive)
- Hall Framework scores (Context, Time, Space)
- Hofstede Framework scores (all six dimensions)

To update the seed data, manually copy values from the Excel file into the appropriate seed script data arrays.

### Data Extraction Instructions

#### Using Excel File as Primary Source

1. **Extract from Excel**: Use the import utility above or manually convert Excel sheets to CSV
2. **Validate Data**: Ensure all scores are in correct ranges and formats
3. **Update Seed Scripts**: Replace or merge data arrays in seed scripts with Excel data
4. **Run Seed**: Execute seed scripts to load data into database

#### Lewis Model Data

Lewis Model data is based on Richard D. Lewis's research. To add more countries:

1. Reference "When Cultures Collide" (1996) or Lewis's cultural classification charts
2. Determine the dominant behavioral type (Linear-Active, Multi-Active, or Reactive)
3. Assign proportional scores that sum to approximately 1.0
4. Countries may exhibit mixed characteristics; scores should reflect relative dominance

**Example Classification:**
- Linear-Active dominant: Germany (0.8, 0.15, 0.05)
- Multi-Active dominant: Italy (0.2, 0.7, 0.1)
- Reactive dominant: Japan (0.2, 0.15, 0.65)

#### Updating Seed Data

To update the seed scripts with data from `Quantifying-Culture-data.xlsx`:

1. Open the Excel file and locate the relevant sheet (Lewis, Hall, or Hofstede)
2. Copy the country data (ISO codes, names, and scores)
3. Update the corresponding data array in the seed script
4. Ensure data format matches the expected structure (see seed scripts below)
5. Run the seed script to load data into the database

### Adding New Countries

To add a new country to any framework:

1. Obtain cultural scores from authoritative sources
2. Add country entry to the appropriate seed data array
3. Ensure scores are in the correct format and range
4. Run the seed script to load the data
5. Verify data integrity (sums, ranges, foreign key constraints)

### Data Validation

All seed scripts include validation:

- **Lewis Model**: Ensures scores sum to ~1.0 (normalized)
- **Hall Framework**: Validates scores are in [0,1] range
- **Hofstede Framework**: Validates scores are in [0,100] range before normalization

## Normalization

All scores are normalized to [0,1] range:
- **Lewis Model**: Scores are proportions that sum to 1.0 (normalized if needed)
- **Hall Framework**: Scores are already on [0,1] scale
- **Hofstede Framework**: Original scores (0-100) are normalized using formula: `normalized = value / 100`
- Normalization is applied during seed migration process

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
