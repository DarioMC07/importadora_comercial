"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesionVendedor } from "@/lib/auth";
import { importacionSchema } from "@/lib/validators";
import { mensajeError } from "./errores";
import type { ResultadoAccion } from "./proveedores";

export async function crearImportacion(input: unknown): Promise<ResultadoAccion> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada. Ingresa nuevamente." };

  const parsed = importacionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("create_import", {
    p_supplier_id: parsed.data.supplier_id,
    p_code: parsed.data.code,
    p_origin_country: parsed.data.origin_country,
    p_ordered_at: parsed.data.ordered_at,
    p_eta_at: parsed.data.eta_at || null,
    p_currency: parsed.data.currency,
    p_fx_rate: parsed.data.fx_rate ? Number(parsed.data.fx_rate) : null,
    p_freight_cost: Number(parsed.data.freight_cost),
    p_duties_cost: Number(parsed.data.duties_cost),
    p_other_costs: Number(parsed.data.other_costs),
    p_items: parsed.data.items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_cost: Number(i.unit_cost),
    })),
  });

  if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  revalidatePath("/dashboard/importaciones");
  return { ok: true, id: data as string };
}

/** Marcar RECIBIDO: atómico e idempotente (función RPC). */
export async function recibirImportacion(id: string): Promise<ResultadoAccion> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("receive_import", { p_import_id: id });
  if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  revalidatePath("/dashboard/importaciones");
  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard/productos");
  return { ok: true };
}

/** Cambio de estado no destructivo (PEDIDO / EN_TRANSITO / CANCELADO). */
export async function cambiarEstadoImportacion(
  id: string,
  estado: "PEDIDO" | "EN_TRANSITO" | "CANCELADO",
): Promise<ResultadoAccion> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("imports")
    .update({ status: estado })
    .eq("id", id)
    .eq("workspace_id", sesion.workspaceId)
    .neq("status", "RECIBIDO");
  if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  revalidatePath("/dashboard/importaciones");
  return { ok: true };
}
