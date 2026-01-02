// Environment variables are loaded via tsx --env-file flag in package.json
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
        target: lewisScores.countryCode,
        set: {
          linearActive: normalized.linearActive.toString(),
          multiActive: normalized.multiActive.toString(),
          reactive: normalized.reactive.toString(),
        },
      });
  }

  console.log(`Seeded ${lewisData.length} countries with Lewis Model data`);
}

// Run if executed directly
if (require.main === module) {
  seedLewisData()
    .then(() => {
      console.log("Lewis seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Lewis seed failed:", error);
      process.exit(1);
    });
}
