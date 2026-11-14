"use client";

import { InsigniaVendedor } from "./chip-vendedor";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { FiltroCatalogo } from "@/lib/validators";
import { OrdenCatalogo } from "./orden-catalogo";

interface Props {
  categorias: string[];
  vendedores: { slug: string; nombre: string; productos: number }[];
  valores: FiltroCatalogo;
  activos: number;
}

const disponibilidades = [
  { valor: "", texto: "Cualquiera" },
  { valor: "DISPONIBLE", texto: "Disponible" },
  { valor: "POCAS_UNIDADES", texto: "Pocas unidades" },
  { valor: "AGOTADO", texto: "Agotado" },
];

export function FiltrosCatalogo({
  categorias,
  vendedores,
  valores,
  activos,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendiente, startTransition] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const [min, setMin] = useState(valores.min?.toString() ?? "");
  const [max, setMax] = useState(valores.max?.toString() ?? "");

  function url(cambios: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("pagina"); // cambiar filtros reinicia la página
    const qs = params.toString();
    return qs ? `/catalogo?${qs}` : "/catalogo";
  }

  function opcion(
    clave: string,
    valor: string,
    texto: string,
    activa: boolean,
    detalle?: string,
    insignia?: React.ReactNode,
  ) {
    return (
      <li key={valor || "todas"}>
        <Link
          href={url({ [clave]: valor })}
          aria-current={activa ? "true" : undefined}
          onClick={() => setAbierto(false)}
          className={`flex min-h-[40px] items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
            activa
              ? "bg-brand-800 font-semibold text-white"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2">
            {insignia}
            <span className="truncate">{texto}</span>
          </span>
          {detalle && (
            <span
              className={`text-xs tabular-nums ${activa ? "text-brand-200" : "text-slate-400"}`}
            >
              {detalle}
            </span>
          )}
        </Link>
      </li>
    );
  }

  return (
    <aside aria-label="Filtros del catálogo" aria-busy={pendiente}>
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <button
          type="button"
          className="btn-secundario shrink-0 whitespace-nowrap"
          aria-expanded={abierto}
          aria-controls="panel-filtros"
          onClick={() => setAbierto((v) => !v)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <path d="M4 6h16 M7 12h10 M10 18h4" />
          </svg>
          {abierto ? "Ocultar filtros" : "Filtros"}
          {activos > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-800 px-1 text-xs font-bold text-white">
              {activos}
            </span>
          )}
        </button>
        <OrdenCatalogo id="orden-movil" valor={valores.orden} />
      </div>

      <div
        id="panel-filtros"
        className={`tarjeta mt-3 space-y-6 p-4 transition-opacity lg:sticky lg:top-24 lg:mt-0 lg:block ${
          abierto ? "block" : "hidden"
        } ${pendiente ? "opacity-60" : ""}`}
      >
        <section aria-labelledby="f-categoria">
          <h2
            id="f-categoria"
            className="etiqueta px-3 font-sans tracking-normal"
          >
            Categoría
          </h2>
          <ul>
            {opcion("categoria", "", "Todas", !valores.categoria)}
            {categorias.map((c) =>
              opcion("categoria", c, c, valores.categoria === c),
            )}
          </ul>
        </section>

        <section aria-labelledby="f-vendedor">
          <h2
            id="f-vendedor"
            className="etiqueta px-3 font-sans tracking-normal"
          >
            Vendedor
          </h2>
          <ul>
            {opcion("vendedor", "", "Todos", !valores.vendedor)}
            {vendedores.map((v) =>
              opcion(
                "vendedor",
                v.slug,
                v.nombre,
                valores.vendedor === v.slug,
                String(v.productos),
                <InsigniaVendedor slug={v.slug} nombre={v.nombre} />,
              ),
            )}
          </ul>
        </section>

        <form
          className="px-3"
          onSubmit={(e) => {
            e.preventDefault();
            setAbierto(false);
            startTransition(() => router.push(url({ min, max })));
          }}
        >
          <span className="etiqueta" id="etiqueta-precio">
            Precio (BOB)
          </span>
          <div
            className="flex items-center gap-2"
            role="group"
            aria-labelledby="etiqueta-precio"
          >
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className="campo"
              placeholder="Mín"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              aria-label="Precio mínimo"
            />
            <span aria-hidden="true">–</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className="campo"
              placeholder="Máx"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              aria-label="Precio máximo"
            />
          </div>
          <button type="submit" className="btn-secundario mt-2 w-full">
            Aplicar precio
          </button>
        </form>

        <section aria-labelledby="f-disp">
          <h2 id="f-disp" className="etiqueta px-3 font-sans tracking-normal">
            Disponibilidad
          </h2>
          <ul>
            {disponibilidades.map((d) =>
              opcion(
                "disponibilidad",
                d.valor,
                d.texto,
                (valores.disponibilidad ?? "") === d.valor,
              ),
            )}
          </ul>
        </section>
      </div>
    </aside>
  );
}
