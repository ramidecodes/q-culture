import { notFound } from "next/navigation";
import { getParticipantGroup } from "@/lib/db/queries/participant-queries";
import { ParticipantGroupCard } from "@/components/participant-group-card";
import { GroupAssignmentPoller } from "@/components/group-assignment-poller";
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

  const data = await getParticipantGroup(token);

  if (!data) {
    notFound();
  }

  if (!data.group) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {data.participant.name}!</CardTitle>
            <CardDescription>
              You have successfully joined the workshop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Waiting for Groups</h3>
              <p className="text-muted-foreground mb-4">
                Your facilitator is setting up groups. Please check back soon.
              </p>
              <GroupAssignmentPoller token={token} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {data.participant.name}!</CardTitle>
          <CardDescription>
            You have successfully joined the workshop.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ParticipantGroupCard
            group={data.group}
            members={data.members}
            currentParticipantId={data.participant.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
