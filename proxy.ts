import { clerkMiddleware } from "@clerk/nextjs/server";

// En Next.js 16 este archivo se llama proxy.ts (antes middleware.ts).
// clerkMiddleware() lee la sesión en cada request para que auth() funcione.
// La protección se hace en cada página, API y Server Action (ver app/pase, app/staff,
// app/api/inscritos y app/acciones.ts), como recomienda la documentación actual de Clerk.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Omite archivos internos de Next.js y archivos estáticos
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Siempre corre para las rutas de API (el CSV se descarga desde /api/inscritos)
    "/(api|trpc)(.*)",
    // Siempre corre para las rutas internas de Clerk
    "/__clerk/(.*)",
  ],
};
