import { crearClienteServidor } from "@/lib/supabase/server";
import { GestionClientes } from "@/components/dashboard/clientes/gestion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clientes" };

export default async function PaginaClientes() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("customers")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        <p className="text-sm text-slate-500">
          Tu libreta de clientes es privada: no se comparte con otros vendedores.
        </p>
      </div>
      <GestionClientes clientes={data ?? []} />
    </div>
  );
}
