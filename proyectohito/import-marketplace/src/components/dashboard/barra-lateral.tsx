"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { obtenerMarca } from "./marcas";

// Agrupadas por tarea: lo que se atiende a diario va primero.
const grupos = [
  { titulo: null, secciones: [{ href: "/dashboard", etiqueta: "Resumen" }] },
  {
    titulo: "Vender",
    secciones: [
      { href: "/dashboard/solicitudes", etiqueta: "Solicitudes" },
      { href: "/dashboard/ventas", etiqueta: "Ventas" },
      { href: "/dashboard/clientes", etiqueta: "Clientes" },
    ],
  },
  {
    titulo: "Catálogo y stock",
    secciones: [
      { href: "/dashboard/productos", etiqueta: "Productos" },
      { href: "/dashboard/inventario", etiqueta: "Inventario" },
    ],
  },
  {
    titulo: "Abastecimiento",
    secciones: [
      { href: "/dashboard/importaciones", etiqueta: "Importaciones" },
      { href: "/dashboard/proveedores", etiqueta: "Proveedores" },
    ],
  },
  { titulo: "Análisis", secciones: [{ href: "/dashboard/reportes", etiqueta: "Reportes" }] },
] as const;

const trazosIconos: Record<string, string> = {
  Resumen: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  Importaciones: "M3 15V5h11v10 M14 9h4l3 4v4h-3 M5 17h9 M14 17h0 M7 17a2 2 0 1 0 0 .01 M17 17a2 2 0 1 0 0 .01 M7 8h3 M8.5 6.5v3",
  Proveedores: "M4 21V5l8-2v18 M12 9h8v12 M2 21h20 M7 7v1 M7 11v1 M7 15v1 M15 12h2 M15 16h2",
  Productos: "M3 7l9-5 9 5v10l-9 5-9-5z M3 7l9 5 9-5 M12 12v10 M7.5 4.5l9 5",
  Inventario: "M3 3h18v18H3z M3 9h18 M3 15h18 M9 3v6 M15 9v6 M9 15v6",
  Solicitudes: "M8 4H5v18h14V4h-3 M8 2h8v5H8z M8 11h8 M8 15h8 M8 19h5",
  Ventas: "M3 5h18v14H3z M3 9h18 M7 15h3 M16 13v4 M14 15h4",
  Clientes: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-2a7 7 0 0 1 14 0v2 M17 3a4 4 0 0 1 0 8 M18 14a6 6 0 0 1 4 5v2",
  Reportes: "M4 3v18h17 M8 17v-5 M13 17V8 M18 17V4",
};

function IconoFormal({ nombre }: { nombre: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
    >
      <path d={trazosIconos[nombre] || trazosIconos.Resumen} />
    </svg>
  );
}

export function BarraLateral({
  nombreEspacio,
  nombreUsuario,
  workspaceSlug = "",
  solicitudesPendientes = 0,
}: {
  nombreEspacio: string;
  nombreUsuario: string;
  workspaceSlug?: string;
  solicitudesPendientes?: number;
}) {
  const pathname = usePathname();
  const marca = obtenerMarca(workspaceSlug);
  const [abierto, setAbierto] = useState(false);

  const activo = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Botón móvil */}
      <button
        type="button"
        className="fixed left-3 top-2.5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 text-white lg:hidden"
        aria-expanded={abierto}
        aria-controls="barra-lateral"
        aria-label={abierto ? "Cerrar menú" : "Menú del panel"}
        onClick={() => setAbierto((v) => !v)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-5 w-5"
        >
          <path d={abierto ? "M6 6l12 12 M18 6L6 18" : "M4 7h16 M4 12h16 M4 17h16"} />
        </svg>
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-30 bg-brand-950/60 lg:hidden"
          aria-hidden="true"
          onClick={() => setAbierto(false)}
        />
      )}

      <aside
        id="barra-lateral"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-900 text-brand-100 transition-transform lg:translate-x-0",
          abierto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Cabecera del Sidebar */}
        <div className="border-b border-white/10 p-5 pt-16 lg:pt-5">
          <Link href="/dashboard" className="block text-white transition-opacity hover:opacity-90">
            {marca ? (
              <div className="flex items-center gap-3">
                {marca.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={marca.logo}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 shrink-0 rounded-full bg-white object-contain"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lima font-display text-lg font-semibold text-slate-900"
                  >
                    {marca.iniciales}
                  </span>
                )}
                <div className="min-w-0">
                  <span className="block font-display text-lg font-semibold leading-tight tracking-tight">
                    {marca.nombre}
                  </span>
                  <span className="block text-xs text-brand-300">{marca.lema}</span>
                </div>
              </div>
            ) : (
              <div>
                <span className="block font-display text-xl font-semibold tracking-tight">ImportHub</span>
                <span className="block text-xs text-brand-300">Panel de vendedor</span>
              </div>
            )}
          </Link>

          <div className="mt-4 rounded-xl bg-white/5 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-white">{nombreEspacio}</p>
            <p className="truncate text-xs text-brand-300">{nombreUsuario}</p>
          </div>
        </div>

        {/* Navegación formal sin emojis */}
        <nav aria-label="Menú del panel" className="flex-1 overflow-y-auto p-3">
          {grupos.map((g) => (
            <div key={g.titulo ?? "inicio"} className="mb-4 last:mb-0">
              {g.titulo && (
                <p className="mb-1 px-3 text-xs font-medium text-brand-300">{g.titulo}</p>
              )}
              <ul className="space-y-0.5">
                {g.secciones.map((s) => (
                  <li key={s.href}>
                    <Link
                      href={s.href}
                      aria-current={activo(s.href) ? "page" : undefined}
                      onClick={() => setAbierto(false)}
                      className={cn(
                        "flex min-h-[42px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        activo(s.href)
                          ? "nav-activo bg-lima text-slate-900"
                          : "text-brand-100 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <IconoFormal nombre={s.etiqueta} />
                      <span className="flex-1">{s.etiqueta}</span>
                      {s.href === "/dashboard/solicitudes" && solicitudesPendientes > 0 && (
                        <span
                          className={cn(
                            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                            activo(s.href) ? "bg-slate-900 text-white" : "bg-lima text-slate-900",
                          )}
                        >
                          {solicitudesPendientes}
                          <span className="sr-only"> pendientes</span>
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Enlace al marketplace público */}
        <div className="border-t border-white/10 p-3">
          <Link
            href={workspaceSlug ? `/catalogo?vendedor=${encodeURIComponent(workspaceSlug)}` : "/"}
            className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-brand-100 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17 17 7 M8 7h9v9" />
            </svg>
            <span>Ver mi tienda pública</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
