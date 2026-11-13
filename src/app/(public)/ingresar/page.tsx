import type { Metadata } from "next";
import { Suspense } from "react";
import { FormularioIngreso } from "@/components/auth/formulario-ingreso";

export const metadata: Metadata = {
  title: "Ingresar",
  description: "Acceso al panel de vendedores.",
  robots: { index: false },
};

export default function PaginaIngresar() {
  return (
    <div className="contenedor flex flex-1 items-center justify-center py-12">
      <div className="tarjeta w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-slate-900">Panel de vendedor</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ingresa para administrar tu espacio de ventas.
        </p>
        <div className="mt-6">
          <Suspense fallback={null}>
            <FormularioIngreso />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
