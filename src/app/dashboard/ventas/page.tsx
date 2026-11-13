import { crearClienteServidor } from "@/lib/supabase/server";
import { GestionVentas } from "@/components/dashboard/ventas/gestion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ventas" };

export default async function PaginaVentas() {
  const supabase = await crearClienteServidor();
  const [{ data: ventas }, { data: clientes }, { data: productos }] = await Promise.all([
    supabase
      .from("sales")
      .select("*, customers(name), sale_items(id, product_id, quantity, unit_price, base_cost_snapshot, landed_cost_snapshot, products(name))")
      .order("sold_at", { ascending: false }),
    supabase.from("customers").select("id, code, name").order("name"),
    supabase.from("products").select("id, sku, name, sale_price, stock").eq("active", true).order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ventas</h1>
        <p className="text-sm text-slate-500">
          Registro diario de ventas. Confirmar descuenta stock (una sola vez); anular genera
          un reverso auditable sin borrar el historial.
        </p>
      </div>
      <GestionVentas
        ventas={(ventas ?? []) as unknown as import("@/components/dashboard/ventas/gestion").Venta[]}
        clientes={clientes ?? []}
        productos={productos ?? []}
      />
    </div>
  );
}
