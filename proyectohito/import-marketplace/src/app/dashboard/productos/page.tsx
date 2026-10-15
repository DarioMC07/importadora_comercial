import { crearClienteServidor } from "@/lib/supabase/server";
import { GestionProductos } from "@/components/dashboard/productos/gestion";
import { requerirVendedor } from "@/lib/auth";
import { AveliInformacion } from "@/components/dashboard/aveli";

export const dynamic = "force-dynamic";
export const metadata = { title: "Productos" };

export default async function PaginaProductos() {
  const supabase = await crearClienteServidor();
  const sesion = await requerirVendedor();
  const esAveli = sesion.workspaceSlug === "aveli";
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("workspace_id", sesion.workspaceId)
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{esAveli ? "Colección AVÉLI" : "Productos"}</h1>
        <p className="text-sm text-slate-500">
          {esAveli ? "Blusas y poleras · Piezas que realzan tu esencia. Administra tu colección y agrega nuevas prendas." : "Costos y datos internos de tu inventario. Solo tú puedes verlos."}
        </p>
      </div>
      {error ? <p role="alert">No se pudieron cargar los productos. Intenta nuevamente.</p> : <GestionProductos productos={data ?? []} esAveli={esAveli} />}
      {esAveli && <AveliInformacion />}
    </div>
  );
}
