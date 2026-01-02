import { db } from "@/lib/db";

/**
 * Fetches all countries ordered by name.
 * @returns Array of countries with isoCode and name
 */
export async function getAllCountries() {
  return await db.query.countries.findMany({
    orderBy: (countries, { asc }) => [asc(countries.name)],
  });
}
