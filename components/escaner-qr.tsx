"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { hacerCheckin, type ResultadoCheckin } from "@/app/acciones";
import { Avatar } from "@/components/avatar";

// BarcodeDetector todavía no está en los tipos de TypeScript; declaramos lo que usamos.
type DetectorDeCodigos = { detect(fuente: HTMLVideoElement): Promise<{ rawValue: string }[]> };
type ClaseDetector = {
  new (opciones: { formats: string[] }): DetectorDeCodigos;
  getSupportedFormats?: () => Promise<string[]>;
};

function claseDetector() {
  return (globalThis as { BarcodeDetector?: ClaseDetector }).BarcodeDetector;
}

const sinSuscripcion = () => () => {};
const camaraDisponible = () => Boolean(claseDetector() && navigator.mediaDevices?.getUserMedia);

// Mismo QR delante de la cámara: lo ignoramos unos segundos para no repetir el check-in.
const PAUSA_MISMO_CODIGO_MS = 5000;

const estilosResultado = {
  ok: "border-turquesa/50 bg-turquesa/10",
  repetido: "border-amber-400/50 bg-amber-400/10",
  error: "border-red-400/50 bg-red-400/10",
};

export function EscanerQr() {
  const soportado = useSyncExternalStore(sinSuscripcion, camaraDisponible, () => false);
  const [camara, setCamara] = useState<"apagada" | "iniciando" | "activa">("apagada");
  const [error, setError] = useState("");
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState<ResultadoCheckin | null>(null);
  const [pendiente, startTransition] = useTransition();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const temporizadorRef = useRef<number | undefined>(undefined);
  const ocupadoRef = useRef(false);
  const ultimoRef = useRef({ codigo: "", hasta: 0 });

  useEffect(() => {
    const stream = streamRef;
    const temporizador = temporizadorRef;
    return () => {
      window.clearTimeout(temporizador.current);
      stream.current?.getTracks().forEach((pista) => pista.stop());
    };
  }, []);

  function procesar(valor: string) {
    ocupadoRef.current = true;
    startTransition(async () => {
      try {
        const r = await hacerCheckin(valor);
        setResultado(r);
        if (r.estado === "ok") navigator.vibrate?.(120);
      } catch {
        setResultado({ estado: "error", mensaje: "No se pudo guardar. Revisa tu conexión." });
      } finally {
        ocupadoRef.current = false;
      }
    });
  }

  function apagar() {
    window.clearTimeout(temporizadorRef.current);
    streamRef.current?.getTracks().forEach((pista) => pista.stop());
    streamRef.current = null;
    setCamara("apagada");
  }

  function buscar(detector: DetectorDeCodigos) {
    temporizadorRef.current = window.setTimeout(async () => {
      const video = videoRef.current;
      if (!streamRef.current || !video) return;
      if (!ocupadoRef.current && video.readyState >= 2) {
        try {
          const [qr] = await detector.detect(video);
          const valor = qr?.rawValue?.trim();
          const repetido = valor === ultimoRef.current.codigo && Date.now() < ultimoRef.current.hasta;
          if (valor && !repetido) {
            ultimoRef.current = { codigo: valor, hasta: Date.now() + PAUSA_MISMO_CODIGO_MS };
            procesar(valor);
          }
        } catch {
          // Cuadro sin un QR legible: seguimos buscando.
        }
      }
      buscar(detector);
    }, 250);
  }

  async function encender() {
    const Detector = claseDetector();
    if (!Detector) return;
    setError("");
    setCamara("iniciando");
    try {
      const formatos = await Detector.getSupportedFormats?.();
      if (formatos && !formatos.includes("qr_code")) throw new Error("sin-qr");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("sin-video");
      video.srcObject = stream;
      await video.play();
      setCamara("activa");
      buscar(new Detector({ formats: ["qr_code"] }));
    } catch (e) {
      apagar();
      setError(
        e instanceof Error && e.message === "sin-qr"
          ? "Este navegador no puede leer códigos QR. Ingresa el código a mano."
          : "No pudimos abrir la cámara. Revisa el permiso de cámara del navegador o ingresa el código a mano.",
      );
    }
  }

  function enviarManual(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!codigo.trim()) return;
    procesar(codigo);
    setCodigo("");
  }

  return (
    <section
      aria-labelledby="titulo-escaner"
      className="flex flex-col gap-4 rounded-3xl border border-borde bg-superficie p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="titulo-escaner" className="text-lg font-semibold">
          Escanear pase
        </h2>
        {soportado && camara !== "apagada" && (
          <button
            type="button"
            onClick={apagar}
            className="cursor-pointer rounded-xl border border-borde px-3 py-1.5 text-sm text-tenue hover:text-texto"
          >
            Apagar cámara
          </button>
        )}
      </div>

      {soportado ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-borde bg-black">
          <video
            ref={videoRef}
            muted
            playsInline
            aria-label="Vista de la cámara"
            className={`size-full object-cover ${camara === "activa" ? "" : "invisible"}`}
          />
          {camara === "activa" ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-[18%] rounded-3xl border-2 border-white/80 shadow-[0_0_0_9999px_rgb(0_0_0/0.35)]"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-tenue">
                  Apunta la cámara al QR del pase. El check-in se hace solo.
                </p>
                <button
                  type="button"
                  onClick={encender}
                  disabled={camara === "iniciando"}
                  className="cursor-pointer rounded-xl bg-clerk px-5 py-3 font-medium text-white transition-colors hover:bg-[#7d5cff] disabled:cursor-wait disabled:opacity-70"
                >
                  {camara === "iniciando" ? "Abriendo cámara…" : "Encender cámara"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-2xl border border-borde bg-superficie-2 p-4 text-sm text-tenue">
          Este navegador no puede leer QR con la cámara (pasa en iPhone y en algunas
          computadoras). Usa Chrome en Android, ingresa el código a mano o busca a la persona en la
          lista.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      <div aria-live="polite" aria-atomic="true">
        {pendiente && !resultado && <p className="text-sm text-tenue">Verificando pase…</p>}
        {resultado && (
          <div className={`rounded-2xl border p-4 ${estilosResultado[resultado.estado]}`}>
            {resultado.estado === "error" ? (
              <>
                <p className="font-semibold text-red-200">No se pudo hacer check-in</p>
                <p className="mt-1 text-sm text-red-100/90">{resultado.mensaje}</p>
              </>
            ) : (
              <>
                <p
                  className={`text-sm font-medium ${
                    resultado.estado === "ok" ? "text-turquesa" : "text-amber-200"
                  }`}
                >
                  {resultado.estado === "ok"
                    ? `Check-in listo · ${resultado.hora}`
                    : `Ya tenía check-in desde las ${resultado.hora}`}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <Avatar nombre={resultado.nombre} foto={resultado.foto} tamano={88} />
                  <div className="min-w-0">
                    <p className="text-xl leading-tight font-semibold">{resultado.nombre}</p>
                    <p className="mt-1 text-sm break-all text-tenue">{resultado.correo}</p>
                  </div>
                </div>
                {/* Una captura del QR se puede reenviar: el nombre y la foto confirman quién es. */}
                <p className="mt-3 text-sm text-tenue">
                  {resultado.foto
                    ? "¿Es la persona que muestra el pase? Compara la foto y el nombre."
                    : "Esta cuenta no tiene foto: pide que te diga su nombre y compáralo."}
                </p>
                {resultado.sinInscripcion && (
                  <p className="mt-2 text-sm text-amber-200">
                    No había confirmado su asistencia: la registramos ahora.
                  </p>
                )}
              </>
            )}
            {pendiente && <p className="mt-2 text-xs text-tenue">Verificando el siguiente pase…</p>}
          </div>
        )}
      </div>

      <form onSubmit={enviarManual} className="flex flex-col gap-2">
        <label htmlFor="codigo-manual" className="text-sm text-tenue">
          ¿Sin cámara? Ingresa el código que aparece debajo del QR
        </label>
        <div className="flex gap-2">
          <input
            id="codigo-manual"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="user_…"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-xl border border-borde bg-superficie-2 px-4 py-3 font-mono text-base placeholder:text-tenue/70"
          />
          <button
            type="submit"
            disabled={pendiente || !codigo.trim()}
            className="shrink-0 cursor-pointer rounded-xl bg-clerk px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#7d5cff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hacer check-in
          </button>
        </div>
      </form>
    </section>
  );
}
