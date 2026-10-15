import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface SesionVendedor {
  userId: string;
  email: string | undefined;
  nombreCompleto: string;
  workspaceId: string;
  workspaceNombre: string;
  workspaceSlug: string;
  rol: string;
}

/**
 * Resuelve la sesión y el espacio del vendedor DESDE EL SERVIDOR.
 * El workspace_id jamás se acepta del navegador: se obtiene de
 * workspace_members según el usuario autenticado. Segunda barrera: RLS.
 */
export async function obtenerSesionVendedor(): Promise<SesionVendedor | null> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membresia } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, seller_workspaces!inner(id, public_name, slug, active)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membresia) return null;
  const ws = membresia.seller_workspaces as unknown as {
    id: string;
    public_name: string;
    slug: string;
    active: boolean;
  };

  const { data: perfil } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email,
    nombreCompleto: perfil?.full_name ?? "Vendedor",
    workspaceId: ws.id,
    workspaceNombre: ws.public_name,
    workspaceSlug: ws.slug,
    rol: membresia.role,
  };
}

/** Guarda para páginas privadas: sin sesión → /ingresar. */
export async function requerirVendedor(): Promise<SesionVendedor> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) redirect("/ingresar");
  return sesion;
}
