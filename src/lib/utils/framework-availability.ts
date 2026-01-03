/**
 * Framework availability detection utilities
 * Determines which cultural frameworks have complete data for all participants
 */

import type { Framework, CulturalScores } from "@/types/cultural";
import { hasFrameworkData } from "@/types/cultural";

/**
 * Determines which frameworks have complete data for all given countries.
 * A framework is considered available if all countries have data for it.
 *
 * @param culturalDataMap - Map of country codes to their cultural scores
 * @param countryCodes - Array of country codes to check
 * @returns Array of available frameworks, ordered by preference (hofstede, lewis, hall, combined)
 */
export function getAvailableFrameworks(
  culturalDataMap: Map<string, CulturalScores>,
  countryCodes: string[]
): Framework[] {
  if (countryCodes.length === 0) {
    return [];
  }

  const available: Framework[] = [];

  // Check individual frameworks first
  const individualFrameworks: Exclude<Framework, "combined">[] = [
    "hofstede",
    "lewis",
    "hall",
  ];

  for (const framework of individualFrameworks) {
    const hasAllData = countryCodes.every((code) => {
      const scores = culturalDataMap.get(code) ?? {};
      return hasFrameworkData(scores, framework);
    });

    if (hasAllData) {
      available.push(framework);
    }
  }

  // Combined is available if at least one framework has data for all countries
  const hasAnyFrameworkComplete = individualFrameworks.some((framework) => {
    return countryCodes.every((code) => {
      const scores = culturalDataMap.get(code) ?? {};
      return hasFrameworkData(scores, framework);
    });
  });

  if (hasAnyFrameworkComplete) {
    available.push("combined");
  }

  return available;
}

/**
 * Gets the best available framework for a set of countries.
 * Preference order: hofstede > lewis > hall > combined
 *
 * @param culturalDataMap - Map of country codes to their cultural scores
 * @param countryCodes - Array of country codes to check
 * @returns Best available framework, or "hofstede" as default (most complete coverage)
 */
export function getBestAvailableFramework(
  culturalDataMap: Map<string, CulturalScores>,
  countryCodes: string[]
): Framework {
  const available = getAvailableFrameworks(culturalDataMap, countryCodes);

  if (available.length === 0) {
    // Default to hofstede as it has the most complete coverage
    return "hofstede";
  }

  // Prefer individual frameworks over combined
  const individualFrameworks: Framework[] = ["hofstede", "lewis", "hall"];
  for (const framework of individualFrameworks) {
    if (available.includes(framework)) {
      return framework;
    }
  }

  // Fallback to combined if available
  return "combined";
}

/**
 * Gets countries missing data for a specific framework.
 *
 * @param culturalDataMap - Map of country codes to their cultural scores
 * @param countryCodes - Array of country codes to check
 * @param framework - Framework to check
 * @returns Array of country codes missing data for the framework
 */
export function getCountriesMissingFramework(
  culturalDataMap: Map<string, CulturalScores>,
  countryCodes: string[],
  framework: Framework
): string[] {
  return countryCodes.filter((code) => {
    const scores = culturalDataMap.get(code) ?? {};
    return !hasFrameworkData(scores, framework);
  });
}
