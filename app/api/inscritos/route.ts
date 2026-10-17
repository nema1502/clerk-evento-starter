import { auth } from "@clerk/nextjs/server";
import { fechaCsv } from "@/lib/evento";
import { listarInscripciones } from "@/lib/inscripciones";
import { esStaff } from "@/lib/roles";

// GET /api/inscritos → CSV con nombre, correo, inscrito y checkin (solo staff).
// GET /api/inscritos?solo=checkin → solo quienes llegaron (ideal para el sorteo).
// Usamos auth() y no auth.protect() porque protect() responde 404 en las APIs.
export async function GET(request: Request) {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    return Response.json({ error: "No autenticado: inicia sesión primero." }, { status: 401 });
  }
  if (!(await esStaff())) {
    return Response.json({ error: "Solo el staff puede exportar la lista." }, { status: 403 });
  }

  const soloCheckin = new URL(request.url).searchParams.get("solo") === "checkin";
  const { inscripciones } = await listarInscripciones();
  const filas = soloCheckin ? inscripciones.filter((p) => p.checkin) : inscripciones;

  const csv = [
    ["nombre", "correo", "inscrito", "checkin"],
    ...filas.map((p) => [p.nombre, p.correo, fechaCsv(p.inscrito), fechaCsv(p.checkin)]),
  ]
    .map((fila) => fila.map(celda).join(","))
    .join("\r\n");

  const archivo = soloCheckin ? "checkins.csv" : "inscripciones.csv";
  // El BOM (﻿) hace que Excel muestre bien las tildes y la ñ.
  return new Response(`﻿${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${archivo}"`,
      "Cache-Control": "no-store",
    },
  });
}

// Comillas según RFC 4180 y protección contra fórmulas (un nombre como "=HYPERLINK(...)").
function celda(valor: string) {
  const seguro = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  return /[",\r\n]/.test(seguro) ? `"${seguro.replaceAll('"', '""')}"` : seguro;
}
