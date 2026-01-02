import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWorkshopParticipants } from "@/lib/db/queries/workshop-queries";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET({ params }: RouteParams) {
  try {
    const { id: workshopId } = await params;
    const facilitatorId = await requireAuth();

    const participants = await getWorkshopParticipants(
      workshopId,
      facilitatorId
    );

    return NextResponse.json(participants);
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}
