"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesionVendedor } from "@/lib/auth";
import { ajusteInventarioSchema } from "@/lib/validators";
import { mensajeError } from "./errores";
import type { ResultadoAccion } from "./proveedores";

/** Ajuste manual con motivo obligatorio; la función RPC evita stock negativo. */
export async function ajustarInventario(input: unknown): Promise<ResultadoAccion> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada. Ingresa nuevamente." };

  const parsed = ajusteInventarioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("adjust_inventory", {
    p_product_id: parsed.data.product_id,
    p_delta: parsed.data.delta,
    p_reason: parsed.data.reason,
  });
  if (error) return { ok: false, error: mensajeError(error.code, error.message) };

  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard/productos");
  return { ok: true };
}
