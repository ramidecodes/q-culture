import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { participants, groupMembers, groups, countries } from "@/lib/db/schema";

export type ParticipantGroupData = {
  participant: {
    id: string;
    name: string;
    countryCode: string;
  };
  group: {
    id: string;
    groupNumber: number;
  } | null;
  members: Array<{
    id: string;
    name: string;
    countryCode: string;
    countryName: string | null;
  }>;
};

/**
 * Fetches participant group assignment by session token.
 * Returns participant data, group assignment (if exists), and all group members.
 *
 * @param token - Participant session token
 * @returns Participant group data or null if participant not found
 */
export async function getParticipantGroup(
  token: string
): Promise<ParticipantGroupData | null> {
  // Find participant by token
  const participant = await db
    .select({
      id: participants.id,
      name: participants.name,
      countryCode: participants.countryCode,
    })
    .from(participants)
    .where(eq(participants.sessionToken, token))
    .limit(1);

  if (participant.length === 0) {
    return null;
  }

  const participantData = participant[0];

  // Find group membership
  const membership = await db
    .select({
      groupId: groupMembers.groupId,
    })
    .from(groupMembers)
    .where(eq(groupMembers.participantId, participantData.id))
    .limit(1);

  if (membership.length === 0) {
    return {
      participant: participantData,
      group: null,
      members: [],
    };
  }

  const groupId = membership[0].groupId;

  // Get group details
  const groupData = await db
    .select({
      id: groups.id,
      groupNumber: groups.groupNumber,
    })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (groupData.length === 0) {
    return {
      participant: participantData,
      group: null,
      members: [],
    };
  }

  // Get all group members with country information
  const allGroupMembers = await db
    .select({
      participantId: groupMembers.participantId,
    })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));

  const participantIds = allGroupMembers.map((gm) => gm.participantId);

  if (participantIds.length === 0) {
    return {
      participant: participantData,
      group: groupData[0],
      members: [],
    };
  }

  // Get all participant details with country information
  const allMemberDetails = await db
    .select({
      id: participants.id,
      name: participants.name,
      countryCode: participants.countryCode,
      countryName: countries.name,
    })
    .from(participants)
    .innerJoin(countries, eq(participants.countryCode, countries.isoCode))
    .where(inArray(participants.id, participantIds));

  return {
    participant: participantData,
    group: groupData[0],
    members: allMemberDetails.map((m) => ({
      id: m.id,
      name: m.name,
      countryCode: m.countryCode,
      countryName: m.countryName,
    })),
  };
}
