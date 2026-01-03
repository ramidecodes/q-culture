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
import type { Framework } from "@/types/cultural";
import { getCulturalDataForCountries } from "@/lib/db/queries/country-queries";
import {
  getAvailableFrameworks,
  getBestAvailableFramework,
} from "@/lib/utils/framework-availability";

export type VisualizationData = {
  framework: Framework;
  availableFrameworks: Framework[];
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

export type VisualizationDataResult =
  | {
      success: true;
      data: VisualizationData;
    }
  | {
      success: false;
      error:
        | "workshop_not_found"
        | "insufficient_participants"
        | "framework_unavailable";
      participantCount?: number;
      availableFrameworks?: Framework[];
      missingCountries?: string[];
    };

/**
 * Fetches and computes visualization data for a workshop.
 * Verifies that the facilitator owns the workshop.
 *
 * @param workshopId - ID of the workshop
 * @param facilitatorId - ID of the facilitator (for verification)
 * @param framework - Framework to use for distance calculation
 * @returns Visualization data result with success/error state
 */
export async function getVisualizationData(
  workshopId: string,
  facilitatorId: string,
  framework: Framework
): Promise<VisualizationDataResult> {
  // Verify facilitator owns workshop
  const workshop = await getWorkshopById(workshopId, facilitatorId);
  if (!workshop) {
    return { success: false, error: "workshop_not_found" };
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

  // Debug logging
  console.log("[getVisualizationData] Debug info:", {
    workshopId,
    facilitatorId,
    participantCount: workshopParticipants.length,
    participants: workshopParticipants.map((p) => ({
      id: p.id,
      name: p.name,
      countryCode: p.countryCode,
    })),
  });

  if (workshopParticipants.length < 2) {
    return {
      success: false,
      error: "insufficient_participants",
      participantCount: workshopParticipants.length,
    };
  }

  const participantsData: Participant[] = workshopParticipants.map((p) => ({
    id: p.id,
    name: p.name,
    countryCode: p.countryCode,
    countryName: p.countryName,
  }));

  // Get cultural data for all participants to check framework availability
  const countryCodes = participantsData.map((p) => p.countryCode);
  const culturalDataMap = await getCulturalDataForCountries(countryCodes);

  // Determine available frameworks
  const availableFrameworks = getAvailableFrameworks(
    culturalDataMap,
    countryCodes
  );

  // Use requested framework if available, otherwise fallback to best available
  let selectedFramework = framework;
  if (!availableFrameworks.includes(framework)) {
    selectedFramework = getBestAvailableFramework(
      culturalDataMap,
      countryCodes
    );
  }

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

  // Compute distance matrix with selected framework
  const distanceMatrix = await computeDistanceMatrixForParticipants(
    participantsData,
    selectedFramework
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
    success: true,
    data: {
      framework: selectedFramework,
      availableFrameworks,
      graphData,
      heatmapData,
    },
  };
}
