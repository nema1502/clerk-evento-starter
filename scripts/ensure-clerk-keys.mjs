// Corre antes de `pnpm dev`. Si no hay claves de Clerk, usa el CLI de Clerk para crear
// una app temporal (no necesitas cuenta) y guarda las claves en .env.local.
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const KEY = "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY";
const ENV_FILES = [".env.local", ".env.development.local", ".env.development", ".env"];

function findPublishableKey() {
  if (process.env[KEY]) return process.env[KEY];
  for (const file of ENV_FILES) {
    if (!existsSync(file)) continue;
    const match = readFileSync(file, "utf8").match(new RegExp(`^\\s*${KEY}\\s*=\\s*["']?([^"'\\s#]+)`, "m"));
    if (match) return match[1];
  }
  return null;
}

const key = findPublishableKey();

if (key?.includes("REEMPLAZAR")) {
  console.error(
    "\n[clerk] Tu .env.local todavía tiene las claves de ejemplo." +
      "\nReemplázalas con las de https://dashboard.clerk.com (API keys) o borra .env.local para crear claves temporales.\n",
  );
  process.exit(1);
}

if (!key) {
  console.log("\n[clerk] No encontramos claves de Clerk. Creando una app temporal (no necesitas cuenta)...\n");
  const result = spawnSync("npx -y clerk@latest init --accountless --no-skills -y", {
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    console.error(
      "\n[clerk] No pudimos crear las claves automáticamente." +
        "\nCopia .env.example como .env.local y pega tus claves (ver README → Claves).\n",
    );
    process.exit(1);
  }
}
