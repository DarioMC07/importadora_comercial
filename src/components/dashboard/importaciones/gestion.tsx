"use client";

import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { importacionSchema, type ImportacionInput } from "@/lib/validators";
import type { z } from "zod";
import { crearImportacion, recibirImportacion, cambiarEstadoImportacion } from "@/server/actions/importaciones";
import { Badge } from "@/components/ui/badge";
import { formatoDineroDecimal, formatoFechaCorta } from "@/lib/format";

type ImportacionForm = z.input<typeof importacionSchema>;

interface ItemImport {
  id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  products: { name: string; sku: string } | null;
}

export interface Importacion {
  id: string;
  code: string;
  origin_country: string;
  ordered_at: string | null;
  eta_at: string | null;
  received_at: string | null;
  status: "BORRADOR" | "PEDIDO" | "EN_TRANSITO" | "RECIBIDO" | "CANCELADO";
  currency: string;
  freight_cost: number;
  duties_cost: number;
  other_costs: number;
  total_cost: number;
  suppliers: { name: string } | null;
  import_items: ItemImport[];
}

const tonoEstado: Record<Importacion["status"], "gris" | "azul" | "ambar" | "verde" | "rojo"> = {
  BORRADOR: "gris",
  PEDIDO: "azul",
  EN_TRANSITO: "ambar",
  RECIBIDO: "verde",
  CANCELADO: "rojo",
};

interface Props {
  importaciones: Importacion[];
  proveedores: { id: string; code: string; name: string }[];
  productos: { id: string; sku: string; name: string }[];
}

