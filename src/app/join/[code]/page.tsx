import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { workshops } from "@/lib/db/schema";
import { getAllCountries } from "@/lib/db/queries/country-queries";
import { ParticipantJoinForm } from "@/components/participant-join-form";

type JoinPageProps = {
  params: Promise<{ code: string }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params;

  // Validate join code and fetch workshop
  const workshop = await db.query.workshops.findFirst({
    where: eq(workshops.joinCode, code),
  });

  if (!workshop) {
    notFound();
  }

  // Check workshop status
  if (workshop.status !== "collecting") {
    return (
      <div className="container max-w-2xl py-8">
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold">
            Workshop Not Accepting Participants
          </h1>
          <p className="text-muted-foreground">
            The workshop &quot;{workshop.title}&quot; is currently in{" "}
            <span className="font-medium">{workshop.status}</span> status and is
            not accepting new participants at this time.
          </p>
        </div>
      </div>
    );
  }

  // Fetch countries for the form
  const countries = await getAllCountries();

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">Join Workshop</h1>
        <p className="text-muted-foreground">{workshop.title}</p>
      </div>
      <ParticipantJoinForm joinCode={code} countries={countries} />
    </div>
  );
}
