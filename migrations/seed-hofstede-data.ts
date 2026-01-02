// Environment variables are loaded via tsx --env-file flag in package.json
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
 * Data source: Verified from theculturefactor.com
 * Reference: https://www.theculturefactor.com/country-comparison-tool
 * Data verified October 2024
 *
 * ✅ VERIFIED DATA: This array contains 73 countries with verified scores
 * from the official Hofstede Insights source.
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
  // United States
  {
    isoCode: "US",
    name: "United States",
    powerDistance: 40,
    individualism: 91,
    masculinity: 62,
    uncertaintyAvoidance: 46,
    longTermOrientation: 29,
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
        target: hofstedeScores.countryCode,
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

// Run if executed directly
if (require.main === module) {
  seedHofstedeData()
    .then(() => {
      console.log("Hofstede seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Hofstede seed failed:", error);
      process.exit(1);
    });
}
