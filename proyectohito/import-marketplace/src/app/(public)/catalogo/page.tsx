import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  buscarCatalogo,
  obtenerCategorias,
  obtenerVendedoresPublicos,
} from "@/lib/queries/catalogo";
import { filtroCatalogoSchema } from "@/lib/validators";
import { TarjetaProducto } from "@/components/marketplace/tarjeta-producto";
import { FiltrosCatalogo } from "@/components/marketplace/filtros-catalogo";
import { Paginacion } from "@/components/marketplace/paginacion";
import { OrdenCatalogo } from "@/components/marketplace/orden-catalogo";
import { formatoDineroDecimal } from "@/lib/format";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Explora todos los productos publicados por nuestros vendedores.",
};

export const revalidate = 60;

export default async function PaginaCatalogo({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const crudo = Object.fromEntries(
    Object.entries(params).filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
  const parsed = filtroCatalogoSchema.safeParse(crudo);
  const filtros = parsed.success ? parsed.data : filtroCatalogoSchema.parse({});

  const [resultado, categorias, vendedores] = await Promise.all([
    buscarCatalogo(filtros),
    obtenerCategorias(),
    obtenerVendedoresPublicos(),
  ]);

  function sin(...claves: string[]) {
    const sp = new URLSearchParams(crudo);
    for (const c of claves) sp.delete(c);
    sp.delete("pagina");
    const qs = sp.toString();
    return qs ? `/catalogo?${qs}` : "/catalogo";
  }

  const textoDisponibilidad: Record<string, string> = {
    DISPONIBLE: "Disponible",
    POCAS_UNIDADES: "Pocas unidades",
    AGOTADO: "Agotado",
  };
  const precio =
    filtros.min !== undefined && filtros.max !== undefined
      ? `${formatoDineroDecimal(filtros.min)} a ${formatoDineroDecimal(filtros.max)}`
      : filtros.min !== undefined
        ? `Desde ${formatoDineroDecimal(filtros.min)}`
        : filtros.max !== undefined
          ? `Hasta ${formatoDineroDecimal(filtros.max)}`
          : null;

  const chips = [
    filtros.q && { texto: `“${filtros.q}”`, href: sin("q") },
    filtros.categoria && { texto: filtros.categoria, href: sin("categoria") },
    filtros.vendedor && {
      texto:
        vendedores.find((v) => v.slug === filtros.vendedor)?.nombre ??
        filtros.vendedor,
      href: sin("vendedor"),
    },
    precio && { texto: precio, href: sin("min", "max") },
    filtros.disponibilidad && {
      texto:
        textoDisponibilidad[filtros.disponibilidad] ?? filtros.disponibilidad,
      href: sin("disponibilidad"),
    },
  ].filter((c): c is { texto: string; href: string } => Boolean(c));

  return (
    <div className="contenedor py-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="titulo-pagina">Catálogo</h1>
          <p className="mt-2 text-slate-600" aria-live="polite">
            {resultado.total}{" "}
            {resultado.total === 1
              ? "producto encontrado"
              : "productos encontrados"}
          </p>
        </div>
        <div className="hidden lg:block">
          <Suspense fallback={null}>
            <OrdenCatalogo id="orden-escritorio" valor={filtros.orden} />
          </Suspense>
        </div>
      </div>

      {chips.length > 0 && (
        <ul
          aria-label="Filtros aplicados"
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          {chips.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                aria-label={`Quitar filtro ${c.texto}`}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-brand-100 py-1 pl-3.5 pr-2.5 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-200"
              >
                {c.texto}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M6 6l12 12 M18 6 6 18" />
                </svg>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/catalogo"
              className="inline-flex min-h-[36px] items-center px-2 text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
            >
              Limpiar todo
            </Link>
          </li>
        </ul>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[250px_1fr] lg:items-start lg:gap-8">
        <Suspense fallback={null}>
          <FiltrosCatalogo
            key={JSON.stringify(crudo)}
            categorias={categorias}
            vendedores={vendedores}
            valores={filtros}
            activos={chips.length}
          />
        </Suspense>

        <div>
          {resultado.items.length === 0 ? (
            <div className="tarjeta flex flex-col items-center gap-3 p-12 text-center">
              <p className="font-display text-2xl font-medium text-slate-900">
                Sin resultados
              </p>
              <p className="text-slate-500">
                Prueba con otros términos o quita algunos filtros.
              </p>
              <Link href="/catalogo" className="btn-secundario">
                Limpiar filtros
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4">
                {resultado.items.map((l) => (
                  <TarjetaProducto key={l.id} listing={l} />
                ))}
              </div>
              <Paginacion
                pagina={resultado.pagina}
                totalPaginas={resultado.totalPaginas}
                params={crudo}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
