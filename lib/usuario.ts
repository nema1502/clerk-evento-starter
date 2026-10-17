import { cache } from "react";
import { currentUser } from "@clerk/nextjs/server";

// currentUser() llama a la Backend API de Clerk cada vez que lo usas (no tiene caché).
// Con cache(), la cabecera y la página comparten una sola llamada por request, y la API
// de desarrollo tiene un límite de solicitudes (README → Límites honestos).
// En las Server Actions usamos currentUser() directo: ahí queremos la cuenta recién leída.
export const usuarioActual = cache(currentUser);
