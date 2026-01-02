"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AuthControls() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="h-8 w-20 animate-pulse rounded bg-muted" />;
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <UserButton />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost">
        <Link href="/sign-in">Sign In</Link>
      </Button>
      <Button>
        <Link href="/sign-up">Sign Up</Link>
      </Button>
    </div>
  );
}
