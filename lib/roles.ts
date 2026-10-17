import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { usuarioActual } from "@/lib/usuario";

// El rol viaja en el session token (claim `metadata`, ver README → Staff), así que leerlo
// no cuesta nada. Si todavía no agregaste ese claim, lo buscamos en la cuenta: funciona
// igual, pero gasta una llamada a la API de Clerk (compartida con la página que la necesite).
export const esStaff = cache(async () => {
  const { isAuthenticated, sessionClaims } = await auth();
  if (!isAuthenticated) return false;

  if (sessionClaims?.metadata) {
    return sessionClaims.metadata.role === "staff";
  }

  const user = await usuarioActual();
  return user?.publicMetadata.role === "staff";
});
