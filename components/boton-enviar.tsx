"use client";

import { useFormStatus } from "react-dom";

const estilos = {
  primario: "bg-clerk text-white hover:bg-[#7d5cff]",
  secundario: "border border-borde bg-superficie-2 text-tenue hover:border-red-400/60 hover:text-red-300",
};

// Botón de formulario que se desactiva mientras corre la Server Action.
export function BotonEnviar({
  children,
  pendiente,
  variante = "primario",
}: {
  children: React.ReactNode;
  pendiente: string;
  variante?: keyof typeof estilos;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`cursor-pointer rounded-xl px-5 py-3 font-medium transition-colors disabled:cursor-wait disabled:opacity-70 ${estilos[variante]}`}
    >
      {pending ? pendiente : children}
    </button>
  );
}
