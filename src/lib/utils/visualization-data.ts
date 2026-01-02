/**
 * Visualization data transformation utilities
 * Transforms distance matrices into formats suitable for visualization
 */

import type { Framework } from "@/lib/actions/grouping-actions";
import { generateDistanceMatrix } from "./distance-matrix";
import { getCountryCulturalData } from "@/lib/db/queries/country-queries";

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
};

export type GraphLink = {
  source: string;
  target: string;
  distance: number;
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
  groups?: Group[]
): GraphData {
  const nodes: GraphNode[] = participants.map((p) => {
    const group = groups?.find((g) => g.participantIds.includes(p.id));
    return {
      id: p.id,
      name: p.name,
      country: p.countryName,
      countryCode: p.countryCode,
      groupId: group?.id,
      groupNumber: group?.groupNumber,
    };
  });

  const links: GraphLink[] = [];

  for (const [sourceId, distances] of distanceMatrix.entries()) {
    for (const [targetId, distance] of distances.entries()) {
      // Only include one direction (avoid duplicate edges)
      if (sourceId < targetId) {
        links.push({
          source: sourceId,
          target: targetId,
          distance,
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
 * Computes distance matrix for participants with a given framework
 */
export async function computeDistanceMatrixForParticipants(
  participants: Participant[],
  framework: Framework
): Promise<Map<string, Map<string, number>>> {
  // Get cultural scores for each participant
  const participantsWithScores = await Promise.all(
    participants.map(async (p) => {
      const culturalData = await getCountryCulturalData(p.countryCode);
      return {
        id: p.id,
        culturalScores: culturalData,
      };
    })
  );

  // Generate distance matrix
  return generateDistanceMatrix(participantsWithScores, framework);
}
