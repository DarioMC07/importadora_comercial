import { generarReporte, resumenADecimales } from "@/lib/queries/reportes";
import { formatoDineroDecimal, formatoEntero, hoyLocal } from "@/lib/format";
import { GraficoVentasPorDia, GraficoFormaPago } from "@/components/dashboard/graficos";
import { FiltroFechas } from "@/components/dashboard/reportes/filtro-fechas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reportes" };

export default async function PaginaReportes({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const params = await searchParams;
  const hoy = hoyLocal();
  const inicioMes = `${hoy.slice(0, 8)}01`;
  const desde = /^\d{4}-\d{2}-\d{2}$/.test(params.desde ?? "") ? (params.desde as string) : inicioMes;
  const hasta = /^\d{4}-\d{2}-\d{2}$/.test(params.hasta ?? "") ? (params.hasta as string) : hoy;

  const reporte = await generarReporte(desde, hasta);
  const r = resumenADecimales(reporte.resumen);

  const tarjetas = [
    { titulo: "Ingresos", valor: formatoDineroDecimal(r.ingresos), nota: "Ventas confirmadas − descuentos" },
    { titulo: "Ganancia bruta", valor: formatoDineroDecimal(r.gananciaBruta), nota: "Ingresos − costo base vendido" },
    { titulo: "Ganancia neta estimada", valor: formatoDineroDecimal(r.gananciaNetaEstimada), nota: "Ingresos − costo puesto vendido" },
    { titulo: "Unidades vendidas", valor: formatoEntero(r.unidades), nota: `${reporte.cantidadVentas} ventas confirmadas` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
        <p className="text-sm text-slate-500">
          Análisis del periodo seleccionado. Las cifras usan los snapshots históricos de cada venta.
        </p>
      </div>

      <FiltroFechas desde={desde} hasta={hasta} />

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="note">
        <strong>Estimación administrativa:</strong> la ganancia neta es una estimación que no
        contempla gastos generales no registrados (alquiler, sueldos, servicios). No es un
        documento fiscal ni contable.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.titulo} className="tarjeta p-5">
            <p className="text-sm text-slate-500">{t.titulo}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{t.valor}</p>
            <p className="mt-1 text-xs text-slate-400">{t.nota}</p>
          </div>
        ))}
      </div>

      <details className="tarjeta p-5 text-sm text-slate-600">
        <summary className="cursor-pointer font-semibold text-slate-900">
          Fórmulas utilizadas
        </summary>
        <ul className="mt-3 list-inside list-disc space-y-1 font-mono text-xs sm:text-sm">
          <li>ingresos = suma(ventas confirmadas) − descuentos</li>
          <li>costo_base_vendido = suma(costo_base_snapshot × cantidad)</li>
          <li>costo_puesto_vendido = suma(landed_unit_cost_snapshot × cantidad)</li>
          <li>ganancia_bruta = ingresos − costo_base_vendido</li>
          <li>ganancia_neta_estimada = ingresos − costo_puesto_vendido</li>
        </ul>
        <p className="mt-3 text-xs">
          El transporte y los impuestos se incluyen una sola vez, dentro del costo puesto en
          almacén de cada ítem (snapshot del momento de la venta).
        </p>
      </details>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="tarjeta p-5" aria-labelledby="r-dias">
          <h2 id="r-dias" className="mb-4 font-semibold text-slate-900">Ventas por día</h2>
          {reporte.ventasPorDia.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Sin ventas confirmadas en el periodo.</p>
          ) : (
            <GraficoVentasPorDia datos={reporte.ventasPorDia} />
          )}
        </section>
        <section className="tarjeta p-5" aria-labelledby="r-pago">
          <h2 id="r-pago" className="mb-4 font-semibold text-slate-900">Distribución por forma de pago</h2>
          {reporte.porFormaPago.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Sin datos en el periodo.</p>
          ) : (
            <GraficoFormaPago
              datos={reporte.porFormaPago.map((p) => ({ metodo: p.metodo, total: p.total }))}
            />
          )}
        </section>
      </div>

      <section className="tarjeta overflow-x-auto" aria-labelledby="r-productos">
        <h2 id="r-productos" className="p-5 pb-0 font-semibold text-slate-900">
          Rentabilidad por producto
        </h2>
        <table className="mt-4 w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-4 py-3">Producto</th>
              <th scope="col" className="px-4 py-3">Unidades</th>
              <th scope="col" className="px-4 py-3">Ingresos</th>
              <th scope="col" className="px-4 py-3">Ganancia neta estimada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reporte.porProducto.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  Sin datos en el periodo.
                </td>
              </tr>
            )}
            {reporte.porProducto.map((p) => (
              <tr key={p.nombre} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.nombre}</td>
                <td className="px-4 py-3">{p.cantidad}</td>
                <td className="px-4 py-3">{formatoDineroDecimal(p.ingresos)}</td>
                <td className={`px-4 py-3 font-semibold ${p.gananciaNeta < 0 ? "text-red-600" : "text-emerald-700"}`}>
                  {formatoDineroDecimal(p.gananciaNeta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <a
        href={`/dashboard/reportes/exportar.csv?desde=${desde}&hasta=${hasta}`}
        className="btn-secundario"
        download
      >
        ⬇ Exportar CSV del periodo
      </a>
    </div>
  );
}
