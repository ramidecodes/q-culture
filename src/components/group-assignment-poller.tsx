"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";

type GroupAssignmentResponse = {
  participant: {
    id: string;
    name: string;
    countryCode: string;
  };
  group: {
    id: string;
    groupNumber: number;
  } | null;
  members: Array<{
    id: string;
    name: string;
    countryCode: string;
    countryName: string | null;
  }>;
};

const fetcher = async (
  url: string
): Promise<GroupAssignmentResponse | null> => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch group assignment");
  }
  return response.json();
};

type GroupAssignmentPollerProps = {
  token: string;
};

export function GroupAssignmentPoller({ token }: GroupAssignmentPollerProps) {
  const router = useRouter();
  const hasRefreshedRef = useRef(false);

  const { data } = useSWR<GroupAssignmentResponse | null>(
    `/api/participant/${token}/group`,
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds
    }
  );

  useEffect(() => {
    if (data?.group && !hasRefreshedRef.current) {
      // Groups assigned, refresh page
      hasRefreshedRef.current = true;
      router.refresh();
    }
  }, [data, router]);

  return (
    <div className="text-sm text-muted-foreground flex items-center gap-2">
      <span className="inline-block h-2 w-2 bg-primary rounded-full animate-pulse" />
      Checking for group assignment...
    </div>
  );
}
