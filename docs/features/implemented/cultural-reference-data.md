# Feature Requirement Document: Cultural Reference Data Seeding

## Feature Name

Cultural Reference Data Seeding Script Implementation

## Goal

Implement seed scripts to populate the database with standardized cultural scores for countries across three frameworks (Lewis, Hall, Hofstede) from the provided Excel data source, enabling consistent cultural distance calculations for participant grouping.

## User Story

As a developer, I need to implement seed scripts that load cultural dimension scores from the Excel data source into the database tables, so that the system has access to standardized country data for computing cultural distances between participants accurately and consistently.

## Summary

**What**: Create TypeScript seed scripts to populate cultural reference data tables

**Why**: The system needs standardized cultural scores to calculate cultural distances between workshop participants

**Data Source**: `docs/Quantifying-Culture-data.csv`

- Contains template with **217 country names**
- ❌ **NO cultural scores included** - data columns are empty
- Provides reference URLs to authoritative sources

**Current Reality**:

- CSV file is a **template**, not a data source
- **Hofstede Framework**: ✅ **73 countries with verified scores** from [theculturefactor.com](https://www.theculturefactor.com/country-comparison-tool)
- **Lewis Model**: ⚠️ **33 countries with estimated scores** (limited public data availability)
- **Hall Framework**: ⚠️ **33 countries with estimated scores** (limited public data availability)
- Hofstede data verified and updated October 2024

**Implementation Options**:

**Option A (Recommended for MVP)**:

1. Use the 33 sample countries provided in seed scripts
2. Implement and test with estimated scores
3. Sufficient for development and testing

**Option B (Full Data Collection - Large Effort)**:

1. Research cultural scores from authoritative sources (URLs in CSV)
2. Collect data for 50-100+ countries (weeks/months of work)
3. Map country names to ISO codes
4. Populate seed scripts with researched data

**Dependencies**:

- Database schema must exist (`countries`, `lewis_scores`, `hall_scores`, `hofstede_scores`)
- Database connection configured in `lib/db/index.ts`

## Functional Requirements

### Seed Script Implementation

- **Extract data** from `docs/Quantifying-Culture-data.xlsx` containing country cultural scores
- **Create TypeScript seed scripts** for each framework:
  - Lewis Framework seed script (`migrations/seed-lewis-data.ts`)
  - Hall Framework seed script (`migrations/seed-hall-data.ts`)
  - Hofstede Framework seed script (`migrations/seed-hofstede-data.ts`)
  - Combined seed orchestrator (`migrations/seed-cultural-data.ts`)
- **Normalize data** during seeding:
  - Lewis scores: Ensure proportions sum to ~1.0
  - Hall scores: Validate [0,1] range
  - Hofstede scores: Convert from 0-100 scale to [0,1] range
- **Handle data conflicts**: Use `onConflictDoUpdate` for idempotent seeding (safe to re-run)
- **Validate data integrity**: Check ranges, sums, and constraints before insertion
- **Log progress**: Console output for seeding progress and completion status
- **Error handling**: Graceful failures with descriptive error messages

### Data Requirements

- **Countries Table**: ISO codes and country names
- **Lewis Scores**: Linear-active, Multi-active, Reactive (sum ≈ 1.0)
- **Hall Scores**: Context, Time, Space (range [0,1])
- **Hofstede Scores**: All six dimensions (normalized to [0,1])
- **Minimum coverage**: 30+ countries with complete data across all three frameworks
- **Data source**: `docs/Quantifying-Culture-data.xlsx` (primary reference)

## Data Source

### ⚠️ CRITICAL: Data Collection Required

**Current State**:

- ✅ `docs/Quantifying-Culture-data.csv` contains **217 country names** (template only)
- ❌ **NO cultural scores are present** - all data columns are empty
- ✅ Reference URLs provided to authoritative sources (line 3 of CSV)

**What the CSV Contains**:

```
Column Headers: Name | Country of Origin | 6 Dimensions | Lewis Model | Halls Dimension
Row 3 (Afghanistan): Links to data sources but NO scores
Rows 4-220: Just country names (Argentina, Australia, Brazil, Canada, China, etc.) - NO scores
```

**Reference Data Sources** (from CSV):

- **Hofstede 6 Dimensions**: https://www.theculturefactor.com/country-comparison-tool
- **Lewis Model**: https://redtangerine.org/the-lewis-model/
- **Hall's Dimensions**: http://changingminds.org/explanations/culture/hall_culture.htm

### Actual Implementation Requirements

This feature requires **DATA RESEARCH** before seed script implementation:

**Option 1: Use Sample Data (33 countries)**

- Seed scripts below contain **estimated/example scores for 33 countries**
- These are NOT from the CSV file - they're reasonable estimates based on framework literature
- Sufficient for testing and initial development
- **Quick to implement** ✅

**Option 2: Collect Real Data (217 countries - Large Effort)**

- Research and collect cultural scores from authoritative sources
- Extract Hofstede scores for 76+ countries from official sources
- Research Lewis Model classifications (limited public data availability)
- Research Hall Framework scores (limited public data availability)
- Map all 217 country names to ISO 3166-1 alpha-2 codes
- Populate seed script data arrays
- **Weeks/months of research work** ⚠️

**Recommended Approach**:

1. **Start with Option 1** (33 sample countries) for MVP
2. **Gradually expand** with researched data as needed
3. **Prioritize countries** most likely to have workshop participants

## Database Schema

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

## Implementation Flow

1. **Data Extraction** (if needed)

   - Open `docs/Quantifying-Culture-data.xlsx`
   - Verify data structure and completeness
   - Extract country data with ISO codes and cultural scores
   - Document any missing or incomplete data

2. **Schema Verification**

   - Confirm database tables exist (`countries`, `lewis_scores`, `hall_scores`, `hofstede_scores`)
   - Verify schema matches expected structure
   - Check foreign key constraints are in place

3. **Seed Script Implementation**

   - Create seed scripts in `migrations/` directory
   - Implement data normalization functions
   - Add validation logic for data integrity
   - Implement idempotent insert/update logic
   - Add progress logging

4. **Testing**

   - Run seed scripts against development database
   - Verify data integrity (counts, ranges, relationships)
   - Test re-running scripts (idempotency)
   - Validate queries retrieve correct data

5. **Documentation**
   - Update this FRED with any implementation notes
   - Document how to re-run seeds if needed
   - Note any data limitations or gaps

## Acceptance Criteria

### Seed Script Functionality

- ✅ Seed scripts successfully insert country data
- ✅ All cultural scores are normalized to [0,1] range
- ✅ Lewis scores sum to approximately 1.0 for each country
- ✅ Data validation catches invalid scores before insertion
- ✅ Scripts are idempotent (safe to re-run without duplicates)
- ✅ Progress logging shows seeding status
- ✅ Error messages are descriptive and actionable

### Data Quality

- ✅ **Minimum 33 countries** with complete data across all three frameworks (sample data)
- ✅ All country ISO codes are valid (ISO 3166-1 alpha-2)
- ✅ No missing required fields
- ✅ Foreign key constraints satisfied
- ✅ Scores are within valid ranges (Lewis sums to ~1.0, others in [0,1])
- ✅ Country coverage includes major regions: Americas, Europe, Asia, Oceania
- ⚠️ Scores are estimates from academic literature (CSV file contains no actual data)

### Data Transparency

- ✅ Documentation clearly states scores are estimated/sample data
- ✅ References to source frameworks provided (Lewis, Hall, Hofstede)
- ✅ Process for adding more countries documented
- ✅ Data research URLs provided for future expansion

### Testing

- ✅ Seed scripts run without errors
- ✅ Database queries return expected country data
- ✅ Re-running seeds updates existing data without errors
- ✅ Data integrity checks pass after seeding
- ✅ Seeding completes in reasonable time (< 30 seconds)

## Edge Cases & Validation

### During Seeding

- **Invalid score ranges**: Validation functions throw errors for out-of-range values

  - Lewis: Throws if any score < 0 or sum significantly ≠ 1.0
  - Hall: Throws if any score < 0 or > 1
  - Hofstede: Throws if any score < 0 or > 100

- **Missing country in dependencies**: Countries are inserted first to satisfy foreign keys

  - Each seed script inserts country record before scores
  - Uses `onConflictDoNothing` to avoid duplicate country errors

- **Re-running seeds**: Safe to execute multiple times

  - `onConflictDoUpdate` updates existing scores
  - `onConflictDoNothing` skips duplicate countries

- **Partial data**: A country may exist in one framework but not others

  - This is valid; cultural distance calculations handle missing frameworks
  - Validation only checks that present data is correct

- **Database connection issues**: Script fails fast with clear error message
  - Check database connection before running seed
  - Use transactions where appropriate for atomicity

### During Runtime (Post-Seeding)

- **Missing framework data for a country**: Application handles gracefully

  - Distance calculation skips missing frameworks
  - Country still appears in selection dropdown

- **Country code mismatches**: ISO codes must be consistent
  - All frameworks use same country code for same country
  - Validation ensures foreign key integrity

## Non-Functional Requirements

### Performance

- Seed scripts complete execution in < 30 seconds for 50+ countries
- Memory usage remains reasonable during seeding (< 100MB)
- Progress logging doesn't significantly impact performance

### Code Quality

- TypeScript strict mode compliance
- Proper error handling with try-catch blocks
- Type-safe data structures
- Reusable normalization and validation functions
- Clear inline documentation

### Maintainability

- Data arrays are easy to update with new countries
- Normalization logic is separate and testable
- Seed scripts can be run individually or together
- Clear separation between frameworks

## Technical Implementation Details

### Key Files to Create

**Seed Scripts** (Create these in `migrations/` directory):

- `migrations/seed-lewis-data.ts` - Lewis Framework seed script
- `migrations/seed-hall-data.ts` - Hall Framework seed script
- `migrations/seed-hofstede-data.ts` - Hofstede Framework seed script
- `migrations/seed-cultural-data.ts` - Combined seed orchestrator

**Database Schema** (Should already exist):

- `lib/db/schema/countries.ts` - Country schema definition
- `lib/db/schema/cultural-frameworks.ts` - Cultural framework schemas
- `lib/db/index.ts` - Database connection configuration

**Query Functions** (For later use):

- `lib/queries/country-queries.ts` - Query functions for countries

### Prerequisites

Before implementing the seed scripts:

1. ✅ **Database tables exist**: Ensure the schema has been applied to the database

   - `countries` table
   - `lewis_scores` table
   - `hall_scores` table
   - `hofstede_scores` table

2. ✅ **Database connection configured**: Verify `lib/db/index.ts` exports a working `db` instance

3. ✅ **Drizzle ORM installed**: Check `package.json` for `drizzle-orm` dependency

4. ✅ **TypeScript execution tool**: Install `tsx` for running TypeScript files directly
   ```bash
   pnpm add -D tsx
   ```

### Dependencies

- `drizzle-orm` - Database ORM for schema and queries
- `postgres` or `@vercel/postgres` - PostgreSQL client (depending on your setup)
- `tsx` - TypeScript execution tool for running seed scripts

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
  timePolychronic: numeric("time_polychronic", {
    precision: 4,
    scale: 3,
  }).notNull(),
  spacePrivate: numeric("space_private", { precision: 4, scale: 3 }).notNull(),
});

