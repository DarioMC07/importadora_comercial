"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { proveedorSchema, type ProveedorInput } from "@/lib/validators";
import type { z } from "zod";
import { guardarProveedor, eliminarProveedor } from "@/server/actions/proveedores";
import { Badge } from "@/components/ui/badge";

type ProveedorForm = z.input<typeof proveedorSchema>;

export interface Proveedor {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  country: string;
  notes: string | null;
  active: boolean;
}

const valoresVacios: ProveedorForm = {
  code: "", name: "", email: "", phone: "", country: "", notes: "", active: true,
};

export function GestionProveedores({ proveedores }: { proveedores: Proveedor[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const form = useForm<ProveedorForm, unknown, ProveedorInput>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: valoresVacios,
  });

  const filtrados = proveedores.filter((p) =>
    `${p.code} ${p.name} ${p.country}`.toLowerCase().includes(busqueda.toLowerCase()),
  );

  function abrirNuevo() {
    setEditando(null);
    form.reset(valoresVacios);
    setMostrarForm(true);
    setMensaje(null);
  }

  function abrirEdicion(p: Proveedor) {
    setEditando(p);
    form.reset({
      code: p.code, name: p.name, email: p.email ?? "", phone: p.phone ?? "",
      country: p.country, notes: p.notes ?? "", active: p.active,
    });
    setMostrarForm(true);
    setMensaje(null);
  }

  function enviar(datos: ProveedorInput) {
    startTransition(async () => {
      const r = await guardarProveedor(datos, editando?.id);
      if (!r.ok) {
        setMensaje(r.error ?? "Error al guardar.");
        return;
      }
      setMostrarForm(false);
      setMensaje(null);
    });
  }

  function eliminar(p: Proveedor) {
    if (!window.confirm(`¿Eliminar al proveedor "${p.name}"? Solo es posible si no tiene importaciones.`)) return;
    startTransition(async () => {
      const r = await eliminarProveedor(p.id);
      if (!r.ok) setMensaje(r.error ?? "No se pudo eliminar.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por código, nombre o país…"
          className="campo max-w-xs"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar proveedores"
        />
        <button type="button" className="btn-primario" onClick={abrirNuevo}>
          + Nuevo proveedor
        </button>
      </div>

      {mensaje && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mensaje}</p>
      )}

      {mostrarForm && (
        <form
          onSubmit={form.handleSubmit(enviar)}
          className="tarjeta grid grid-cols-1 gap-4 p-5 sm:grid-cols-2"
          noValidate
          aria-label={editando ? "Editar proveedor" : "Nuevo proveedor"}
        >
          <h2 className="font-semibold text-slate-900 sm:col-span-2">
            {editando ? `Editar ${editando.name}` : "Nuevo proveedor"}
          </h2>
          <div>
            <label htmlFor="p-code" className="etiqueta">Código interno *</label>
            <input id="p-code" className="campo" maxLength={40} {...form.register("code")} />
            {form.formState.errors.code && <p className="mensaje-error">{form.formState.errors.code.message}</p>}
          </div>
          <div>
            <label htmlFor="p-name" className="etiqueta">Nombre o razón social *</label>
            <input id="p-name" className="campo" maxLength={160} {...form.register("name")} />
            {form.formState.errors.name && <p className="mensaje-error">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="p-country" className="etiqueta">País *</label>
            <input id="p-country" className="campo" maxLength={80} {...form.register("country")} />
            {form.formState.errors.country && <p className="mensaje-error">{form.formState.errors.country.message}</p>}
          </div>
          <div>
            <label htmlFor="p-email" className="etiqueta">Correo</label>
            <input id="p-email" type="email" className="campo" maxLength={160} {...form.register("email")} />
            {form.formState.errors.email && <p className="mensaje-error">{form.formState.errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="p-phone" className="etiqueta">Teléfono</label>
            <input id="p-phone" className="campo" maxLength={30} {...form.register("phone")} />
          </div>
          <div className="flex items-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4" {...form.register("active")} />
              Proveedor activo
            </label>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="p-notes" className="etiqueta">Notas privadas</label>
            <textarea id="p-notes" className="campo" rows={2} maxLength={2000} {...form.register("notes")} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={pendiente} className="btn-primario">
              {pendiente ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" className="btn-secundario" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="tarjeta overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-4 py-3">Código</th>
              <th scope="col" className="px-4 py-3">Nombre</th>
              <th scope="col" className="px-4 py-3">País</th>
              <th scope="col" className="px-4 py-3">Contacto</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  {busqueda ? "Sin resultados para esa búsqueda." : "Aún no registras proveedores."}
                </td>
              </tr>
            )}
            {filtrados.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                <td className="px-4 py-3">{p.country}</td>
                <td className="px-4 py-3 text-slate-600">
                  {p.email ?? p.phone ?? <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge tono={p.active ? "verde" : "gris"}>{p.active ? "Activo" : "Inactivo"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" className="btn-fantasma" onClick={() => abrirEdicion(p)}>
                      Editar
                    </button>
                    <button type="button" className="btn-fantasma text-red-600" onClick={() => eliminar(p)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
