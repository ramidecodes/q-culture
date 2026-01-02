"use client";

import useSWR from "swr";
import { ParticipantCard } from "@/components/participant-card";
import { Badge } from "@/components/ui/badge";

type Participant = {
  id: string;
  name: string;
  countryName: string;
  countryCode: string;
  joinedAt: Date;
};

const fetcher = async (url: string): Promise<Participant[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch participants");
  }
  const data = await response.json();
  return data.map((p: Participant) => ({
    ...p,
    joinedAt: new Date(p.joinedAt),
  }));
};

type ParticipantListProps = {
  workshopId: string;
};

export function ParticipantList({ workshopId }: ParticipantListProps) {
  const { data, isLoading, error } = useSWR<Participant[]>(
    `/api/workshop/${workshopId}/participants`,
    fetcher,
    { refreshInterval: 5000 }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading participants</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No participants have joined yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Share the join code to invite participants
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Badge variant="secondary" className="text-base px-3 py-1">
          Total: {data.length} participant{data.length !== 1 ? "s" : ""}
        </Badge>
      </div>
      <div className="grid gap-4">
        {data.map((participant) => (
          <ParticipantCard key={participant.id} participant={participant} />
        ))}
      </div>
    </div>
  );
}
