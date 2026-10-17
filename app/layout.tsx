import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esMX } from "@clerk/localizations";
import { dark } from "@clerk/ui/themes";
import { Cabecera } from "@/components/cabecera";
import { EVENTO } from "@/lib/evento";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: EVENTO.nombre, template: `%s · ${EVENTO.nombreCorto}` },
  description: `${EVENTO.descripcion} ${EVENTO.fecha}, ${EVENTO.lugar}.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {/* ClerkProvider va dentro de <body>. `localization` traduce los componentes de Clerk. */}
        <ClerkProvider
          localization={esMX}
          appearance={{
            theme: dark,
            variables: { colorPrimary: "#6c47ff", colorPrimaryForeground: "#ffffff" },
          }}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/pase"
          signUpFallbackRedirectUrl="/pase"
        >
          <Cabecera />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
            {children}
          </main>
          <footer className="border-t border-borde px-4 py-6 text-center text-sm text-tenue">
            Hecho para el Clerk Workshop × Women Techmakers Santa Cruz ·{" "}
            <a
              href="https://clerk.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-borde underline-offset-4 hover:text-texto"
            >
              Documentación de Clerk
            </a>
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}
