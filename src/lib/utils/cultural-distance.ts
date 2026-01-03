/**
 * Cultural distance computation utilities
 * Computes normalized cultural distances between participants based on
 * their countries' cultural dimension scores.
 */

// Re-export types from centralized location for backward compatibility
export type {
  Framework,
  LewisScores,
  HallScores,
  HofstedeScores,
  CulturalScores,
} from "@/types/cultural";

import type {
  Framework,
  LewisScores,
  HallScores,
  HofstedeScores,
  CulturalScores,
} from "@/types/cultural";
import type { DimensionalDistance } from "./visualization-data";

/**
 * Computes cultural distance between two sets of cultural scores
 * using the specified framework.
 */
export function computeCulturalDistance(
  scores1: CulturalScores,
  scores2: CulturalScores,
  framework: Framework
): number {
  switch (framework) {
    case "lewis":
      return computeLewisDistance(scores1.lewis, scores2.lewis);
    case "hall":
      return computeHallDistance(scores1.hall, scores2.hall);
    case "hofstede":
      return computeHofstedeDistance(scores1.hofstede, scores2.hofstede);
    case "combined":
      return computeCombinedDistance(scores1, scores2);
    default:
      throw new Error(`Unknown framework: ${framework}`);
  }
}

/**
 * Computes distance using Lewis framework (3 dimensions)
 */
function computeLewisDistance(
  scores1?: LewisScores,
  scores2?: LewisScores
): number {
  if (!scores1 || !scores2) {
    throw new Error("Missing Lewis scores");
  }

  const dimensions = [
    scores1.linearActive - scores2.linearActive,
    scores1.multiActive - scores2.multiActive,
    scores1.reactive - scores2.reactive,
  ];

  return euclideanDistance(dimensions);
}

/**
 * Computes distance using Hall framework (3 dimensions)
 */
function computeHallDistance(
  scores1?: HallScores,
  scores2?: HallScores
): number {
  if (!scores1 || !scores2) {
    throw new Error("Missing Hall scores");
  }

  const dimensions = [
    scores1.contextHigh - scores2.contextHigh,
    scores1.timePolychronic - scores2.timePolychronic,
    scores1.spacePrivate - scores2.spacePrivate,
  ];

  return euclideanDistance(dimensions);
}

/**
 * Computes distance using Hofstede framework (6 dimensions)
 */
function computeHofstedeDistance(
  scores1?: HofstedeScores,
  scores2?: HofstedeScores
): number {
  if (!scores1 || !scores2) {
    throw new Error("Missing Hofstede scores");
  }

  const dimensions = [
    scores1.powerDistance - scores2.powerDistance,
    scores1.individualism - scores2.individualism,
    scores1.masculinity - scores2.masculinity,
    scores1.uncertaintyAvoidance - scores2.uncertaintyAvoidance,
    scores1.longTermOrientation - scores2.longTermOrientation,
    scores1.indulgence - scores2.indulgence,
  ];

  return euclideanDistance(dimensions);
}

/**
 * Maximum theoretical distances for each framework (√dimensions)
 * Used for normalizing distances to [0,1] range before averaging
 */
const MAX_FRAMEWORK_DISTANCES = {
  lewis: Math.sqrt(3), // ≈ 1.732
  hall: Math.sqrt(3), // ≈ 1.732
  hofstede: Math.sqrt(6), // ≈ 2.449
} as const;

/**
 * Computes distance using combined framework (all available frameworks weighted equally)
 * Normalizes each framework's distance to [0,1] range before averaging to ensure
 * equal contribution regardless of dimension count.
 */
function computeCombinedDistance(
  scores1: CulturalScores,
  scores2: CulturalScores
): number {
  const distances: Array<{ distance: number; maxDist: number }> = [];

  if (scores1.lewis && scores2.lewis) {
    const distance = computeLewisDistance(scores1.lewis, scores2.lewis);
    distances.push({
      distance,
      maxDist: MAX_FRAMEWORK_DISTANCES.lewis,
    });
  }
  if (scores1.hall && scores2.hall) {
    const distance = computeHallDistance(scores1.hall, scores2.hall);
    distances.push({
      distance,
      maxDist: MAX_FRAMEWORK_DISTANCES.hall,
    });
  }
  if (scores1.hofstede && scores2.hofstede) {
    const distance = computeHofstedeDistance(
      scores1.hofstede,
      scores2.hofstede
    );
    distances.push({
      distance,
      maxDist: MAX_FRAMEWORK_DISTANCES.hofstede,
    });
  }

  if (distances.length === 0) {
    throw new Error("No cultural scores available for combined calculation");
  }

  // Normalize each distance to [0,1] range before averaging
  const normalizedDistances = distances.map((d) => d.distance / d.maxDist);

  // Average the normalized distances (equal weighting)
  return (
    normalizedDistances.reduce((sum, d) => sum + d, 0) /
    normalizedDistances.length
  );
}

/**
 * Computes Euclidean distance from an array of dimension differences
 */
function euclideanDistance(dimensions: number[]): number {
  const sumSquaredDiffs = dimensions.reduce(
    (sum, diff) => sum + diff * diff,
    0
  );
  return Math.sqrt(sumSquaredDiffs);
}

/**
 * Computes per-dimension distances between two sets of cultural scores.
 * Returns normalized distances (0-1) for each dimension in the framework.
 */
export function computeDimensionalDistances(
  scores1: CulturalScores,
  scores2: CulturalScores,
  framework: Framework
): DimensionalDistance[] {
  switch (framework) {
    case "lewis":
      return computeLewisDimensionalDistances(scores1.lewis, scores2.lewis);
    case "hall":
      return computeHallDimensionalDistances(scores1.hall, scores2.hall);
    case "hofstede":
      return computeHofstedeDimensionalDistances(
        scores1.hofstede,
        scores2.hofstede
      );
    case "combined":
      return computeCombinedDimensionalDistances(scores1, scores2);
    default:
      throw new Error(`Unknown framework: ${framework}`);
  }
}

