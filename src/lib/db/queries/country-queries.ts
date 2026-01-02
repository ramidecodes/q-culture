import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  lewisScores,
  hallScores,
  hofstedeScores,
} from "@/lib/db/schema/cultural-frameworks";
import type { CulturalScores } from "@/types/cultural";

/**
 * Fetches all countries ordered by name.
 * @returns Array of countries with isoCode and name
 */
export async function getAllCountries() {
  return await db.query.countries.findMany({
    orderBy: (countries, { asc }) => [asc(countries.name)],
  });
}

/**
 * Fetches cultural scores for a country across all frameworks.
 * Converts database numeric values to numbers.
 *
 * @param countryCode - ISO country code (e.g., "US", "GB")
 * @returns Cultural scores object with optional lewis, hall, and hofstede scores
 */
export async function getCountryCulturalData(
  countryCode: string
): Promise<CulturalScores> {
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

  const result: CulturalScores = {};

  if (lewis) {
    result.lewis = {
      linearActive: Number(lewis.linearActive),
      multiActive: Number(lewis.multiActive),
      reactive: Number(lewis.reactive),
    };
  }

  if (hall) {
    result.hall = {
      contextHigh: Number(hall.contextHigh),
      timePolychronic: Number(hall.timePolychronic),
      spacePrivate: Number(hall.spacePrivate),
    };
  }

  if (hofstede) {
    result.hofstede = {
      powerDistance: Number(hofstede.powerDistance),
      individualism: Number(hofstede.individualism),
      masculinity: Number(hofstede.masculinity),
      uncertaintyAvoidance: Number(hofstede.uncertaintyAvoidance),
      longTermOrientation: Number(hofstede.longTermOrientation),
      indulgence: Number(hofstede.indulgence),
    };
  }

  return result;
}

/**
 * Fetches cultural scores for multiple countries in a single batch.
 * Optimized to run 3 queries total (one per framework) instead of 3N queries.
 *
 * @param countryCodes - Array of ISO country codes
 * @returns Map of country code to cultural scores
 */
export async function getCulturalDataForCountries(
  countryCodes: string[]
): Promise<Map<string, CulturalScores>> {
  if (countryCodes.length === 0) {
    return new Map();
  }

  // Deduplicate country codes
  const uniqueCodes = [...new Set(countryCodes)];

  // Fetch all framework scores in parallel (3 queries total)
  const [lewisData, hallData, hofstedeData] = await Promise.all([
    db
      .select()
      .from(lewisScores)
      .where(inArray(lewisScores.countryCode, uniqueCodes)),
    db
      .select()
      .from(hallScores)
      .where(inArray(hallScores.countryCode, uniqueCodes)),
    db
      .select()
      .from(hofstedeScores)
      .where(inArray(hofstedeScores.countryCode, uniqueCodes)),
  ]);

  // Build lookup maps for each framework
  const lewisMap = new Map(lewisData.map((l) => [l.countryCode, l]));
  const hallMap = new Map(hallData.map((h) => [h.countryCode, h]));
  const hofstedeMap = new Map(hofstedeData.map((h) => [h.countryCode, h]));

  // Combine into CulturalScores for each country
  const result = new Map<string, CulturalScores>();

  for (const countryCode of uniqueCodes) {
    const scores: CulturalScores = {};

    const lewis = lewisMap.get(countryCode);
    if (lewis) {
      scores.lewis = {
        linearActive: Number(lewis.linearActive),
        multiActive: Number(lewis.multiActive),
        reactive: Number(lewis.reactive),
      };
    }

    const hall = hallMap.get(countryCode);
    if (hall) {
      scores.hall = {
        contextHigh: Number(hall.contextHigh),
        timePolychronic: Number(hall.timePolychronic),
        spacePrivate: Number(hall.spacePrivate),
      };
    }

    const hofstede = hofstedeMap.get(countryCode);
    if (hofstede) {
      scores.hofstede = {
        powerDistance: Number(hofstede.powerDistance),
        individualism: Number(hofstede.individualism),
        masculinity: Number(hofstede.masculinity),
        uncertaintyAvoidance: Number(hofstede.uncertaintyAvoidance),
        longTermOrientation: Number(hofstede.longTermOrientation),
        indulgence: Number(hofstede.indulgence),
      };
    }

    result.set(countryCode, scores);
  }

  return result;
}
