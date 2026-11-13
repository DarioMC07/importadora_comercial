import { crearClienteServidor } from "@/lib/supabase/server";
import type { FiltroCatalogo } from "@/lib/validators";

export interface ImagenListing {
  url: string;
  alt: string;
}

export interface Listing {
  id: string;
  product_id: string; // UUID no predecible, expuesto por la proyección pública
  workspace_id: string; // solo para agrupar el carrito por vendedor
  slug: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  availability: "DISPONIBLE" | "POCAS_UNIDADES" | "AGOTADO";
  origin_country: string | null;
  dims_public: Record<string, unknown> | null;
  seller_public_name: string;
  seller_slug: string;
  images: ImagenListing[];
  published_at: string;
}

export interface ResultadoCatalogo {
  items: Listing[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export const POR_PAGINA = 12;

/**
 * Catálogo público. Lee EXCLUSIVAMENTE de catalog_listings (la proyección
 * pública): el rol anónimo no tiene permiso de lectura sobre products.
 */
export async function buscarCatalogo(filtros: FiltroCatalogo): Promise<ResultadoCatalogo> {
  const supabase = await crearClienteServidor();
  const pagina = filtros.pagina;
  const desde = (pagina - 1) * POR_PAGINA;
  const hasta = desde + POR_PAGINA - 1;

  let query = supabase
    .from("catalog_listings")
    .select("*", { count: "exact" })
    .range(desde, hasta);

  if (filtros.q) {
    const q = filtros.q.replace(/[%,()]/g, " ").trim();
    if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
  }
  if (filtros.categoria) query = query.eq("category", filtros.categoria);
  if (filtros.vendedor) query = query.eq("seller_slug", filtros.vendedor);
  if (filtros.min !== undefined) query = query.gte("price", filtros.min);
  if (filtros.max !== undefined) query = query.lte("price", filtros.max);
  if (filtros.disponibilidad) query = query.eq("availability", filtros.disponibilidad);

  switch (filtros.orden) {
    case "precio_asc":
      query = query.order("price", { ascending: true });
      break;
    case "precio_desc":
      query = query.order("price", { ascending: false });
      break;
    case "novedades":
      query = query.order("published_at", { ascending: false });
      break;
    default:
      // Relevancia: disponibles primero, luego recientes.
      query = query
        .order("availability", { ascending: true })
        .order("published_at", { ascending: false });
  }

  const { data, count, error } = await query;
  if (error) throw new Error("No se pudo cargar el catálogo");

  const total = count ?? 0;
  return {
    items: (data ?? []) as Listing[],
    total,
    pagina,
    porPagina: POR_PAGINA,
    totalPaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
  };
}

export async function obtenerListingPorSlug(slug: string): Promise<Listing | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("catalog_listings")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Listing | null) ?? null;
}

export async function obtenerRelacionados(
  categoria: string,
  excluirSlug: string,
): Promise<Listing[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("catalog_listings")
    .select("*")
    .eq("category", categoria)
    .neq("slug", excluirSlug)
    .neq("availability", "AGOTADO")
    .order("published_at", { ascending: false })
    .limit(4);
  return (data ?? []) as Listing[];
}

export async function obtenerDestacados(): Promise<Listing[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("catalog_listings")
    .select("*")
    .neq("availability", "AGOTADO")
    .order("published_at", { ascending: false })
    .limit(8);
  return (data ?? []) as Listing[];
}

export async function obtenerCategorias(): Promise<string[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("catalog_listings").select("category");
  const unicas = new Set((data ?? []).map((r: { category: string }) => r.category));
  return [...unicas].sort((a, b) => a.localeCompare(b, "es"));
}

export async function obtenerVendedoresPublicos(): Promise<
  { slug: string; nombre: string; productos: number }[]
> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("catalog_listings")
    .select("seller_slug, seller_public_name");
  const mapa = new Map<string, { slug: string; nombre: string; productos: number }>();
  for (const r of data ?? []) {
    const actual = mapa.get(r.seller_slug);
    if (actual) actual.productos += 1;
    else mapa.set(r.seller_slug, { slug: r.seller_slug, nombre: r.seller_public_name, productos: 1 });
  }
  return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
