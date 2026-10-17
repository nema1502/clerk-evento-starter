import Link from "next/link";
import { Show, SignUpButton } from "@clerk/nextjs";
import { EVENTO } from "@/lib/evento";

const pasos = [
  {
    titulo: "Crea tu cuenta",
    texto: "Con Google, GitHub o tu correo. Toma menos de un minuto.",
  },
  {
    titulo: "Confirma tu asistencia",
    texto: "Un clic y recibes tu pase con un código QR personal.",
  },
  {
    titulo: "Muestra tu QR en la entrada",
    texto: "El staff lo escanea con el celular y listo: check-in hecho.",
  },
];

const incluye = [
  { ruta: "/pase", texto: "Confirmación de asistencia y pase con QR (userId)." },
  { ruta: "/staff", texto: "Lista con buscador, contadores, check-in y escáner con la cámara." },
  { ruta: "/api/inscritos", texto: "Exporta CSV (nombre, correo, inscrito, checkin) para tu sorteo." },
  { ruta: "metadata", texto: "Sin base de datos: todo vive en el publicMetadata de Clerk." },
];

export default function Inicio() {
  return (
    <div className="flex flex-col gap-16">
      <section className="fondo-evento -mx-4 -mt-8 px-4 pt-10 pb-4 sm:-mx-6 sm:-mt-12 sm:px-6 sm:pt-16">
        <div className="flex max-w-3xl flex-col items-start gap-6">
          <span className="rounded-full border border-clerk/40 bg-clerk/10 px-3 py-1 text-xs font-medium text-clerk-claro">
            {EVENTO.fecha} · {EVENTO.horario}
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            {EVENTO.nombre}
          </h1>
          <p className="max-w-2xl text-lg text-tenue">{EVENTO.descripcion}</p>

          <dl className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
            <Dato titulo="Cuándo" valor={`${EVENTO.fecha}, ${EVENTO.horario}`} />
            <Dato titulo="Dónde" valor={`${EVENTO.lugar} · ${EVENTO.direccion}`} />
          </dl>

          <div className="flex flex-wrap gap-3">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button className="cursor-pointer rounded-xl bg-clerk px-5 py-3 font-medium text-white transition-colors hover:bg-[#7d5cff]">
                  Quiero mi pase
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/pase"
                className="rounded-xl bg-clerk px-5 py-3 font-medium text-white transition-colors hover:bg-[#7d5cff]"
              >
                Ver mi pase
              </Link>
            </Show>
            <a
              href="#como-funciona"
              className="rounded-xl border border-borde bg-superficie px-5 py-3 font-medium transition-colors hover:border-clerk/60"
            >
              ¿Cómo funciona?
            </a>
          </div>
        </div>
      </section>

      <section id="como-funciona" aria-labelledby="titulo-pasos" className="scroll-mt-24">
        <h2 id="titulo-pasos" className="mb-5 text-2xl font-semibold tracking-tight">
          Tu entrada en 3 pasos
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {pasos.map((paso, i) => (
            <li key={paso.titulo} className="rounded-2xl border border-borde bg-superficie p-5">
              <span className="grid size-8 place-items-center rounded-full bg-clerk/15 font-mono text-sm font-semibold text-clerk-claro">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold">{paso.titulo}</h3>
              <p className="mt-1 text-sm text-tenue">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="titulo-plantilla"
        className="rounded-3xl border border-borde bg-superficie p-6 sm:p-8"
      >
        <p className="font-mono text-xs text-turquesa">clerk-evento-starter</p>
        <h2 id="titulo-plantilla" className="mt-2 text-2xl font-semibold tracking-tight">
          ¿Organizas un meetup, hackatón o evento de la U?
        </h2>
        <p className="mt-2 max-w-2xl text-tenue">
          Esta app es una plantilla de código abierto hecha con Next.js 16 y Clerk. Cámbiale los
          datos en <code className="font-mono text-texto">lib/evento.ts</code> y úsala para tu
          propio evento.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {incluye.map((item) => (
            <li key={item.ruta} className="rounded-xl border border-borde bg-superficie-2 p-4">
              <code className="font-mono text-xs text-clerk-claro">{item.ruta}</code>
              <p className="mt-1 text-sm text-tenue">{item.texto}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-borde bg-superficie/80 p-4">
      <dt className="text-xs font-medium tracking-wide text-tenue uppercase">{titulo}</dt>
      <dd className="mt-1 text-sm">{valor}</dd>
    </div>
  );
}
