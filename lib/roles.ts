import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";

// El rol viaja en el session token (claim `metadata`, ver README → Staff), así que leerlo
// no cuesta nada. Si todavía no agregaste ese claim, lo buscamos en la cuenta con
// currentUser(): funciona igual, pero hace una llamada extra a la API de Clerk.
export const esStaff = cache(async () => {
  const { isAuthenticated, sessionClaims } = await auth();
  if (!isAuthenticated) return false;

  if (sessionClaims?.metadata) {
    return sessionClaims.metadata.role === "staff";
  }

  const user = await currentUser();
  return user?.publicMetadata.role === "staff";
});
