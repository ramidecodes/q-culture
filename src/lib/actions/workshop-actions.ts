"use server";

import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, workshops } from "@/lib/db/schema";
import type { WorkshopStatus } from "@/lib/db/schema/workshops";
import { generateJoinCode } from "@/lib/utils/join-code";

type CreateWorkshopData = {
  title: string;
  date?: string;
};

type CreateWorkshopResult =
  | { success: true; workshop: { id: string; joinCode: string } }
  | { error: string };

/**
 * Creates a new workshop with a unique join code.
 * Validates input and ensures join code uniqueness.
 *
 * @param data - Workshop creation data (title required, date optional)
 * @returns Success with workshop data or error message
 */
export async function createWorkshop(
  data: CreateWorkshopData
): Promise<CreateWorkshopResult> {
  const userId = await requireAuth();

  // Validate input
  if (!data.title || data.title.trim().length === 0) {
    return { error: "Title is required" };
  }

  if (data.title.length > 200) {
    return { error: "Title must be 200 characters or less" };
  }

  // Generate unique join code
  let joinCode = generateJoinCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await db
      .select()
      .from(workshops)
      .where(eq(workshops.joinCode, joinCode))
      .limit(1);

    if (existing.length === 0) {
      break;
    }

    joinCode = generateJoinCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    return { error: "Failed to generate unique join code. Please try again." };
  }

  // Parse date if provided
  let parsedDate: Date | null = null;
  if (data.date && data.date.trim().length > 0) {
    parsedDate = new Date(data.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return { error: "Invalid date format" };
    }
  }

  // Create workshop
  try {
    const [workshop] = await db
      .insert(workshops)
      .values({
        title: data.title.trim(),
        date: parsedDate ? parsedDate.toISOString().split("T")[0] : null,
        joinCode,
        facilitatorId: userId,
        status: "draft",
      })
      .returning({
        id: workshops.id,
        joinCode: workshops.joinCode,
      });

    return { success: true, workshop };
  } catch (error) {
    console.error("Error creating workshop:", error);
    return { error: "Failed to create workshop. Please try again." };
  }
}

type UpdateWorkshopStatusResult = { success: true } | { error: string };

/**
 * Updates workshop status with state transition validation.
 * Validates that the transition is allowed and checks prerequisites.
 *
 * @param workshopId - ID of the workshop to update
 * @param newStatus - Target status for the workshop
 * @returns Success or error message
 */
export async function updateWorkshopStatus(
  workshopId: string,
  newStatus: WorkshopStatus
): Promise<UpdateWorkshopStatusResult> {
  const userId = await requireAuth();

  // Verify facilitator owns workshop and get current status
  const workshop = await db
    .select()
    .from(workshops)
    .where(
      and(eq(workshops.id, workshopId), eq(workshops.facilitatorId, userId))
    )
    .limit(1);

  if (workshop.length === 0) {
    return { error: "Workshop not found" };
  }

  const currentStatus = workshop[0].status;

  // Validate state transition
  if (!isValidTransition(currentStatus, newStatus)) {
    return { error: "Invalid state transition" };
  }

  // Special validation for grouped state: must have groups
  if (newStatus === "grouped") {
    const workshopGroups = await db
      .select()
      .from(groups)
      .where(eq(groups.workshopId, workshopId))
      .limit(1);

    if (workshopGroups.length === 0) {
      return { error: "Cannot advance to grouped: no groups generated" };
    }
  }

  // Update status in transaction
  try {
    await db
      .update(workshops)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(workshops.id, workshopId));

    return { success: true };
  } catch (error) {
    console.error("Error updating workshop status:", error);
    return { error: "Failed to update workshop status. Please try again." };
  }
}

function isValidTransition(
  current: WorkshopStatus,
  next: WorkshopStatus
): boolean {
  const validTransitions: Record<WorkshopStatus, WorkshopStatus[]> = {
    draft: ["collecting"],
    collecting: ["grouped"],
    grouped: ["closed"],
    closed: [], // Terminal state
  };

  return validTransitions[current]?.includes(next) ?? false;
}
