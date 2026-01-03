import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Rami Labs. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <Link
              href="/terms"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
