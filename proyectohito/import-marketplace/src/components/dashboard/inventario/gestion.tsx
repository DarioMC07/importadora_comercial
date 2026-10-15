"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ajustarInventario } from "@/server/actions/inventario";
import { Badge } from "@/components/ui/badge";
import { formatoFechaLarga } from "@/lib/format";

interface ProductoStock {
  id: string;
  sku: string;
  name: string;
  stock: number;
  min_stock: number;
  unit: string;
  active: boolean;
}

export interface Movimiento {
  id: string;
  type: "ENTRADA_IMPORTACION" | "SALIDA_VENTA" | "AJUSTE_POSITIVO" | "AJUSTE_NEGATIVO" | "REVERSO";
  quantity: number;
  reason: string | null;
  ref_type: string | null;
  created_at: string;
  products: { name: string; sku: string } | null;
}

const etiquetaTipo: Record<Movimiento["type"], string> = {
  ENTRADA_IMPORTACION: "Entrada · importación",
  SALIDA_VENTA: "Salida · venta",
  AJUSTE_POSITIVO: "Ajuste +",
  AJUSTE_NEGATIVO: "Ajuste −",
  REVERSO: "Reverso",
};

const tonoTipo: Record<Movimiento["type"], "verde" | "rojo" | "azul" | "ambar" | "gris"> = {
  ENTRADA_IMPORTACION: "verde",
  SALIDA_VENTA: "rojo",
  AJUSTE_POSITIVO: "azul",
  AJUSTE_NEGATIVO: "ambar",
  REVERSO: "gris",
};

const ajusteSchema = z.object({
  product_id: z.string().uuid("Selecciona un producto"),
  delta: z.number({ message: "Ingresa un número" }).int("Debe ser entero").refine((n) => n !== 0, "No puede ser cero"),
  reason: z.string().trim().min(3, "Describe el motivo").max(500),
});
type Ajuste = z.infer<typeof ajusteSchema>;

export function GestionInventario({
  productos,
  movimientos,
}: {
  productos: ProductoStock[];
  movimientos: Movimiento[];
}) {
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [pendiente, startTransition] = useTransition();

  const form = useForm<Ajuste>({
    resolver: zodResolver(ajusteSchema),
    defaultValues: { product_id: "", delta: 1, reason: "" },
  });

  function enviar(datos: Ajuste) {
    setMensaje(null);
    startTransition(async () => {
      const r = await ajustarInventario(datos);
      setMensaje(
        r.ok
          ? { tipo: "ok", texto: "Ajuste registrado correctamente." }
          : { tipo: "error", texto: r.error ?? "No se pudo registrar el ajuste." },
      );
      if (r.ok) form.reset({ product_id: "", delta: 1, reason: "" });
    });
  }

  const movsFiltrados = filtroTipo
    ? movimientos.filter((m) => m.type === filtroTipo)
    : movimientos;

  return (
    <div className="space-y-8">
      <section aria-labelledby="t-existencias">
        <h2 id="t-existencias" className="mb-3 font-semibold text-slate-900">Existencias</h2>
        <div className="tarjeta overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-4 py-3">SKU</th>
                <th scope="col" className="px-4 py-3">Producto</th>
                <th scope="col" className="px-4 py-3">Stock</th>
                <th scope="col" className="px-4 py-3">Stock mínimo</th>
                <th scope="col" className="px-4 py-3">Alerta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {p.name}{!p.active && <span className="text-xs text-slate-400"> (inactivo)</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold">{p.stock} {p.unit}</td>
                  <td className="px-4 py-3 text-slate-500">{p.min_stock}</td>
                  <td className="px-4 py-3">
                    {p.stock === 0 ? (
                      <Badge tono="rojo">Agotado</Badge>
                    ) : p.stock <= p.min_stock ? (
                      <Badge tono="ambar">Stock bajo</Badge>
                    ) : (
                      <Badge tono="verde">OK</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="t-ajuste" className="tarjeta p-5">
        <h2 id="t-ajuste" className="font-semibold text-slate-900">Ajuste manual de inventario</h2>
        <p className="mt-1 text-sm text-slate-500">
          Usa cantidades positivas para sumar y negativas para restar. El motivo es obligatorio
          y queda en el historial de auditoría.
        </p>
        <form onSubmit={form.handleSubmit(enviar)} className="mt-4 flex flex-wrap items-end gap-3" noValidate>
          <div className="min-w-56 flex-1">
            <label htmlFor="a-prod" className="etiqueta">Producto</label>
            <select id="a-prod" className="campo" {...form.register("product_id")}>
              <option value="">Selecciona…</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.sku} — {p.name} (stock: {p.stock})</option>
              ))}
            </select>
            {form.formState.errors.product_id && <p className="mensaje-error">{form.formState.errors.product_id.message}</p>}
          </div>
          <div className="w-32">
            <label htmlFor="a-delta" className="etiqueta">Ajuste (+/−)</label>
            <input id="a-delta" type="number" className="campo" {...form.register("delta", { valueAsNumber: true })} />
            {form.formState.errors.delta && <p className="mensaje-error">{form.formState.errors.delta.message}</p>}
          </div>
          <div className="min-w-56 flex-1">
            <label htmlFor="a-reason" className="etiqueta">Motivo *</label>
            <input id="a-reason" className="campo" maxLength={500} placeholder="Ej. Merma por daño en transporte" {...form.register("reason")} />
            {form.formState.errors.reason && <p className="mensaje-error">{form.formState.errors.reason.message}</p>}
          </div>
          <button type="submit" disabled={pendiente} className="btn-primario">
            {pendiente ? "Registrando…" : "Registrar ajuste"}
          </button>
        </form>
        {mensaje && (
          <p role="alert" className={`mt-3 rounded-lg p-3 text-sm ${mensaje.tipo === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {mensaje.texto}
          </p>
        )}
      </section>

      <section aria-labelledby="t-movimientos">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="t-movimientos" className="font-semibold text-slate-900">
            Historial de movimientos <span className="text-sm font-normal text-slate-500">(inmutable, últimos 100)</span>
          </h2>
          <select
            className="campo max-w-56"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            aria-label="Filtrar por tipo de movimiento"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(etiquetaTipo).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="tarjeta overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-4 py-3">Fecha</th>
                <th scope="col" className="px-4 py-3">Producto</th>
                <th scope="col" className="px-4 py-3">Tipo</th>
                <th scope="col" className="px-4 py-3">Cantidad</th>
                <th scope="col" className="px-4 py-3">Motivo / referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Sin movimientos registrados.
                  </td>
                </tr>
              )}
              {movsFiltrados.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatoFechaLarga(m.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{m.products?.name ?? "—"}</td>
                  <td className="px-4 py-3"><Badge tono={tonoTipo[m.type]}>{etiquetaTipo[m.type]}</Badge></td>
                  <td className="px-4 py-3 font-semibold">{m.quantity}</td>
                  <td className="px-4 py-3 text-slate-600">{m.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
