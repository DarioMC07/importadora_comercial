"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesionVendedor } from "@/lib/auth";
import { ventaSchema } from "@/lib/validators";
import { mensajeError } from "./errores";
import type { ResultadoAccion } from "./proveedores";

export async function crearVenta(input: unknown): Promise<ResultadoAccion> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada. Ingresa nuevamente." };

  const parsed = ventaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("create_sale", {
    p_items: parsed.data.items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price !== undefined ? Number(i.unit_price) : null,
    })),
    p_payment_method: parsed.data.payment_method,
    p_discount: Number(parsed.data.discount),
    p_customer_id: parsed.data.customer_id || null,
    p_request_id: parsed.data.request_id ?? null,
  });

  if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  revalidatePath("/dashboard/ventas");
  revalidatePath("/dashboard/solicitudes");
  return { ok: true, id: data as string };
}

/** Confirmar: descuenta stock atómicamente y solo una vez. */
export async function confirmarVenta(id: string): Promise<ResultadoAccion> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("confirm_sale", { p_sale_id: id });
  if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  revalidatePath("/dashboard/ventas");
  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Anular: genera movimientos REVERSO; nunca borra el historial. */
export async function anularVenta(id: string, motivo: string): Promise<ResultadoAccion> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada." };
  if (!motivo || motivo.trim().length < 3) {
    return { ok: false, error: "Indica el motivo de la anulación." };
  }
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("cancel_sale", { p_sale_id: id, p_reason: motivo.trim() });
  if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  revalidatePath("/dashboard/ventas");
  revalidatePath("/dashboard/inventario");
  return { ok: true };
}
