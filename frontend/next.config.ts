import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the tracing root to this app so standalone output is correct in Docker
  // and the multi-lockfile inference warning is silenced.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
