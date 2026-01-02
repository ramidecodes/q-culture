"use server";

import { and, count, eq, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, groupMembers, participants, workshops } from "@/lib/db/schema";
import { generateGroups } from "@/lib/utils/group-assignment";
import { getCountryCulturalData } from "@/lib/db/queries/country-queries";
import type { Framework } from "@/lib/utils/cultural-distance";

export type { Framework };
export type GroupSize = 3 | 4 | null;

type GroupingConfig = {
  framework: Framework;
  groupSize: GroupSize;
};

type SaveGroupingConfigResult = { success: true } | { error: string };

/**
 * Saves grouping configuration for a workshop.
 * Validates that groups haven't been generated yet and that there are
 * enough participants for the selected group size.
 *
 * @param workshopId - ID of the workshop to configure
 * @param config - Grouping configuration (framework and group size)
 * @returns Success or error message
 */
export async function saveGroupingConfig(
  workshopId: string,
  config: GroupingConfig
): Promise<SaveGroupingConfigResult> {
  const userId = await requireAuth();

  // Verify facilitator owns workshop
  const workshop = await db.query.workshops.findFirst({
    where: and(
      eq(workshops.id, workshopId),
      eq(workshops.facilitatorId, userId)
    ),
  });

  if (!workshop) {
    return { error: "Workshop not found" };
  }

  // Check if groups already generated
  const groupsResult = await db
    .select({ count: count() })
    .from(groups)
    .where(eq(groups.workshopId, workshopId));

  if (groupsResult[0]?.count && groupsResult[0].count > 0) {
    return {
      error: "Cannot change configuration after groups are generated",
    };
  }

  // Validate minimum participant count
  const participantResult = await db
    .select({ count: count() })
    .from(participants)
    .where(eq(participants.workshopId, workshopId));

  const participantCount = participantResult[0]?.count ?? 0;
  const minRequired = config.groupSize ?? 3;

  if (participantCount < minRequired) {
    return {
      error: `Need at least ${minRequired} participants for this group size`,
    };
  }

  // Validate workshop status allows configuration
  if (workshop.status === "closed") {
    return { error: "Cannot configure a closed workshop" };
  }

  // Save configuration
  try {
    await db
      .update(workshops)
      .set({
        framework: config.framework,
        groupSize: config.groupSize,
        updatedAt: new Date(),
      })
      .where(eq(workshops.id, workshopId));

    return { success: true };
  } catch (error) {
    console.error("Error saving grouping configuration:", error);
    return {
      error: "Failed to save configuration. Please try again.",
    };
  }
}

type GenerateWorkshopGroupsResult =
  | { success: true; groupCount: number }
  | { error: string };

/**
 * Generates groups for a workshop based on cultural distances.
 * Clears existing groups and creates new ones in a transaction.
 *
 * @param workshopId - ID of the workshop to generate groups for
 * @returns Success with group count, or error message
 */
export async function generateWorkshopGroups(
  workshopId: string
): Promise<GenerateWorkshopGroupsResult> {
  const userId = await requireAuth();

  // Verify facilitator owns workshop
  const workshop = await db.query.workshops.findFirst({
    where: and(
      eq(workshops.id, workshopId),
      eq(workshops.facilitatorId, userId)
    ),
  });

  if (!workshop) {
    return { error: "Workshop not found" };
  }

  // Validate workshop status
  if (workshop.status === "closed") {
    return { error: "Cannot generate groups for a closed workshop" };
  }

  // Validate configuration is set
  if (!workshop.framework) {
    return { error: "Cultural framework must be configured first" };
  }

  if (
    workshop.groupSize !== 3 &&
    workshop.groupSize !== 4 &&
    workshop.groupSize !== null
  ) {
    return { error: "Group size must be configured first" };
  }

  // Get all participants
  const workshopParticipants = await db
    .select({
      id: participants.id,
      countryCode: participants.countryCode,
    })
    .from(participants)
    .where(eq(participants.workshopId, workshopId));

  if (workshopParticipants.length < 3) {
    return { error: "Need at least 3 participants to form groups" };
  }

  // Get cultural scores for each participant
  const participantsWithScores = await Promise.all(
    workshopParticipants.map(async (p) => {
      const culturalData = await getCountryCulturalData(p.countryCode);
      return {
        id: p.id,
        culturalScores: culturalData,
      };
    })
  );

  // Validate that all participants have required cultural data
  const framework = workshop.framework as Framework;
  for (const participant of participantsWithScores) {
    if (framework === "lewis" && !participant.culturalScores.lewis) {
      return {
        error: `Participant's country (${
          workshopParticipants.find((p) => p.id === participant.id)?.countryCode
        }) is missing Lewis framework data`,
      };
    }
    if (framework === "hall" && !participant.culturalScores.hall) {
      return {
        error: `Participant's country (${
          workshopParticipants.find((p) => p.id === participant.id)?.countryCode
        }) is missing Hall framework data`,
      };
    }
    if (framework === "hofstede" && !participant.culturalScores.hofstede) {
      return {
        error: `Participant's country (${
          workshopParticipants.find((p) => p.id === participant.id)?.countryCode
        }) is missing Hofstede framework data`,
      };
    }
    if (framework === "combined") {
      const hasAny =
        participant.culturalScores.lewis ||
        participant.culturalScores.hall ||
        participant.culturalScores.hofstede;
      if (!hasAny) {
        return {
          error: `Participant's country (${
            workshopParticipants.find((p) => p.id === participant.id)
              ?.countryCode
          }) is missing all cultural framework data`,
        };
      }
    }
  }

  // Generate groups
  let generatedGroups: Array<{ participants: string[] }> | undefined;
  try {
    generatedGroups = generateGroups(
      participantsWithScores,
      framework,
      workshop.groupSize
    );
  } catch (error) {
    console.error("Error generating groups:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate groups. Please try again.",
    };
  }

  if (!generatedGroups) {
    return {
      error: "Unable to generate groups. Need at least 3 participants.",
    };
  }

  // Clear existing groups and members in a transaction
  try {
    await db.transaction(async (tx) => {
      // First, get all group IDs for this workshop
      const existingGroups = await tx
        .select({ id: groups.id })
        .from(groups)
        .where(eq(groups.workshopId, workshopId));

      if (existingGroups.length > 0) {
        const groupIds = existingGroups.map((g) => g.id);

        // Delete group members
        await tx
          .delete(groupMembers)
          .where(inArray(groupMembers.groupId, groupIds));

        // Delete groups
        await tx.delete(groups).where(eq(groups.workshopId, workshopId));
      }

      // Create new groups
      const createdGroups = [];
      for (let i = 0; i < generatedGroups.length; i++) {
        const [group] = await tx
          .insert(groups)
          .values({
            workshopId,
            groupNumber: i + 1,
          })
          .returning();

        createdGroups.push(group);

        // Create group member records
        for (const participantId of generatedGroups[i].participants) {
          await tx.insert(groupMembers).values({
            groupId: group.id,
            participantId,
          });
        }
      }
    });

    return { success: true, groupCount: generatedGroups.length };
  } catch (error) {
    console.error("Error saving groups to database:", error);
    return {
      error: "Failed to save groups to database. Please try again.",
    };
  }
}
