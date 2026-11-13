"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesionVendedor } from "@/lib/auth";
import { estadoSolicitudSchema } from "@/lib/validators";
import { mensajeError } from "./errores";
import type { ResultadoAccion } from "./proveedores";

export async function cambiarEstadoSolicitud(input: unknown): Promise<ResultadoAccion> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada. Ingresa nuevamente." };

  const parsed = estadoSolicitudSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("purchase_requests")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.request_id)
    .eq("workspace_id", sesion.workspaceId)
    .neq("status", "CONVERTIDA"); // una convertida no cambia de estado

  if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  revalidatePath("/dashboard/solicitudes");
  return { ok: true };
}
