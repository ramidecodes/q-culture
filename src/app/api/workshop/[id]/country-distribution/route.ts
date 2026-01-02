import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCountryDistribution } from "@/lib/db/queries/workshop-queries";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id: workshopId } = await params;
    const facilitatorId = await requireAuth();

    const distribution = await getCountryDistribution(
      workshopId,
      facilitatorId
    );

    return NextResponse.json(distribution);
  } catch (error) {
    console.error("Error fetching country distribution:", error);
    return NextResponse.json(
      { error: "Failed to fetch country distribution" },
      { status: 500 }
    );
  }
}
