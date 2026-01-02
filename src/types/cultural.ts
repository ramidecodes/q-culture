/**
 * Cultural framework types and validation utilities
 * Single source of truth for all cultural dimension types used across the application
 */

export type Framework = "lewis" | "hall" | "hofstede" | "combined";

export type LewisScores = {
  linearActive: number;
  multiActive: number;
  reactive: number;
};

export type HallScores = {
  contextHigh: number;
  timePolychronic: number;
  spacePrivate: number;
};

export type HofstedeScores = {
  powerDistance: number;
  individualism: number;
  masculinity: number;
  uncertaintyAvoidance: number;
  longTermOrientation: number;
  indulgence: number;
};

export type CulturalScores = {
  lewis?: LewisScores;
  hall?: HallScores;
  hofstede?: HofstedeScores;
};

/**
 * Validates that a participant has the required cultural scores for a given framework.
 *
 * @param scores - The cultural scores to validate
 * @param framework - The framework requiring validation
 * @param countryCode - Country code for error messages
 * @returns Validation result with error message if invalid
 */
export function validateFrameworkScores(
  scores: CulturalScores,
  framework: Framework,
  countryCode: string
): { valid: true } | { valid: false; error: string } {
  const frameworkScoreMap: Record<
    Exclude<Framework, "combined">,
    keyof CulturalScores
  > = {
    lewis: "lewis",
    hall: "hall",
    hofstede: "hofstede",
  };

  if (framework === "combined") {
    const hasAny = scores.lewis || scores.hall || scores.hofstede;
    if (!hasAny) {
      return {
        valid: false,
        error: `Participant's country (${countryCode}) is missing all cultural framework data`,
      };
    }
    return { valid: true };
  }

  const scoreKey = frameworkScoreMap[framework];
  if (!scores[scoreKey]) {
    const frameworkName =
      framework.charAt(0).toUpperCase() + framework.slice(1);
    return {
      valid: false,
      error: `Participant's country (${countryCode}) is missing ${frameworkName} framework data`,
    };
  }

  return { valid: true };
}

/**
 * Checks if cultural scores have data for a specific framework
 */
export function hasFrameworkData(
  scores: CulturalScores,
  framework: Framework
): boolean {
  if (framework === "combined") {
    return !!(scores.lewis || scores.hall || scores.hofstede);
  }
  return !!scores[framework];
}