/**
 * Computes per-dimension distances for Lewis framework
 */
function computeLewisDimensionalDistances(
  scores1?: LewisScores,
  scores2?: LewisScores
): DimensionalDistance[] {
  if (!scores1 || !scores2) {
    throw new Error("Missing Lewis scores");
  }

  // Scores are normalized (0-1 scale), so max possible difference is 1
  const maxDiff = 1;

  return [
    {
      dimension: "linearActive",
      label: "Linear Active",
      distance: Math.abs(scores1.linearActive - scores2.linearActive) / maxDiff,
      sourceValue: scores1.linearActive,
      targetValue: scores2.linearActive,
    },
    {
      dimension: "multiActive",
      label: "Multi Active",
      distance: Math.abs(scores1.multiActive - scores2.multiActive) / maxDiff,
      sourceValue: scores1.multiActive,
      targetValue: scores2.multiActive,
    },
    {
      dimension: "reactive",
      label: "Reactive",
      distance: Math.abs(scores1.reactive - scores2.reactive) / maxDiff,
      sourceValue: scores1.reactive,
      targetValue: scores2.reactive,
    },
  ];
}

/**
 * Computes per-dimension distances for Hall framework
 */
function computeHallDimensionalDistances(
  scores1?: HallScores,
  scores2?: HallScores
): DimensionalDistance[] {
  if (!scores1 || !scores2) {
    throw new Error("Missing Hall scores");
  }

  // Scores are normalized (0-1 scale), so max possible difference is 1
  const maxDiff = 1;

  return [
    {
      dimension: "contextHigh",
      label: "Context (High)",
      distance: Math.abs(scores1.contextHigh - scores2.contextHigh) / maxDiff,
      sourceValue: scores1.contextHigh,
      targetValue: scores2.contextHigh,
    },
    {
      dimension: "timePolychronic",
      label: "Time (Polychronic)",
      distance:
        Math.abs(scores1.timePolychronic - scores2.timePolychronic) / maxDiff,
      sourceValue: scores1.timePolychronic,
      targetValue: scores2.timePolychronic,
    },
    {
      dimension: "spacePrivate",
      label: "Space (Private)",
      distance: Math.abs(scores1.spacePrivate - scores2.spacePrivate) / maxDiff,
      sourceValue: scores1.spacePrivate,
      targetValue: scores2.spacePrivate,
    },
  ];
}

/**
 * Computes per-dimension distances for Hofstede framework
 */
function computeHofstedeDimensionalDistances(
  scores1?: HofstedeScores,
  scores2?: HofstedeScores
): DimensionalDistance[] {
  if (!scores1 || !scores2) {
    throw new Error("Missing Hofstede scores");
  }

  // Scores are normalized (0-1 scale), so max possible difference is 1
  const maxDiff = 1;

  return [
    {
      dimension: "powerDistance",
      label: "Power Distance",
      distance:
        Math.abs(scores1.powerDistance - scores2.powerDistance) / maxDiff,
      sourceValue: scores1.powerDistance,
      targetValue: scores2.powerDistance,
    },
    {
      dimension: "individualism",
      label: "Individualism",
      distance:
        Math.abs(scores1.individualism - scores2.individualism) / maxDiff,
      sourceValue: scores1.individualism,
      targetValue: scores2.individualism,
    },
    {
      dimension: "masculinity",
      label: "Masculinity",
      distance: Math.abs(scores1.masculinity - scores2.masculinity) / maxDiff,
      sourceValue: scores1.masculinity,
      targetValue: scores2.masculinity,
    },
    {
      dimension: "uncertaintyAvoidance",
      label: "Uncertainty Avoidance",
      distance:
        Math.abs(scores1.uncertaintyAvoidance - scores2.uncertaintyAvoidance) /
        maxDiff,
      sourceValue: scores1.uncertaintyAvoidance,
      targetValue: scores2.uncertaintyAvoidance,
    },
    {
      dimension: "longTermOrientation",
      label: "Long-term Orientation",
      distance:
        Math.abs(scores1.longTermOrientation - scores2.longTermOrientation) /
        maxDiff,
      sourceValue: scores1.longTermOrientation,
      targetValue: scores2.longTermOrientation,
    },
    {
      dimension: "indulgence",
      label: "Indulgence",
      distance: Math.abs(scores1.indulgence - scores2.indulgence) / maxDiff,
      sourceValue: scores1.indulgence,
      targetValue: scores2.indulgence,
    },
  ];
}

/**
 * Computes per-dimension distances for combined framework
 * Returns all dimensions from all available frameworks
 */
function computeCombinedDimensionalDistances(
  scores1: CulturalScores,
  scores2: CulturalScores
): DimensionalDistance[] {
  const dimensions: DimensionalDistance[] = [];

  if (scores1.lewis && scores2.lewis) {
    dimensions.push(
      ...computeLewisDimensionalDistances(scores1.lewis, scores2.lewis)
    );
  }
  if (scores1.hall && scores2.hall) {
    dimensions.push(
      ...computeHallDimensionalDistances(scores1.hall, scores2.hall)
    );
  }
  if (scores1.hofstede && scores2.hofstede) {
    dimensions.push(
      ...computeHofstedeDimensionalDistances(scores1.hofstede, scores2.hofstede)
    );
  }

  if (dimensions.length === 0) {
    throw new Error("No cultural scores available for combined calculation");
  }

  return dimensions;
}
