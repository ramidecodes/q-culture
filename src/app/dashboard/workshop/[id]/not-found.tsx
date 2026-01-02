import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkshopNotFound() {
  return (
    <div className="container max-w-2xl py-16">
      <Card>
        <CardHeader>
          <CardTitle>Workshop Not Found</CardTitle>
          <CardDescription>
            The workshop you're looking for doesn't exist or you don't have access to it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
