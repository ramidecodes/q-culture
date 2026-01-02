import { Loader2 } from "lucide-react";

export function VisualizationSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Computing cultural distances...
        </p>
      </div>
    </div>
  );
}
