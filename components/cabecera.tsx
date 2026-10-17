import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { EVENTO } from "@/lib/evento";
import { esStaff } from "@/lib/roles";

const enlace =
  "rounded-lg px-3 py-2 text-tenue transition-colors hover:bg-white/5 hover:text-texto";

export async function Cabecera() {
  const staff = await esStaff();

  return (
    <header className="sticky top-0 z-20 border-b border-borde bg-fondo/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-lg font-semibold">
          <IconoTicket />
          <span className="hidden truncate sm:inline">{EVENTO.nombreCorto}</span>
          <span className="sm:hidden">Evento</span>
        </Link>

        <nav aria-label="Principal" className="flex items-center gap-1 text-sm">
          {/* <Show> reemplaza a <SignedIn>/<SignedOut> en la versión actual de Clerk */}
          <Show when="signed-in">
            <Link href="/pase" className={enlace}>
              Mi pase
            </Link>
            {staff && (
              <Link href="/staff" className={enlace}>
                Staff
              </Link>
            )}
            <div className="ml-1 flex">
              <UserButton />
            </div>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className={`${enlace} cursor-pointer`}>Iniciar sesión</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="cursor-pointer rounded-xl bg-clerk px-3.5 py-2 font-medium text-white transition-colors hover:bg-[#7d5cff]">
                Crear cuenta
              </button>
            </SignUpButton>
          </Show>
        </nav>
      </div>
    </header>
  );
}

function IconoTicket() {
  return (
    <span
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-lg bg-linear-to-br from-clerk to-azul text-white"
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Z"
          strokeLinejoin="round"
        />
        <path d="M13 7v2m0 3v1m0 3v1" strokeLinecap="round" />
      </svg>
    </span>
  );
}