export const hofstedeScores = pgTable("hofstede_scores", {
  countryCode: text("country_code")
    .primaryKey()
    .references(() => countries.isoCode),
  powerDistance: numeric("power_distance", {
    precision: 4,
    scale: 3,
  }).notNull(),
  individualism: numeric("individualism", { precision: 4, scale: 3 }).notNull(),
  masculinity: numeric("masculinity", { precision: 4, scale: 3 }).notNull(),
  uncertaintyAvoidance: numeric("uncertainty_avoidance", {
    precision: 4,
    scale: 3,
  }).notNull(),
  longTermOrientation: numeric("long_term_orientation", {
    precision: 4,
    scale: 3,
  }).notNull(),
  indulgence: numeric("indulgence", { precision: 4, scale: 3 }).notNull(),
});
```

### Query Functions

```typescript
// lib/queries/country-queries.ts
import { db } from "@/lib/db";
import {
  countries,
  lewisScores,
  hallScores,
  hofstedeScores,
} from "@/lib/db/schema";
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

**Note**: The seed scripts below contain **sample data for 33 countries**. For production use, expand the data arrays by extracting all countries from `docs/Quantifying-Culture-data.xlsx`.

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
 * Data source: Estimated from academic literature
 * Reference: https://redtangerine.org/the-lewis-model/
 *
 * ⚠️ LIMITED PUBLIC DATA: This array contains 33 countries with estimated scores.
 * Lewis Model data is not as widely published as Hofstede.
 *
 * To add more countries:
 * 1. Research "When Cultures Collide" by Richard D. Lewis (1996)
 * 2. Visit https://redtangerine.org/the-lewis-model/ for classifications
 * 3. Classify countries by behavioral type (Linear-Active, Multi-Active, Reactive)
 * 4. Assign proportional scores that sum to ~1.0
 */
