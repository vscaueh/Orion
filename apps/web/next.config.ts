import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O core é publicado como TypeScript puro; o Next compila junto.
  transpilePackages: ["@orion/core"],
};

export default nextConfig;
