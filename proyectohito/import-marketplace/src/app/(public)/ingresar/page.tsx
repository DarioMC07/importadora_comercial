import type { Metadata } from "next";
import { Suspense } from "react";
import { FormularioIngreso } from "@/components/auth/formulario-ingreso";

export const metadata: Metadata = {
  title: "Ingresar",
  description: "Acceso al panel de vendedores.",
  robots: { index: false },
};

const funciones = [
  "Publica tu catálogo sin exponer costos ni proveedores.",
  "Recibe solicitudes de compra y conviértelas en ventas.",
  "Controla stock, importaciones y utilidad estimada.",
];

export default function PaginaIngresar() {
  return (
    <div className="contenedor flex flex-1 items-center py-8 sm:py-12">
      <div className="mx-auto grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-brand-800 p-10 text-white md:flex">
          <p className="font-display text-3xl font-semibold leading-none tracking-tight">
            Tu negocio importador, ordenado en un solo lugar
          </p>
          <ul className="mt-10 space-y-3 text-sm text-brand-100">
            {funciones.map((f) => (
              <li key={f} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lima"
                />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 sm:p-10">
          <h1 className="titulo-seccion">Panel de vendedor</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ingresa para administrar tu espacio de ventas.
          </p>
          <div className="mt-6">
            <Suspense fallback={null}>
              <FormularioIngreso />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
