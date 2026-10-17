import type { NextConfig } from "next";

// Nota: create-next-app activa `cacheComponents` por defecto. Lo quitamos para que
// las páginas que leen la sesión (auth(), currentUser()) funcionen sin <Suspense> extra.
const nextConfig: NextConfig = {
  // Fotos de perfil de Clerk para <Image> (components/avatar.tsx).
  images: {
    remotePatterns: [{ protocol: "https", hostname: "img.clerk.com" }],
  },
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
