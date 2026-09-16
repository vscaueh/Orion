import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O core é publicado como TypeScript puro; o Next compila junto.
  transpilePackages: ["@orion/core"],

  experimental: {
    serverActions: {
      // Server Actions comparam o Origin do navegador com o Host que o
      // servidor enxerga, como defesa contra CSRF. Atrás de um proxy
      // (Codespaces) o Host chega como localhost e a requisição seria
      // recusada; estes domínios de desenvolvimento são liberados.
      allowedOrigins: ["*.app.github.dev", "localhost:3000"],
    },
  },
};

export default nextConfig;
