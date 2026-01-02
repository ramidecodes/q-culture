import { Badge } from "@/components/ui/badge";

type WorkshopStatus = "draft" | "collecting" | "grouped" | "closed";

const statusConfig: Record<
  WorkshopStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Draft", variant: "outline" },
  collecting: { label: "Collecting", variant: "default" },
  grouped: { label: "Grouped", variant: "secondary" },
  closed: { label: "Closed", variant: "outline" },
};

export function WorkshopStatusBadge({ status }: { status: WorkshopStatus }) {
  const config = statusConfig[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
