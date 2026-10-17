import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { EscanerQr } from "@/components/escaner-qr";
import { ListaInscripciones } from "@/components/lista-inscripciones";
import { listarInscripciones } from "@/lib/inscripciones";
import { esStaff } from "@/lib/roles";

export const metadata = { title: "Staff" };

const LIMITE_DESARROLLO = 100;

export default async function PaginaStaff() {
  const { userId } = await auth.protect();

  if (!(await esStaff())) {
    return <SinPermiso userId={userId} />;
  }

  const { totalCuentas, inscripciones } = await listarInscripciones();
  const presentes = inscripciones.filter((p) => p.checkin).length;
  const esDesarrollo = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_");

  const contadores = [
    { titulo: "Inscripciones", valor: inscripciones.length, color: "text-texto" },
    { titulo: "Check-ins", valor: presentes, color: "text-turquesa" },
    { titulo: "Por llegar", valor: inscripciones.length - presentes, color: "text-clerk-claro" },
    { titulo: "Cuentas creadas", valor: totalCuentas, color: "text-tenue" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Panel de staff</h1>
          <p className="mt-2 text-tenue">Escanea pases, busca personas y exporta la lista.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/inscritos"
            download
            className="rounded-xl border border-borde bg-superficie px-4 py-2.5 text-sm font-medium transition-colors hover:border-clerk/60"
          >
            Exportar CSV
          </a>
          <a
            href="/api/inscritos?solo=checkin"
            download
            className="rounded-xl border border-borde bg-superficie px-4 py-2.5 text-sm font-medium transition-colors hover:border-clerk/60"
          >
            CSV solo con check-in
          </a>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {contadores.map((c) => (
          <div key={c.titulo} className="rounded-2xl border border-borde bg-superficie p-4">
            <dt className="text-sm text-tenue">{c.titulo}</dt>
            <dd className={`mt-1 font-mono text-3xl font-semibold tabular-nums ${c.color}`}>
              {c.valor}
            </dd>
          </div>
        ))}
      </dl>

      {esDesarrollo && totalCuentas >= LIMITE_DESARROLLO * 0.8 && (
        <p
          role="status"
          className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-100"
        >
          Tu instancia de desarrollo de Clerk admite hasta {LIMITE_DESARROLLO} usuarios y ya hay{" "}
          {totalCuentas}. Para un evento más grande, pasa a producción con tu propio dominio
          (README → Límites).
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <EscanerQr />
        <ListaInscripciones personas={inscripciones} />
      </div>
    </div>
  );
}

function SinPermiso({ userId }: { userId: string }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-10 text-center">
      <span className="font-mono text-6xl font-semibold text-clerk-claro">403</span>
      <h1 className="text-2xl font-semibold">Esta zona es solo para el staff</h1>
      <p className="text-tenue">
        Tu cuenta todavía no tiene el rol <code className="text-texto">staff</code>. Quien organiza
        puede dártelo con <code className="text-texto">pnpm staff tu@correo.com</code> o desde el
        Dashboard de Clerk: <strong className="text-texto">Users</strong> → tu cuenta →{" "}
        <strong className="text-texto">Public metadata</strong> →{" "}
        <code className="text-texto">{`{"role": "staff"}`}</code>.
      </p>
      <p className="text-sm text-tenue">
        Tu código de cuenta: <code className="font-mono break-all text-texto">{userId}</code>
      </p>
      <p className="text-sm text-tenue">
        ¿Ya te dieron el rol? Cierra sesión y vuelve a entrar para actualizar tu sesión.
      </p>
      <Link href="/pase" className="text-clerk-claro underline-offset-4 hover:underline">
        Ir a mi pase
      </Link>
    </div>
  );
}
