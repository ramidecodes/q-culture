"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkshopStatusBadge } from "@/components/workshop-status-badge";
import { deleteWorkshop } from "@/lib/actions/workshop-actions";
import type { WorkshopStatus } from "@/lib/db/schema/workshops";

type Workshop = {
  id: string;
  title: string;
  date: string | null;
  joinCode: string;
  status: WorkshopStatus;
  framework: string | null;
  groupSize: number | null;
  createdAt: Date;
  participantCount: number;
};

type WorkshopListProps = {
  workshops: Workshop[];
};

export function WorkshopList({ workshops }: WorkshopListProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workshopToDelete, setWorkshopToDelete] = useState<Workshop | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteClick = (workshop: Workshop) => {
    setWorkshopToDelete(workshop);
    setDeleteDialogOpen(true);
    setError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!workshopToDelete) return;

    setIsDeleting(true);
    setError(null);

    const result = await deleteWorkshop(workshopToDelete.id);

    if ("error" in result) {
      setError(result.error);
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setWorkshopToDelete(null);
    router.refresh();
  };

  const handleDialogClose = () => {
    if (!isDeleting) {
      setDeleteDialogOpen(false);
      setWorkshopToDelete(null);
      setError(null);
    }
  };

  if (workshops.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No workshops yet. Create your first workshop to get started.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {workshops.map((workshop) => (
          <Card
            key={workshop.id}
            className="hover:bg-accent/50 transition-colors"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-xl">
                    <Link
                      href={`/dashboard/workshop/${workshop.id}`}
                      className="hover:underline"
                    >
                      {workshop.title}
                    </Link>
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <WorkshopStatusBadge status={workshop.status} />
                    <span className="text-xs text-muted-foreground">
                      Code: {workshop.joinCode}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(workshop)}
                  title="Delete workshop"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {workshop.date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(workshop.date).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>
                    {workshop.participantCount}{" "}
                    {workshop.participantCount === 1
                      ? "participant"
                      : "participants"}
                  </span>
                </div>
              </div>
              {workshop.framework && (
                <CardDescription className="text-xs">
                  Framework:{" "}
                  {workshop.framework.charAt(0).toUpperCase() +
                    workshop.framework.slice(1)}
                  {workshop.groupSize && ` • Group size: ${workshop.groupSize}`}
                </CardDescription>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workshop</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{workshopToDelete?.title}
              &quot;? This will permanently delete:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>The workshop and all its settings</li>
              <li>
                All {workshopToDelete?.participantCount || 0} participant
                records
              </li>
              <li>All generated groups and assignments</li>
              <li>All participant reflections</li>
            </ul>
            <p className="mt-4 text-sm font-medium text-destructive">
              This action cannot be undone.
            </p>
          </div>
          {error && (
            <div className="text-sm font-medium text-destructive">{error}</div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDialogClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Workshop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
