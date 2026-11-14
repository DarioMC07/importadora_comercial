# ImportHub — guía para agentes de IA

Marketplace multi-vendedor para pequeños importadores. Next.js 15 (App Router), React 19, TypeScript estricto, Supabase (PostgreSQL, Auth, Storage), Tailwind, Zod, React Hook Form, Vitest y Playwright.

Lee este archivo completo antes de editar. Para instalar y levantar el proyecto, sigue `README.md`. Las decisiones de diseño ya tomadas están en `docs/DECISIONES.md`.

## Reglas que no se rompen

1. **Sin commit, push, stash, reset ni cambio de rama** salvo pedido explícito de la persona.
2. **Secretos:** no leas, imprimas ni copies `.env`, `.env.local`, claves ni tokens. Los nombres de las variables están en `.env.example`. La `service_role` solo se usa en `scripts/`, nunca en `src/`.
3. **Aislamiento entre vendedores:** el `workspace_id` nunca llega desde el cliente. Se resuelve en el servidor con `obtenerSesionVendedor()` (`src/lib/auth.ts`). Toda tabla privada nueva lleva `workspace_id` y sus políticas RLS.
4. **Lado público:** el visitante anónimo solo lee `catalog_listings` y el bucket `product-images`. Nunca expongas costos, stock exacto, proveedores ni márgenes.
5. **Migraciones:** no edites una migración existente. Agrega un archivo nuevo en `supabase/migrations/` con el siguiente número de cuatro dígitos (`0007_<descripcion>.sql` es el siguiente libre mientras nadie agregue otra).
6. **Dinero:** sin floats. `numeric(14,2)` en PostgreSQL y centavos enteros en TypeScript, con las funciones de `src/lib/money.ts`. Para mostrar, `src/lib/format.ts`.
7. **Operaciones de varias filas** (stock, ventas, importaciones): en una función PL/pgSQL llamada por `supabase.rpc(...)`, no en varias consultas desde TypeScript.
8. **Alcance:** toca solo lo que la tarea pide. Sin refactors, renombres ni reformateo de líneas ajenas. No instales ni actualices dependencias sin pedido.
9. **Gestor de paquetes:** las dependencias se instalan con `pnpm` (`pnpm install`, `pnpm add <paquete>`). No uses `npm install`. Ojo: el `Dockerfile` todavía instala con `npm ci` y `package-lock.json`; si agregas una dependencia, avisa, porque la imagen Docker no la verá hasta que se actualice ese archivo.
10. **Si la tarea no calza con el código** (un archivo o símbolo no existe, dos instrucciones se contradicen), detente y pregunta. No improvises.

## Comandos

| Comando | Qué hace | Qué necesita |
| :--- | :--- | :--- |
| `pnpm dev` | App en `http://localhost:3000` | Supabase local o remoto, `.env.local` |
| `pnpm check` | `lint`, `typecheck`, `test` y `build` | Solo dependencias instaladas |
| `pnpm test` | Pruebas unitarias (Vitest) | Nada más |
| `pnpm test:rls` | Pruebas de aislamiento RLS | Supabase con migraciones y seed |
| `pnpm test:e2e` | Playwright (levanta la app si falta) | Supabase con seed, Chromium instalado |
| `pnpm dlx supabase db reset` | Reaplica migraciones y seed en local | Supabase local |

## Dónde va cada cosa

| Carpeta | Contenido |
| :--- | :--- |
| `src/app/(public)/` | Rutas públicas: catálogo, carrito, solicitud, ingreso |
| `src/app/dashboard/<modulo>/` | Rutas privadas del vendedor. Server Components que leen datos |
| `src/components/dashboard/<modulo>/` | Componentes cliente del panel: formularios y tablas |
| `src/components/marketplace/` | Componentes de la tienda pública |
| `src/components/ui/` | Componentes genéricos sin lógica de negocio |
| `src/server/actions/` | Server Actions: toda mutación pasa por aquí |
| `src/lib/queries/` | Lecturas y agregaciones |
| `src/lib/validators.ts` | Esquemas Zod, compartidos entre formulario y servidor |
| `src/lib/supabase/` | Clientes: `server.ts`, `client.ts`, `middleware.ts` |
| `supabase/migrations/` | Esquema, funciones, RLS y storage |
| `tests/unit/` | Vitest, `*.test.ts` |
| `e2e/` | Playwright, `*.spec.ts` |

