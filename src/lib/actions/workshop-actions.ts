"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { workshops } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { generateJoinCode } from "@/lib/utils/join-code";
import { eq } from "drizzle-orm";

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
    if (isNaN(parsedDate.getTime())) {
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
