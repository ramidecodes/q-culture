import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getVisualizationData } from "@/lib/db/queries/visualization-queries";
import type { Framework } from "@/types/cultural";

type RouteParams = Promise<{ id: string }>;

export async function GET(
  request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;
    const userId = await requireAuth();

    // Get framework from query params
    const searchParams = new URL(request.url).searchParams;
    const frameworkParam = searchParams.get("framework");
    const framework: Framework = (frameworkParam as Framework) || "combined";

    // Get visualization data (includes auth check)
    const result = await getVisualizationData(id, userId, framework);

    if (!result.success) {
      if (result.error === "workshop_not_found") {
        return NextResponse.json(
          { error: "Workshop not found" },
          { status: 404 }
        );
      }

      if (result.error === "insufficient_participants") {
        return NextResponse.json(
          {
            error: "Insufficient participants",
            participantCount: result.participantCount,
          },
          { status: 400 }
        );
      }

      if (result.error === "framework_unavailable") {
        return NextResponse.json(
          {
            error: "Framework unavailable for these participants",
            availableFrameworks: result.availableFrameworks,
            missingCountries: result.missingCountries,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to compute distance matrix" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error computing distance matrix:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to compute distance matrix",
      },
      { status: 500 }
    );
  }
}
