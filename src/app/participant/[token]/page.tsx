import { notFound } from "next/navigation";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";

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
    <div className="container max-w-2xl py-8 space-y-4">
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Submit Your Reflection
              </h3>
              <p className="text-sm text-muted-foreground">
                After your group discussion, share your thoughts and insights
                with the facilitator.
              </p>
            </div>
            <Link href={`/participant/${token}/reflect`}>
              <Button className="w-full">Submit Reflection</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
