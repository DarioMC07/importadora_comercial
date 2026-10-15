import Link from "next/link";
import { obtenerResumen } from "@/lib/queries/dashboard";
import { formatoDineroDecimal, formatoEntero } from "@/lib/format";
import { GraficoVentasPorDia, GraficoFormaPago, GraficoTopProductos } from "@/components/dashboard/graficos";
import { Badge } from "@/components/ui/badge";
import { requerirVendedor } from "@/lib/auth";
import { AveliBienvenida, AveliInformacion } from "@/components/dashboard/aveli";

export const dynamic = "force-dynamic";

export default async function PaginaResumen() {
  const r = await obtenerResumen();
  const sesion = await requerirVendedor();
  const esAveli = sesion.workspaceSlug === "aveli";

  const tarjetas = [
    { titulo: "Ventas de hoy", valor: formatoEntero(r.ventasHoy), detalle: formatoDineroDecimal(r.ingresosHoy) },
    { titulo: "Ingresos del mes", valor: formatoDineroDecimal(r.ingresosMes), detalle: "Ventas confirmadas" },
    { titulo: "Unidades vendidas (mes)", valor: formatoEntero(r.unidadesMes), detalle: "En ventas confirmadas" },
    { titulo: "Solicitudes pendientes", valor: formatoEntero(r.solicitudesPendientes), detalle: "Nuevas o contactadas" },
  ];

  return (
    <div className="space-y-6">
      {esAveli ? <AveliBienvenida /> : <h1 className="text-2xl font-bold text-slate-900">Resumen</h1>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.titulo} className="tarjeta p-5">
            <p className="text-sm text-slate-500">{t.titulo}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{t.valor}</p>
            <p className="mt-1 text-xs text-slate-400">{t.detalle}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="tarjeta p-5" aria-labelledby="g-ventas-dia">
          <h2 id="g-ventas-dia" className="mb-4 font-semibold text-slate-900">
            Ventas de los últimos 30 días
          </h2>
          {r.ventasPorDia.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Aún no hay ventas confirmadas.</p>
          ) : (
            <GraficoVentasPorDia datos={r.ventasPorDia} />
          )}
        </section>

        <section className="tarjeta p-5" aria-labelledby="g-forma-pago">
          <h2 id="g-forma-pago" className="mb-4 font-semibold text-slate-900">
            Distribución por forma de pago (mes)
          </h2>
          {r.porFormaPago.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Sin datos este mes.</p>
          ) : (
            <GraficoFormaPago datos={r.porFormaPago} />
          )}
        </section>

        <section className="tarjeta p-5" aria-labelledby="g-top">
          <h2 id="g-top" className="mb-4 font-semibold text-slate-900">
            Productos más vendidos (mes)
          </h2>
          {r.topProductos.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Sin datos este mes.</p>
          ) : (
            <GraficoTopProductos datos={r.topProductos} />
          )}
        </section>

        <section className="tarjeta p-5" aria-labelledby="g-bajos">
          <h2 id="g-bajos" className="mb-4 font-semibold text-slate-900">
            Productos con stock bajo
          </h2>
          {r.productosStockBajo.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Ningún producto por debajo de su stock mínimo.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {r.productosStockBajo.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                  <Link href="/dashboard/inventario" className="font-medium text-slate-800 hover:underline">
                    {p.name}
                  </Link>
                  <Badge tono={p.stock === 0 ? "rojo" : "ambar"}>
                    {p.stock === 0 ? "Agotado" : `Quedan ${p.stock}`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {esAveli && <AveliInformacion />}
    </div>
  );
}
