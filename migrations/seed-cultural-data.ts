// Environment variables are loaded via tsx --env-file flag in package.json

import { seedHallData } from "./seed-hall-data";
import { seedHofstedeData } from "./seed-hofstede-data";
import { seedLewisData } from "./seed-lewis-data";

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
