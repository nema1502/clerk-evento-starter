// Edita estos datos con los de tu evento: se muestran en la portada, el pase y el panel de staff.
export const EVENTO = {
  nombre: "Clerk Workshop × Women Techmakers Santa Cruz",
  nombreCorto: "Clerk Workshop × WTM",
  descripcion:
    "Taller práctico de autenticación con Clerk y Next.js. Trae tu laptop: sales con un login funcionando.",
  fecha: "Sábado 17 de octubre de 2026",
  horario: "15:00 – 18:00",
  lugar: "Central 43 – Espacio Colaborativo",
  direccion: "Av. Barrientos 43, Santa Cruz de la Sierra, Bolivia",
  // Zona horaria del evento: se usa para mostrar las horas de inscripción y check-in.
  zonaHoraria: "America/La_Paz",
} as const;

const formatoCorto = new Intl.DateTimeFormat("es", {
  timeZone: EVENTO.zonaHoraria,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const formatoHora = new Intl.DateTimeFormat("es", {
  timeZone: EVENTO.zonaHoraria,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// "sv-SE" da el formato AAAA-MM-DD HH:mm, fácil de ordenar en Excel o Google Sheets.
const formatoCsv = new Intl.DateTimeFormat("sv-SE", {
  timeZone: EVENTO.zonaHoraria,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function fechaCorta(iso?: string | null) {
  return iso ? formatoCorto.format(new Date(iso)) : "";
}

export function hora(iso?: string | null) {
  return iso ? formatoHora.format(new Date(iso)) : "";
}

export function fechaCsv(iso?: string | null) {
  return iso ? formatoCsv.format(new Date(iso)) : "";
}
