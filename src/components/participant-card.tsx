import { Card, CardContent } from "@/components/ui/card";
import { getCountryFlag } from "@/lib/utils/country-flag";

type ParticipantCardProps = {
  participant: {
    id: string;
    name: string;
    countryName: string;
    countryCode: string;
  };
};

export function ParticipantCard({ participant }: ParticipantCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="font-medium">{participant.name}</p>
          <p className="text-sm text-muted-foreground">
            {participant.countryName}
          </p>
        </div>
        <div className="text-2xl">
          {getCountryFlag(participant.countryCode)}
        </div>
      </CardContent>
    </Card>
  );
}
