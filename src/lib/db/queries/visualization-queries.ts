import { eq, inArray } from "drizzle-orm";
import { getWorkshopById } from "@/lib/db/queries/workshop-queries";
import { db } from "@/lib/db";
import { participants, groups, groupMembers, countries } from "@/lib/db/schema";
import {
  computeDistanceMatrixForParticipants,
  transformDistanceMatrixToGraph,
  transformDistanceMatrixToHeatmap,
  type Participant,
  type Group,
} from "@/lib/utils/visualization-data";
import type { Framework } from "@/lib/utils/cultural-distance";

export type VisualizationData = {
  framework: Framework;
  graphData: {
    nodes: Array<{
      id: string;
      name: string;
      country: string;
      countryCode: string;
      groupId?: string;
      groupNumber?: number;
    }>;
    links: Array<{
      source: string;
      target: string;
      distance: number;
    }>;
  };
  heatmapData: {
    participants: Array<{
      id: string;
      name: string;
      countryCode: string;
      countryName: string;
    }>;
    data: Array<{
      x: string;
      y: string;
      value: number;
      participantX: string;
      participantY: string;
      countryX: string;
      countryY: string;
    }>;
    minDistance: number;
    maxDistance: number;
  };
};

/**
 * Fetches and computes visualization data for a workshop.
 * Verifies that the facilitator owns the workshop.
 *
 * @param workshopId - ID of the workshop
 * @param facilitatorId - ID of the facilitator (for verification)
 * @param framework - Framework to use for distance calculation
 * @returns Visualization data or null if workshop not found
 */
export async function getVisualizationData(
  workshopId: string,
  facilitatorId: string,
  framework: Framework
): Promise<VisualizationData | null> {
  // Verify facilitator owns workshop
  const workshop = await getWorkshopById(workshopId, facilitatorId);
  if (!workshop) {
    return null;
  }

  // Get all participants
  const workshopParticipants = await db
    .select({
      id: participants.id,
      name: participants.name,
      countryCode: participants.countryCode,
      countryName: countries.name,
    })
    .from(participants)
    .innerJoin(countries, eq(participants.countryCode, countries.isoCode))
    .where(eq(participants.workshopId, workshopId))
    .orderBy(participants.createdAt);

  if (workshopParticipants.length < 2) {
    throw new Error("Need at least 2 participants for distance visualization");
  }

  const participantsData: Participant[] = workshopParticipants.map((p) => ({
    id: p.id,
    name: p.name,
    countryCode: p.countryCode,
    countryName: p.countryName,
  }));

  // Get groups if they exist
  let groupsData: Group[] | undefined;
  const existingGroups = await db
    .select()
    .from(groups)
    .where(eq(groups.workshopId, workshopId))
    .orderBy(groups.groupNumber);

  if (existingGroups.length > 0) {
    const groupIds = existingGroups.map((g) => g.id);
    const allGroupMembers = await db
      .select()
      .from(groupMembers)
      .where(inArray(groupMembers.groupId, groupIds));

    // Map group members to groups
    const groupMembersMap = new Map<string, string[]>();
    for (const member of allGroupMembers) {
      const current = groupMembersMap.get(member.groupId) || [];
      current.push(member.participantId);
      groupMembersMap.set(member.groupId, current);
    }

    groupsData = existingGroups.map((g) => ({
      id: g.id,
      groupNumber: g.groupNumber,
      participantIds: groupMembersMap.get(g.id) || [],
    }));
  }

  // Compute distance matrix
  const distanceMatrix = await computeDistanceMatrixForParticipants(
    participantsData,
    framework
  );

  // Transform to visualization formats
  const graphData = transformDistanceMatrixToGraph(
    participantsData,
    distanceMatrix,
    groupsData
  );

  const heatmapData = transformDistanceMatrixToHeatmap(
    participantsData,
    distanceMatrix
  );

  return {
    framework,
    graphData,
    heatmapData,
  };
}
