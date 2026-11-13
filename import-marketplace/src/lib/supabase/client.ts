import { createBrowserClient } from "@supabase/ssr";

/** Cliente para componentes de navegador (usa la anon key, segura por RLS). */
export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
