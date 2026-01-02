"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { generateWorkshopGroups } from "@/lib/actions/grouping-actions";
import { useRouter } from "next/navigation";

type GenerateGroupsButtonProps = {
  workshopId: string;
  disabled?: boolean;
};

export function GenerateGroupsButton({
  workshopId,
  disabled = false,
}: GenerateGroupsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateWorkshopGroups(workshopId);

      if ("error" in result) {
        setError(result.error);
        setIsGenerating(false);
        return;
      }

      // Success - refresh the page to show groups
      router.refresh();
    } catch (_err) {
      setError("An unexpected error occurred. Please try again.");
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || disabled}
        className="w-full sm:w-auto"
      >
        {isGenerating ? (
          <>
            <Users className="mr-2 h-4 w-4 animate-pulse" />
            Generating Groups...
          </>
        ) : (
          <>
            <Users className="mr-2 h-4 w-4" />
            Generate Groups
          </>
        )}
      </Button>
      {error && (
        <div className="text-sm font-medium text-destructive">{error}</div>
      )}
    </div>
  );
}
