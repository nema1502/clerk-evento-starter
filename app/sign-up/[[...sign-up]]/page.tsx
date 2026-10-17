import { SignUp } from "@clerk/nextjs";

export const metadata = { title: "Crear cuenta" };

// Página de registro dentro de tu app (ruta: /sign-up).
export default function PaginaRegistro() {
  return (
    <div className="flex justify-center py-6">
      <SignUp />
    </div>
  );
}
