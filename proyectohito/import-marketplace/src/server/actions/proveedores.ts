"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesionVendedor } from "@/lib/auth";
import { proveedorSchema } from "@/lib/validators";
import { mensajeError } from "./errores";

export interface ResultadoAccion {
  ok: boolean;
  error?: string;
  id?: string;
}

async function sesionOFallo() {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return null;
  return sesion;
}

export async function guardarProveedor(input: unknown, id?: string): Promise<ResultadoAccion> {
  const sesion = await sesionOFallo();
  if (!sesion) return { ok: false, error: "Sesión expirada. Ingresa nuevamente." };

  const parsed = proveedorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const supabase = await crearClienteServidor();
  const datos = {
    workspace_id: sesion.workspaceId, // siempre del servidor
    code: parsed.data.code,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    country: parsed.data.country,
    notes: parsed.data.notes || null,
    active: parsed.data.active,
  };

  if (id) {
    // Anti-IDOR: el RLS bloquea filas ajenas; además filtramos por workspace del servidor.
    const { error } = await supabase
      .from("suppliers")
      .update(datos)
      .eq("id", id)
      .eq("workspace_id", sesion.workspaceId);
    if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  } else {
    const { error } = await supabase.from("suppliers").insert(datos);
    if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  }

  revalidatePath("/dashboard/proveedores");
  return { ok: true };
}

export async function eliminarProveedor(id: string): Promise<ResultadoAccion> {
  const sesion = await sesionOFallo();
  if (!sesion) return { ok: false, error: "Sesión expirada." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", id)
    .eq("workspace_id", sesion.workspaceId);
  if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  revalidatePath("/dashboard/proveedores");
  return { ok: true };
}
