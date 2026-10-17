# Clerk Evento Starter

Plantilla de **Next.js 16 + Clerk** para gestionar un evento, meetup, hackatón o proyecto de la U
**sin base de datos**: registro con Clerk, confirmación de asistencia, pase con código QR, panel
de staff con check-in (también con la cámara del celular) y exportación a CSV para tu sorteo.
Todo se guarda en el `publicMetadata` de cada cuenta de Clerk.

> Hecho para el Clerk Workshop × Women Techmakers Santa Cruz

## ¿Qué incluye?

| Ruta | Qué hace | Archivo |
| --- | --- | --- |
| `/` | Portada del evento (fecha, lugar) y botón para pedir tu pase | `app/page.tsx` |
| `/pase` | Con sesión: confirmas tu asistencia y ves tu pase con un QR que codifica tu `userId`. Puedes descargar el QR o cancelar (“Ya no puedo ir”) | `app/pase/page.tsx` |
| `/staff` | Solo rol `staff`: contadores, lista de inscripciones con buscador por nombre o correo, botón **Hacer check-in**, escáner de QR con la cámara e ingreso manual del código | `app/staff/page.tsx` |
| `/api/inscritos` | Solo staff: descarga un CSV con `nombre, correo, inscrito, checkin` (`?solo=checkin` para quienes llegaron). `401` sin sesión, `403` sin rol | `app/api/inscritos/route.ts` |
| `/sign-in`, `/sign-up` | Inicio de sesión y registro (Google, GitHub o correo) | `app/sign-in`, `app/sign-up` |

Además:

- `proxy.ts` (el antiguo `middleware.ts` en Next.js 16) con `clerkMiddleware()`.
- Cada página protegida usa `await auth.protect()`; la API usa `auth()` y responde `401`.
- Las Server Actions (`app/acciones.ts`) verifican sesión y rol **en el servidor** antes de
  escribir en Clerk con la Backend API.
- Componentes de Clerk en español (`@clerk/localizations`) y con tema oscuro (`@clerk/ui/themes`).
- Restricción opcional por dominio de correo (`DOMINIOS_PERMITIDOS`).
- `pnpm staff tu@correo.com` para darte el rol de staff desde la terminal.

## ¿Cómo funciona sin base de datos?

Cada cuenta de Clerk tiene un `publicMetadata` (un JSON que solo el servidor puede escribir y
que la app puede leer). Esta plantilla guarda ahí todo lo del evento:

```json
{
  "role": "staff",
  "evento": {
    "inscrito": "2026-10-17T14:02:11.000Z",
    "checkin": "2026-10-17T19:05:42.000Z"
  }
}
```

- **Confirmar asistencia** escribe `evento.inscrito` con la fecha.
- **Hacer check-in** escribe `evento.checkin` con la fecha (si la persona llegó sin confirmar,
  también la inscribe).
- El panel de staff lee todas las cuentas con `clerkClient().users.getUserList()` y filtra las
  inscripciones en memoria.

Las escrituras usan `updateUserMetadata()`, que hace un merge profundo: no borra el rol ni otros
datos. Los tipos están en `types/globals.d.ts` y los datos del evento (nombre, fecha, lugar, zona
horaria) en `lib/evento.ts`.

## Inicio rápido (3 pasos)

