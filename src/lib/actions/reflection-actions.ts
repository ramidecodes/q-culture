"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  reflections,
  participants,
  groupMembers,
  workshops,
} from "@/lib/db/schema";

const MAX_REFLECTION_LENGTH = 1000; // characters

type SubmitReflectionResult =
  | { success: true; reflection: { id: string; content: string } }
  | { error: string };

/**
 * Submits a reflection for a participant.
 * Validates input, checks workshop status, and ensures one submission per participant.
 *
 * @param token - Participant session token
 * @param content - Reflection content text
 * @returns Success with reflection data or error message
 */
export async function submitReflection(
  token: string,
  content: string
): Promise<SubmitReflectionResult> {
  // Validate input
  if (!content || content.trim().length === 0) {
    return { error: "Reflection cannot be empty" };
  }

  if (content.length > MAX_REFLECTION_LENGTH) {
    return {
      error: `Reflection must be ${MAX_REFLECTION_LENGTH} characters or less`,
    };
  }

  // Find participant by token
  const participantData = await db
    .select({
      id: participants.id,
      workshopId: participants.workshopId,
    })
    .from(participants)
    .where(eq(participants.sessionToken, token))
    .limit(1);

  if (participantData.length === 0) {
    return { error: "Participant not found" };
  }

  const participant = participantData[0];

  // Get workshop status
  const workshopData = await db
    .select({
      status: workshops.status,
    })
    .from(workshops)
    .where(eq(workshops.id, participant.workshopId))
    .limit(1);

  if (workshopData.length === 0) {
    return { error: "Workshop not found" };
  }

  const workshopStatus = workshopData[0].status;

  // Check workshop status
  if (workshopStatus === "closed") {
    return { error: "Workshop is closed, no new submissions accepted" };
  }

  if (workshopStatus !== "grouped") {
    return {
      error: "Reflections can only be submitted after groups are assigned",
    };
  }

  // Check if already submitted
  const existing = await db
    .select()
    .from(reflections)
    .where(eq(reflections.participantId, participant.id))
    .limit(1);

  if (existing.length > 0) {
    return { error: "Reflection already submitted" };
  }

  // Find participant's group
  const groupMemberData = await db
    .select({
      groupId: groupMembers.groupId,
    })
    .from(groupMembers)
    .where(eq(groupMembers.participantId, participant.id))
    .limit(1);

  if (groupMemberData.length === 0) {
    return { error: "Participant not assigned to a group" };
  }

  // Create reflection
  try {
    const [reflection] = await db
      .insert(reflections)
      .values({
        participantId: participant.id,
        groupId: groupMemberData[0].groupId,
        content: content.trim(),
      })
      .returning({
        id: reflections.id,
        content: reflections.content,
      });

    return { success: true, reflection };
  } catch (error) {
    console.error("Error submitting reflection:", error);
    return { error: "Failed to submit reflection. Please try again." };
  }
}

type ParticipantReflection = {
  id: string;
  content: string;
  submittedAt: Date;
} | null;

/**
 * Retrieves a participant's reflection by session token.
 *
 * @param token - Participant session token
 * @returns Reflection data or null if not found
 */
export async function getParticipantReflection(
  token: string
): Promise<ParticipantReflection> {
  const participantData = await db
    .select({
      id: participants.id,
    })
    .from(participants)
    .where(eq(participants.sessionToken, token))
    .limit(1);

  if (participantData.length === 0) {
    return null;
  }

  const reflectionData = await db
    .select({
      id: reflections.id,
      content: reflections.content,
      submittedAt: reflections.submittedAt,
    })
    .from(reflections)
    .where(eq(reflections.participantId, participantData[0].id))
    .limit(1);

  if (reflectionData.length === 0) {
    return null;
  }

  return reflectionData[0];
}
