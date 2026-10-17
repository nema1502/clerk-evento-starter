"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { refresh } from "next/cache";
import { hora } from "@/lib/evento";
import { correoDe, cuentaPermitida, fotoDe, nombreDe } from "@/lib/inscripciones";
import { esStaff } from "@/lib/roles";

// Las Server Actions son endpoints públicos: cada una verifica la sesión y el rol en el
// servidor, aunque la interfaz ya oculte los botones a quien no corresponde.

export async function confirmarAsistencia() {
  const user = await currentUser();
  if (!user) throw new Error("Inicia sesión para confirmar tu asistencia.");
  if (!cuentaPermitida(user)) throw new Error("Tu correo no está habilitado para este evento.");
  if (user.publicMetadata.evento?.inscrito) return;

  const client = await clerkClient();
  // updateUserMetadata hace un merge profundo: no borra el rol ni el check-in.
  await client.users.updateUserMetadata(user.id, {
    publicMetadata: { evento: { inscrito: new Date().toISOString() } },
  });
  refresh();
}

export async function cancelarAsistencia() {
  const user = await currentUser();
  if (!user) throw new Error("Inicia sesión primero.");
  if (user.publicMetadata.evento?.checkin) {
    throw new Error("Ya hiciste check-in: habla con el staff si necesitas cambiar algo.");
  }

  const client = await clerkClient();
  // null borra la clave dentro del merge.
  await client.users.updateUserMetadata(user.id, {
    publicMetadata: { evento: { inscrito: null } },
  });
  refresh();
}

export type ResultadoCheckin =
  | {
      estado: "ok" | "repetido";
      nombre: string;
      correo: string;
      // Foto de perfil (null si la cuenta no tiene) para comparar con quien muestra el QR.
      foto: string | null;
      hora: string;
      sinInscripcion: boolean;
    }
  | { estado: "error"; mensaje: string };

// El QR del pase contiene el userId. Aceptamos texto con más cosas alrededor
// (por ejemplo, una URL) y nos quedamos con el userId.
function extraerUserId(codigo: string) {
  return codigo.match(/user_[A-Za-z0-9]{10,64}/)?.[0] ?? null;
}

// Código HTTP de un error de la Backend API de Clerk (404, 429…), si lo trae.
function estadoHttp(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error
    ? error.status
    : undefined;
}

export async function hacerCheckin(codigo: string): Promise<ResultadoCheckin> {
  try {
    return await registrarCheckin(codigo);
  } catch (error) {
    // Con mucha gente en la puerta, la API de desarrollo puede responder 429 (README → Límites).
    return {
      estado: "error",
      mensaje:
        estadoHttp(error) === 429
          ? "Clerk recibió demasiadas solicitudes seguidas. Espera unos segundos y vuelve a intentarlo."
          : "No se pudo guardar el check-in. Revisa tu conexión e inténtalo de nuevo.",
    };
  }
}

async function registrarCheckin(codigo: string): Promise<ResultadoCheckin> {
  if (!(await esStaff())) {
    return { estado: "error", mensaje: "Solo el staff puede hacer check-in." };
  }

  const userId = extraerUserId(String(codigo));
  if (!userId) {
    return { estado: "error", mensaje: "Ese código no es un pase de este evento." };
  }

  const client = await clerkClient();
  // Solo un 404 significa "no existe"; otros errores (red, 429) suben al catch de arriba.
  const user = await client.users.getUser(userId).catch((error: unknown) => {
    if (estadoHttp(error) === 404) return null;
    throw error;
  });
  if (!user) {
    return { estado: "error", mensaje: "No encontramos ninguna cuenta con ese código." };
  }

  const evento = user.publicMetadata.evento;
  const persona = { nombre: nombreDe(user), correo: correoDe(user), foto: fotoDe(user) };

  if (evento?.checkin) {
    return { estado: "repetido", ...persona, hora: hora(evento.checkin), sinInscripcion: false };
  }

  const ahora = new Date().toISOString();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      // Si llegó sin confirmar, también la registramos para que cuente en la lista.
      evento: evento?.inscrito ? { checkin: ahora } : { inscrito: ahora, checkin: ahora },
    },
  });
  refresh();

  return { estado: "ok", ...persona, hora: hora(ahora), sinInscripcion: !evento?.inscrito };
}

export async function deshacerCheckin(userId: string) {
  if (!(await esStaff())) throw new Error("Solo el staff puede deshacer un check-in.");
  const id = extraerUserId(String(userId));
  if (!id) throw new Error("Código no válido.");

  const client = await clerkClient();
  await client.users.updateUserMetadata(id, {
    publicMetadata: { evento: { checkin: null } },
  });
  refresh();
}