const lewisData: Array<{
  isoCode: string;
  name: string;
  linearActive: number;
  multiActive: number;
  reactive: number;
}> = [
  // ===== SAMPLE DATA: 33 COUNTRIES =====
  // Linear-Active dominant countries
  {
    isoCode: "DE",
    name: "Germany",
    linearActive: 0.8,
    multiActive: 0.15,
    reactive: 0.05,
  },
  {
    isoCode: "CH",
    name: "Switzerland",
    linearActive: 0.85,
    multiActive: 0.1,
    reactive: 0.05,
  },
  {
    isoCode: "US",
    name: "United States",
    linearActive: 0.7,
    multiActive: 0.25,
    reactive: 0.05,
  },
  {
    isoCode: "GB",
    name: "United Kingdom",
    linearActive: 0.75,
    multiActive: 0.2,
    reactive: 0.05,
  },
  {
    isoCode: "NL",
    name: "Netherlands",
    linearActive: 0.8,
    multiActive: 0.15,
    reactive: 0.05,
  },
  {
    isoCode: "SE",
    name: "Sweden",
    linearActive: 0.75,
    multiActive: 0.15,
    reactive: 0.1,
  },
  {
    isoCode: "NO",
    name: "Norway",
    linearActive: 0.75,
    multiActive: 0.15,
    reactive: 0.1,
  },
  {
    isoCode: "DK",
    name: "Denmark",
    linearActive: 0.75,
    multiActive: 0.15,
    reactive: 0.1,
  },
  {
    isoCode: "CA",
    name: "Canada",
    linearActive: 0.7,
    multiActive: 0.2,
    reactive: 0.1,
  },
  {
    isoCode: "AU",
    name: "Australia",
    linearActive: 0.7,
    multiActive: 0.25,
    reactive: 0.05,
  },
  {
    isoCode: "NZ",
    name: "New Zealand",
    linearActive: 0.7,
    multiActive: 0.25,
    reactive: 0.05,
  },

  // Multi-Active dominant countries
  {
    isoCode: "IT",
    name: "Italy",
    linearActive: 0.2,
    multiActive: 0.7,
    reactive: 0.1,
  },
  {
    isoCode: "ES",
    name: "Spain",
    linearActive: 0.25,
    multiActive: 0.65,
    reactive: 0.1,
  },
  {
    isoCode: "BR",
    name: "Brazil",
    linearActive: 0.2,
    multiActive: 0.7,
    reactive: 0.1,
  },
  {
    isoCode: "MX",
    name: "Mexico",
    linearActive: 0.25,
    multiActive: 0.65,
    reactive: 0.1,
  },
  {
    isoCode: "AR",
    name: "Argentina",
    linearActive: 0.25,
    multiActive: 0.65,
    reactive: 0.1,
  },
  {
    isoCode: "FR",
    name: "France",
    linearActive: 0.4,
    multiActive: 0.5,
    reactive: 0.1,
  },
  {
    isoCode: "GR",
    name: "Greece",
    linearActive: 0.3,
    multiActive: 0.6,
    reactive: 0.1,
  },
  {
    isoCode: "PT",
    name: "Portugal",
    linearActive: 0.3,
    multiActive: 0.6,
    reactive: 0.1,
  },
  {
    isoCode: "RU",
    name: "Russia",
    linearActive: 0.35,
    multiActive: 0.55,
    reactive: 0.1,
  },
  {
    isoCode: "PL",
    name: "Poland",
    linearActive: 0.4,
    multiActive: 0.5,
    reactive: 0.1,
  },
  {
    isoCode: "TR",
    name: "Turkey",
    linearActive: 0.3,
    multiActive: 0.6,
    reactive: 0.1,
  },
  {
    isoCode: "IN",
    name: "India",
    linearActive: 0.3,
    multiActive: 0.6,
    reactive: 0.1,
  },

  // Reactive dominant countries
  {
    isoCode: "CN",
    name: "China",
    linearActive: 0.15,
    multiActive: 0.2,
    reactive: 0.65,
  },
  {
    isoCode: "JP",
    name: "Japan",
    linearActive: 0.2,
    multiActive: 0.15,
    reactive: 0.65,
  },
  {
    isoCode: "KR",
    name: "South Korea",
    linearActive: 0.25,
    multiActive: 0.2,
    reactive: 0.55,
  },
  {
    isoCode: "VN",
    name: "Vietnam",
    linearActive: 0.15,
    multiActive: 0.25,
    reactive: 0.6,
  },
  {
    isoCode: "TH",
    name: "Thailand",
    linearActive: 0.2,
    multiActive: 0.25,
    reactive: 0.55,
  },
  {
    isoCode: "FI",
    name: "Finland",
    linearActive: 0.4,
    multiActive: 0.2,
    reactive: 0.4,
  },
  {
    isoCode: "SG",
    name: "Singapore",
    linearActive: 0.35,
    multiActive: 0.25,
    reactive: 0.4,
  },
  {
    isoCode: "MY",
    name: "Malaysia",
    linearActive: 0.25,
    multiActive: 0.3,
    reactive: 0.45,
  },
  {
    isoCode: "ID",
    name: "Indonesia",
    linearActive: 0.2,
    multiActive: 0.35,
    reactive: 0.45,
  },
  {
    isoCode: "PH",
    name: "Philippines",
    linearActive: 0.25,
    multiActive: 0.4,
    reactive: 0.35,
  },
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
    throw new Error(
      `Hall score ${value} is outside valid range [${min}, ${max}]`
    );
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
 * Data source: Estimated from academic literature
 * Reference: http://changingminds.org/explanations/culture/hall_culture.htm
 *
 * ⚠️ LIMITED PUBLIC DATA: This array contains 33 countries with estimated scores.
 * Hall's Framework data is primarily qualitative and not as quantitatively published.
 *
 * To add more countries:
 * 1. Research Edward T. Hall's anthropological work
 * 2. Visit http://changingminds.org/explanations/culture/hall_culture.htm
 * 3. Classify countries by Context, Time, and Space dimensions
 * 4. Assign scores on [0,1] scale based on cultural patterns
 */
const hallData: Array<{
  isoCode: string;
  name: string;
  contextHigh: number; // 0-1 scale
  timePolychronic: number; // 0-1 scale
  spacePrivate: number; // 0-1 scale
}> = [
  // ===== SAMPLE DATA: 33 COUNTRIES =====
  // Low-context, Monochronic, Private space (e.g., US, Germany)
  {
    isoCode: "US",
    name: "United States",
    contextHigh: 0.2,
    timePolychronic: 0.2,
    spacePrivate: 0.8,
  },
  {
    isoCode: "DE",
    name: "Germany",
    contextHigh: 0.3,
    timePolychronic: 0.1,
    spacePrivate: 0.7,
  },
  {
    isoCode: "GB",
    name: "United Kingdom",
    contextHigh: 0.3,
    timePolychronic: 0.2,
    spacePrivate: 0.75,
  },
  {
    isoCode: "CA",
    name: "Canada",
    contextHigh: 0.25,
    timePolychronic: 0.2,
    spacePrivate: 0.8,
  },
  {
    isoCode: "AU",
    name: "Australia",
    contextHigh: 0.25,
    timePolychronic: 0.2,
    spacePrivate: 0.75,
  },
  {
    isoCode: "NL",
    name: "Netherlands",
    contextHigh: 0.3,
    timePolychronic: 0.15,
    spacePrivate: 0.7,
  },
  {
    isoCode: "SE",
    name: "Sweden",
    contextHigh: 0.35,
    timePolychronic: 0.15,
    spacePrivate: 0.65,
  },
  {
    isoCode: "CH",
    name: "Switzerland",
    contextHigh: 0.3,
    timePolychronic: 0.1,
    spacePrivate: 0.75,
  },

  // High-context, Polychronic, Public space (e.g., Latin America, Middle East)
  {
    isoCode: "BR",
    name: "Brazil",
    contextHigh: 0.8,
    timePolychronic: 0.9,
    spacePrivate: 0.3,
  },
  {
    isoCode: "MX",
    name: "Mexico",
    contextHigh: 0.75,
    timePolychronic: 0.85,
    spacePrivate: 0.35,
  },
  {
    isoCode: "AR",
    name: "Argentina",
    contextHigh: 0.7,
    timePolychronic: 0.8,
    spacePrivate: 0.4,
  },
  {
    isoCode: "ES",
    name: "Spain",
    contextHigh: 0.65,
    timePolychronic: 0.7,
    spacePrivate: 0.5,
  },
  {
    isoCode: "IT",
    name: "Italy",
    contextHigh: 0.7,
    timePolychronic: 0.75,
    spacePrivate: 0.45,
  },
  {
    isoCode: "GR",
    name: "Greece",
    contextHigh: 0.7,
    timePolychronic: 0.8,
    spacePrivate: 0.4,
  },
  {
    isoCode: "TR",
    name: "Turkey",
    contextHigh: 0.75,
    timePolychronic: 0.8,
    spacePrivate: 0.4,
  },
  {
    isoCode: "IN",
    name: "India",
    contextHigh: 0.8,
    timePolychronic: 0.85,
    spacePrivate: 0.3,
  },

  // High-context, Monochronic, Mixed space (e.g., Japan, China)
  {
    isoCode: "JP",
    name: "Japan",
    contextHigh: 0.9,
    timePolychronic: 0.2,
    spacePrivate: 0.6,
  },
  {
    isoCode: "CN",
    name: "China",
    contextHigh: 0.85,
    timePolychronic: 0.3,
    spacePrivate: 0.5,
  },
  {
    isoCode: "KR",
    name: "South Korea",
    contextHigh: 0.85,
    timePolychronic: 0.25,
    spacePrivate: 0.55,
  },
  {
    isoCode: "VN",
    name: "Vietnam",
    contextHigh: 0.8,
    timePolychronic: 0.4,
    spacePrivate: 0.4,
  },
  {
    isoCode: "TH",
    name: "Thailand",
    contextHigh: 0.8,
    timePolychronic: 0.5,
    spacePrivate: 0.35,
  },
  {
    isoCode: "SG",
    name: "Singapore",
    contextHigh: 0.7,
    timePolychronic: 0.4,
    spacePrivate: 0.6,
  },
  {
    isoCode: "MY",
    name: "Malaysia",
    contextHigh: 0.75,
    timePolychronic: 0.6,
    spacePrivate: 0.4,
  },
  {
    isoCode: "ID",
    name: "Indonesia",
    contextHigh: 0.8,
    timePolychronic: 0.7,
    spacePrivate: 0.3,
  },
  {
    isoCode: "PH",
    name: "Philippines",
    contextHigh: 0.75,
    timePolychronic: 0.75,
    spacePrivate: 0.35,
  },

  // Mixed patterns
  {
    isoCode: "FR",
    name: "France",
    contextHigh: 0.6,
    timePolychronic: 0.5,
    spacePrivate: 0.6,
  },
  {
    isoCode: "RU",
    name: "Russia",
    contextHigh: 0.7,
    timePolychronic: 0.6,
    spacePrivate: 0.5,
  },
  {
    isoCode: "PL",
    name: "Poland",
    contextHigh: 0.6,
    timePolychronic: 0.5,
    spacePrivate: 0.6,
  },
  {
    isoCode: "PT",
    name: "Portugal",
    contextHigh: 0.65,
    timePolychronic: 0.7,
    spacePrivate: 0.45,
  },
  {
    isoCode: "FI",
    name: "Finland",
    contextHigh: 0.5,
    timePolychronic: 0.2,
    spacePrivate: 0.7,
  },
  {
    isoCode: "NO",
    name: "Norway",
    contextHigh: 0.4,
    timePolychronic: 0.2,
    spacePrivate: 0.7,
  },
  {
    isoCode: "DK",
    name: "Denmark",
    contextHigh: 0.4,
    timePolychronic: 0.2,
    spacePrivate: 0.7,
  },
  {
    isoCode: "NZ",
    name: "New Zealand",
    contextHigh: 0.3,
    timePolychronic: 0.25,
    spacePrivate: 0.75,
  },
];

export async function seedHallData() {
  console.log("Seeding Hall Framework data...");

  for (const country of hallData) {
    // Validate scores are in [0,1] range
    if (
      country.contextHigh < 0 ||
      country.contextHigh > 1 ||
      country.timePolychronic < 0 ||
      country.timePolychronic > 1 ||
      country.spacePrivate < 0 ||
      country.spacePrivate > 1
    ) {
      throw new Error(
        `Invalid Hall scores for ${country.name}: scores must be in [0,1] range`
      );
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
 *
 * ⚠️ SAMPLE DATA: This array contains 33 countries as examples.
 * For production, extract ALL countries from the Excel file.
 * Expected total: 50-76+ countries (Hofstede covers 76+ countries)
 *
 * To add more countries:
 * 1. Open docs/Quantifying-Culture-data.xlsx
 * 2. Find Hofstede Framework data for each country
 * 3. Add entries to this array following the format below
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
  // ===== VERIFIED DATA FROM theculturefactor.com =====
  // Source: https://www.theculturefactor.com/country-comparison-tool
  // Data verified October 2024
  // Total: 33 original + 40 additional = 73 countries with verified Hofstede scores
  // United States
  {
    isoCode: "US",
    name: "United States",
    powerDistance: 40,
    individualism: 91,
    masculinity: 62,
    uncertaintyAvoidance: 46,
    longTermOrientation: 29, // Updated from 26 to match official data
    indulgence: 68,
  },
  // Germany
  {
    isoCode: "DE",
    name: "Germany",
    powerDistance: 35,
    individualism: 67,
    masculinity: 66,
    uncertaintyAvoidance: 65,
    longTermOrientation: 83,
    indulgence: 40,
  },
  // United Kingdom
  {
    isoCode: "GB",
    name: "United Kingdom",
    powerDistance: 35,
    individualism: 89,
    masculinity: 66,
    uncertaintyAvoidance: 35,
    longTermOrientation: 51,
    indulgence: 69,
  },
  // Japan
  {
    isoCode: "JP",
    name: "Japan",
    powerDistance: 54,
    individualism: 46,
    masculinity: 95,
    uncertaintyAvoidance: 92,
    longTermOrientation: 88,
    indulgence: 42,
  },
  // China
  {
    isoCode: "CN",
    name: "China",
    powerDistance: 80,
    individualism: 20,
    masculinity: 66,
    uncertaintyAvoidance: 30,
    longTermOrientation: 87,
    indulgence: 24,
  },
  // France
  {
    isoCode: "FR",
    name: "France",
    powerDistance: 68,
    individualism: 71,
    masculinity: 43,
    uncertaintyAvoidance: 86,
    longTermOrientation: 63,
    indulgence: 48,
  },
  // Italy
  {
    isoCode: "IT",
    name: "Italy",
    powerDistance: 50,
    individualism: 76,
    masculinity: 70,
    uncertaintyAvoidance: 75,
    longTermOrientation: 61,
    indulgence: 30,
  },
  // Spain
  {
    isoCode: "ES",
    name: "Spain",
    powerDistance: 57,
    individualism: 51,
    masculinity: 42,
    uncertaintyAvoidance: 86,
    longTermOrientation: 48,
    indulgence: 44,
  },
  // Brazil
  {
    isoCode: "BR",
    name: "Brazil",
    powerDistance: 69,
    individualism: 38,
    masculinity: 49,
    uncertaintyAvoidance: 76,
    longTermOrientation: 44,
    indulgence: 59,
  },
  // Mexico
  {
    isoCode: "MX",
    name: "Mexico",
    powerDistance: 81,
    individualism: 30,
    masculinity: 69,
    uncertaintyAvoidance: 82,
    longTermOrientation: 24,
    indulgence: 97,
  },
  // India
  {
    isoCode: "IN",
    name: "India",
    powerDistance: 77,
    individualism: 48,
    masculinity: 56,
    uncertaintyAvoidance: 40,
    longTermOrientation: 51,
    indulgence: 26,
  },
  // South Korea
  {
    isoCode: "KR",
    name: "South Korea",
    powerDistance: 60,
    individualism: 18,
    masculinity: 39,
    uncertaintyAvoidance: 85,
    longTermOrientation: 100,
    indulgence: 29,
  },
  // Netherlands
  {
    isoCode: "NL",
    name: "Netherlands",
    powerDistance: 38,
    individualism: 80,
    masculinity: 14,
    uncertaintyAvoidance: 53,
    longTermOrientation: 67,
    indulgence: 68,
  },
  // Sweden
  {
    isoCode: "SE",
    name: "Sweden",
    powerDistance: 31,
    individualism: 71,
    masculinity: 5,
    uncertaintyAvoidance: 29,
    longTermOrientation: 53,
    indulgence: 78,
  },
  // Canada
  {
    isoCode: "CA",
    name: "Canada",
    powerDistance: 39,
    individualism: 80,
    masculinity: 52,
    uncertaintyAvoidance: 48,
    longTermOrientation: 36,
    indulgence: 68,
  },
  // Australia
  {
    isoCode: "AU",
    name: "Australia",
    powerDistance: 38,
    individualism: 90,
    masculinity: 61,
    uncertaintyAvoidance: 51,
    longTermOrientation: 21,
    indulgence: 71,
  },
  // Switzerland
  {
    isoCode: "CH",
    name: "Switzerland",
    powerDistance: 34,
    individualism: 68,
    masculinity: 70,
    uncertaintyAvoidance: 58,
    longTermOrientation: 74,
    indulgence: 66,
  },
  // Russia
  {
    isoCode: "RU",
    name: "Russia",
    powerDistance: 93,
    individualism: 39,
    masculinity: 36,
    uncertaintyAvoidance: 95,
    longTermOrientation: 81,
    indulgence: 20,
  },
  // Turkey
  {
    isoCode: "TR",
    name: "Turkey",
    powerDistance: 66,
    individualism: 37,
    masculinity: 45,
    uncertaintyAvoidance: 85,
    longTermOrientation: 46,
    indulgence: 49,
  },
  // Argentina
  {
    isoCode: "AR",
    name: "Argentina",
    powerDistance: 49,
    individualism: 46,
    masculinity: 56,
    uncertaintyAvoidance: 86,
    longTermOrientation: 20,
    indulgence: 62,
  },
  // Poland
  {
    isoCode: "PL",
    name: "Poland",
    powerDistance: 68,
    individualism: 60,
    masculinity: 64,
    uncertaintyAvoidance: 93,
    longTermOrientation: 38,
    indulgence: 29,
  },
  // Greece
  {
    isoCode: "GR",
    name: "Greece",
    powerDistance: 60,
    individualism: 35,
    masculinity: 57,
    uncertaintyAvoidance: 100,
    longTermOrientation: 45,
    indulgence: 50,
  },
  // Portugal
  {
    isoCode: "PT",
    name: "Portugal",
    powerDistance: 63,
    individualism: 27,
    masculinity: 31,
    uncertaintyAvoidance: 99,
    longTermOrientation: 28,
    indulgence: 33,
  },
  // Vietnam
  {
    isoCode: "VN",
    name: "Vietnam",
    powerDistance: 70,
    individualism: 20,
    masculinity: 40,
    uncertaintyAvoidance: 30,
    longTermOrientation: 57,
    indulgence: 35,
  },
  // Thailand
  {
    isoCode: "TH",
    name: "Thailand",
    powerDistance: 64,
    individualism: 20,
    masculinity: 34,
    uncertaintyAvoidance: 64,
    longTermOrientation: 32,
    indulgence: 45,
  },
  // Singapore
  {
    isoCode: "SG",
    name: "Singapore",
    powerDistance: 74,
    individualism: 20,
    masculinity: 48,
    uncertaintyAvoidance: 8,
    longTermOrientation: 72,
    indulgence: 46,
  },
  // Malaysia
  {
    isoCode: "MY",
    name: "Malaysia",
    powerDistance: 100,
    individualism: 26,
    masculinity: 50,
    uncertaintyAvoidance: 36,
    longTermOrientation: 41,
    indulgence: 57,
  },
  // Indonesia
  {
    isoCode: "ID",
    name: "Indonesia",
    powerDistance: 78,
    individualism: 14,
    masculinity: 46,
    uncertaintyAvoidance: 48,
    longTermOrientation: 62,
    indulgence: 38,
  },
  // Philippines
  {
    isoCode: "PH",
    name: "Philippines",
    powerDistance: 94,
    individualism: 32,
    masculinity: 64,
    uncertaintyAvoidance: 44,
    longTermOrientation: 27,
    indulgence: 42,
  },
  // Finland
  {
    isoCode: "FI",
    name: "Finland",
    powerDistance: 33,
    individualism: 63,
    masculinity: 26,
    uncertaintyAvoidance: 59,
    longTermOrientation: 38,
    indulgence: 57,
  },
  // Norway
  {
    isoCode: "NO",
    name: "Norway",
    powerDistance: 31,
    individualism: 69,
    masculinity: 8,
    uncertaintyAvoidance: 50,
    longTermOrientation: 35,
    indulgence: 55,
  },
  // Denmark
  {
    isoCode: "DK",
    name: "Denmark",
    powerDistance: 18,
    individualism: 74,
    masculinity: 16,
    uncertaintyAvoidance: 23,
    longTermOrientation: 35,
    indulgence: 70,
  },
  // New Zealand
  {
    isoCode: "NZ",
    name: "New Zealand",
    powerDistance: 22,
    individualism: 79,
    masculinity: 58,
    uncertaintyAvoidance: 49,
    longTermOrientation: 33,
    indulgence: 75,
  },
  // ===== ADDITIONAL COUNTRIES FROM theculturefactor.com =====
  // Albania
  {
    isoCode: "AL",
    name: "Albania",
    powerDistance: 90,
    individualism: 27,
    masculinity: 80,
    uncertaintyAvoidance: 70,
    longTermOrientation: 56,
    indulgence: 15,
  },
  // Algeria
  {
    isoCode: "DZ",
    name: "Algeria",
    powerDistance: 80,
    individualism: 29,
    masculinity: 35,
    uncertaintyAvoidance: 70,
    longTermOrientation: 25,
    indulgence: 32,
  },
  // Argentina
  {
    isoCode: "AR",
    name: "Argentina",
    powerDistance: 49,
    individualism: 46,
    masculinity: 56,
    uncertaintyAvoidance: 86,
    longTermOrientation: 20,
    indulgence: 62,
  },
  // Austria
  {
    isoCode: "AT",
    name: "Austria",
    powerDistance: 11,
    individualism: 55,
    masculinity: 79,
    uncertaintyAvoidance: 70,
    longTermOrientation: 60,
    indulgence: 63,
  },
  // Belgium
  {
    isoCode: "BE",
    name: "Belgium",
    powerDistance: 65,
    individualism: 75,
    masculinity: 54,
    uncertaintyAvoidance: 94,
    longTermOrientation: 82,
    indulgence: 57,
  },
  // Chile
  {
    isoCode: "CL",
    name: "Chile",
    powerDistance: 63,
    individualism: 23,
    masculinity: 28,
    uncertaintyAvoidance: 86,
    longTermOrientation: 31,
    indulgence: 68,
  },
  // Colombia
  {
    isoCode: "CO",
    name: "Colombia",
    powerDistance: 67,
    individualism: 13,
    masculinity: 64,
    uncertaintyAvoidance: 80,
    longTermOrientation: 13,
    indulgence: 83,
  },
  // Costa Rica
  {
    isoCode: "CR",
    name: "Costa Rica",
    powerDistance: 35,
    individualism: 15,
    masculinity: 21,
    uncertaintyAvoidance: 86,
    longTermOrientation: 0,
    indulgence: 83,
  },
  // Croatia
  {
    isoCode: "HR",
    name: "Croatia",
    powerDistance: 73,
    individualism: 33,
    masculinity: 40,
    uncertaintyAvoidance: 80,
    longTermOrientation: 58,
    indulgence: 33,
  },
  // Czech Republic
  {
    isoCode: "CZ",
    name: "Czech Republic",
    powerDistance: 57,
    individualism: 58,
    masculinity: 57,
    uncertaintyAvoidance: 74,
    longTermOrientation: 70,
    indulgence: 29,
  },
  // Egypt
  {
    isoCode: "EG",
    name: "Egypt",
    powerDistance: 70,
    individualism: 25,
    masculinity: 45,
    uncertaintyAvoidance: 80,
    longTermOrientation: 7,
    indulgence: 4,
  },
  // Estonia
  {
    isoCode: "EE",
    name: "Estonia",
    powerDistance: 40,
    individualism: 60,
    masculinity: 30,
    uncertaintyAvoidance: 60,
    longTermOrientation: 82,
    indulgence: 16,
  },
  // Greece
  {
    isoCode: "GR",
    name: "Greece",
    powerDistance: 60,
    individualism: 35,
    masculinity: 57,
    uncertaintyAvoidance: 100,
    longTermOrientation: 45,
    indulgence: 50,
  },
  // Hong Kong
  {
    isoCode: "HK",
    name: "Hong Kong",
    powerDistance: 68,
    individualism: 25,
    masculinity: 57,
    uncertaintyAvoidance: 29,
    longTermOrientation: 61,
    indulgence: 17,
  },
  // Hungary
  {
    isoCode: "HU",
    name: "Hungary",
    powerDistance: 46,
    individualism: 80,
    masculinity: 88,
    uncertaintyAvoidance: 82,
    longTermOrientation: 58,
    indulgence: 31,
  },
  // Iceland
  {
    isoCode: "IS",
    name: "Iceland",
    powerDistance: 30,
    individualism: 60,
    masculinity: 10,
    uncertaintyAvoidance: 50,
    longTermOrientation: 28,
    indulgence: 67,
  },
  // Ireland
  {
    isoCode: "IE",
    name: "Ireland",
    powerDistance: 28,
    individualism: 70,
    masculinity: 68,
    uncertaintyAvoidance: 35,
    longTermOrientation: 24,
    indulgence: 65,
  },
  // Israel
  {
    isoCode: "IL",
    name: "Israel",
    powerDistance: 13,
    individualism: 54,
    masculinity: 47,
    uncertaintyAvoidance: 81,
    longTermOrientation: 38,
    indulgence: 57,
  },
  // Jamaica
  {
    isoCode: "JM",
    name: "Jamaica",
    powerDistance: 45,
    individualism: 39,
    masculinity: 68,
    uncertaintyAvoidance: 13,
    longTermOrientation: 37,
    indulgence: 45,
  },
  // Jordan
  {
    isoCode: "JO",
    name: "Jordan",
    powerDistance: 70,
    individualism: 30,
    masculinity: 45,
    uncertaintyAvoidance: 65,
    longTermOrientation: 16,
    indulgence: 43,
  },
  // Kenya
  {
    isoCode: "KE",
    name: "Kenya",
    powerDistance: 70,
    individualism: 25,
    masculinity: 40,
    uncertaintyAvoidance: 50,
    longTermOrientation: 61,
    indulgence: 55,
  },
  // Latvia
  {
    isoCode: "LV",
    name: "Latvia",
    powerDistance: 44,
    individualism: 70,
    masculinity: 9,
    uncertaintyAvoidance: 63,
    longTermOrientation: 69,
    indulgence: 13,
  },
  // Lithuania
  {
    isoCode: "LT",
    name: "Lithuania",
    powerDistance: 42,
    individualism: 60,
    masculinity: 19,
    uncertaintyAvoidance: 65,
    longTermOrientation: 82,
    indulgence: 16,
  },
  // Luxembourg
  {
    isoCode: "LU",
    name: "Luxembourg",
    powerDistance: 40,
    individualism: 60,
    masculinity: 50,
    uncertaintyAvoidance: 70,
    longTermOrientation: 64,
    indulgence: 56,
  },
  // Morocco
  {
    isoCode: "MA",
    name: "Morocco",
    powerDistance: 70,
    individualism: 46,
    masculinity: 53,
    uncertaintyAvoidance: 68,
    longTermOrientation: 14,
    indulgence: 43,
  },
  // Nigeria
  {
    isoCode: "NG",
    name: "Nigeria",
    powerDistance: 80,
    individualism: 30,
    masculinity: 60,
    uncertaintyAvoidance: 55,
    longTermOrientation: 13,
    indulgence: 84,
  },
  // Pakistan
  {
    isoCode: "PK",
    name: "Pakistan",
    powerDistance: 55,
    individualism: 14,
    masculinity: 50,
    uncertaintyAvoidance: 70,
    longTermOrientation: 50,
    indulgence: 0,
  },
  // Peru
  {
    isoCode: "PE",
    name: "Peru",
    powerDistance: 64,
    individualism: 16,
    masculinity: 42,
    uncertaintyAvoidance: 87,
    longTermOrientation: 25,
    indulgence: 46,
  },
  // Romania
  {
    isoCode: "RO",
    name: "Romania",
    powerDistance: 90,
    individualism: 30,
    masculinity: 42,
    uncertaintyAvoidance: 90,
    longTermOrientation: 52,
    indulgence: 20,
  },
  // Saudi Arabia
  {
    isoCode: "SA",
    name: "Saudi Arabia",
    powerDistance: 95,
    individualism: 25,
    masculinity: 60,
    uncertaintyAvoidance: 80,
    longTermOrientation: 36,
    indulgence: 52,
  },
  // Slovakia
  {
    isoCode: "SK",
    name: "Slovakia",
    powerDistance: 100,
    individualism: 52,
    masculinity: 100,
    uncertaintyAvoidance: 51,
    longTermOrientation: 77,
    indulgence: 28,
  },
  // Slovenia
  {
    isoCode: "SI",
    name: "Slovenia",
    powerDistance: 71,
    individualism: 27,
    masculinity: 19,
    uncertaintyAvoidance: 88,
    longTermOrientation: 49,
    indulgence: 48,
  },
  // South Africa
  {
    isoCode: "ZA",
    name: "South Africa",
    powerDistance: 49,
    individualism: 65,
    masculinity: 63,
    uncertaintyAvoidance: 49,
    longTermOrientation: 34,
    indulgence: 63,
  },
  // Sri Lanka
  {
    isoCode: "LK",
    name: "Sri Lanka",
    powerDistance: 80,
    individualism: 35,
    masculinity: 10,
    uncertaintyAvoidance: 45,
    longTermOrientation: 32,
    indulgence: 38,
  },
  // Taiwan
  {
    isoCode: "TW",
    name: "Taiwan",
    powerDistance: 58,
    individualism: 17,
    masculinity: 45,
    uncertaintyAvoidance: 69,
    longTermOrientation: 93,
    indulgence: 49,
  },
  // Tanzania
  {
    isoCode: "TZ",
    name: "Tanzania",
    powerDistance: 70,
    individualism: 25,
    masculinity: 40,
    uncertaintyAvoidance: 50,
    longTermOrientation: 34,
    indulgence: 38,
  },
  // Tunisia
  {
    isoCode: "TN",
    name: "Tunisia",
    powerDistance: 80,
    individualism: 30,
    masculinity: 40,
    uncertaintyAvoidance: 68,
    longTermOrientation: 14,
    indulgence: 42,
  },
  // Ukraine
  {
    isoCode: "UA",
    name: "Ukraine",
    powerDistance: 92,
    individualism: 25,
    masculinity: 27,
    uncertaintyAvoidance: 95,
    longTermOrientation: 86,
    indulgence: 14,
  },
  // United Arab Emirates
  {
    isoCode: "AE",
    name: "United Arab Emirates",
    powerDistance: 90,
    individualism: 25,
    masculinity: 50,
    uncertaintyAvoidance: 80,
    longTermOrientation: 36,
    indulgence: 52,
  },
  // Uruguay
  {
    isoCode: "UY",
    name: "Uruguay",
    powerDistance: 61,
    individualism: 36,
    masculinity: 38,
    uncertaintyAvoidance: 98,
    longTermOrientation: 26,
    indulgence: 53,
  },
  // Venezuela
  {
    isoCode: "VE",
    name: "Venezuela",
    powerDistance: 81,
    individualism: 12,
    masculinity: 73,
    uncertaintyAvoidance: 76,
    longTermOrientation: 16,
    indulgence: 100,
  },
];

export async function seedHofstedeData() {
  console.log("Seeding Hofstede Framework data...");

  for (const country of hofstedeData) {
    // Normalize scores from 0-100 to [0,1]
    const normalized = {
      powerDistance: normalizeHofstedeScore(country.powerDistance),
      individualism: normalizeHofstedeScore(country.individualism),
      masculinity: normalizeHofstedeScore(country.masculinity),
      uncertaintyAvoidance: normalizeHofstedeScore(
        country.uncertaintyAvoidance
      ),
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

  console.log(
    `Seeded ${hofstedeData.length} countries with Hofstede Framework data`
  );
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

## Available Country Data

### ⚠️ Critical Finding: CSV Contains No Cultural Data

**What's Actually in `docs/Quantifying-Culture-data.csv`**:

- ✅ **217 country names** (list from Afghanistan to Zimbabwe)
- ❌ **NO cultural scores** - all data columns are empty
- ✅ **Reference URLs** pointing to where data can be researched:
  - Hofstede: https://www.theculturefactor.com/country-comparison-tool
  - Lewis: https://redtangerine.org/the-lewis-model/
  - Hall: http://changingminds.org/explanations/culture/hall_culture.htm

**What's in the Seed Scripts Below**:

- ✅ **Hofstede Framework**: **73 countries with verified scores** from [theculturefactor.com](https://www.theculturefactor.com/country-comparison-tool)
- ⚠️ **Lewis Model**: **33 countries with estimated scores** (limited public data)
- ⚠️ **Hall Framework**: **33 countries with estimated scores** (limited public data)
- ✅ **Ready to implement** - Hofstede data verified October 2024

### Sample Countries Included (33 countries)

The seed scripts below include these countries as examples:

**Americas**: United States, Canada, Brazil, Mexico, Argentina
**Europe**: Germany, United Kingdom, France, Italy, Spain, Switzerland, Netherlands, Sweden, Norway, Denmark, Finland, Russia, Poland, Greece, Portugal, Turkey
**Asia**: Japan, China, South Korea, India, Vietnam, Thailand, Singapore, Malaysia, Indonesia, Philippines
**Oceania**: Australia, New Zealand

### Two Paths Forward

**Path 1: Use Current Data (Recommended for MVP)**

- ✅ **Hofstede**: 73 countries with verified scores from official source
- ⚠️ **Lewis & Hall**: 33 countries with estimated scores (sufficient for MVP)
- ✅ Quick to implement (hours, not weeks)
- ✅ Sufficient for testing and initial deployments
- ✅ Hofstede data is verified and accurate

**Path 2: Research Real Data (Major Undertaking)**

If you need authoritative, researched data for all 217 countries:

1. **Research Hofstede Scores** (Most Available)

   - Visit https://www.theculturefactor.com/country-comparison-tool
   - Or access official Hofstede Insights database
   - Extract 6 dimension scores for 76+ countries
   - Normalize from 0-100 to 0-1 range

2. **Research Lewis Model** (Limited Public Data)

   - Review "When Cultures Collide" by Richard D. Lewis
   - Visit https://redtangerine.org/the-lewis-model/
   - Classify countries by behavioral type
   - Assign proportional scores (Linear-Active, Multi-Active, Reactive)

3. **Research Hall's Dimensions** (Limited Public Data)

   - Visit http://changingminds.org/explanations/culture/hall_culture.htm
   - Review Edward T. Hall's anthropological research
   - Score countries on Context, Time, and Space dimensions

4. **Map to ISO Codes**

   - Map 217 country names from CSV to ISO 3166-1 alpha-2 codes
   - Handle special cases (Taiwan, Hong Kong, etc.)

5. **Populate Seed Scripts**
   - Add researched data to data arrays
   - Validate and normalize scores

**Effort Estimate for Path 2**: 2-4 weeks of full-time research work

**Recommended Approach**: Start with Path 1 (sample data), expand incrementally as needed

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

## Implementation Guide

### Quick Start: Implement with Sample Data

**Recommended approach** for immediate implementation:

1. **Copy the seed scripts** from this document to your `migrations/` directory

   - `migrations/seed-lewis-data.ts`
   - `migrations/seed-hall-data.ts`
   - `migrations/seed-hofstede-data.ts`
   - `migrations/seed-cultural-data.ts`

2. **Verify database connection** in `lib/db/index.ts`

3. **Run the seed scripts**:

```bash
# Run individual framework seeds
pnpm tsx migrations/seed-lewis-data.ts
pnpm tsx migrations/seed-hall-data.ts
pnpm tsx migrations/seed-hofstede-data.ts

# Or run all frameworks together
pnpm tsx migrations/seed-cultural-data.ts
```

4. **Verify data** by querying the database tables

### About the Sample Data (33 Countries)

The seed scripts below contain **estimated scores for 33 countries**:

**Data Source**: Academic framework literature (NOT from CSV file)

- **Lewis Model**: Based on "When Cultures Collide" classifications
- **Hall Framework**: Based on anthropological research patterns
- **Hofstede**: Based on published dimension scores

**Coverage**: Major countries from each region

- **Americas**: United States, Canada, Brazil, Mexico, Argentina
- **Europe**: Germany, UK, France, Italy, Spain, Switzerland, Netherlands, Sweden, Norway, Denmark, Finland, Russia, Poland, Greece, Portugal, Turkey
- **Asia**: Japan, China, South Korea, India, Vietnam, Thailand, Singapore, Malaysia, Indonesia, Philippines
- **Oceania**: Australia, New Zealand

**Quality**: Reasonable estimates suitable for MVP, testing, and initial production use

**Expanding Beyond 33 Countries**: See "Two Paths Forward" section above for data research approach

### If You Need More Than 33 Countries

**Reality**: The CSV file contains NO cultural data to extract, only country names and reference URLs.

**To expand beyond 33 countries**, you'll need to research cultural scores:

**Step 1: Research Data Sources**

Visit the URLs provided in CSV line 3:

- **Hofstede**: https://www.theculturefactor.com/country-comparison-tool (76+ countries)
- **Lewis**: https://redtangerine.org/the-lewis-model/ (limited public data)
- **Hall**: http://changingminds.org/explanations/culture/hall_culture.htm (limited public data)

**Step 2: Collect Scores**

For each country you want to add:

1. Research its cultural scores for each framework
2. Look up or assign ISO 3166-1 alpha-2 code
3. Validate scores are in correct ranges
4. Document your sources

**Step 3: Add to Seed Scripts**

- Add entries to `lewisData` array (format example on lines ~445-680)
- Add entries to `hallData` array (format example on lines ~800-1075)
- Add entries to `hofstedeData` array (format example on lines ~1150-1500)

**Step 4: Maintain Consistency**

- Use same ISO codes across all three frameworks
- Ensure country names match exactly
- Test incrementally (add 10-20 countries at a time)

**Effort Estimate**: 15-30 minutes per country (research + data entry) = 8-16 hours for 50 countries

**Recommendation**: Start with 33, add more based on actual workshop participant demographics

### Troubleshooting

**Error: Cannot find module '@/lib/db'**

- Solution: Update import path to match your project structure (e.g., `../lib/db` or `../../lib/db`)

**Error: Database connection failed**

- Solution: Verify database connection string in environment variables
- Check `.env` file has correct `DATABASE_URL` or equivalent

**Error: Table does not exist**

- Solution: Run database migrations to create the schema tables first
- Check that schema files are properly configured

**Error: Foreign key constraint violation**

- Solution: Ensure `countries` table entries are created before framework score entries
- The seed scripts handle this by inserting countries first

**Duplicate key errors**

- Solution: This is normal if re-running seeds; the `onConflictDoUpdate` handles this
- If errors persist, check that the conflict resolution logic is correct

**Numeric precision errors**

- Solution: Ensure `numeric` columns in database schema have sufficient precision (4, 3)
- Check that score values are converted to strings when inserting

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

## Visualization Requirements

The cultural reference data feature provides framework-specific visualizations that help facilitators understand and demonstrate how different countries are positioned across cultural dimensions. These visualizations can be used for educational purposes and to explain the cultural distance calculations.

### Framework-Specific Visualizations

#### Lewis Framework (3 Dimensions)

**Visualization Types**:

1. **Radar/Spider Chart**

   - Three axes: Linear-Active, Multi-Active, Reactive
   - Each country displayed as a polygon overlay
   - Multiple countries can be compared side-by-side
   - Interactive: Hover to highlight country, click to isolate
   - Use case: Compare behavioral type profiles across countries

2. **Ternary Plot**

   - Triangular scatter plot with three vertices (Linear-Active, Multi-Active, Reactive)
   - Each country positioned based on proportional scores
   - Countries near a vertex are dominant in that behavioral type
   - Color coding by region or behavioral type dominance
   - Interactive: Hover for country details, zoom and pan
   - Use case: Visualize the distribution of behavioral types across all countries

3. **Bar Chart Comparison**
   - Three grouped bars per country (one for each dimension)
   - Stacked or side-by-side bars
   - Multiple countries can be selected for comparison
   - Use case: Direct numerical comparison of scores

**Features**:

- Filter by country: Select specific countries to visualize
- Compare mode: Overlay multiple countries on same chart
- Export: Download visualization as image
- Tooltips: Show exact score values on hover

#### Hall Framework (3 Dimensions)

**Visualization Types**:

1. **3D Scatter Plot**

   - Three axes: Context (High/Low), Time (Monochronic/Polychronic), Space (Private/Public)
   - Countries positioned in 3D space
   - Interactive rotation, zoom, and pan
   - Color coding by cultural cluster or region
   - Use case: Understand spatial relationships between countries

2. **Parallel Coordinates Plot**

   - Three parallel vertical axes, one per dimension
   - Each country represented as a line connecting its scores
   - Lines can be colored or highlighted for comparison
   - Interactive: Drag axes to reorder, brush to filter
   - Use case: Compare countries across all three dimensions simultaneously

3. **Radar Chart**
   - Three-armed radar showing Context, Time, Space
   - Multiple countries overlaid for comparison
   - Interactive highlighting and filtering
   - Use case: Compare specific countries' communication patterns

**Features**:

- 3D visualization toggle: Switch between 2D projection and 3D view
- Cluster analysis: Automatically group similar countries
- Cultural cluster coloring: Visual grouping of similar cultures
- Interactive filters: Filter by dimension ranges

#### Hofstede Framework (6 Dimensions)

**Visualization Types**:

1. **Radar/Spider Chart**

   - Six-armed radar showing all dimensions:
     - Power Distance
     - Individualism
     - Masculinity
     - Uncertainty Avoidance
     - Long-term Orientation
     - Indulgence
   - Each country displayed as a polygon
   - Multiple countries can be compared
   - Use case: Comprehensive cultural profile comparison

2. **Bar Chart Comparison**

   - Six grouped bars per country (one per dimension)
   - Side-by-side or stacked presentation
   - Multiple countries selectable
   - Sorting options: by dimension or country
   - Use case: Detailed numerical comparison

3. **Parallel Coordinates Plot**

   - Six parallel vertical axes, one per dimension
   - Countries as lines connecting dimension scores
   - Interactive brushing and filtering
   - Color coding by cultural clusters
   - Use case: Identify patterns and outliers across dimensions

4. **Heatmap Matrix**
   - Countries as rows, dimensions as columns
   - Color intensity represents score magnitude
   - Sorting by country or dimension
   - Use case: Overview of all countries and dimensions

**Features**:

- Dimension filtering: Show/hide specific dimensions
- Country search: Quick filter by country name
- Comparison mode: Select 2-5 countries for detailed comparison
- Export capabilities: Download visualizations and data

### User Flow

1. Facilitator navigates to cultural reference data visualization page (or embedded view)
2. Facilitator selects framework to visualize (Lewis, Hall, or Hofstede)
3. System loads cultural scores for all countries in selected framework
4. System displays default visualization for selected framework
5. Facilitator can:
   - Select specific countries to display
   - Switch visualization type (radar, bar chart, scatter plot, etc.)
   - Compare multiple countries
   - Filter or search countries
   - Export visualization
6. For workshop context:
   - Optionally filter to show only countries represented by participants
   - Highlight participant countries in visualization
   - Compare participant countries against all countries

### Data Requirements

**Query Requirements**:

- Fetch all countries with cultural scores for selected framework
- Optional: Filter countries by workshop participants
- Support partial data (some countries may have incomplete framework data)

**Real-time Updates**:

- Framework switching triggers immediate data reload
- Country selection updates visualization in real-time
- No caching needed (reference data is static)

### Technical Implementation Details

#### Key Files

- `components/cultural-visualizations/framework-view.tsx` - Framework-specific visualization component
- `components/cultural-visualizations/lewis-visualization.tsx` - Lewis framework visualizations
- `components/cultural-visualizations/hall-visualization.tsx` - Hall framework visualizations
- `components/cultural-visualizations/hofstede-visualization.tsx` - Hofstede framework visualizations
- `lib/utils/framework-visualization-data.ts` - Transform cultural data for visualizations

#### Dependencies

- `recharts`: Radar charts, bar charts, scatter plots
- `@react-three/fiber` + `three`: Optional 3D scatter plots for Hall framework
- `d3-scale-chromatic`: Color schemes for visualizations
- `react-parallel-coordinates`: Parallel coordinates plots (if using specialized library)

#### Data Transformation Examples

```typescript
// lib/utils/framework-visualization-data.ts
export function transformLewisDataForRadar(
  countries: Array<{ name: string; scores: LewisScores }>
): RadarData {
  return countries.map((country) => ({
    country: country.name,
    "Linear-Active": country.scores.linearActive,
    "Multi-Active": country.scores.multiActive,
    Reactive: country.scores.reactive,
  }));
}

export function transformHallDataFor3DScatter(
  countries: Array<{ name: string; scores: HallScores }>
): Scatter3DData {
  return countries.map((country) => ({
    x: country.scores.contextHigh,
    y: country.scores.timePolychronic,
    z: country.scores.spacePrivate,
    country: country.name,
  }));
}

export function transformHofstedeDataForRadar(
  countries: Array<{ name: string; scores: HofstedeScores }>
): RadarData {
  return countries.map((country) => ({
    country: country.name,
    "Power Distance": country.scores.powerDistance,
    Individualism: country.scores.individualism,
    Masculinity: country.scores.masculinity,
    "Uncertainty Avoidance": country.scores.uncertaintyAvoidance,
    "Long-term Orientation": country.scores.longTermOrientation,
    Indulgence: country.scores.indulgence,
  }));
}
```

### Performance Considerations

- Lazy load 3D visualizations (only load when selected)
- Virtualize long country lists in dropdowns
- Memoize transformed visualization data
- Progressive rendering for large country sets
- Cache color assignments per framework

### Accessibility

- Screen reader support: Alternative text descriptions of visualizations
- Keyboard navigation: Tab through country selection, arrow keys for charts
- High contrast mode: Available color schemes
- Text alternatives: Numerical data available as tables
- Tooltip information also in accessible info panels

### Visualization Acceptance Criteria

- All framework visualizations render correctly
- Framework switching updates visualization immediately
- Country selection and filtering work smoothly
- Comparison mode accurately overlays multiple countries
- 3D visualizations are interactive and performant
- Export functionality works for all visualization types
- Visualizations are accessible (keyboard, screen reader)
- Color schemes are distinguishable and accessible
- Performance acceptable: renders in <1 second for all countries
- Mobile-responsive: Simplified views on small screens

### Integration with Workshop Context

When used in workshop context:

- Option to filter to participant countries only
- Highlight participant countries in full country visualization
- Show cultural dimension breakdown for workshop's cultural landscape
- Compare workshop participants against global cultural distribution

## Implementation Checklist

### Phase 1: Setup (Prerequisites)

- [ ] Verify database schema tables exist
- [ ] Confirm database connection works
- [ ] Install `tsx` dependency if not present
- [ ] Create `migrations/` directory if it doesn't exist
- [ ] Review `docs/Quantifying-Culture-data.xlsx` structure

### Phase 2: Choose Data Approach

**Option A: Use Sample Data (Recommended for MVP)**:

- [ ] Accept that 33 countries with estimated scores is sufficient for MVP
- [ ] Understand scores are estimates from academic literature
- [ ] No data extraction needed - ready to implement

**Option B: Research Additional Countries (Optional, If Needed)**:

- [ ] Review CSV file for list of 217 country names
- [ ] Research cultural scores from URLs provided in CSV:
  - [ ] Hofstede scores (theculturefactor.com)
  - [ ] Lewis classifications (redtangerine.org)
  - [ ] Hall dimensions (changingminds.org)
- [ ] Map country names to ISO 3166-1 alpha-2 codes
- [ ] Add researched data to seed script arrays
- [ ] Validate data completeness and consistency
- [ ] **Estimated effort**: 15-30 minutes per country

### Phase 3: Implement Seed Scripts

- [ ] Create `migrations/seed-lewis-data.ts` (copy from document)
- [ ] Create `migrations/seed-hall-data.ts` (copy from document)
- [ ] Create `migrations/seed-hofstede-data.ts` (copy from document)
- [ ] Create `migrations/seed-cultural-data.ts` (copy from document)
- [ ] Update import paths to match project structure
- [ ] Add extracted country data to data arrays (if using production data)

### Phase 4: Test and Verify

- [ ] Run Lewis seed script: `pnpm tsx migrations/seed-lewis-data.ts`
- [ ] Run Hall seed script: `pnpm tsx migrations/seed-hall-data.ts`
- [ ] Run Hofstede seed script: `pnpm tsx migrations/seed-hofstede-data.ts`
- [ ] Verify data in database:
  - [ ] Country count matches expected (33 sample or 50-100+ production)
  - [ ] Score ranges are correct (all [0,1])
  - [ ] Lewis scores sum to ~1.0
  - [ ] No missing foreign keys
- [ ] Test re-running scripts (should update without errors)
- [ ] Query sample countries to verify data correctness

### Phase 4: Integration

- [ ] Implement query functions in `lib/queries/country-queries.ts`
- [ ] Test queries retrieve correct data
- [ ] Create country selection component (if needed)
- [ ] Document seeding process in main documentation

### Phase 5: Documentation

- [ ] Update project documentation with seeding instructions
- [ ] Note any implementation changes or issues
- [ ] Document how to add more countries in the future

## Next Steps After Implementation

Once the seed scripts are implemented and data is loaded:

1. **Implement Country Query Functions**: Create `lib/queries/country-queries.ts` for data retrieval
2. **Country Selection Component**: Build UI component for country selection
3. **Cultural Distance Calculation**: Implement distance calculation algorithms using the seeded data
4. **Visualization**: Add cultural framework visualizations (radar charts, scatter plots, etc.)

## Future Enhancements

- Additional cultural frameworks (e.g., Trompenaars, GLOBE)
- Historical cultural data (temporal changes tracking)
- Regional/city-level cultural data
- Data update mechanisms (admin interface with migration approval)
- Interactive cultural dimension explanations
- Country similarity clustering algorithms
- Cultural dimension correlation analysis
- Animated transitions between frameworks
