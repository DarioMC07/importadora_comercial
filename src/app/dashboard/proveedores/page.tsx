import { crearClienteServidor } from "@/lib/supabase/server";
import { GestionProveedores } from "@/components/dashboard/proveedores/gestion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Proveedores" };

export default async function PaginaProveedores() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Proveedores</h1>
        <p className="text-sm text-slate-500">
          Información privada de tus proveedores. Nunca se muestra en el marketplace.
        </p>
      </div>
      <GestionProveedores proveedores={data ?? []} />
    </div>
  );
}
