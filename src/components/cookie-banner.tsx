"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { X } from "lucide-react";

const COOKIE_CONSENT_KEY = "qc-cookie-consent";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has been given
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to ensure smooth appearance
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg animate-in slide-in-from-bottom duration-300"
    >
      <div className="container py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-1">
            <p className="text-sm text-foreground">
              We use cookies to enhance your experience and analyze site usage.
              By clicking "Accept", you consent to our use of cookies.{" "}
              <Link
                href="/privacy"
                className="text-primary underline hover:text-primary/80"
              >
                Learn more
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              aria-label="Decline cookies"
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              aria-label="Accept cookies"
            >
              Accept
            </Button>
            <button
              type="button"
              onClick={handleDecline}
              className="ml-2 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close cookie banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
