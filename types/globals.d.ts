export {};

// Roles de tu app. Agrega los que necesites (por ejemplo: "jurado", "mentora").
export type Roles = "staff";

// Lo que guardamos del evento en cada cuenta. Fechas en formato ISO 8601.
export interface EventoMetadata {
  inscrito?: string | null;
  checkin?: string | null;
}

declare global {
  // publicMetadata de cada cuenta de Clerk: la "base de datos" de esta plantilla.
  // Solo se puede escribir desde el servidor (Backend API); el navegador solo la lee.
  interface UserPublicMetadata {
    role?: Roles;
    evento?: EventoMetadata;
  }

  // Lo que viaja dentro del session token si agregaste el claim `metadata` (README → Staff).
  interface CustomJwtSessionClaims {
    metadata?: UserPublicMetadata;
  }
}
