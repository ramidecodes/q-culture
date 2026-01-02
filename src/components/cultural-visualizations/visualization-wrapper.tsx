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
  const data = await getVisualizationData(workshopId, userId, framework);

  if (!data) {
    return (
      <div className="py-12">
        <div className="text-center text-sm text-destructive">
          Workshop not found or access denied
        </div>
      </div>
    );
  }

  return <VisualizationView initialData={data} workshopId={workshopId} />;
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
