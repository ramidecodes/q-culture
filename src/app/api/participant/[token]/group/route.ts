import { NextResponse } from "next/server";
import { getParticipantGroup } from "@/lib/db/queries/participant-queries";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { token } = await params;
    const data = await getParticipantGroup(token);

    if (!data) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching participant group:", error);
    return NextResponse.json(
      { error: "Failed to fetch group assignment" },
      { status: 500 }
    );
  }
}
