import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getVisualizationData } from "@/lib/db/queries/visualization-queries";
import type { Framework } from "@/lib/utils/cultural-distance";

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
    const data = await getVisualizationData(id, userId, framework);

    if (!data) {
      return NextResponse.json(
        { error: "Workshop not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
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
