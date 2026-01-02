import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCountryFlag } from "@/lib/utils/country-flag";
import { cn } from "@/lib/utils";

type ParticipantGroupCardProps = {
  group: {
    groupNumber: number;
  };
  members: Array<{
    id: string;
    name: string;
    countryCode: string;
    countryName: string | null;
  }>;
  currentParticipantId: string;
};

export function ParticipantGroupCard({
  group,
  members,
  currentParticipantId,
}: ParticipantGroupCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Group {group.groupNumber}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-4">
            You&apos;ll be discussing with:
          </p>
          {members.map((member) => (
            <div
              key={member.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                member.id === currentParticipantId
                  ? "bg-primary/10 font-medium"
                  : "bg-muted/50"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {getCountryFlag(member.countryCode)}
                </span>
                <div>
                  <span className="flex items-center gap-2">
                    {member.name}
                    {member.id === currentParticipantId && (
                      <Badge variant="secondary">You</Badge>
                    )}
                  </span>
                  {member.countryName && (
                    <p className="text-sm text-muted-foreground">
                      {member.countryName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
