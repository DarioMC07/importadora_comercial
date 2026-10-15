import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesionVendedor } from "@/lib/auth";

/**
 * Exportación CSV del periodo. Protegida: requiere sesión de vendedor y
 * RLS limita las filas a su propio espacio.
 */
export async function GET(request: NextRequest) {
  const sesion = await obtenerSesionVendedor();
  if (!sesion) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const desde = /^\d{4}-\d{2}-\d{2}$/.test(sp.get("desde") ?? "") ? sp.get("desde")! : "2000-01-01";
  const hasta = /^\d{4}-\d{2}-\d{2}$/.test(sp.get("hasta") ?? "") ? sp.get("hasta")! : "2100-01-01";

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("sales")
    .select("code, sold_at, payment_method, status, subtotal, discount, total, customers(name)")
    .gte("sold_at", `${desde}T00:00:00-04:00`)
    .lte("sold_at", `${hasta}T23:59:59-04:00`)
    .order("sold_at", { ascending: true });

  const escapar = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const filas = [
    "codigo,fecha,estado,forma_pago,cliente,subtotal,descuento,total",
    ...(data ?? []).map((v) => {
      const cliente = (v.customers as unknown as { name: string } | null)?.name ?? "";
      return [
        v.code,
        v.sold_at.slice(0, 16).replace("T", " "),
        v.status,
        v.payment_method,
        escapar(cliente),
        Number(v.subtotal).toFixed(2),
        Number(v.discount).toFixed(2),
        Number(v.total).toFixed(2),
      ].join(",");
    }),
  ];

  return new NextResponse(filas.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ventas_${desde}_${hasta}.csv"`,
    },
  });
}
