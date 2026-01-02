import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCountryDistribution } from "@/lib/db/queries/workshop-queries";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET({ params }: RouteParams) {
  try {
    const { id: workshopId } = await params;
    const facilitatorId = await requireAuth();

    const distribution = await getCountryDistribution(workshopId, facilitatorId);

    return NextResponse.json(distribution);
  } catch (error) {
    console.error("Error fetching country distribution:", error);
    return NextResponse.json(
      { error: "Failed to fetch country distribution" },
      { status: 500 }
    );
  }
}
