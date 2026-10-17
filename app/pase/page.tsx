import QRCode from "qrcode";
import { auth } from "@clerk/nextjs/server";
import { cancelarAsistencia, confirmarAsistencia } from "@/app/acciones";
import { BotonEnviar } from "@/components/boton-enviar";
import { EVENTO, fechaCorta, hora } from "@/lib/evento";
import { correoDe, cuentaPermitida, dominiosPermitidos, nombreDe } from "@/lib/inscripciones";
import { usuarioActual } from "@/lib/usuario";

export const metadata = { title: "Mi pase" };

export default async function PaginaPase() {
  // Sin sesión, auth.protect() te manda a /sign-in y luego te trae de vuelta.
  await auth.protect();
  // Lee la cuenta fresca de la API (refleja la inscripción al instante) con una sola
  // llamada, compartida con la cabecera.
  const user = await usuarioActual();
  if (!user) return null;

  const nombre = nombreDe(user);
  const evento = user.publicMetadata.evento;

  if (!evento?.inscrito) {
    return (
      <Confirmar
        nombre={user.firstName ?? nombre}
        permitido={cuentaPermitida(user)}
        dominios={dominiosPermitidos()}
      />
    );
  }

  const opcionesQr = {
    errorCorrectionLevel: "M",
    color: { dark: "#0b0b12", light: "#ffffff" },
  } as const;
  const [qrSvg, qrPng] = await Promise.all([
    QRCode.toString(user.id, { ...opcionesQr, type: "svg", margin: 0 }),
    QRCode.toDataURL(user.id, { ...opcionesQr, width: 720, margin: 3 }),
  ]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tu pase está listo</h1>
        <p className="mt-2 text-tenue">
          Muéstralo en la entrada. Consejo: toma una captura de pantalla por si no tienes señal.
        </p>
      </div>

      <article
        aria-label={`Pase de ${nombre} para ${EVENTO.nombre}`}
        className="overflow-hidden rounded-3xl border border-borde bg-superficie shadow-2xl shadow-clerk/10"
      >
        <div className="bg-linear-to-br from-clerk via-[#4f5df5] to-azul p-5 text-white">
          <p className="text-xs font-medium tracking-widest uppercase opacity-90">Pase de entrada</p>
          <h2 className="mt-1 text-xl leading-tight font-semibold text-balance">{EVENTO.nombre}</h2>
          <p className="mt-2 text-sm opacity-95">
            {EVENTO.fecha} · {EVENTO.horario}
          </p>
          <p className="text-sm opacity-95">{EVENTO.lugar}</p>
        </div>

        <div className="relative flex flex-col items-center gap-4 border-t border-dashed border-borde px-5 pt-6 pb-5">
          <div
            role="img"
            aria-label="Código QR de tu pase"
            className="w-full max-w-64 rounded-2xl bg-white p-4 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <div className="text-center">
            <p className="text-lg font-semibold">{nombre}</p>
            <p className="text-sm text-tenue">{correoDe(user)}</p>
          </div>

          {evento.checkin ? (
            <p className="rounded-full border border-turquesa/40 bg-turquesa/10 px-3 py-1 text-sm font-medium text-turquesa">
              Check-in hecho a las {hora(evento.checkin)}. ¡Disfruta el evento!
            </p>
          ) : (
            <p className="rounded-full border border-clerk/40 bg-clerk/10 px-3 py-1 text-sm font-medium text-clerk-claro">
              Asistencia confirmada · {fechaCorta(evento.inscrito)}
            </p>
          )}

          <p className="font-mono text-[11px] break-all text-tenue">Código: {user.id}</p>
        </div>
      </article>

      <div className="flex flex-wrap gap-3">
        <a
          href={qrPng}
          download="mi-pase-qr.png"
          className="rounded-xl bg-clerk px-5 py-3 font-medium text-white transition-colors hover:bg-[#7d5cff]"
        >
          Descargar QR
        </a>
        {!evento.checkin && (
          <form action={cancelarAsistencia}>
            <BotonEnviar variante="secundario" pendiente="Cancelando…">
              Ya no puedo ir
            </BotonEnviar>
          </form>
        )}
      </div>
    </div>
  );
}

function Confirmar({
  nombre,
  permitido,
  dominios,
}: {
  nombre: string;
  permitido: boolean;
  dominios: string[];
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-clerk-claro">Hola, {nombre}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">¿Nos vemos en el evento?</h1>
        <p className="mt-2 text-tenue">
          Confirma tu asistencia para recibir tu pase con QR. Si luego no puedes ir, lo cancelas
          desde aquí mismo.
        </p>
      </div>

      <div className="rounded-3xl border border-borde bg-superficie p-6">
        <h2 className="text-lg font-semibold text-balance">{EVENTO.nombre}</h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-tenue">Cuándo</dt>
            <dd>
              {EVENTO.fecha}, {EVENTO.horario}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-tenue">Dónde</dt>
            <dd>
              {EVENTO.lugar} · {EVENTO.direccion}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          {permitido ? (
            <form action={confirmarAsistencia}>
              <BotonEnviar pendiente="Confirmando…">Confirmar mi asistencia</BotonEnviar>
            </form>
          ) : (
            <div
              role="alert"
              className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-100"
            >
              <p className="font-medium">Este evento es solo para correos de {dominios.join(", ")}.</p>
              <p className="mt-1 text-amber-100/85">
                Agrega y verifica tu correo institucional desde tu perfil (tu foto arriba a la
                derecha → Administrar cuenta) y vuelve a esta página.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
