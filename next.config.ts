import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shorten the build output path to stay under Windows' path-length limit.
  distDir: ".n",
  reactCompiler: true,
};

export default nextConfig;
