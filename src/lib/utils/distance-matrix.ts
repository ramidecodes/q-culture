/**
 * Distance matrix generation utilities
 * Creates pairwise distance matrices for all participants
 */

import { computeCulturalDistance } from "./cultural-distance";
import type { Framework, CulturalScores } from "./cultural-distance";

export type Participant = {
  id: string;
  culturalScores: CulturalScores;
};

/**
 * Generates a distance matrix for all participant pairs.
 * Returns a Map where keys are participant IDs and values are Maps
 * of other participant IDs to their distance.
 *
 * @param participants - Array of participants with cultural scores
 * @param framework - Framework to use for distance calculation
 * @returns Distance matrix as nested Map structure
 */
export function generateDistanceMatrix(
  participants: Participant[],
  framework: Framework
): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>();

  for (let i = 0; i < participants.length; i++) {
    const row = new Map<string, number>();

    for (let j = 0; j < participants.length; j++) {
      if (i === j) {
        row.set(participants[j].id, 0); // Distance to self is 0
      } else {
        const distance = computeCulturalDistance(
          participants[i].culturalScores,
          participants[j].culturalScores,
          framework
        );
        row.set(participants[j].id, distance);
      }
    }

    matrix.set(participants[i].id, row);
  }

  return matrix;
}
