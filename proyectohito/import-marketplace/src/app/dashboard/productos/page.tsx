import { crearClienteServidor } from "@/lib/supabase/server";
import { GestionProductos } from "@/components/dashboard/productos/gestion";
import { requerirVendedor } from "@/lib/auth";
import { TiendaInformacion } from "@/components/dashboard/tienda";

export const dynamic = "force-dynamic";
export const metadata = { title: "Catálogo de Productos" };

export default async function PaginaProductos() {
  const supabase = await crearClienteServidor();
  const sesion = await requerirVendedor();
  const esAveli = sesion.workspaceSlug === "aveli";

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("workspace_id", sesion.workspaceId)
    .order("name", { ascending: true });

  const ids = (data ?? []).map((p) => p.id as string);
  const { data: imagenes } =
    ids.length > 0
      ? await supabase
          .from("product_images")
          .select("product_id, storage_path, public_url, position")
          .in("product_id", ids)
      : { data: [] };
  const productos = (data ?? []).map((p) => ({
    ...p,
    product_images: (imagenes ?? []).filter((i) => i.product_id === p.id),
  }));

  const subtituloPorTienda: Record<string, string> = {
    aveli: "Blusas y poleras · Piezas que realzan tu esencia. Administra tu colección y agrega nuevas prendas.",
    smaylan: "Cosmética facial y maquillaje especializado. Administra tus productos oficiales y disponibilidad.",
    "chocolates-capri": "Chocolates Nestlé Capri. Administra presentaciones, stock y fichas técnicas.",
    trencito: "Chocolate Trencito Express. Administra la presentación oficial, stock y precios.",
  };

  const subtitulo =
    subtituloPorTienda[sesion.workspaceSlug] ||
    "Catálogo oficial de productos. Administra fotografías, disponibilidad y precios.";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo-pagina">
          Catálogo {sesion.workspaceNombre}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{subtitulo}</p>
      </div>

      {error ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          No se pudieron cargar los productos. Intenta nuevamente.
        </div>
      ) : (
        <GestionProductos
          productos={productos}
          esAveli={esAveli}
          workspaceNombre={sesion.workspaceNombre}
        />
      )}

      <TiendaInformacion slug={sesion.workspaceSlug} />
    </div>
  );
}
