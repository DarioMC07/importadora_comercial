import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buscarCatalogo, obtenerCategorias, obtenerVendedoresPublicos } from "@/lib/queries/catalogo";
import { filtroCatalogoSchema } from "@/lib/validators";
import { TarjetaProducto } from "@/components/marketplace/tarjeta-producto";
import { FiltrosCatalogo } from "@/components/marketplace/filtros-catalogo";
import { Paginacion } from "@/components/marketplace/paginacion";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Explora todos los productos publicados por nuestros vendedores.",
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

  return (
    <div className="contenedor py-8">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Catálogo</h1>
      <p className="mt-1 text-slate-600" aria-live="polite">
        {resultado.total} {resultado.total === 1 ? "producto encontrado" : "productos encontrados"}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <Suspense fallback={null}>
          <FiltrosCatalogo
            categorias={categorias}
            vendedores={vendedores}
            valores={filtros}
          />
        </Suspense>

        <div>
          {resultado.items.length === 0 ? (
            <div className="tarjeta flex flex-col items-center gap-3 p-12 text-center">
              <p className="text-lg font-semibold text-slate-700">Sin resultados</p>
              <p className="text-slate-500">Prueba con otros términos o quita algunos filtros.</p>
              <Link href="/catalogo" className="btn-secundario">
                Limpiar filtros
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
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
