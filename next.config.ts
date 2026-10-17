import type { NextConfig } from "next";

// Nota: create-next-app activa `cacheComponents` por defecto. Lo quitamos para que
// las páginas que leen la sesión (auth(), currentUser()) funcionen sin <Suspense> extra.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
