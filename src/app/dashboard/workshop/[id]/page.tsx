import { Calendar, Settings } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { WorkshopJoinCode } from "@/components/workshop-join-code";
import { WorkshopQRCode } from "@/components/workshop-qr-code";
import { WorkshopStateControls } from "@/components/workshop-state-controls";
import { WorkshopStatusBadge } from "@/components/workshop-status-badge";
import { ParticipantList } from "@/components/participant-list";
import { CountryDistribution } from "@/components/country-distribution";
import { GenerateGroupsButton } from "@/components/generate-groups-button";
import { VisualizationWrapper } from "@/components/cultural-visualizations/visualization-wrapper";
import { ReflectionList } from "@/components/reflection-list";
import { requireAuth } from "@/lib/auth";
import { getWorkshopById } from "@/lib/db/queries/workshop-queries";
import { getWorkshopReflectionsWithMissing } from "@/lib/db/queries/reflection-queries";
import { db } from "@/lib/db";
import { groups } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import type { Framework } from "@/types/cultural";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkshopPage({ params }: PageProps) {
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

  // Get reflections if groups are generated
  const groupedReflections =
    hasGroups && (workshop.status === "grouped" || workshop.status === "closed")
      ? await getWorkshopReflectionsWithMissing(id, userId)
      : [];

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {workshop.title}
            </h1>
            <WorkshopStatusBadge status={workshop.status} />
          </div>
          {workshop.date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(`${workshop.date}T00:00:00`).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Join Code</CardTitle>
            <CardDescription>
              Share this code with participants so they can join your workshop
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <WorkshopJoinCode joinCode={workshop.joinCode} />
            <div className="border-t pt-6">
              <WorkshopQRCode joinCode={workshop.joinCode} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workshop Details</CardTitle>
            <CardDescription>Information about this workshop</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Status
              </div>
              <div className="mt-1">
                <WorkshopStatusBadge status={workshop.status} />
              </div>
            </div>
            {workshop.framework && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Framework
                </div>
                <div className="mt-1 text-sm">{workshop.framework}</div>
              </div>
            )}
            {workshop.groupSize !== undefined && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Group Size
                </div>
                <div className="mt-1 text-sm">
                  {workshop.groupSize === null
                    ? "Flexible (3-4 participants)"
                    : `${workshop.groupSize} participants per group`}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Created
              </div>
              <div className="mt-1 text-sm">
                {new Date(workshop.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="visualizations">Cultural Distances</TabsTrigger>
          {hasGroups &&
            (workshop.status === "grouped" || workshop.status === "closed") && (
              <TabsTrigger value="reflections">Reflections</TabsTrigger>
            )}
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workshop Overview</CardTitle>
              <CardDescription>
                Manage your workshop and track participant progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {workshop.status === "draft" &&
                  "Your workshop is in draft mode. Start collecting participants when you're ready."}
                {workshop.status === "collecting" &&
                  "Your workshop is accepting participants. Share the join code to invite people."}
                {workshop.status === "grouped" &&
                  "Participants have been assigned to groups. They can now view their groups and submit reflections."}
                {workshop.status === "closed" &&
                  "This workshop is closed. No further actions can be taken."}
              </p>
              {workshop.status !== "closed" && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Workshop State
                  </div>
                  <WorkshopStateControls
                    workshopId={workshop.id}
                    currentStatus={workshop.status}
                  />
                </div>
              )}
              {!hasGroups && workshop.status !== "closed" && (
                <div className="space-y-4">
                  {(!workshop.framework || workshop.groupSize === null) && (
                    <div>
                      <Button asChild variant="outline">
                        <Link href={`/dashboard/workshop/${id}/configure`}>
                          <Settings className="mr-2 h-4 w-4" />
                          Configure Grouping
                        </Link>
                      </Button>
                    </div>
                  )}
                  {workshop.framework && workshop.groupSize !== null && (
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium mb-2">
                          Ready to Generate Groups
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Your grouping configuration is complete. Click the
                          button below to generate diverse groups based on
                          cultural distances.
                        </p>
                        <GenerateGroupsButton workshopId={workshop.id} />
                      </div>
                      <div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/workshop/${id}/configure`}>
                            <Settings className="mr-2 h-4 w-4" />
                            Change Configuration
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="participants" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Participants</CardTitle>
                  <CardDescription>
                    View all participants who have joined your workshop
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ParticipantList workshopId={workshop.id} />
                </CardContent>
              </Card>
            </div>
            <div>
              <CountryDistribution workshopId={workshop.id} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="visualizations" className="space-y-6">
          <VisualizationWrapper
            workshopId={workshop.id}
            framework={(workshop.framework as Framework) || "combined"}
          />
        </TabsContent>
        {hasGroups &&
          (workshop.status === "grouped" || workshop.status === "closed") && (
            <TabsContent value="reflections" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Participant Reflections</CardTitle>
                  <CardDescription>
                    Review all participant reflections organized by group.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {groupedReflections.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No reflections found for this workshop.</p>
                    </div>
                  ) : (
                    <ReflectionList reflections={groupedReflections} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
      </Tabs>
    </div>
  );
}
