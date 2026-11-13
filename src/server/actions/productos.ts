"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesionVendedor } from "@/lib/auth";
import { productoSchema } from "@/lib/validators";
import { mensajeError } from "./errores";
import type { ResultadoAccion } from "./proveedores";

export async function subirImagenProducto(form: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada." };
  const file = form.get("imagen");
  if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2097152 || file.size === 0) {
    return { ok: false, error: "Selecciona una imagen JPG, PNG o WebP de hasta 2 MB." };
  }
  const supabase = await crearClienteServidor();
  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = `${sesion.workspaceId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
  if (error) return { ok: false, error: "No se pudo subir la imagen. Intenta nuevamente." };
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
  return { ok: true, url };
}

export async function guardarProducto(input: unknown, id?: string): Promise<ResultadoAccion> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada. Ingresa nuevamente." };

  const parsed = productoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const numOrNull = (s: string | undefined) =>
    s && /^\d+(\.\d+)?$/.test(s) ? Number(s) : null;

  const supabase = await crearClienteServidor();
  const datos = {
    workspace_id: sesion.workspaceId,
    sku: parsed.data.sku,
    name: parsed.data.name,
    description: parsed.data.description || null,
    category: parsed.data.category,
    base_cost: Number(parsed.data.base_cost),
    sale_price: Number(parsed.data.sale_price),
    freight_alloc: Number(parsed.data.freight_alloc),
    duty_alloc: Number(parsed.data.duty_alloc),
    other_alloc: Number(parsed.data.other_alloc),
    dim_length: numOrNull(parsed.data.dim_length),
    dim_width: numOrNull(parsed.data.dim_width),
    dim_height: numOrNull(parsed.data.dim_height),
    dim_unit: parsed.data.dim_unit,
    weight_kg: numOrNull(parsed.data.weight_kg),
    min_stock: parsed.data.min_stock,
    unit: parsed.data.unit,
    origin_country: parsed.data.origin_country || null,
    origin_public: parsed.data.origin_public,
    notes: parsed.data.notes || null,
    active: parsed.data.active,
    ...(parsed.data.image_url !== undefined && { image_url: parsed.data.image_url || null }),
    ...(parsed.data.sizes !== undefined && { sizes: parsed.data.sizes }),
    ...(parsed.data.colors !== undefined && { colors: parsed.data.colors }),
    ...(parsed.data.catalog_availability !== undefined && { catalog_availability: parsed.data.catalog_availability }),
  };

  if (id) {
    const { error } = await supabase
      .from("products")
      .update(datos)
      .eq("id", id)
      .eq("workspace_id", sesion.workspaceId);
    if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  } else {
    const { error } = await supabase.from("products").insert(datos);
    if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  }

  revalidatePath("/dashboard/productos");
  revalidatePath("/dashboard");
  revalidatePath("/catalogo");
  return { ok: true };
}

/** Publicar: copia solo campos autorizados a catalog_listings (función RPC). */
export async function publicarProducto(id: string): Promise<ResultadoAccion> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("publish_product", { p_product_id: id });
  if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  revalidatePath("/dashboard/productos");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return { ok: true };
}

/** Despublicar: retira del catálogo sin borrar el producto privado. */
export async function despublicarProducto(id: string): Promise<ResultadoAccion> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("unpublish_product", { p_product_id: id });
  if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  revalidatePath("/dashboard/productos");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return { ok: true };
}
