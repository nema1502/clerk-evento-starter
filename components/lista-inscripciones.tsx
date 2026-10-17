"use client";

import { useState, useTransition } from "react";
import { deshacerCheckin, hacerCheckin } from "@/app/acciones";
import type { Persona } from "@/lib/inscripciones";

const FILTROS = [
  { id: "todas", texto: "Todas" },
  { id: "por-llegar", texto: "Por llegar" },
  { id: "llegaron", texto: "Llegaron" },
] as const;

type Filtro = (typeof FILTROS)[number]["id"];

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function ListaInscripciones({ personas }: { personas: Persona[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [procesando, setProcesando] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [, startTransition] = useTransition();

  const termino = normalizar(busqueda.trim());
  const conteo = {
    todas: personas.length,
    "por-llegar": personas.filter((p) => !p.checkin).length,
    llegaron: personas.filter((p) => p.checkin).length,
  };
  const visibles = personas.filter((p) => {
    if (filtro === "por-llegar" && p.checkin) return false;
    if (filtro === "llegaron" && !p.checkin) return false;
    return !termino || normalizar(`${p.nombre} ${p.correo}`).includes(termino);
  });

  function ejecutar(persona: Persona, accion: "checkin" | "deshacer") {
    setProcesando(persona.id);
    setAviso("");
    startTransition(async () => {
      try {
        if (accion === "checkin") {
          const r = await hacerCheckin(persona.id);
          setAviso(
            r.estado === "error"
              ? r.mensaje
              : r.estado === "repetido"
                ? `${r.nombre} ya tenía check-in (${r.hora}).`
                : `Check-in listo: ${r.nombre} (${r.hora}).`,
          );
        } else {
          await deshacerCheckin(persona.id);
          setAviso(`Deshiciste el check-in de ${persona.nombre}.`);
        }
      } catch {
        setAviso("No se pudo completar. Revisa tu conexión e inténtalo de nuevo.");
      } finally {
        setProcesando(null);
      }
    });
  }

  return (
    <section
      aria-labelledby="titulo-lista"
      className="flex flex-col gap-4 rounded-3xl border border-borde bg-superficie p-4 sm:p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="titulo-lista" className="text-lg font-semibold">
          Personas inscritas
        </h2>
        <span className="text-sm text-tenue">
          {visibles.length} de {personas.length}
        </span>
      </div>

      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre o correo"
        aria-label="Buscar por nombre o correo"
        className="w-full rounded-xl border border-borde bg-superficie-2 px-4 py-3 text-base placeholder:text-tenue/70"
      />

      <div role="group" aria-label="Filtrar lista" className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filtro === f.id}
            onClick={() => setFiltro(f.id)}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
              filtro === f.id
                ? "border-clerk bg-clerk/15 text-texto"
                : "border-borde text-tenue hover:text-texto"
            }`}
          >
            {f.texto} <span className="font-mono tabular-nums">{conteo[f.id]}</span>
          </button>
        ))}
      </div>

      <p aria-live="polite" className="min-h-5 text-sm text-turquesa">
        {aviso}
      </p>

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-borde p-6 text-center text-sm text-tenue">
          {personas.length === 0
            ? "Todavía no hay inscripciones. Comparte el enlace del evento."
            : "Nadie coincide con tu búsqueda."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-borde">
          {visibles.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <span
                aria-hidden="true"
                className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                  p.checkin ? "bg-turquesa/15 text-turquesa" : "bg-clerk/15 text-clerk-claro"
                }`}
              >
                {iniciales(p.nombre)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.nombre}</p>
                <p className="truncate text-sm text-tenue">{p.correo}</p>
                <p className="text-xs text-tenue">
                  {p.checkin ? `Llegó · ${p.checkinTexto}` : `Inscripción · ${p.inscritoTexto}`}
                </p>
              </div>
              {p.checkin ? (
                <button
                  type="button"
                  onClick={() => ejecutar(p, "deshacer")}
                  disabled={procesando === p.id}
                  aria-label={`Deshacer el check-in de ${p.nombre}`}
                  className="shrink-0 cursor-pointer rounded-xl border border-borde px-3 py-2 text-sm text-tenue transition-colors hover:text-texto disabled:opacity-60"
                >
                  {procesando === p.id ? "…" : "Deshacer"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => ejecutar(p, "checkin")}
                  disabled={procesando === p.id}
                  aria-label={`Hacer check-in de ${p.nombre}`}
                  className="shrink-0 cursor-pointer rounded-xl bg-clerk px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7d5cff] disabled:opacity-60"
                >
                  {procesando === p.id ? "Guardando…" : "Hacer check-in"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
