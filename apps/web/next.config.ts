import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/theory", "@repo/voicings", "@repo/db", "@repo/ui"],
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
