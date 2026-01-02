import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: "Quantifying Culture",
    template: "%s | Quantifying Culture",
  },
  description:
    "Facilitator-led workshop application for cultural diversity. Enable anonymous participants to input their country of origin, compute cultural distances using established frameworks (Lewis, Hall, Hofstede), and generate maximally diverse small groups for discussion and reflection.",
  keywords: [
    "cultural diversity",
    "workshop",
    "cultural frameworks",
    "Hofstede",
    "Lewis model",
    "Hall framework",
    "group facilitation",
    "cross-cultural communication",
  ],
  authors: [{ name: "Quantifying Culture" }],
  creator: "Quantifying Culture",
  publisher: "Quantifying Culture",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Quantifying Culture",
    description: "Facilitator-led workshop application for cultural diversity",
    siteName: "Quantifying Culture",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quantifying Culture",
    description: "Facilitator-led workshop application for cultural diversity",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
