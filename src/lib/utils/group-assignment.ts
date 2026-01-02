/**
 * Group assignment algorithm
 * Generates maximally diverse groups based on cultural distances
 */

import { generateDistanceMatrix } from "./distance-matrix";
import type { Framework, CulturalScores } from "./cultural-distance";

export type Group = {
  participants: string[];
};

type ParticipantWithScores = {
  id: string;
  culturalScores: CulturalScores;
};

/**
 * Generates maximally diverse groups of participants.
 *
 * @param participants - Array of participants with cultural scores
 * @param framework - Framework to use for distance calculation
 * @param groupSize - Target group size (3, 4, or null for flexible 3-4)
 * @returns Array of groups with participant IDs
 */
export function generateGroups(
  participants: ParticipantWithScores[],
  framework: Framework,
  groupSize: number | null // 3, 4, or null for flexible
): Group[] | undefined {
  if (participants.length === 0 || participants.length < 3) {
    return undefined;
  }

  // Generate distance matrix
  const distanceMatrix = generateDistanceMatrix(participants, framework);

  // Determine target group size
  const targetSize = groupSize ?? 4; // Default to 4 for flexible
  const flexible = groupSize === null;

  // Sort participants by ID for determinism
  const sortedParticipants = [...participants].sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  // Greedy algorithm: iteratively form groups
  const groups: Group[] = [];
  const assigned = new Set<string>();
  const participantIds = sortedParticipants.map((p) => p.id);

  while (assigned.size < participantIds.length) {
    const remaining = participantIds.filter((id) => !assigned.has(id));

    if (remaining.length === 0) break;

    // Start new group with most distant unassigned participants
    const group = formMaxDiverseGroup(
      remaining,
      distanceMatrix,
      targetSize,
      flexible,
      assigned.size,
      participantIds.length
    );

    groups.push({ participants: group });
    group.forEach((id) => {
      assigned.add(id);
    });
  }

  return groups;
}

/**
 * Forms a maximally diverse group from candidate participants.
 */
function formMaxDiverseGroup(
  candidates: string[],
  distanceMatrix: Map<string, Map<string, number>>,
  targetSize: number,
  flexible: boolean,
  assignedCount: number,
  totalCount: number
): string[] {
  const group: string[] = [];

  // First participant: pick participant with highest average distance to others
  const first = selectInitialParticipant(candidates, distanceMatrix);
  group.push(first);

  // Add participants that maximize diversity
  const remaining = candidates.filter((id) => id !== first);

  while (group.length < targetSize && remaining.length > 0) {
    // For flexible groups, check if we should stop at 3
    if (flexible && group.length === 3) {
      const remainingAfterThis = totalCount - assignedCount - group.length - 1;
      // If remainder would create groups that are too unbalanced, prefer 4
      // Otherwise, 3 is acceptable
      if (remainingAfterThis >= 3) {
        // Can afford another participant
      } else {
        // Better to stop at 3
        break;
      }
    }

    // Find participant that maximizes minimum distance to current group
    const next = findMostDistantParticipant(group, remaining, distanceMatrix);
    group.push(next);
    remaining.splice(remaining.indexOf(next), 1);
  }

  return group;
}

/**
 * Selects the initial participant for a group.
 * Chooses the participant with the highest average distance to all other candidates.
 */
function selectInitialParticipant(
  candidates: string[],
  distanceMatrix: Map<string, Map<string, number>>
): string {
  if (candidates.length === 1) return candidates[0];

  let maxAvgDistance = -1;
  let bestCandidate = candidates[0];

  for (const candidate of candidates) {
    const distances = distanceMatrix.get(candidate);
    if (!distances) continue;

    let sum = 0;
    let count = 0;

    for (const other of candidates) {
      if (other === candidate) continue;
      const dist = distances.get(other) ?? 0;
      sum += dist;
      count++;
    }

    const avgDistance = count > 0 ? sum / count : 0;

    if (avgDistance > maxAvgDistance) {
      maxAvgDistance = avgDistance;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

/**
 * Finds the participant that maximizes the minimum distance to the current group.
 */
function findMostDistantParticipant(
  group: string[],
  candidates: string[],
  distanceMatrix: Map<string, Map<string, number>>
): string {
  let maxMinDistance = -1;
  let bestCandidate = candidates[0];

  for (const candidate of candidates) {
    const distances = distanceMatrix.get(candidate);
    if (!distances) continue;

    // Find minimum distance to any participant in current group
    let minDistance = Infinity;

    for (const groupMember of group) {
      const dist = distances.get(groupMember) ?? 0;
      minDistance = Math.min(minDistance, dist);
    }

    // Maximize the minimum distance (most diverse)
    if (minDistance > maxMinDistance) {
      maxMinDistance = minDistance;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}
