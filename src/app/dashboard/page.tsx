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

export default async function DashboardPage() {
  const user = await currentUser();

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
          <p className="text-sm text-muted-foreground">
            No workshops yet. Create your first workshop to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
