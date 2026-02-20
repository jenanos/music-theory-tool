import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/theory", "@repo/voicings", "@repo/db", "@repo/ui"],
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
