import { Calendar } from "lucide-react";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorkshopJoinCode } from "@/components/workshop-join-code";
import { WorkshopStateControls } from "@/components/workshop-state-controls";
import { WorkshopStatusBadge } from "@/components/workshop-status-badge";
import { requireAuth } from "@/lib/auth";
import { getWorkshopById } from "@/lib/db/queries/workshop-queries";

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
          <CardContent>
            <WorkshopJoinCode joinCode={workshop.joinCode} />
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
            {workshop.groupSize && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Group Size
                </div>
                <div className="mt-1 text-sm">
                  {workshop.groupSize} participants per group
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
        </CardContent>
      </Card>
    </div>
  );
}
