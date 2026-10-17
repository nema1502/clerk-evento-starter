import Image from "next/image";

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "?";
}

// Foto de perfil de Clerk (img.clerk.com, permitido en next.config.ts) o, si la cuenta
// no tiene una, sus iniciales.
export function Avatar({
  nombre,
  foto,
  tamano,
  colores = "bg-clerk/15 text-clerk-claro",
  decorativa = false,
}: {
  nombre: string;
  foto: string | null;
  tamano: number;
  colores?: string;
  // true cuando el nombre ya está escrito al lado (el lector de pantalla no lo repite).
  decorativa?: boolean;
}) {
  const medidas = { width: tamano, height: tamano };

  if (foto) {
    return (
      <Image
        src={foto}
        alt={decorativa ? "" : `Foto de ${nombre}`}
        {...medidas}
        style={medidas}
        className="shrink-0 rounded-full border border-borde object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ ...medidas, fontSize: Math.round(tamano * 0.36) }}
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${colores}`}
    >
      {iniciales(nombre)}
    </span>
  );
}
