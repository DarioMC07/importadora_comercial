import { crearClienteServidor } from "@/lib/supabase/server";
import { fechaLocal } from "@/lib/format";

/**
 * Consultas del panel. Todas dependen del usuario autenticado (cookies) y
 * están protegidas por RLS: un vendedor jamás ve datos de otro espacio.
 */

export interface ResumenDashboard {
  ventasHoy: number;
  ingresosHoy: number;
  ingresosMes: number;
  unidadesMes: number;
  solicitudesPendientes: number;
  productosStockBajo: { id: string; name: string; stock: number; min_stock: number }[];
  topProductos: { nombre: string; cantidad: number; ingresos: number }[];
  ventasPorDia: { fecha: string; total: number }[];
  porFormaPago: { metodo: string; total: number }[];
}

export async function obtenerResumen(): Promise<ResumenDashboard> {
  const supabase = await crearClienteServidor();
  const ahora = new Date();
  const inicioMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1)).toISOString();
  const hoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
  const inicioDia = hoy.toISOString();
  const hace30 = new Date(hoy.getTime() - 29 * 86_400_000).toISOString();

  const [
    { data: ventasMes },
    { data: itemsMes },
    { count: pendientes },
    { data: bajos },
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("id, total, sold_at, payment_method")
      .eq("status", "CONFIRMADA")
      .gte("sold_at", hace30),
    supabase
      .from("sale_items")
      .select("quantity, unit_price, product_id, products(name), sales!inner(status, sold_at)")
      .gte("sales.sold_at", inicioMes)
      .eq("sales.status", "CONFIRMADA"),
    supabase
      .from("purchase_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["NUEVA", "CONTACTADA"]),
    supabase
      .from("products")
      .select("id, name, stock, min_stock")
      .eq("active", true)
      .gt("min_stock", 0)
      .order("stock", { ascending: true })
      .limit(50),
  ]);

  const ventas = ventasMes ?? [];
  const tInicioDia = new Date(inicioDia).getTime();
  const tInicioMes = new Date(inicioMes).getTime();
  const ventasHoy = ventas.filter((v) => new Date(v.sold_at).getTime() >= tInicioDia);
  const delMes = ventas.filter((v) => new Date(v.sold_at).getTime() >= tInicioMes);

  const porDia = new Map<string, number>();
  for (const v of ventas) {
    const dia = fechaLocal(v.sold_at);
    porDia.set(dia, (porDia.get(dia) ?? 0) + Number(v.total));
  }

  const porPago = new Map<string, number>();
  for (const v of delMes) {
    porPago.set(v.payment_method, (porPago.get(v.payment_method) ?? 0) + Number(v.total));
  }

  const topMapa = new Map<string, { nombre: string; cantidad: number; ingresos: number }>();
  for (const item of itemsMes ?? []) {
    const prod = item.products as unknown as { name: string } | null;
    const nombre = prod?.name ?? "Producto";
    const actual = topMapa.get(item.product_id) ?? { nombre, cantidad: 0, ingresos: 0 };
    actual.cantidad += item.quantity;
    actual.ingresos += item.quantity * Number(item.unit_price);
    topMapa.set(item.product_id, actual);
  }

  return {
    ventasHoy: ventasHoy.length,
    ingresosHoy: ventasHoy.reduce((a, v) => a + Number(v.total), 0),
    ingresosMes: delMes.reduce((a, v) => a + Number(v.total), 0),
    unidadesMes: (itemsMes ?? []).reduce((a, i) => a + i.quantity, 0),
    solicitudesPendientes: pendientes ?? 0,
    productosStockBajo: (bajos ?? []).filter((p) => p.stock <= p.min_stock).slice(0, 8),
    topProductos: [...topMapa.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5),
    ventasPorDia: [...porDia.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, total]) => ({ fecha, total })),
    porFormaPago: [...porPago.entries()].map(([metodo, total]) => ({ metodo, total })),
  };
}
