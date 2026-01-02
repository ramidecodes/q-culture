import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { workshops, participants, countries } from "@/lib/db/schema";

/**
 * Fetches a workshop by ID, ensuring the facilitator owns it.
 * Returns null if workshop not found or user doesn't have access.
 */
export async function getWorkshopById(
  workshopId: string,
  facilitatorId: string
) {
  const workshop = await db
    .select()
    .from(workshops)
    .where(
      and(
        eq(workshops.id, workshopId),
        eq(workshops.facilitatorId, facilitatorId)
      )
    )
    .limit(1);

  return workshop[0] ?? null;
}

/**
 * Fetches a workshop by ID without facilitator check.
 * Use with caution - typically for public participant views.
 */
export async function getWorkshopByIdPublic(workshopId: string) {
  const workshop = await db
    .select()
    .from(workshops)
    .where(eq(workshops.id, workshopId))
    .limit(1);

  return workshop[0] ?? null;
}

/**
 * Fetches all participants for a workshop with country information.
 * Verifies that the facilitator owns the workshop.
 */
export async function getWorkshopParticipants(
  workshopId: string,
  facilitatorId: string
) {
  // First verify facilitator owns the workshop
  const workshop = await getWorkshopById(workshopId, facilitatorId);
  if (!workshop) {
    return [];
  }

  return await db
    .select({
      id: participants.id,
      name: participants.name,
      countryCode: participants.countryCode,
      countryName: countries.name,
      joinedAt: participants.createdAt,
    })
    .from(participants)
    .innerJoin(countries, eq(participants.countryCode, countries.isoCode))
    .where(eq(participants.workshopId, workshopId))
    .orderBy(participants.createdAt);
}

/**
 * Gets the total count of participants for a workshop.
 * Verifies that the facilitator owns the workshop.
 */
export async function getParticipantCount(
  workshopId: string,
  facilitatorId: string
): Promise<number> {
  // First verify facilitator owns the workshop
  const workshop = await getWorkshopById(workshopId, facilitatorId);
  if (!workshop) {
    return 0;
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(participants)
    .where(eq(participants.workshopId, workshopId));

  return result[0]?.count ?? 0;
}

/**
 * Gets country distribution summary for a workshop.
 * Verifies that the facilitator owns the workshop.
 */
export async function getCountryDistribution(
  workshopId: string,
  facilitatorId: string
) {
  // First verify facilitator owns the workshop
  const workshop = await getWorkshopById(workshopId, facilitatorId);
  if (!workshop) {
    return [];
  }

  return await db
    .select({
      countryCode: participants.countryCode,
      countryName: countries.name,
      count: sql<number>`count(*)`,
    })
    .from(participants)
    .innerJoin(countries, eq(participants.countryCode, countries.isoCode))
    .where(eq(participants.workshopId, workshopId))
    .groupBy(participants.countryCode, countries.name)
    .orderBy(sql`count(*) desc`);
}

/**
 * Fetches all workshops for a facilitator with participant counts.
 * Returns workshops ordered by creation date (newest first).
 */
export async function getWorkshopsByFacilitator(facilitatorId: string) {
  const workshopList = await db
    .select({
      id: workshops.id,
      title: workshops.title,
      date: workshops.date,
      joinCode: workshops.joinCode,
      status: workshops.status,
      framework: workshops.framework,
      groupSize: workshops.groupSize,
      createdAt: workshops.createdAt,
      participantCount: sql<number>`count(${participants.id})`,
    })
    .from(workshops)
    .leftJoin(participants, eq(participants.workshopId, workshops.id))
    .where(eq(workshops.facilitatorId, facilitatorId))
    .groupBy(
      workshops.id,
      workshops.title,
      workshops.date,
      workshops.joinCode,
      workshops.status,
      workshops.framework,
      workshops.groupSize,
      workshops.createdAt
    )
    .orderBy(desc(workshops.createdAt));

  return workshopList;
}
