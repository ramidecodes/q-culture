import { notFound } from "next/navigation";
import { getParticipantGroup } from "@/lib/db/queries/participant-queries";
import { ReflectionForm } from "@/components/reflection-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ReflectionPageProps = {
  params: Promise<{ token: string }>;
};

export default async function ReflectionPage({
  params,
}: ReflectionPageProps) {
  const { token } = await params;

  const data = await getParticipantGroup(token);

  if (!data) {
    notFound();
  }

  // Check if groups are assigned
  if (!data.group) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Reflection Submission</CardTitle>
            <CardDescription>
              Groups have not been assigned yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                Waiting for Groups
              </h3>
              <p className="text-muted-foreground">
                Your facilitator is setting up groups. Please check back once
                groups have been assigned to submit your reflection.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <ReflectionForm token={token} />
    </div>
  );
}
