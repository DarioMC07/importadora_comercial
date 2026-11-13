import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatoDineroDecimal, formatoFechaLarga } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ficha de cliente" };

export default async function PaginaCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await crearClienteServidor();

  // RLS garantiza que solo se devuelve si pertenece al espacio del vendedor.
  const { data: cliente } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!cliente) notFound();

  const [{ data: solicitudes }, { data: ventas }] = await Promise.all([
    supabase
      .from("purchase_requests")
      .select("id, public_code, status, total, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("sales")
      .select("id, code, status, total, payment_method, sold_at")
      .eq("customer_id", id)
      .order("sold_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <nav aria-label="Ruta de navegación" className="text-sm text-slate-500">
        <Link href="/dashboard/clientes" className="hover:underline">Clientes</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-slate-800">{cliente.name}</span>
      </nav>

      <section className="tarjeta p-5" aria-labelledby="t-datos">
        <h1 id="t-datos" className="text-xl font-bold text-slate-900">{cliente.name}</h1>
        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-slate-500">Código</dt><dd className="font-medium">{cliente.code}</dd></div>
          <div><dt className="text-slate-500">CI / NIT (privado)</dt><dd className="font-medium">{cliente.ci_nit ?? "—"}</dd></div>
          <div><dt className="text-slate-500">Teléfono</dt><dd className="font-medium">{cliente.phone ?? "—"}</dd></div>
          <div><dt className="text-slate-500">Correo</dt><dd className="font-medium">{cliente.email ?? "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-slate-500">Dirección</dt><dd className="font-medium">{cliente.address ?? "—"}</dd></div>
          {cliente.notes && (
            <div className="sm:col-span-2 lg:col-span-3"><dt className="text-slate-500">Notas</dt><dd className="font-medium">{cliente.notes}</dd></div>
          )}
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="tarjeta p-5" aria-labelledby="t-solicitudes">
          <h2 id="t-solicitudes" className="mb-3 font-semibold text-slate-900">
            Solicitudes ({solicitudes?.length ?? 0})
          </h2>
          {(solicitudes ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">Sin solicitudes registradas.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {(solicitudes ?? []).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="font-mono font-semibold">{s.public_code}</span>
                  <Badge tono={s.status === "NUEVA" ? "azul" : s.status === "RECHAZADA" ? "rojo" : "gris"}>
                    {s.status}
                  </Badge>
                  <span>{formatoDineroDecimal(s.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="tarjeta p-5" aria-labelledby="t-ventas">
          <h2 id="t-ventas" className="mb-3 font-semibold text-slate-900">
            Ventas ({ventas?.length ?? 0})
          </h2>
          {(ventas ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">Sin ventas registradas.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {(ventas ?? []).map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="font-mono font-semibold">{v.code}</span>
                  <span className="text-slate-500">{formatoFechaLarga(v.sold_at)}</span>
                  <Badge tono={v.status === "CONFIRMADA" ? "verde" : v.status === "ANULADA" ? "rojo" : "gris"}>
                    {v.status}
                  </Badge>
                  <span>{formatoDineroDecimal(v.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
