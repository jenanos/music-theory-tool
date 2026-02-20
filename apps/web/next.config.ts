import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/theory", "@repo/voicings", "@repo/db", "@repo/ui"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