## Cómo se escribe cada pieza

Imita el archivo modelo: mismo nombre, misma forma, mismo manejo de errores.

**Server Action** — modelo: `guardarProducto` en `src/server/actions/productos.ts`. El tipo `ResultadoAccion` está en `src/server/actions/proveedores.ts`.
1. `"use server"` en la primera línea del archivo.
2. Nombre con verbo en infinitivo en español: `guardarX`, `eliminarX`, `confirmarX`.
3. Recibe `input: unknown` y devuelve `Promise<ResultadoAccion>` (`{ ok, error?, id? }`).
4. Orden del cuerpo: `obtenerSesionVendedor()`; `schema.safeParse(input)`; escritura con `workspace_id: sesion.workspaceId`; errores con `mensajeError(error.code, error.message)` de `src/server/actions/errores.ts`; `revalidatePath(...)` de cada ruta afectada.
5. Un error de negocio nuevo se agrega al mapa de `mensajeError`, con texto en español apto para el usuario.

**Operación atómica** — modelo: `confirmarVenta` en `src/server/actions/ventas.ts`, que llama a `confirm_sale` en `supabase/migrations/0003_transactions.sql`. La función SQL valida la membresía con `public.is_member_of(...)` y lanza excepciones con identificador (`'NO_AUTORIZADO'`, `'STOCK_INSUFICIENTE'`).

**Esquema Zod** — en `src/lib/validators.ts`, nombre `<entidad>Schema`, tipo `<Entidad>Input`, siempre con `.strict()`.

**Página del panel** — modelo: `src/app/dashboard/proveedores/page.tsx` con `src/components/dashboard/proveedores/gestion.tsx`.
- La página es un Server Component con `export const dynamic = "force-dynamic"`, lee con `crearClienteServidor()` y pasa los datos al componente cliente.
- El componente cliente usa `useForm` con `zodResolver(schema)`, llama a la acción dentro de `startTransition` y muestra `r.error` cuando `r.ok` es falso.

**Tabla nueva** — `workspace_id` con clave foránea a `seller_workspaces`, RLS activado y políticas en la misma migración, siguiendo `supabase/migrations/0004_rls.sql`. Agrega su caso en `scripts/run-rls-tests.mjs`.

## Nombres

| Elemento | Idioma y formato | Ejemplo |
| :--- | :--- | :--- |
| Tablas, columnas y funciones SQL | Inglés, `snake_case` | `inventory_movements`, `confirm_sale` |
| Estados (enums) | Español, mayúsculas | `BORRADOR`, `CONFIRMADA` |
| Funciones y variables TypeScript | Español, `camelCase` | `guardarProducto`, `formatoDinero` |
| Archivos | Español, `kebab-case` | `tarjeta-producto.tsx` |
| Rutas | Español, `kebab-case` | `/dashboard/importaciones` |
| Textos de interfaz y mensajes de error | Español (es-BO) | — |

Los imports dentro de `src/` usan el alias `@/`.

## TypeScript

`strict`, `noUncheckedIndexedAccess` y `noImplicitOverride` están activos. Acceder a un índice devuelve un valor que puede ser `undefined`: manéjalo. No uses `any` ni `@ts-ignore` para pasar el chequeo.

## Pruebas

- Lógica pura (dinero, validadores, carrito): prueba unitaria en `tests/unit/`, al estilo de `tests/unit/money.test.ts`.
- Política o tabla nueva: caso en `scripts/run-rls-tests.mjs` que demuestre que el vendedor 1 no lee ni escribe datos del vendedor 2.
- Un arreglo de bug incluye una prueba que falla sin el arreglo, cuando el área tiene pruebas.

## Terminado significa

1. `pnpm check` pasa.
2. Si tocaste migraciones, RLS o funciones SQL: `pnpm test:rls` pasa. Si Supabase no está corriendo, dilo; no lo des por pasado.
3. No quedan `console.log`, código comentado ni archivos fuera del alcance en el diff.
4. Informas qué archivos cambiaste, qué comandos corriste con su resultado, y lo que no hiciste.
