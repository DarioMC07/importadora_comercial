import { crearClienteServidor } from "@/lib/supabase/server";
import { GestionSolicitudes } from "@/components/dashboard/solicitudes/gestion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Solicitudes" };

export default async function PaginaSolicitudes() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("purchase_requests")
    .select("*, purchase_request_items(id, product_id, product_name, quantity, unit_price)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Solicitudes de compra</h1>
        <p className="text-sm text-slate-500">
          Solicitudes recibidas desde el marketplace. Solo ves las de tu espacio.
        </p>
      </div>
      <GestionSolicitudes
        solicitudes={(data ?? []) as unknown as import("@/components/dashboard/solicitudes/gestion").Solicitud[]}
      />
    </div>
  );
}
