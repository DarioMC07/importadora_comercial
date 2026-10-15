"use client";

import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ventaSchema, type VentaInput } from "@/lib/validators";
import type { z } from "zod";
import { crearVenta, confirmarVenta, anularVenta } from "@/server/actions/ventas";
import { Badge } from "@/components/ui/badge";
import { formatoDineroDecimal, formatoFechaLarga } from "@/lib/format";

type VentaForm = z.input<typeof ventaSchema>;

interface ItemVenta {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  base_cost_snapshot: number;
  landed_cost_snapshot: number;
  products: { name: string } | null;
}

export interface Venta {
  id: string;
  code: string;
  sold_at: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: "EFECTIVO" | "QR" | "OTRO";
  status: "BORRADOR" | "CONFIRMADA" | "ANULADA";
  customers: { name: string } | null;
  sale_items: ItemVenta[];
}

const tonoEstado: Record<Venta["status"], "gris" | "verde" | "rojo"> = {
  BORRADOR: "gris",
  CONFIRMADA: "verde",
  ANULADA: "rojo",
};

interface Props {
  ventas: Venta[];
  clientes: { id: string; code: string; name: string }[];
  productos: { id: string; sku: string; name: string; sale_price: number; stock: number }[];
}

export function GestionVentas({ ventas, clientes, productos }: Props) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const form = useForm<VentaForm, unknown, VentaInput>({
    resolver: zodResolver(ventaSchema),
    defaultValues: {
      customer_id: "", payment_method: "EFECTIVO", discount: "0",
      items: [{ product_id: "", quantity: 1 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  function enviar(datos: VentaInput, confirmar: boolean) {
    setMensaje(null);
    startTransition(async () => {
      const creada = await crearVenta(datos);
      if (!creada.ok || !creada.id) {
        setMensaje(creada.error ?? "No se pudo crear la venta.");
        return;
      }
      if (confirmar) {
        const confirmada = await confirmarVenta(creada.id);
        if (!confirmada.ok) {
          setMensaje(confirmada.error ?? "La venta quedó en borrador: no se pudo confirmar.");
          setMostrarForm(false);
          return;
        }
      }
      setMostrarForm(false);
      form.reset();
    });
  }

  function confirmar(v: Venta) {
    startTransition(async () => {
      const r = await confirmarVenta(v.id);
      setMensaje(r.ok ? null : r.error ?? "No se pudo confirmar.");
    });
  }

  function anular(v: Venta) {
    const motivo = window.prompt(
      `¿Anular la venta ${v.code}? El stock se repondrá con un movimiento de reverso.\n\nMotivo de la anulación:`,
    );
    if (motivo === null) return;
    startTransition(async () => {
      const r = await anularVenta(v.id, motivo);
      setMensaje(r.ok ? null : r.error ?? "No se pudo anular.");
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <button type="button" className="btn-primario" onClick={() => { setMostrarForm(true); setMensaje(null); }}>
          + Registrar venta
        </button>
      </div>

      {mensaje && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mensaje}</p>
      )}

      {mostrarForm && (
        <form className="tarjeta space-y-4 p-5" noValidate aria-label="Registrar venta">
          <h2 className="font-semibold text-slate-900">Nueva venta</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="v-cliente" className="etiqueta">Cliente (opcional)</label>
              <select id="v-cliente" className="campo" {...form.register("customer_id")}>
                <option value="">Venta sin cliente registrado</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="v-pago" className="etiqueta">Forma de pago *</label>
              <select id="v-pago" className="campo" {...form.register("payment_method")}>
                <option value="EFECTIVO">Efectivo</option>
                <option value="QR">QR</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <label htmlFor="v-descuento" className="etiqueta">Descuento (BOB)</label>
              <input id="v-descuento" inputMode="decimal" className="campo" {...form.register("discount")} />
              {form.formState.errors.discount && <p className="mensaje-error">{form.formState.errors.discount.message}</p>}
            </div>
          </div>

          <fieldset>
            <legend className="etiqueta">Productos *</legend>
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-56 flex-1">
                    <label htmlFor={`v-prod-${idx}`} className="sr-only">Producto</label>
                    <select id={`v-prod-${idx}`} className="campo" {...form.register(`items.${idx}.product_id`)}>
                      <option value="">Selecciona producto…</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name} (stock: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label htmlFor={`v-qty-${idx}`} className="sr-only">Cantidad</label>
                    <input id={`v-qty-${idx}`} type="number" min={1} className="campo"
                      {...form.register(`items.${idx}.quantity`, { valueAsNumber: true })} />
                  </div>
                  <div className="w-32">
                    <label htmlFor={`v-price-${idx}`} className="sr-only">Precio unitario (opcional)</label>
                    <input id={`v-price-${idx}`} inputMode="decimal" className="campo" placeholder="Precio actual"
                      {...form.register(`items.${idx}.unit_price`)} />
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
            <button type="button" className="btn-secundario mt-2" onClick={() => append({ product_id: "", quantity: 1 })}>
              + Agregar producto
            </button>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={pendiente} className="btn-secundario"
              onClick={form.handleSubmit((d) => enviar(d, false))}>
              Guardar borrador
            </button>
            <button type="button" disabled={pendiente} className="btn-primario"
              onClick={form.handleSubmit((d) => enviar(d, true))}>
              {pendiente ? "Procesando…" : "Guardar y confirmar (descuenta stock)"}
            </button>
            <button type="button" className="btn-fantasma" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {ventas.length === 0 && (
          <p className="tarjeta p-10 text-center text-slate-500">Aún no registras ventas.</p>
        )}
        {ventas.map((v) => (
          <article key={v.id} className="tarjeta overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-bold text-slate-900">{v.code}</p>
                <p className="text-sm text-slate-500">
                  {formatoFechaLarga(v.sold_at)} · {v.customers?.name ?? "Sin cliente"} · {v.payment_method}
                </p>
              </div>
              <Badge tono={tonoEstado[v.status]}>{v.status}</Badge>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{formatoDineroDecimal(v.total)}</p>
                {v.discount > 0 && (
                  <p className="text-xs text-slate-500">desc. {formatoDineroDecimal(v.discount)}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button type="button" className="btn-fantasma"
                  aria-expanded={expandida === v.id}
                  onClick={() => setExpandida(expandida === v.id ? null : v.id)}>
                  {expandida === v.id ? "Ocultar" : "Detalle"}
                </button>
                {v.status === "BORRADOR" && (
                  <button type="button" className="btn-primario" disabled={pendiente} onClick={() => confirmar(v)}>
                    Confirmar
                  </button>
                )}
                {v.status !== "ANULADA" && (
                  <button type="button" className="btn-fantasma text-red-600" disabled={pendiente} onClick={() => anular(v)}>
                    Anular
                  </button>
                )}
              </div>
            </div>
            {expandida === v.id && (
              <div className="border-t border-slate-100 bg-slate-50 p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="py-1">Producto</th>
                      <th scope="col" className="py-1">Cant.</th>
                      <th scope="col" className="py-1">Precio (snapshot)</th>
                      <th scope="col" className="py-1">Costo base (snapshot)</th>
                      <th scope="col" className="py-1">Costo puesto (snapshot)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.sale_items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-1">{it.products?.name ?? it.product_id}</td>
                        <td className="py-1">{it.quantity}</td>
                        <td className="py-1">{formatoDineroDecimal(it.unit_price)}</td>
                        <td className="py-1">{formatoDineroDecimal(it.base_cost_snapshot)}</td>
                        <td className="py-1">{formatoDineroDecimal(it.landed_cost_snapshot)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-slate-500">
                  Los snapshots garantizan que cambiar costos o precios actuales no altera ventas históricas.
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
