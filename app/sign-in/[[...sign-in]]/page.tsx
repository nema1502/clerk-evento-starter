import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Iniciar sesión" };

// Página de inicio de sesión dentro de tu app (ruta: /sign-in).
export default function PaginaIniciarSesion() {
  return (
    <div className="flex justify-center py-6">
      <SignIn />
    </div>
  );
}
