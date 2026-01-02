import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReflectionList } from "@/components/reflection-list";
import { requireAuth } from "@/lib/auth";
import { getWorkshopById } from "@/lib/db/queries/workshop-queries";
import { getWorkshopReflectionsWithMissing } from "@/lib/db/queries/reflection-queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReflectionsPage({ params }: PageProps) {
  const { id } = await params;
  const userId = await requireAuth();

  // Verify facilitator owns workshop
  const workshop = await getWorkshopById(id, userId);

  if (!workshop) {
    notFound();
  }

  // Check if groups are generated (workshop status must be "grouped" or "closed")
  if (workshop.status === "draft" || workshop.status === "collecting") {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Reflections Not Available</CardTitle>
            <CardDescription>
              Reflections are available after groups are generated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please generate groups for this workshop first to enable reflection
              viewing.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedReflections = await getWorkshopReflectionsWithMissing(
    id,
    userId
  );

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Participant Reflections
        </h1>
        <p className="text-muted-foreground">
          Review all participant reflections organized by group.
        </p>
      </div>

      {groupedReflections.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No reflections found for this workshop.</p>
          </CardContent>
        </Card>
      ) : (
        <ReflectionList reflections={groupedReflections} />
      )}
    </div>
  );
}
