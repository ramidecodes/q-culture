"use client";

import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function GetStartedButton() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <Button size="lg" disabled>
        Get Started
      </Button>
    );
  }

  if (isSignedIn) {
    return (
      <Button size="lg">
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    );
  }

  return (
    <Button size="lg">
      <Link href="/sign-up">Get Started</Link>
    </Button>
  );
}
