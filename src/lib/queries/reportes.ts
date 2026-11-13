import { crearClienteServidor } from "@/lib/supabase/server";
import { fechaLocal } from "@/lib/format";
import { resumirVentas, type ResumenVenta, type ItemVentaSnapshot, aDecimal } from "@/lib/money";

export interface ReportePeriodo {
  resumen: ResumenVenta;
  cantidadVentas: number;
  porFormaPago: { metodo: string; total: number; cantidad: number }[];
  porProducto: { nombre: string; cantidad: number; ingresos: number; gananciaNeta: number }[];
  ventasPorDia: { fecha: string; total: number }[];
}

/**
 * Reporte del periodo con las fórmulas oficiales (ver DECISIONES.md):
 *  ingresos = suma(ventas confirmadas) - descuentos
 *  ganancia_bruta = ingresos - suma(costo_base_snapshot × cantidad)
 *  ganancia_neta_estimada = ingresos - suma(landed_cost_snapshot × cantidad)
 * Transporte e impuestos entran UNA sola vez vía landed_unit_cost_snapshot.
 */
export async function generarReporte(desde: string, hasta: string): Promise<ReportePeriodo> {
  const supabase = await crearClienteServidor();

  const { data: ventas } = await supabase
    .from("sales")
    .select("id, code, sold_at, total, discount, payment_method, sale_items(quantity, unit_price, base_cost_snapshot, landed_cost_snapshot, products(name))")
    .eq("status", "CONFIRMADA")
    .gte("sold_at", `${desde}T00:00:00-04:00`)
    .lte("sold_at", `${hasta}T23:59:59-04:00`)
    .order("sold_at", { ascending: true });

  const lista = ventas ?? [];

  const resumen = resumirVentas(
    lista.map((v) => ({
      descuento: v.discount,
      items: v.sale_items.map(
        (i): ItemVentaSnapshot => ({
          cantidad: i.quantity,
          precioUnitario: i.unit_price,
          costoBase: i.base_cost_snapshot,
          costoPuesto: i.landed_cost_snapshot,
        }),
      ),
    })),
  );

  const porPago = new Map<string, { total: number; cantidad: number }>();
  const porDia = new Map<string, number>();
  const porProd = new Map<string, { nombre: string; cantidad: number; ingresos: number; costo: number }>();

  for (const v of lista) {
    const pago = porPago.get(v.payment_method) ?? { total: 0, cantidad: 0 };
    pago.total += Number(v.total);
    pago.cantidad += 1;
    porPago.set(v.payment_method, pago);

    const dia = fechaLocal(v.sold_at);
    porDia.set(dia, (porDia.get(dia) ?? 0) + Number(v.total));

    for (const i of v.sale_items) {
      const prod = i.products as unknown as { name: string } | null;
      const nombre = prod?.name ?? "Producto";
      const actual = porProd.get(nombre) ?? { nombre, cantidad: 0, ingresos: 0, costo: 0 };
      actual.cantidad += i.quantity;
      actual.ingresos += i.quantity * Number(i.unit_price);
      actual.costo += i.quantity * Number(i.landed_cost_snapshot);
      porProd.set(nombre, actual);
    }
  }

  return {
    resumen,
    cantidadVentas: lista.length,
    porFormaPago: [...porPago.entries()].map(([metodo, v]) => ({ metodo, ...v })),
    porProducto: [...porProd.values()]
      .map((p) => ({ ...p, gananciaNeta: p.ingresos - p.costo }))
      .sort((a, b) => b.ingresos - a.ingresos),
    ventasPorDia: [...porDia.entries()].map(([fecha, total]) => ({ fecha, total })),
  };
}

export function resumenADecimales(r: ResumenVenta) {
  return {
    ingresos: aDecimal(r.ingresos),
    costoBaseVendido: aDecimal(r.costoBaseVendido),
    costoPuestoVendido: aDecimal(r.costoPuestoVendido),
    gananciaBruta: aDecimal(r.gananciaBruta),
    gananciaNetaEstimada: aDecimal(r.gananciaNetaEstimada),
    unidades: r.unidades,
  };
}
