import { currentUser } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorkshopList } from "@/components/workshop-list";
import { requireAuth } from "@/lib/auth";
import { getWorkshopsByFacilitator } from "@/lib/db/queries/workshop-queries";

export default async function DashboardPage() {
  const user = await currentUser();
  const userId = await requireAuth();

  const workshops = await getWorkshopsByFacilitator(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back,{" "}
            {user?.firstName ||
              user?.emailAddresses[0]?.emailAddress ||
              "Facilitator"}
            !
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new-workshop">
            <Plus className="mr-2 h-4 w-4" />
            Create Workshop
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Workshops</CardTitle>
          <CardDescription>
            Manage and monitor your cultural diversity workshops
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkshopList workshops={workshops} />
        </CardContent>
      </Card>
    </div>
  );
}
