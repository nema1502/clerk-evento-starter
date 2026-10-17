import { clerkClient, type User } from "@clerk/nextjs/server";
import { fechaCorta } from "@/lib/evento";

export type Persona = {
  id: string;
  nombre: string;
  correo: string;
  foto: string | null;
  // Fechas en ISO 8601 (o null) y ya formateadas para mostrar en pantalla.
  inscrito: string | null;
  checkin: string | null;
  inscritoTexto: string;
  checkinTexto: string;
};

export function correoDe(user: User) {
  return user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";
}

export function nombreDe(user: User) {
  const nombre = user.fullName?.trim() || user.username;
  return nombre || correoDe(user).split("@")[0] || "Sin nombre";
}

// Sin foto propia, Clerk devuelve un avatar genérico: para reconocer a alguien no sirve.
export function fotoDe(user: User) {
  return user.hasImage ? user.imageUrl : null;
}

export function aPersona(user: User): Persona {
  const evento = user.publicMetadata.evento;
  return {
    id: user.id,
    nombre: nombreDe(user),
    correo: correoDe(user),
    foto: fotoDe(user),
    inscrito: evento?.inscrito ?? null,
    checkin: evento?.checkin ?? null,
    inscritoTexto: fechaCorta(evento?.inscrito),
    checkinTexto: fechaCorta(evento?.checkin),
  };
}

// Sin base de datos: pedimos todas las cuentas a Clerk (hasta 500 por página) y
// filtramos en memoria las que confirmaron asistencia en su publicMetadata.
export async function listarInscripciones() {
  const client = await clerkClient();
  const cuentas: User[] = [];
  let totalCuentas = 0;

  do {
    const { data, totalCount } = await client.users.getUserList({
      limit: 500,
      offset: cuentas.length,
      orderBy: "-created_at",
    });
    totalCuentas = totalCount;
    if (data.length === 0) break;
    cuentas.push(...data);
  } while (cuentas.length < totalCuentas);

  const inscripciones = cuentas
    .map(aPersona)
    .filter((p) => p.inscrito)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return { totalCuentas, inscripciones };
}

// Restricción opcional por dominio de correo (alternativa gratis al allowlist de Clerk).
// DOMINIOS_PERMITIDOS=miuniversidad.edu.bo,otra.org → acepta esos dominios y sus subdominios.
export function dominiosPermitidos() {
  return (process.env.DOMINIOS_PERMITIDOS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export function cuentaPermitida(user: User) {
  const dominios = dominiosPermitidos();
  if (dominios.length === 0) return true;

  return user.emailAddresses.some((correo) => {
    if (correo.verification?.status !== "verified") return false;
    const dominio = correo.emailAddress.split("@")[1]?.toLowerCase() ?? "";
    return dominios.some((d) => dominio === d || dominio.endsWith(`.${d}`));
  });
}
