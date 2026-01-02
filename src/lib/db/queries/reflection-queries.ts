import { eq, asc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  reflections,
  participants,
  groups,
  groupMembers,
} from "@/lib/db/schema";
import { getWorkshopById } from "./workshop-queries";

type ParticipantReflection = {
  participant: {
    id: string;
    name: string;
  };
  reflection: {
    id: string;
    content: string;
    submittedAt: Date;
  } | null;
  submitted: boolean;
};

export type ReflectionGroupData = {
  groupNumber: number;
  reflections: ParticipantReflection[];
};

/**
 * Fetches all reflections for a workshop, organized by group.
 * Includes participants who haven't submitted reflections yet.
 * Verifies that the facilitator owns the workshop.
 *
 * @param workshopId - Workshop ID
 * @param facilitatorId - Facilitator user ID
 * @returns Array of group data with reflections, or empty array if workshop not found
 */
export async function getWorkshopReflectionsWithMissing(
  workshopId: string,
  facilitatorId: string
): Promise<ReflectionGroupData[]> {
  // Verify facilitator owns the workshop
  const workshop = await getWorkshopById(workshopId, facilitatorId);
  if (!workshop) {
    return [];
  }

  // Get all groups for the workshop
  const workshopGroups = await db
    .select({
      id: groups.id,
      groupNumber: groups.groupNumber,
    })
    .from(groups)
    .where(eq(groups.workshopId, workshopId))
    .orderBy(asc(groups.groupNumber));

  if (workshopGroups.length === 0) {
    return [];
  }

  const groupIds = workshopGroups.map((g) => g.id);

  // Get all group members for these groups
  const allMemberships = await db
    .select({
      groupId: groupMembers.groupId,
      participantId: groupMembers.participantId,
    })
    .from(groupMembers)
    .where(inArray(groupMembers.groupId, groupIds));

  // Get all reflections for participants in this workshop
  const allReflections = await db
    .select({
      id: reflections.id,
      participantId: reflections.participantId,
      groupId: reflections.groupId,
      content: reflections.content,
      submittedAt: reflections.submittedAt,
    })
    .from(reflections)
    .innerJoin(participants, eq(reflections.participantId, participants.id))
    .where(eq(participants.workshopId, workshopId));

  // Create a map of participantId -> reflection
  const reflectionMap = new Map(
    allReflections.map((r) => [r.participantId, r])
  );

  // Get all participants for this workshop who are in groups
  const participantIds = allMemberships.map((m) => m.participantId);

  if (participantIds.length === 0) {
    return [];
  }

  const allParticipants = await db
    .select({
      id: participants.id,
      name: participants.name,
    })
    .from(participants)
    .where(inArray(participants.id, participantIds));

  // Create a map of participantId -> participant
  const participantMap = new Map(allParticipants.map((p) => [p.id, p]));

  // Organize by group
  return workshopGroups.map((group) => {
    // Get all members of this group
    const groupMemberIds = allMemberships
      .filter((m) => m.groupId === group.id)
      .map((m) => m.participantId);

    // Build reflection data for each member, filtering out missing participants
    const groupReflections: ParticipantReflection[] = groupMemberIds.flatMap(
      (participantId) => {
        const participant = participantMap.get(participantId);
        if (!participant) {
          return [];
        }

        const reflection = reflectionMap.get(participantId);

        return [
          {
            participant: {
              id: participant.id,
              name: participant.name,
            },
            reflection: reflection
              ? {
                  id: reflection.id,
                  content: reflection.content,
                  submittedAt: reflection.submittedAt,
                }
              : null,
            submitted: !!reflection,
          },
        ];
      }
    );

    // Sort: submitted first, then by name
    groupReflections.sort((a, b) => {
      if (a.submitted !== b.submitted) {
        return a.submitted ? -1 : 1;
      }
      return a.participant.name.localeCompare(b.participant.name);
    });

    return {
      groupNumber: group.groupNumber,
      reflections: groupReflections,
    };
  });
}
