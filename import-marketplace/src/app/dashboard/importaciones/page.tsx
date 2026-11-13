import { crearClienteServidor } from "@/lib/supabase/server";
import { GestionImportaciones } from "@/components/dashboard/importaciones/gestion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Importaciones" };

export default async function PaginaImportaciones() {
  const supabase = await crearClienteServidor();
  const [{ data: importaciones }, { data: proveedores }, { data: productos }] = await Promise.all([
    supabase
      .from("imports")
      .select("*, suppliers(name), import_items(id, product_id, quantity, unit_cost, products(name, sku))")
      .order("created_at", { ascending: false }),
    supabase.from("suppliers").select("id, code, name").eq("active", true).order("name"),
    supabase.from("products").select("id, sku, name").eq("active", true).order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Importaciones</h1>
        <p className="text-sm text-slate-500">
          Registra pedidos al exterior y su recepción. Al marcar una importación como
          recibida, el stock aumenta una sola vez (operación atómica e idempotente).
        </p>
      </div>
      <GestionImportaciones
        importaciones={(importaciones ?? []) as unknown as import("@/components/dashboard/importaciones/gestion").Importacion[]}
        proveedores={proveedores ?? []}
        productos={productos ?? []}
      />
    </div>
  );
}
