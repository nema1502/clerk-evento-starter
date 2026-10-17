// Da (o quita) el rol de staff a una cuenta usando la Backend API de Clerk.
// Uso:  pnpm staff ana@correo.com          → role: "staff"
//       pnpm staff ana@correo.com --quitar → quita el rol
// Lee CLERK_SECRET_KEY de .env.local (o de las variables de entorno).
import { existsSync, readFileSync } from "node:fs";

function leerClaveSecreta() {
  if (process.env.CLERK_SECRET_KEY) return process.env.CLERK_SECRET_KEY;
  for (const archivo of [".env.local", ".env"]) {
    if (!existsSync(archivo)) continue;
    const coincidencia = readFileSync(archivo, "utf8").match(
      /^\s*CLERK_SECRET_KEY\s*=\s*["']?([^"'\s#]+)/m,
    );
    if (coincidencia) return coincidencia[1];
  }
  return null;
}

const [correo, opcion] = process.argv.slice(2);
const quitar = opcion === "--quitar";
const clave = leerClaveSecreta();

if (!correo || !correo.includes("@")) {
  console.error("Uso: pnpm staff tu@correo.com [--quitar]");
  process.exit(1);
}
if (!clave || clave.includes("REEMPLAZAR")) {
  console.error("No encontramos CLERK_SECRET_KEY. Corre `pnpm dev` una vez o revisa tu .env.local.");
  process.exit(1);
}

const api = (ruta, opciones = {}) =>
  fetch(`https://api.clerk.com/v1${ruta}`, {
    ...opciones,
    headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
  });

const respuesta = await api(`/users?email_address=${encodeURIComponent(correo)}`);
if (!respuesta.ok) {
  console.error(`La API de Clerk respondió ${respuesta.status}: ${await respuesta.text()}`);
  process.exit(1);
}
const [cuenta] = await respuesta.json();
if (!cuenta) {
  console.error(`No hay ninguna cuenta con el correo ${correo}. Primero crea la cuenta en la app.`);
  process.exit(1);
}

// PATCH /metadata hace un merge profundo; null borra la clave.
const cambio = await api(`/users/${cuenta.id}/metadata`, {
  method: "PATCH",
  body: JSON.stringify({ public_metadata: { role: quitar ? null : "staff" } }),
});
if (!cambio.ok) {
  console.error(`No se pudo actualizar el rol (${cambio.status}): ${await cambio.text()}`);
  process.exit(1);
}

console.log(
  quitar
    ? `Hecho: ${correo} ya no tiene el rol de staff.`
    : `Hecho: ${correo} ahora tiene el rol de staff. Debe cerrar sesión y volver a entrar si ya tenía una sesión abierta.`,
);
