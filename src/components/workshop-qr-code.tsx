"use client";

import { QRCodeSVG } from "qrcode.react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type WorkshopQRCodeProps = {
  joinCode: string;
};

export function WorkshopQRCode({ joinCode }: WorkshopQRCodeProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const joinUrl = `${baseUrl}/join/${joinCode}`;

  // Determine colors based on theme
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const fgColor = isDark ? "#ffffff" : "#000000";
  const bgColor = isDark ? "#111827" : "#ffffff";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <QRCodeSVG
          value={joinUrl}
          size={220}
          level="M"
          includeMargin={true}
          fgColor={fgColor}
          bgColor={bgColor}
        />
      </div>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Scan this QR code with your phone to join the workshop
      </p>
    </div>
  );
}
