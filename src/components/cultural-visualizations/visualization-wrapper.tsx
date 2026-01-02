import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { getVisualizationData } from "@/lib/db/queries/visualization-queries";
import { VisualizationView } from "./visualization-view";
import { VisualizationSkeleton } from "./visualization-skeleton";
import type { Framework } from "@/types/cultural";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type VisualizationWrapperProps = {
  workshopId: string;
  framework: Framework;
};

async function VisualizationData({
  workshopId,
  framework,
}: VisualizationWrapperProps) {
  const userId = await requireAuth();
  const result = await getVisualizationData(workshopId, userId, framework);

  if (!result.success) {
    if (result.error === "workshop_not_found") {
      return (
        <div className="py-12">
          <div className="text-center text-sm text-destructive">
            Workshop not found or access denied
          </div>
        </div>
      );
    }

    if (result.error === "insufficient_participants") {
      return (
        <div className="py-12">
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              At least 2 participants are needed for distance visualization
            </div>
            {result.participantCount !== undefined && (
              <div className="text-xs text-muted-foreground">
                Current participants: {result.participantCount}
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <VisualizationView initialData={result.data} workshopId={workshopId} />
  );
}

export function VisualizationWrapper({
  workshopId,
  framework,
}: VisualizationWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cultural Distance Visualization</CardTitle>
        <CardDescription>
          Explore cultural distances between participants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<VisualizationSkeleton />}>
          <VisualizationData workshopId={workshopId} framework={framework} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
