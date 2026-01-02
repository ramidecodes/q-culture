import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { participants, workshops } from "@/lib/db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ParticipantPageProps = {
  params: Promise<{ token: string }>;
};

export default async function ParticipantPage({
  params,
}: ParticipantPageProps) {
  const { token } = await params;

  // Find participant by session token
  const participant = await db.query.participants.findFirst({
    where: eq(participants.sessionToken, token),
  });

  if (!participant) {
    notFound();
  }

  // Fetch workshop details
  const workshop = await db.query.workshops.findFirst({
    where: eq(workshops.id, participant.workshopId),
  });

  if (!workshop) {
    notFound();
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {participant.name}!</CardTitle>
          <CardDescription>
            You have successfully joined the workshop.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Workshop Details</h3>
            <p className="text-muted-foreground">
              <strong>Workshop:</strong> {workshop.title}
            </p>
            <p className="text-muted-foreground">
              <strong>Status:</strong> {workshop.status}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Your Information</h3>
            <p className="text-muted-foreground">
              <strong>Name:</strong> {participant.name}
            </p>
            <p className="text-muted-foreground">
              <strong>Country Code:</strong> {participant.countryCode}
            </p>
            <p className="text-muted-foreground">
              <strong>Joined:</strong>{" "}
              {new Date(participant.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              This is a placeholder page. The full participant status view will
              be implemented in a future update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
