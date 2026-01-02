import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  // optimizePackageImports is no longer experimental in Next.js 16
  optimizePackageImports: ["@/components/ui"],
};

export default nextConfig;
