"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesionVendedor } from "@/lib/auth";
import { imagenesProductoSchema, productoSchema, uuidSchema } from "@/lib/validators";
import { validarArchivoImagen } from "@/lib/galeria";
import { limpiarAtributos } from "@/lib/rubros";
import { mensajeError } from "./errores";
import type { ResultadoAccion } from "./proveedores";

export type ResultadoProducto = ResultadoAccion & { errores?: Record<string, string> };

export async function guardarProducto(input: unknown, id?: string): Promise<ResultadoProducto> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada. Ingresa nuevamente." };

  const parsed = productoSchema.safeParse(input);
  if (!parsed.success) {
    const errores: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const ruta = issue.path.join(".");
      if (ruta && !errores[ruta]) errores[ruta] = issue.message;
    }
    return { ok: false, error: parsed.error.issues[0]?.message, errores };
  }

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
    rubro: parsed.data.rubro,
    attributes: limpiarAtributos(parsed.data.rubro, parsed.data.attributes),
    ...(parsed.data.image_url !== undefined && { image_url: parsed.data.image_url || null }),
    ...(parsed.data.sizes !== undefined && { sizes: parsed.data.sizes }),
    ...(parsed.data.colors !== undefined && { colors: parsed.data.colors }),
    ...(parsed.data.catalog_availability !== undefined && { catalog_availability: parsed.data.catalog_availability }),
  };

  let productoId = id;
  if (id) {
    const { error } = await supabase
      .from("products")
      .update(datos)
      .eq("id", id)
      .eq("workspace_id", sesion.workspaceId);
    if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  } else {
    const { data: creado, error } = await supabase.from("products").insert(datos).select("id").single();
    if (error) return { ok: false, error: mensajeError(error.code, error.message) };
    productoId = creado.id as string;
  }

  revalidatePath("/dashboard/productos");
  revalidatePath("/dashboard");
  revalidatePath("/catalogo");
  return { ok: true, id: productoId };
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

/** Sube un archivo de la galería a la carpeta del producto. No escribe en la base. */
export async function subirImagenGaleria(
  form: FormData,
): Promise<{ ok: boolean; storage_path?: string; public_url?: string; error?: string }> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada." };
  const productId = uuidSchema.safeParse(form.get("productId"));
  if (!productId.success) return { ok: false, error: "Identificador inválido" };
  const file = form.get("imagen");
  if (!(file instanceof File)) return { ok: false, error: "Selecciona una imagen JPG, PNG o WebP de hasta 2 MB." };
  const problema = validarArchivoImagen(file);
  if (problema) return { ok: false, error: problema };
  const supabase = await crearClienteServidor();
  const { data: producto } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId.data)
    .eq("workspace_id", sesion.workspaceId)
    .maybeSingle();
  if (!producto) return { ok: false, error: "El producto no existe o no pertenece a tu espacio." };
  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const storage_path = `${sesion.workspaceId}/${productId.data}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(storage_path, file, { contentType: file.type });
  if (error) return { ok: false, error: "No se pudo subir la imagen. Intenta nuevamente." };
  const public_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${storage_path}`;
  return { ok: true, storage_path, public_url };
}

/** Reemplaza la galería completa del producto, en el orden recibido (la primera es la portada). */
export async function guardarImagenesProducto(productId: string, imagenes: unknown): Promise<ResultadoAccion> {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return { ok: false, error: "Sesión expirada." };
  const id = uuidSchema.safeParse(productId);
  if (!id.success) return { ok: false, error: id.error.issues[0]?.message };
  const parsed = imagenesProductoSchema.safeParse(imagenes);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("set_product_images", { p_product_id: id.data, p_images: parsed.data });
  if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  const sobrantes = Array.isArray(data) ? (data as string[]) : [];
  if (sobrantes.length > 0) await supabase.storage.from("product-images").remove(sobrantes);
  revalidatePath("/dashboard/productos");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return { ok: true, id: id.data };
}
