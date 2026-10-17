"use client";

export default function ErrorDePagina({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">Algo salió mal</h1>
      <p className="text-tenue">
        No pudimos completar la acción. Revisa tu conexión e inténtalo de nuevo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="cursor-pointer rounded-xl bg-clerk px-5 py-3 font-medium text-white hover:bg-[#7d5cff]"
      >
        Reintentar
      </button>
    </div>
  );
}
