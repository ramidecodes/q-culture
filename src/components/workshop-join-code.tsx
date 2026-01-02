"use client";

import { Check, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WorkshopJoinCode({ joinCode }: { joinCode: string }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [joinUrl, setJoinUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setJoinUrl(`${window.location.origin}/join/${joinCode}`);
    }
  }, [joinCode]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="join-code"
          className="text-sm font-medium text-muted-foreground mb-2 block"
        >
          Join Code
        </label>
        <div className="flex gap-2">
          <Input
            id="join-code"
            value={joinCode}
            readOnly
            className="font-mono text-lg font-semibold tracking-wider text-center"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopyCode}
            className="shrink-0"
          >
            {copiedCode ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div>
        <label
          htmlFor="join-url"
          className="text-sm font-medium text-muted-foreground mb-2 block"
        >
          Join URL
        </label>
        <div className="flex gap-2">
          <Input
            id="join-url"
            value={joinUrl}
            readOnly
            className="font-mono text-sm text-center"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopyUrl}
            className="shrink-0"
            title="Copy join URL"
          >
            {copiedUrl ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
