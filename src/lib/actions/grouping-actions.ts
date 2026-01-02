"use server";

import { and, count, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, participants, workshops } from "@/lib/db/schema";

export type Framework = "lewis" | "hall" | "hofstede" | "combined";
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