export function GestionImportaciones({ importaciones, proveedores, productos }: Props) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const form = useForm<ImportacionForm, unknown, ImportacionInput>({
    resolver: zodResolver(importacionSchema),
    defaultValues: {
      supplier_id: "", code: "", origin_country: "", ordered_at: "", eta_at: "",
      currency: "USD", fx_rate: "", freight_cost: "0", duties_cost: "0", other_costs: "0",
      items: [{ product_id: "", quantity: 1, unit_cost: "0" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  function enviar(datos: ImportacionInput) {
    startTransition(async () => {
      const r = await crearImportacion(datos);
      if (!r.ok) {
        setMensaje(r.error ?? "Error al crear la importación.");
        return;
      }
      setMostrarForm(false);
      setMensaje(null);
      form.reset();
    });
  }

  function recibir(imp: Importacion) {
    if (!window.confirm(
      `¿Confirmar la recepción de ${imp.code}? Se generarán entradas de inventario y el stock aumentará una sola vez.`,
    )) return;
    startTransition(async () => {
      const r = await recibirImportacion(imp.id);
      setMensaje(r.ok ? null : r.error ?? "No se pudo recibir.");
    });
  }

  function cambiarEstado(imp: Importacion, estado: "PEDIDO" | "EN_TRANSITO" | "CANCELADO") {
    if (estado === "CANCELADO" && !window.confirm(`¿Cancelar la importación ${imp.code}?`)) return;
    startTransition(async () => {
      const r = await cambiarEstadoImportacion(imp.id, estado);
      setMensaje(r.ok ? null : r.error ?? "No se pudo cambiar el estado.");
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <button type="button" className="btn-primario" onClick={() => { setMostrarForm(true); setMensaje(null); }}>
          + Nueva importación
        </button>
      </div>

      {mensaje && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mensaje}</p>
      )}

      {mostrarForm && (
        <form onSubmit={form.handleSubmit(enviar)} className="tarjeta space-y-4 p-5" noValidate aria-label="Nueva importación">
          <h2 className="font-semibold text-slate-900">Nueva importación (borrador)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="i-code" className="etiqueta">Código / referencia *</label>
              <input id="i-code" className="campo" maxLength={40} placeholder="IMP-2026-003" {...form.register("code")} />
              {form.formState.errors.code && <p className="mensaje-error">{form.formState.errors.code.message}</p>}
            </div>
            <div>
              <label htmlFor="i-supplier" className="etiqueta">Proveedor *</label>
              <select id="i-supplier" className="campo" {...form.register("supplier_id")}>
                <option value="">Selecciona…</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                ))}
              </select>
              {form.formState.errors.supplier_id && <p className="mensaje-error">{form.formState.errors.supplier_id.message}</p>}
            </div>
            <div>
              <label htmlFor="i-origen" className="etiqueta">País de origen *</label>
              <input id="i-origen" className="campo" maxLength={80} {...form.register("origin_country")} />
              {form.formState.errors.origin_country && <p className="mensaje-error">{form.formState.errors.origin_country.message}</p>}
            </div>
            <div>
              <label htmlFor="i-ordered" className="etiqueta">Fecha de pedido *</label>
              <input id="i-ordered" type="date" className="campo" {...form.register("ordered_at")} />
              {form.formState.errors.ordered_at && <p className="mensaje-error">{form.formState.errors.ordered_at.message}</p>}
            </div>
            <div>
              <label htmlFor="i-eta" className="etiqueta">Fecha estimada de llegada</label>
              <input id="i-eta" type="date" className="campo" {...form.register("eta_at")} />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="i-currency" className="etiqueta">Moneda</label>
                <input id="i-currency" className="campo" maxLength={3} {...form.register("currency")} />
              </div>
              <div className="flex-1">
                <label htmlFor="i-fx" className="etiqueta">Tipo de cambio</label>
                <input id="i-fx" inputMode="decimal" className="campo" placeholder="6.96" {...form.register("fx_rate")} />
              </div>
            </div>
            <div>
              <label htmlFor="i-flete" className="etiqueta">Transporte / flete (BOB)</label>
              <input id="i-flete" inputMode="decimal" className="campo" {...form.register("freight_cost")} />
            </div>
            <div>
              <label htmlFor="i-aranceles" className="etiqueta">Aranceles / impuestos (BOB)</label>
              <input id="i-aranceles" inputMode="decimal" className="campo" {...form.register("duties_cost")} />
            </div>
            <div>
              <label htmlFor="i-otros" className="etiqueta">Otros gastos (BOB)</label>
              <input id="i-otros" inputMode="decimal" className="campo" {...form.register("other_costs")} />
            </div>
          </div>

          <fieldset>
            <legend className="etiqueta">Productos de la importación *</legend>
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-56 flex-1">
                    <label htmlFor={`i-prod-${idx}`} className="sr-only">Producto</label>
                    <select id={`i-prod-${idx}`} className="campo" {...form.register(`items.${idx}.product_id`)}>
                      <option value="">Selecciona producto…</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label htmlFor={`i-qty-${idx}`} className="sr-only">Cantidad</label>
                    <input id={`i-qty-${idx}`} type="number" min={1} className="campo" placeholder="Cant."
                      {...form.register(`items.${idx}.quantity`, { valueAsNumber: true })} />
                  </div>
                  <div className="w-28">
                    <label htmlFor={`i-cost-${idx}`} className="sr-only">Costo unitario</label>
                    <input id={`i-cost-${idx}`} inputMode="decimal" className="campo" placeholder="Costo"
                      {...form.register(`items.${idx}.unit_cost`)} />
                  </div>
                  <button type="button" className="btn-fantasma text-red-600" onClick={() => remove(idx)}
                    aria-label={`Quitar fila ${idx + 1}`} disabled={fields.length === 1}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {form.formState.errors.items && (
              <p className="mensaje-error">{form.formState.errors.items.message ?? form.formState.errors.items.root?.message}</p>
            )}
            <button type="button" className="btn-secundario mt-2"
              onClick={() => append({ product_id: "", quantity: 1, unit_cost: "0" })}>
              + Agregar producto
            </button>
          </fieldset>

          <div className="flex gap-2">
            <button type="submit" disabled={pendiente} className="btn-primario">
              {pendiente ? "Guardando…" : "Crear importación"}
            </button>
            <button type="button" className="btn-secundario" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {importaciones.length === 0 && (
          <p className="tarjeta p-10 text-center text-slate-500">Aún no registras importaciones.</p>
        )}
        {importaciones.map((imp) => (
          <article key={imp.id} className="tarjeta overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{imp.code}</p>
                <p className="text-sm text-slate-500">
                  {imp.suppliers?.name ?? "Proveedor"} · {imp.origin_country}
                  {imp.ordered_at && <> · Pedido {formatoFechaCorta(imp.ordered_at)}</>}
                  {imp.received_at && <> · Recibido {formatoFechaCorta(imp.received_at)}</>}
                </p>
              </div>
              <Badge tono={tonoEstado[imp.status]}>{imp.status.replace("_", " ")}</Badge>
              <p className="font-semibold text-slate-900">{formatoDineroDecimal(imp.total_cost)}</p>
              <div className="flex gap-1">
                <button type="button" className="btn-fantasma"
                  aria-expanded={expandida === imp.id}
                  onClick={() => setExpandida(expandida === imp.id ? null : imp.id)}>
                  {expandida === imp.id ? "Ocultar" : "Detalle"}
                </button>
                {imp.status === "BORRADOR" && (
                  <>
                    <button type="button" className="btn-fantasma text-brand-700" disabled={pendiente}
                      onClick={() => cambiarEstado(imp, "PEDIDO")}>
                      Marcar pedido
                    </button>
                    <button type="button" className="btn-fantasma text-red-600" disabled={pendiente}
                      onClick={() => cambiarEstado(imp, "CANCELADO")}>
                      Cancelar
                    </button>
                  </>
                )}
                {imp.status === "PEDIDO" && (
                  <button type="button" className="btn-fantasma text-brand-700" disabled={pendiente}
                    onClick={() => cambiarEstado(imp, "EN_TRANSITO")}>
                    En tránsito
                  </button>
                )}
                {(imp.status === "PEDIDO" || imp.status === "EN_TRANSITO" || imp.status === "BORRADOR") && (
                  <button type="button" className="btn-primario" disabled={pendiente} onClick={() => recibir(imp)}>
                    Recibir
                  </button>
                )}
              </div>
            </div>
            {expandida === imp.id && (
              <div className="border-t border-slate-100 bg-slate-50 p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="py-1">Producto</th>
                      <th scope="col" className="py-1">Cantidad</th>
                      <th scope="col" className="py-1">Costo unit.</th>
                      <th scope="col" className="py-1">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {imp.import_items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-1">{it.products?.name ?? it.product_id}</td>
                        <td className="py-1">{it.quantity}</td>
                        <td className="py-1">{formatoDineroDecimal(it.unit_cost)}</td>
                        <td className="py-1">{formatoDineroDecimal(it.quantity * it.unit_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-slate-500">
                  Gastos: flete {formatoDineroDecimal(imp.freight_cost)} · aranceles{" "}
                  {formatoDineroDecimal(imp.duties_cost)} · otros {formatoDineroDecimal(imp.other_costs)}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
