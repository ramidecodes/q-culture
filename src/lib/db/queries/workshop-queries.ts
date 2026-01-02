import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workshops } from "@/lib/db/schema";

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
