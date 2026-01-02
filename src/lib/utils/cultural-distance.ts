/**
 * Cultural distance computation utilities
 * Computes normalized cultural distances between participants based on
 * their countries' cultural dimension scores.
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
 * Computes distance using combined framework (all available frameworks weighted equally)
 */
function computeCombinedDistance(
  scores1: CulturalScores,
  scores2: CulturalScores
): number {
  const distances: number[] = [];

  if (scores1.lewis && scores2.lewis) {
    distances.push(computeLewisDistance(scores1.lewis, scores2.lewis));
  }
  if (scores1.hall && scores2.hall) {
    distances.push(computeHallDistance(scores1.hall, scores2.hall));
  }
  if (scores1.hofstede && scores2.hofstede) {
    distances.push(computeHofstedeDistance(scores1.hofstede, scores2.hofstede));
  }

  if (distances.length === 0) {
    throw new Error("No cultural scores available for combined calculation");
  }

  // Average of all framework distances (equal weighting)
  return distances.reduce((sum, d) => sum + d, 0) / distances.length;
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
