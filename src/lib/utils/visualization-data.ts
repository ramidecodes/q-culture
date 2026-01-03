/**
 * Visualization data transformation utilities
 * Transforms distance matrices into formats suitable for visualization
 */

import type { Framework, CulturalScores } from "@/types/cultural";
import { generateDistanceMatrix } from "./distance-matrix";
import { getCulturalDataForCountries } from "@/lib/db/queries/country-queries";
import { computeDimensionalDistances } from "./cultural-distance";

export type Participant = {
  id: string;
  name: string;
  countryCode: string;
  countryName: string;
};

export type Group = {
  id: string;
  groupNumber: number;
  participantIds: string[];
};

export type GraphNode = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  groupId?: string;
  groupNumber?: number;
  culturalScores?: CulturalScores;
};

export type DimensionalDistance = {
  dimension: string;
  label: string;
  distance: number; // normalized 0-1
  sourceValue?: number; // actual score value from source node
  targetValue?: number; // actual score value from target node
};

export type GraphLink = {
  source: string;
  target: string;
  distance: number;
  dimensionalDistances?: DimensionalDistance[]; // New field
};

export type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

export type HeatmapDataPoint = {
  x: string;
  y: string;
  value: number;
  participantX: string;
  participantY: string;
  countryX: string;
  countryY: string;
};

export type HeatmapData = {
  participants: Participant[];
  data: HeatmapDataPoint[];
  minDistance: number;
  maxDistance: number;
};

/**
 * Transforms distance matrix to graph data for network visualization
 */
export function transformDistanceMatrixToGraph(
  participants: Participant[],
  distanceMatrix: Map<string, Map<string, number>>,
  groups?: Group[],
  framework?: Framework,
  culturalDataMap?: Map<string, CulturalScores>
): GraphData {
  const nodes: GraphNode[] = participants.map((p) => {
    const group = groups?.find((g) => g.participantIds.includes(p.id));
    const scores = culturalDataMap?.get(p.countryCode);
    return {
      id: p.id,
      name: p.name,
      country: p.countryName,
      countryCode: p.countryCode,
      groupId: group?.id,
      groupNumber: group?.groupNumber,
      culturalScores: scores,
    };
  });

  const links: GraphLink[] = [];

  for (const [sourceId, distances] of distanceMatrix.entries()) {
    for (const [targetId, distance] of distances.entries()) {
      // Only include one direction (avoid duplicate edges)
      if (sourceId < targetId) {
        const sourceParticipant = participants.find((p) => p.id === sourceId);
        const targetParticipant = participants.find((p) => p.id === targetId);

        // Compute dimensional distances if framework and cultural data are available
        let dimensionalDistances: DimensionalDistance[] | undefined;
        if (
          framework &&
          culturalDataMap &&
          sourceParticipant &&
          targetParticipant
        ) {
          const scores1 = culturalDataMap.get(sourceParticipant.countryCode);
          const scores2 = culturalDataMap.get(targetParticipant.countryCode);
          if (scores1 && scores2) {
            try {
              dimensionalDistances = computeDimensionalDistances(
                scores1,
                scores2,
                framework
              );
            } catch (error) {
              // If dimensional computation fails, just omit it
              console.warn("Failed to compute dimensional distances:", error);
            }
          }
        }

        links.push({
          source: sourceId,
          target: targetId,
          distance,
          dimensionalDistances,
        });
      }
    }
  }

  return { nodes, links };
}

/**
 * Transforms distance matrix to heatmap data
 */
export function transformDistanceMatrixToHeatmap(
  participants: Participant[],
  distanceMatrix: Map<string, Map<string, number>>
): HeatmapData {
  const data: HeatmapDataPoint[] = [];
  let minDistance = Infinity;
  let maxDistance = -Infinity;

  for (let i = 0; i < participants.length; i++) {
    for (let j = 0; j < participants.length; j++) {
      const sourceId = participants[i].id;
      const targetId = participants[j].id;
      const distance = distanceMatrix.get(sourceId)?.get(targetId) ?? 0;

      minDistance = Math.min(minDistance, distance);
      maxDistance = Math.max(maxDistance, distance);

      data.push({
        x: participants[i].name,
        y: participants[j].name,
        value: distance,
        participantX: participants[i].id,
        participantY: participants[j].id,
        countryX: participants[i].countryName,
        countryY: participants[j].countryName,
      });
    }
  }

  return {
    participants,
    data,
    minDistance: minDistance === Infinity ? 0 : minDistance,
    maxDistance: maxDistance === -Infinity ? 0 : maxDistance,
  };
}

/**
 * Computes distance matrix for participants with a given framework.
 * Uses batch query to fetch all cultural data in a single round-trip.
 */
export async function computeDistanceMatrixForParticipants(
  participants: Participant[],
  framework: Framework
): Promise<Map<string, Map<string, number>>> {
  // Get cultural scores for all participants in a single batch query
  const countryCodes = participants.map((p) => p.countryCode);
  const culturalDataMap = await getCulturalDataForCountries(countryCodes);

  // Build participants with scores
  const participantsWithScores = participants.map((p) => ({
    id: p.id,
    culturalScores: culturalDataMap.get(p.countryCode) ?? {},
  }));

  // Generate distance matrix
  return generateDistanceMatrix(participantsWithScores, framework);
}
