"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesionVendedor } from "@/lib/auth";
import { clienteSchema } from "@/lib/validators";
import { mensajeError } from "./errores";
import type { ResultadoAccion } from "./proveedores";

export async function guardarCliente(input: unknown, id?: string): Promise<ResultadoAccion> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada. Ingresa nuevamente." };

  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const supabase = await crearClienteServidor();
  const datos = {
    workspace_id: sesion.workspaceId,
    code: parsed.data.code,
    name: parsed.data.name,
    ci_nit: parsed.data.ci_nit || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    notes: parsed.data.notes || null,
  };

  if (id) {
    const { error } = await supabase
      .from("customers")
      .update(datos)
      .eq("id", id)
      .eq("workspace_id", sesion.workspaceId);
    if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  } else {
    const { error } = await supabase.from("customers").insert(datos);
    if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  }

  revalidatePath("/dashboard/clientes");
  return { ok: true };
}
