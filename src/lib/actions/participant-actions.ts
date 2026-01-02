"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { participants, workshops } from "@/lib/db/schema";

type JoinWorkshopData = {
  name: string;
  countryCode: string;
};

type JoinWorkshopResult =
  | { success: true; participant: { id: string }; token: string }
  | { error: string };

/**
 * Allows an anonymous participant to join a workshop by providing
 * their name and country via a join code.
 *
 * @param joinCode - 6-character alphanumeric join code
 * @param data - Participant data (name and country code)
 * @returns Success with participant data and session token, or error message
 */
export async function joinWorkshop(
  joinCode: string,
  data: JoinWorkshopData
): Promise<JoinWorkshopResult> {
  // Validate join code and workshop status
  const workshop = await db.query.workshops.findFirst({
    where: eq(workshops.joinCode, joinCode),
  });

  if (!workshop) {
    return { error: "Invalid join code" };
  }

  if (workshop.status !== "collecting") {
    return { error: "Workshop is not accepting participants" };
  }

  // Validate inputs
  if (!data.name || data.name.trim().length === 0) {
    return { error: "Name is required" };
  }

  if (data.name.trim().length > 100) {
    return { error: "Name must be 100 characters or less" };
  }

  if (!data.countryCode || data.countryCode.trim().length === 0) {
    return { error: "Country is required" };
  }

  // Get or create session token
  const cookieStore = await cookies();
  let sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    sessionToken = randomUUID();
    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  // Check if already joined
  const existing = await db.query.participants.findFirst({
    where: and(
      eq(participants.workshopId, workshop.id),
      eq(participants.sessionToken, sessionToken)
    ),
  });

  if (existing) {
    return {
      error: "You have already joined this workshop",
    };
  }

  // Create participant record
  try {
    const [participant] = await db
      .insert(participants)
      .values({
        workshopId: workshop.id,
        name: data.name.trim(),
        countryCode: data.countryCode.trim(),
        sessionToken,
      })
      .returning({
        id: participants.id,
      });

    return { success: true, participant, token: sessionToken };
  } catch (error) {
    console.error("Error joining workshop:", error);
    return { error: "Failed to join workshop. Please try again." };
  }
}
