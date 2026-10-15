import { crearClienteServidor } from "@/lib/supabase/server";
import { GestionInventario } from "@/components/dashboard/inventario/gestion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventario" };

export default async function PaginaInventario() {
  const supabase = await crearClienteServidor();
  const [{ data: productos }, { data: movimientos }] = await Promise.all([
    supabase
      .from("products")
      .select("id, sku, name, stock, min_stock, unit, active")
      .order("name"),
    supabase
      .from("inventory_movements")
      .select("id, type, quantity, reason, ref_type, created_at, products(name, sku)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventario</h1>
        <p className="text-sm text-slate-500">
          Existencias actuales e historial inmutable de movimientos.
        </p>
      </div>
      <GestionInventario
        productos={productos ?? []}
        movimientos={(movimientos ?? []) as unknown as import("@/components/dashboard/inventario/gestion").Movimiento[]}
      />
    </div>
  );
}
