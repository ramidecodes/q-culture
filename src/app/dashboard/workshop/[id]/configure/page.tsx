import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GroupingConfigForm } from "@/components/grouping-config-form";
import { GenerateGroupsButton } from "@/components/generate-groups-button";
import { requireAuth } from "@/lib/auth";
import { getWorkshopById } from "@/lib/db/queries/workshop-queries";
import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups } from "@/lib/db/schema";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConfigureGroupingPage({ params }: PageProps) {
  const { id } = await params;
  const userId = await requireAuth();

  const workshop = await getWorkshopById(id, userId);

  if (!workshop) {
    notFound();
  }

  // Check if groups already generated
  const groupsResult = await db
    .select({ count: count() })
    .from(groups)
    .where(eq(groups.workshopId, id));

  const hasGroups = (groupsResult[0]?.count ?? 0) > 0;
  const isDisabled = hasGroups || workshop.status === "closed";

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/workshop/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to workshop</span>
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Configure Grouping
          </h1>
          <p className="text-muted-foreground">{workshop.title}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grouping Configuration</CardTitle>
          <CardDescription>
            Configure the cultural framework and group size for generating
            diverse groups. This can only be changed before groups are
            generated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasGroups && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Groups have already been generated for this workshop. The
                configuration cannot be changed.
              </p>
            </div>
          )}

          {workshop.status === "closed" && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">
                This workshop is closed. The configuration cannot be changed.
              </p>
            </div>
          )}

          <GroupingConfigForm
            workshopId={id}
            currentConfig={{
              framework: workshop.framework,
              groupSize: workshop.groupSize,
            }}
            disabled={isDisabled}
          />
        </CardContent>
      </Card>

      {!hasGroups &&
        workshop.status !== "closed" &&
        workshop.framework &&
        workshop.groupSize !== null && (
          <Card>
            <CardHeader>
              <CardTitle>Generate Groups</CardTitle>
              <CardDescription>
                Once your configuration is saved, you can generate groups. The
                algorithm will create maximally diverse groups based on cultural
                distances.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Check participant count client-side would require an API call
                // For now, server-side validation will handle this
                return (
                  <GenerateGroupsButton
                    workshopId={id}
                    disabled={workshop.status === "closed"}
                  />
                );
              })()}
            </CardContent>
          </Card>
        )}
    </div>
  );
}
