import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  lewisScores,
  hallScores,
  hofstedeScores,
} from "@/lib/db/schema/cultural-frameworks";
import type { CulturalScores } from "@/lib/utils/cultural-distance";

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
 * Converts database numeric values to numbers and normalizes to [0,1] range.
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
