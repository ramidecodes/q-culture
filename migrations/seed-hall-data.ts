// Environment variables are loaded via tsx --env-file flag in package.json
import { db } from "@/lib/db";
import { countries, hallScores } from "@/lib/db/schema";

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
        target: hallScores.countryCode,
        set: {
          contextHigh: country.contextHigh.toString(),
          timePolychronic: country.timePolychronic.toString(),
          spacePrivate: country.spacePrivate.toString(),
        },
      });
  }

  console.log(`Seeded ${hallData.length} countries with Hall Framework data`);
}

// Run if executed directly
if (require.main === module) {
  seedHallData()
    .then(() => {
      console.log("Hall seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Hall seed failed:", error);
      process.exit(1);
    });
}
