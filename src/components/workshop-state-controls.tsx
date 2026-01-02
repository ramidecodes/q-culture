"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateWorkshopStatus } from "@/lib/actions/workshop-actions";
import type { WorkshopStatus } from "@/lib/db/schema/workshops";

type WorkshopStateControlsProps = {
  workshopId: string;
  currentStatus: WorkshopStatus;
};

export function WorkshopStateControls({
  workshopId,
  currentStatus,
}: WorkshopStateControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStatusUpdate = async (newStatus: WorkshopStatus) => {
    setError(null);

    startTransition(async () => {
      const result = await updateWorkshopStatus(workshopId, newStatus);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {currentStatus === "draft" && (
          <Button
            onClick={() => handleStatusUpdate("collecting")}
            disabled={isPending}
          >
            Start Collecting
          </Button>
        )}
        {currentStatus === "collecting" && (
          <Button
            onClick={() => handleStatusUpdate("grouped")}
            disabled={isPending}
          >
            Mark as Grouped
          </Button>
        )}
        {currentStatus === "grouped" && (
          <Button
            onClick={() => handleStatusUpdate("closed")}
            disabled={isPending}
            variant="destructive"
          >
            Close Workshop
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
