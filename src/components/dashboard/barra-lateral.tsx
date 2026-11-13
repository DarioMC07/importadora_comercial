"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const secciones = [
  { href: "/dashboard", etiqueta: "Resumen" },
  { href: "/dashboard/productos", etiqueta: "Productos" },
  { href: "/dashboard/solicitudes", etiqueta: "Solicitudes" },
  { href: "/dashboard/ventas", etiqueta: "Ventas" },
  { href: "/dashboard/clientes", etiqueta: "Clientes" },
  { href: "/dashboard/inventario", etiqueta: "Inventario" },
  { href: "/dashboard/importaciones", etiqueta: "Importaciones" },
  { href: "/dashboard/proveedores", etiqueta: "Proveedores" },
  { href: "/dashboard/reportes", etiqueta: "Reportes" },
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
  esAveli = false,
}: {
  nombreEspacio: string;
  nombreUsuario: string;
  workspaceSlug?: string;
  esAveli?: boolean;
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const activo = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Botón móvil */}
      <button
        type="button"
        className="btn-primario fixed bottom-4 right-4 z-50 rounded-full shadow-lg lg:hidden"
        aria-expanded={abierto}
        aria-controls="barra-lateral"
        onClick={() => setAbierto((v) => !v)}
      >
        {abierto ? "Cerrar menú" : "Menú del panel"}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/60 lg:hidden"
          aria-hidden="true"
          onClick={() => setAbierto(false)}
        />
      )}

      <aside
        id="barra-lateral"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-100 transition-transform lg:translate-x-0",
          abierto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Cabecera del Sidebar */}
        <div className="border-b border-slate-800 p-5">
          <Link href="/dashboard" className="block text-white transition-opacity hover:opacity-90">
            {workspaceSlug === "aveli" ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/aveli/logo.png"
                  alt="AVÉLI"
                  width={90}
                  height={90}
                  className="mx-auto mb-2 rounded-full border border-rose-200/20"
                />
                <span className="block text-center font-serif text-xl font-bold tracking-widest">AVÉLI</span>
              </>
            ) : workspaceSlug === "smaylan" ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-900 text-white font-serif font-bold text-lg">
                  SM
                </div>
                <div>
                  <span className="block font-serif text-lg font-bold tracking-wide">Smaylan</span>
                  <span className="block text-[11px] text-rose-300">Cosmética Facial</span>
                </div>
              </div>
            ) : workspaceSlug === "chocolates-capri" ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-900 text-amber-100 font-serif font-bold text-lg">
                  CP
                </div>
                <div>
                  <span className="block font-serif text-lg font-bold tracking-wide">Chocolates Capri</span>
                  <span className="block text-[11px] text-amber-300">Nestlé Capri</span>
                </div>
              </div>
            ) : workspaceSlug === "trencito" ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-900 text-white font-serif font-bold text-lg">
                  TR
                </div>
                <div>
                  <span className="block font-serif text-lg font-bold tracking-wide">Trencito</span>
                  <span className="block text-[11px] text-red-300">Express</span>
                </div>
              </div>
            ) : (
              <div>
                <span className="block text-lg font-bold tracking-wide">ImportHub</span>
                <span className="block text-xs text-slate-400">{nombreEspacio}</span>
              </div>
            )}
          </Link>

          <div className="mt-3 border-t border-slate-800/80 pt-3">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-400">
              {nombreEspacio}
            </p>
            <p className="truncate text-xs text-slate-500">{nombreUsuario}</p>
          </div>
        </div>

        {/* Navegación formal sin emojis */}
        <nav aria-label="Menú del panel" className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {secciones.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  aria-current={activo(s.href) ? "page" : undefined}
                  onClick={() => setAbierto(false)}
                  className={cn(
                    "flex min-h-[40px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    activo(s.href)
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  )}
                >
                  <IconoFormal nombre={s.etiqueta} />
                  <span>{s.etiqueta}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Enlace al marketplace público */}
        <div className="border-t border-slate-800 p-3">
          <Link
            href="/"
            className="flex min-h-[40px] items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Ver marketplace público</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
