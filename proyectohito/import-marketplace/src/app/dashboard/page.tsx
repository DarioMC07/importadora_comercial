import Link from "next/link";
import { obtenerResumen } from "@/lib/queries/dashboard";
import { formatoDineroDecimal, formatoEntero } from "@/lib/format";
import {
  GraficoVentasPorDia,
  GraficoFormaPago,
  GraficoTopProductos,
} from "@/components/dashboard/graficos";
import { Badge } from "@/components/ui/badge";
import { requerirVendedor } from "@/lib/auth";
import {
  TiendaBienvenida,
  TiendaInformacion,
} from "@/components/dashboard/tienda";

export const dynamic = "force-dynamic";

export default async function PaginaResumen() {
  const r = await obtenerResumen();
  const sesion = await requerirVendedor();

  const sinStock = r.productosStockBajo.length;
  const vacio =
    "flex min-h-[9rem] items-center justify-center text-center text-sm text-slate-500";

  return (
    <div className="space-y-6">
      <TiendaBienvenida
        slug={sesion.workspaceSlug}
        nombre={sesion.workspaceNombre}
      />

      <section aria-labelledby="t-atender">
        <h2 id="t-atender" className="sr-only">
          Para atender hoy
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/dashboard/solicitudes"
            className={`group rounded-2xl p-5 transition-colors ${
              r.solicitudesPendientes > 0
                ? "bg-lima text-slate-900 hover:bg-lima-fuerte"
                : "tarjeta hover:border-slate-400"
            }`}
          >
            <p className="text-sm">Solicitudes por atender</p>
            <p className="mt-3 font-display text-4xl font-semibold leading-none tabular-nums">
              {formatoEntero(r.solicitudesPendientes)}
            </p>
            <p className="mt-3 text-sm font-semibold underline-offset-4 group-hover:underline">
              {r.solicitudesPendientes > 0
                ? "Responder ahora"
                : "Ver solicitudes"}
            </p>
          </Link>
          <Link
            href="/dashboard/inventario"
            className="tarjeta group p-5 transition-colors hover:border-slate-400"
          >
            <p className="text-sm text-slate-600">Productos con stock bajo</p>
            <p className="mt-3 font-display text-4xl font-semibold leading-none tabular-nums text-slate-900">
              {formatoEntero(sinStock)}
            </p>
            <p className="mt-3 text-sm font-semibold text-brand-700 underline-offset-4 group-hover:underline">
              {sinStock > 0 ? "Revisar inventario" : "Ver inventario"}
            </p>
          </Link>
          <div className="tarjeta p-5">
            <p className="text-sm text-slate-600">Ventas de hoy</p>
            <p className="mt-3 font-display text-4xl font-semibold leading-none tabular-nums text-slate-900">
              {formatoEntero(r.ventasHoy)}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              {formatoDineroDecimal(r.ingresosHoy)}
            </p>
          </div>
          <div className="tarjeta p-5">
            <p className="text-sm text-slate-600">Ingresos del mes</p>
            <p className="mt-3 font-display text-4xl font-semibold leading-none tabular-nums text-slate-900">
              {formatoDineroDecimal(r.ingresosMes)}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              {formatoEntero(r.unidadesMes)} unidades en ventas confirmadas
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section
          className="tarjeta p-5 xl:col-span-2"
          aria-labelledby="g-ventas-dia"
        >
          <h2
            id="g-ventas-dia"
            className="mb-4 text-lg font-semibold tracking-normal text-slate-900"
          >
            Ventas de los últimos 30 días
          </h2>
          {r.ventasPorDia.length === 0 ? (
            <div className={vacio}>
              <div>
                <p>Aún no hay ventas confirmadas en este periodo.</p>
                <Link href="/dashboard/ventas" className="btn-secundario mt-3">
                  Registrar una venta
                </Link>
              </div>
            </div>
          ) : (
            <GraficoVentasPorDia datos={r.ventasPorDia} />
          )}
        </section>

        <section className="tarjeta p-5" aria-labelledby="g-bajos">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2
              id="g-bajos"
              className="text-lg font-semibold tracking-normal text-slate-900"
            >
              Productos con stock bajo
            </h2>
            <Link
              href="/dashboard/importaciones"
              className="shrink-0 text-sm font-semibold text-brand-700 underline underline-offset-4"
            >
              Reponer
            </Link>
          </div>
          {r.productosStockBajo.length === 0 ? (
            <p className={vacio}>
              Ningún producto por debajo de su stock mínimo.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {r.productosStockBajo.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <Link
                    href="/dashboard/inventario"
                    className="font-medium text-slate-800 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <Badge
                    tono={p.stock === 0 ? "rojo" : "ambar"}
                    className="shrink-0"
                  >
                    {p.stock === 0 ? "Agotado" : `Quedan ${p.stock}`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="tarjeta p-5 xl:col-span-2" aria-labelledby="g-top">
          <h2
            id="g-top"
            className="mb-4 text-lg font-semibold tracking-normal text-slate-900"
          >
            Productos más vendidos (mes)
          </h2>
          {r.topProductos.length === 0 ? (
            <p className={vacio}>Sin ventas este mes.</p>
          ) : (
            <GraficoTopProductos datos={r.topProductos} />
          )}
        </section>

        <section className="tarjeta p-5" aria-labelledby="g-forma-pago">
          <h2
            id="g-forma-pago"
            className="mb-4 text-lg font-semibold tracking-normal text-slate-900"
          >
            Formas de pago (mes)
          </h2>
          {r.porFormaPago.length === 0 ? (
            <p className={vacio}>Sin ventas este mes.</p>
          ) : (
            <GraficoFormaPago datos={r.porFormaPago} />
          )}
        </section>
      </div>

      <TiendaInformacion slug={sesion.workspaceSlug} />
    </div>
  );
}
