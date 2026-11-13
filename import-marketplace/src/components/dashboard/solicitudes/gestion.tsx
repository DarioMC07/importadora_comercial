"use client";

import { useState, useTransition } from "react";
import { cambiarEstadoSolicitud } from "@/server/actions/solicitudes";
import { crearVenta, confirmarVenta } from "@/server/actions/ventas";
import { Badge } from "@/components/ui/badge";
import { formatoDineroDecimal, formatoFechaLarga } from "@/lib/format";

interface ItemSolicitud {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface Solicitud {
  id: string;
  public_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  status: "NUEVA" | "CONTACTADA" | "CONFIRMADA" | "RECHAZADA" | "CONVERTIDA";
  total: number;
  created_at: string;
  purchase_request_items: ItemSolicitud[];
}

const tonoEstado: Record<Solicitud["status"], "azul" | "ambar" | "verde" | "rojo" | "gris"> = {
  NUEVA: "azul",
  CONTACTADA: "ambar",
  CONFIRMADA: "verde",
  RECHAZADA: "rojo",
  CONVERTIDA: "gris",
};

const transiciones: Record<Solicitud["status"], { estado: "CONTACTADA" | "CONFIRMADA" | "RECHAZADA"; etiqueta: string }[]> = {
  NUEVA: [
    { estado: "CONTACTADA", etiqueta: "Marcar contactada" },
    { estado: "CONFIRMADA", etiqueta: "Confirmar" },
    { estado: "RECHAZADA", etiqueta: "Rechazar" },
  ],
  CONTACTADA: [
    { estado: "CONFIRMADA", etiqueta: "Confirmar" },
    { estado: "RECHAZADA", etiqueta: "Rechazar" },
  ],
  CONFIRMADA: [],
  RECHAZADA: [],
  CONVERTIDA: [],
};

export function GestionSolicitudes({ solicitudes }: { solicitudes: Solicitud[] }) {
  const [filtro, setFiltro] = useState("");
  const [expandida, setExpandida] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const filtradas = filtro ? solicitudes.filter((s) => s.status === filtro) : solicitudes;

  function cambiarEstado(s: Solicitud, estado: "CONTACTADA" | "CONFIRMADA" | "RECHAZADA") {
    startTransition(async () => {
      const r = await cambiarEstadoSolicitud({ request_id: s.id, status: estado });
      setMensaje(r.ok ? null : r.error ?? "No se pudo actualizar.");
    });
  }

  function convertir(s: Solicitud) {
    if (!window.confirm(
      `¿Convertir la solicitud ${s.public_code} en una venta confirmada? Se descontará el stock de inmediato.`,
    )) return;
    startTransition(async () => {
      const creada = await crearVenta({
        customer_id: "",
        request_id: s.id,
        payment_method: "EFECTIVO",
        discount: "0",
        items: s.purchase_request_items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: String(i.unit_price),
        })),
      });
      if (!creada.ok || !creada.id) {
        setMensaje(creada.error ?? "No se pudo crear la venta.");
        return;
      }
      const confirmada = await confirmarVenta(creada.id);
      setMensaje(confirmada.ok ? null : confirmada.error ?? "Venta creada pero no confirmada. Revísala en Ventas.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select className="campo max-w-56" value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="NUEVA">Nuevas</option>
          <option value="CONTACTADA">Contactadas</option>
          <option value="CONFIRMADA">Confirmadas</option>
          <option value="CONVERTIDA">Convertidas</option>
          <option value="RECHAZADA">Rechazadas</option>
        </select>
      </div>

      {mensaje && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mensaje}</p>
      )}

      <div className="space-y-3">
        {filtradas.length === 0 && (
          <p className="tarjeta p-10 text-center text-slate-500">No hay solicitudes con ese estado.</p>
        )}
        {filtradas.map((s) => (
          <article key={s.id} className="tarjeta overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-bold tracking-wider text-slate-900">{s.public_code}</p>
                <p className="text-sm text-slate-500">
                  {s.customer_name} · {s.customer_phone} · {formatoFechaLarga(s.created_at)}
                </p>
              </div>
              <Badge tono={tonoEstado[s.status]}>{s.status}</Badge>
              <p className="font-semibold text-slate-900">{formatoDineroDecimal(s.total)}</p>
              <div className="flex flex-wrap gap-1">
                <button type="button" className="btn-fantasma"
                  aria-expanded={expandida === s.id}
                  onClick={() => setExpandida(expandida === s.id ? null : s.id)}>
                  {expandida === s.id ? "Ocultar" : "Detalle"}
                </button>
                {transiciones[s.status].map((t) => (
                  <button key={t.estado} type="button" disabled={pendiente}
                    className={t.estado === "RECHAZADA" ? "btn-fantasma text-red-600" : "btn-fantasma text-brand-700"}
                    onClick={() => cambiarEstado(s, t.estado)}>
                    {t.etiqueta}
                  </button>
                ))}
                {s.status === "CONFIRMADA" && (
                  <button type="button" className="btn-primario" disabled={pendiente} onClick={() => convertir(s)}>
                    Convertir en venta
                  </button>
                )}
              </div>
            </div>
            {expandida === s.id && (
              <div className="border-t border-slate-100 bg-slate-50 p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="py-1">Producto</th>
                      <th scope="col" className="py-1">Cantidad</th>
                      <th scope="col" className="py-1">Precio unit. (snapshot)</th>
                      <th scope="col" className="py-1">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.purchase_request_items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-1">{it.product_name}</td>
                        <td className="py-1">{it.quantity}</td>
                        <td className="py-1">{formatoDineroDecimal(it.unit_price)}</td>
                        <td className="py-1">{formatoDineroDecimal(it.quantity * it.unit_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {s.customer_email && (
                  <p className="mt-2 text-xs text-slate-500">Correo del cliente: {s.customer_email}</p>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
