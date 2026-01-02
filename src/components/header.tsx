import Image from "next/image";
import Link from "next/link";
import { AuthControls } from "@/components/auth-controls";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/qc_logo.svg"
              alt="Quantifying Culture Logo"
              width={32}
              height={32}
              priority
              className="h-8 w-8"
            />
            <h1 className="text-lg font-semibold">Quantifying Culture</h1>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <AuthControls />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