Necesitas [Node.js 20.9 o superior](https://nodejs.org) y [pnpm](https://pnpm.io/installation)
(`npm install -g pnpm`).

1. **Usa la plantilla**: en GitHub, botón **Use this template** → **Create a new repository**.
   Luego clona tu repo: `git clone <URL-de-tu-repo>` y entra a la carpeta.
2. **Instala**: `pnpm install`
3. **Arranca**: `pnpm dev` y abre <http://localhost:3000>

¡No necesitas claves para empezar! La primera vez que corres `pnpm dev`, si no hay claves de Clerk,
el script `scripts/ensure-clerk-keys.mjs` ejecuta `npx -y clerk@latest init` (el
[CLI de Clerk](https://clerk.com/docs/cli)), que crea una **app temporal sin cuenta** y guarda las
claves de desarrollo en `.env.local`. Crea tu cuenta con **Crear cuenta**, confirma tu asistencia
y verás tu pase.

Para editar los datos del evento, abre `lib/evento.ts`. Para cambiar los colores, `app/globals.css`.

## Claves de Clerk

- **Automático (recomendado para empezar)**: `pnpm dev` crea las claves por ti. Para ver y
  configurar esa app en el [Dashboard de Clerk](https://dashboard.clerk.com), **reclámala** con
  tu cuenta (gratis):

  ```bash
  pnpm dlx clerk@latest auth login
  ```

- **Tu propia app**: crea una aplicación en <https://dashboard.clerk.com>, copia `.env.example`
  como `.env.local` y reemplaza las claves por las de la página **API keys**.

| Variable | Para qué |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clave pública (`pk_test_...`). Puede ir al navegador. |
| `CLERK_SECRET_KEY` | Clave secreta (`sk_test_...`). **Nunca** la compartas ni la subas a GitHub. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `..._SIGN_UP_URL` | Rutas `/sign-in` y `/sign-up`. |
| `DOMINIOS_PERMITIDOS` | Opcional. Ver [Restringir por dominio](#restringir-por-dominio-de-correo). |

`.env.local` y la carpeta `.clerk/` están en `.gitignore`: no se suben a GitHub.

## Activar Google y GitHub

La app temporal ya trae registro con correo y con Google. Para sumar GitHub (o activar Google
en una app tuya):

1. En el Dashboard de Clerk, ve a **SSO connections**.
2. Elige **Add connection** → **For all users**.
3. Selecciona **GitHub** (o **Google**).

En desarrollo, Clerk usa credenciales OAuth compartidas: no necesitas configurar nada más.
En producción tendrás que poner tus propias credenciales (**Use custom credentials**).

Tip: en el formulario de registro, Clerk muestra el nombre de tu aplicación ("My Application"
en la app temporal). Cámbialo por el de tu evento en la configuración de la app en el Dashboard.

## Cómo hacerte staff

El staff es quien hace check-in y descarga la lista. El rol vive en `publicMetadata.role`.

1. **Crea tu cuenta** en la app (botón **Crear cuenta**).
2. **Date el rol** con una de estas dos opciones:
   - Desde la terminal, en la carpeta del proyecto:

     ```bash
     pnpm staff tu@correo.com            # da el rol
     pnpm staff tu@correo.com --quitar   # lo quita
     ```

     Usa la `CLERK_SECRET_KEY` de tu `.env.local`, así que funciona incluso con la app temporal.
   - Desde el Dashboard: **Users** → la cuenta → **User metadata** → **Public** → **Edit** y
     guarda `{"role": "staff"}`.
3. **Agrega el rol al session token** (recomendado): Dashboard → **Sessions** →
   **Customize session token** → en **Claims** pega esto y guarda:

   ```json
   {
     "metadata": "{{user.public_metadata}}"
   }
   ```

   Así el servidor lee el rol directo del token, sin llamadas extra. Si todavía no lo agregaste
   (por ejemplo, con la app temporal sin reclamar), la plantilla lo consulta con `currentUser()`
   y funciona igual, solo que con una llamada más a la API de Clerk por página (ojo con el
   [límite de solicitudes](#límites-honestos) el día del evento).
4. **Cierra sesión y vuelve a entrar** para que tu sesión tome el rol nuevo. En la cabecera
   aparecerá el enlace **Staff**.

¿Más roles? Edita el tipo `Roles` en `types/globals.d.ts` (por ejemplo, `"jurado"`) y copia el
patrón de `lib/roles.ts`.

## El día del evento: check-in

1. **Publica la app con HTTPS** (por ejemplo, en Vercel; ver [Deploy](#deploy-en-vercel)). Los
   navegadores solo dan acceso a la cámara en `https://` o en `localhost`: si el staff abre
   `http://192.168.x.x:3000` desde su celular, el escáner no funcionará.
2. Cada persona del staff entra a `/staff` desde su celular con su cuenta.
3. En la puerta, cada asistente muestra su pase (`/pase` o la captura de pantalla).
4. Toca **Encender cámara** y apunta al QR: el check-in se hace solo y ves en grande el nombre
   y la foto de perfil (si la cuenta tiene una, por ejemplo al registrarse con Google).
   Si el mismo QR sigue frente a la cámara, se ignora unos segundos para no repetirlo.
5. **Compara la foto o el nombre con quien muestra el pase.** El QR es solo el código de la
   cuenta, así que una captura se puede reenviar a otra persona. Si el check-in da derecho al
   sorteo, pide que te diga su nombre antes de mirar la pantalla; si no coincide, toca
   **Deshacer** en la lista.
6. **Sin cámara** (iPhone, algunas computadoras o permiso denegado): escribe el código que
   aparece debajo del QR, o busca a la persona por nombre o correo en la lista y toca
   **Hacer check-in**. Si alguien se equivocó, **Deshacer** quita el check-in.
7. Al final, **Exportar CSV** (todas las inscripciones) o **CSV solo con check-in** (quienes
   llegaron). Cárgalo en Tinkazo u otra herramienta de sorteos, o ábrelo en Excel o Google
   Sheets. Las fechas van en la zona horaria del evento (`AAAA-MM-DD HH:mm`) y el archivo trae
   BOM UTF-8 para que Excel muestre bien las tildes.

El escáner usa la API `BarcodeDetector` del navegador, disponible en Chrome para Android y en
otros navegadores basados en Chromium según el sistema. Donde no existe (por ejemplo, Safari en
iPhone), la app muestra solo el ingreso manual y la lista.

Consejos: prueba el flujo completo un día antes con 2 o 3 cuentas, sube el brillo del celular
de quien muestra el QR y ten la lista abierta en una segunda pantalla para buscar por nombre.
Si el evento es grande, reclama la app y agrega el claim `metadata` **antes** de ese día (ver
[Límites honestos](#límites-honestos)).

## Restringir por dominio de correo

¿Evento solo para tu universidad o empresa? Agrega en `.env.local` (y en Vercel):

```bash
DOMINIOS_PERMITIDOS=miuniversidad.edu.bo,est.miuniversidad.edu.bo
```

Con esa variable, solo pueden **confirmar asistencia** las cuentas que tengan un correo
**verificado** de esos dominios (o de sus subdominios). El resto puede crear su cuenta, pero en
`/pase` ve un aviso para agregar su correo institucional desde su perfil. El staff igual puede
hacer check-in a cualquier persona.

Es una alternativa gratis hecha en código al **allowlist** de Clerk (Dashboard → **Access mode**
→ **Enable allowlist**), que bloquea el registro en sí: el allowlist es gratis en desarrollo,
pero en producción requiere un plan pago (Pro).

## Límites honestos

- **Instancia de desarrollo** (claves `pk_test_`/`sk_test_`, incluida la app temporal): tope de
  **100 usuarios** y **100 correos al mes**. El panel de staff te avisa cuando te acercas al tope.
  Para un evento más grande, crea una instancia de **producción**, que necesita un **dominio
  propio** (no sirve `*.vercel.app`). Revisa los planes en <https://clerk.com/pricing>.
- **Límite de solicitudes**: la Backend API de una instancia de desarrollo admite **100
  solicitudes cada 10 segundos** por clave secreta (producción: 1000); si te pasas, responde
  `429` y bloquea por unos segundos ([límites del sistema](https://clerk.com/docs/guides/how-clerk-works/system-limits)).
  Sin el claim `metadata`, cada página con sesión gasta 1 solicitud para leer el rol (el panel
  de staff, 2 más para la lista y el total) y cada check-in gasta 6 (rol, cuenta, escritura y
  el panel actualizado); con el claim, 4. Para un meetup alcanza de sobra; si esperas una fila
  larga en la puerta con varias personas de staff escaneando a la vez, **reclama la app y
  agrega el claim `metadata` antes del día del evento**
  ([Cómo hacerte staff](#cómo-hacerte-staff), paso 3). Si igual llegas al límite, el escáner
  te avisa: espera unos segundos y vuelve a escanear.
- **Sin base de datos**: el panel lee todas las cuentas de Clerk en cada carga (500 por llamada).
  Va perfecto para cientos de personas; para miles, guarda las inscripciones en una base de datos.
- **Sin tiempo real**: si hay varias personas en el staff, cada una ve los check-ins de las demás
  al recargar o al hacer su siguiente check-in.
- **Rol en el token**: si cambias el rol de alguien, debe cerrar sesión y volver a entrar.
- **El QR es el `userId`**: no es secreto (sirve para identificar, no para iniciar sesión) y solo
  el staff puede usarlo para hacer check-in. Como una captura se puede reenviar, el escáner
  muestra el nombre y la foto de perfil para que el staff compare con quien muestra el pase.

## Deploy en Vercel

1. Sube tu repo a GitHub.
2. En <https://vercel.com/new> importa el repo (Vercel detecta Next.js solo).
3. En **Environment Variables** agrega `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`
   (las de tu `.env.local`), `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`,
   `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` y, si la usas, `DOMINIOS_PERMITIDOS`.
4. **Deploy**.

Las claves de desarrollo sirven para un meetup o la demo de tu hackatón (con el tope de 100
usuarios); reclama tu app antes de usarlas fuera de tu compu. Para un lanzamiento real, crea una
instancia de producción con tu dominio y usa las claves `pk_live_`/`sk_live_`.

## Trabajo en equipo

Usen **una sola app de Clerk por equipo**. Si cada laptop corre `pnpm dev` sin claves, cada una
crea su propia app temporal y las cuentas, inscripciones y roles no se comparten.

1. Una persona corre `pnpm dev` (o crea la app en el Dashboard) y reclama la app con su cuenta.
2. Comparte el contenido de `.env.local` con el equipo por un canal privado (nunca por GitHub
   ni en un grupo público): la `CLERK_SECRET_KEY` da acceso a todas las cuentas.
3. El resto pega ese `.env.local` en su copia del repo antes de correr `pnpm dev`.

## Ideas para extenderla

- **QR que abre una URL**: haz que el QR contenga `https://tu-app/staff?codigo=user_...` para
  que el staff con iPhone escanee con la cámara del sistema (el check-in ya acepta un `userId`
  dentro de cualquier texto).
- **Cupos**: en `confirmarAsistencia`, cuenta las inscripciones y cierra el registro al llegar
  al límite (o abre una lista de espera con el componente `<Waitlist />` de Clerk).
- **Varios eventos**: guarda `eventos: { "meetup-octubre": { inscrito, checkin } }` en vez de
  un solo `evento`.
- **Jurado de hackatón**: rol `jurado` y una página `/evaluar` con el patrón de `/staff`.
- **Equipos**: activa Organizations y agrupa a las personas por equipo (5 miembros por
  organización por defecto; puedes subirlo hasta 20 sin pagar). Desde el Dashboard: página
  **Organizations Settings** → **Enable Organizations**. Desde la terminal,
  `pnpm dlx clerk@latest enable orgs` actúa sobre la app **vinculada**, así que con la app
  temporal primero reclámala (`pnpm dlx clerk@latest auth login`) y vincula el proyecto
  (`pnpm dlx clerk@latest link`).
- **Certificados**: genera un PDF de asistencia para quienes tienen `checkin`.
- **Avisos por correo**: escucha los webhooks de Clerk (`user.created`) para dar la bienvenida.

## Solución de problemas

**"Clerk keys are missing from your environment"**
No hay claves en `.env.local`. Corre `pnpm dev` (las crea solo) o copia `.env.example` como
`.env.local` con tus claves y reinicia el servidor. En Vercel, revisa las Environment Variables.

**Ya tengo el rol, pero `/staff` me muestra 403**
Cierra sesión y vuelve a entrar. Si agregaste el claim `metadata`, revisa que esté bien escrito
(paso 3 de [Cómo hacerte staff](#cómo-hacerte-staff)).

**La cámara no abre**
Usa `https://` (o `localhost`), revisa el permiso de cámara del navegador y prueba con Chrome en
Android. Mientras tanto, usa el ingreso manual o la lista.

**`pnpm staff` dice que no hay ninguna cuenta**
La persona primero tiene que crear su cuenta en la app, con ese mismo correo.

## Estructura

```
app/
  page.tsx                 Portada del evento
  pase/page.tsx            Confirmar asistencia y pase con QR
  staff/page.tsx           Panel de staff (contadores, escáner, lista)
  api/inscritos/route.ts   CSV para staff (auth() + 401/403)
  acciones.ts              Server Actions: confirmar, cancelar, check-in, deshacer
  sign-in/, sign-up/       Páginas de Clerk
components/
  cabecera.tsx             Navegación con <Show> y <UserButton />
  escaner-qr.tsx           Cámara + BarcodeDetector + ingreso manual
  lista-inscripciones.tsx  Buscador, filtros y botones de check-in
  avatar.tsx               Foto de perfil de Clerk o iniciales
lib/
  evento.ts                Datos del evento y formato de fechas
  inscripciones.ts         Lectura de cuentas, metadata y dominios permitidos
  roles.ts                 esStaff(): rol desde el session token
  usuario.ts               usuarioActual(): currentUser() con una sola llamada por request
proxy.ts                   clerkMiddleware()
types/globals.d.ts         Tipos del publicMetadata y del session token
scripts/
  ensure-clerk-keys.mjs    Crea claves temporales al correr pnpm dev
  hacer-staff.mjs          pnpm staff tu@correo.com
```

Documentación: [Clerk + Next.js](https://clerk.com/docs/nextjs/getting-started/quickstart) ·
[Metadata de usuarios](https://clerk.com/docs/guides/users/extending) ·
[Roles con metadata](https://clerk.com/docs/guides/secure/basic-rbac) ·
[Session token personalizado](https://clerk.com/docs/guides/sessions/customize-session-tokens)

---

Hecho para el Clerk Workshop × Women Techmakers Santa Cruz
