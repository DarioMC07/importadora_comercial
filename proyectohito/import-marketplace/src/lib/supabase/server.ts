import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente SSR oficial: sesión en cookies, verificación en servidor.
 * Se crea por request (Server Components, Server Actions, Route Handlers).
 */
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamado desde un Server Component de solo lectura: el middleware
            // se encarga de refrescar la sesión.
          }
        },
      },
    },
  );
}
