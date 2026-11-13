"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clienteSchema, type ClienteInput } from "@/lib/validators";
import type { z } from "zod";
import { guardarCliente } from "@/server/actions/clientes";

type ClienteForm = z.input<typeof clienteSchema>;

export interface Cliente {
  id: string;
  code: string;
  name: string;
  ci_nit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

const vacio: ClienteForm = {
  code: "", name: "", ci_nit: "", phone: "", email: "", address: "", notes: "",
};

export function GestionClientes({ clientes }: { clientes: Cliente[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const form = useForm<ClienteForm, unknown, ClienteInput>({ resolver: zodResolver(clienteSchema), defaultValues: vacio });

  const POR_PAGINA = 10;
  const filtrados = clientes.filter((c) =>
    `${c.code} ${c.name} ${c.phone ?? ""} ${c.email ?? ""}`.toLowerCase().includes(busqueda.toLowerCase()),
  );
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const visibles = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  function abrirNuevo() {
    setEditando(null);
    form.reset(vacio);
    setMostrarForm(true);
    setMensaje(null);
  }

  function abrirEdicion(c: Cliente) {
    setEditando(c);
    form.reset({
      code: c.code, name: c.name, ci_nit: c.ci_nit ?? "", phone: c.phone ?? "",
      email: c.email ?? "", address: c.address ?? "", notes: c.notes ?? "",
    });
    setMostrarForm(true);
    setMensaje(null);
  }

  function enviar(datos: ClienteInput) {
    startTransition(async () => {
      const r = await guardarCliente(datos, editando?.id);
      if (!r.ok) {
        setMensaje(r.error ?? "Error al guardar.");
        return;
      }
      setMostrarForm(false);
      setMensaje(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por código, nombre, teléfono o correo…"
          className="campo max-w-sm"
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          aria-label="Buscar clientes"
        />
        <button type="button" className="btn-primario" onClick={abrirNuevo}>
          + Nuevo cliente
        </button>
      </div>

      {mensaje && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mensaje}</p>
      )}

      {mostrarForm && (
        <form onSubmit={form.handleSubmit(enviar)} className="tarjeta grid grid-cols-1 gap-4 p-5 sm:grid-cols-2" noValidate
          aria-label={editando ? "Editar cliente" : "Nuevo cliente"}>
          <h2 className="font-semibold text-slate-900 sm:col-span-2">
            {editando ? `Editar ${editando.name}` : "Nuevo cliente"}
          </h2>
          <div>
            <label htmlFor="c-code" className="etiqueta">Código de cliente *</label>
            <input id="c-code" className="campo" maxLength={40} {...form.register("code")} />
            {form.formState.errors.code && <p className="mensaje-error">{form.formState.errors.code.message}</p>}
          </div>
          <div>
            <label htmlFor="c-name" className="etiqueta">Nombre *</label>
            <input id="c-name" className="campo" maxLength={160} {...form.register("name")} />
            {form.formState.errors.name && <p className="mensaje-error">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="c-ci" className="etiqueta">CI / NIT (privado)</label>
            <input id="c-ci" className="campo" maxLength={30} {...form.register("ci_nit")} />
          </div>
          <div>
            <label htmlFor="c-phone" className="etiqueta">Teléfono / celular</label>
            <input id="c-phone" className="campo" maxLength={30} {...form.register("phone")} />
          </div>
          <div>
            <label htmlFor="c-email" className="etiqueta">Correo</label>
            <input id="c-email" type="email" className="campo" maxLength={160} {...form.register("email")} />
            {form.formState.errors.email && <p className="mensaje-error">{form.formState.errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="c-address" className="etiqueta">Dirección</label>
            <input id="c-address" className="campo" maxLength={300} {...form.register("address")} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="c-notes" className="etiqueta">Notas</label>
            <textarea id="c-notes" className="campo" rows={2} maxLength={2000} {...form.register("notes")} />
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
              <th scope="col" className="px-4 py-3">Teléfono</th>
              <th scope="col" className="px-4 py-3">Correo</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  {busqueda ? "Sin resultados." : "Aún no registras clientes."}
                </td>
              </tr>
            )}
            {visibles.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link href={`/dashboard/clientes/${c.id}`} className="hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.phone ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{c.email ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="btn-fantasma" onClick={() => abrirEdicion(c)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <nav aria-label="Paginación de clientes" className="flex items-center gap-2">
          <button type="button" className="btn-secundario" disabled={pagina === 1}
            onClick={() => setPagina((p) => p - 1)}>
            ← Anterior
          </button>
          <span className="text-sm text-slate-600" aria-live="polite">
            Página {pagina} de {totalPaginas}
          </span>
          <button type="button" className="btn-secundario" disabled={pagina === totalPaginas}
            onClick={() => setPagina((p) => p + 1)}>
            Siguiente →
          </button>
        </nav>
      )}
    </div>
  );
}
