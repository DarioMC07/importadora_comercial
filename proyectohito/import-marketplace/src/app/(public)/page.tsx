import Link from "next/link";
import { obtenerDestacados, obtenerCategorias, obtenerVendedoresPublicos } from "@/lib/queries/catalogo";
import { TarjetaProducto } from "@/components/marketplace/tarjeta-producto";
import { BuscadorHero } from "@/components/marketplace/buscador-hero";

export const revalidate = 60;

export default async function PaginaInicio() {
  const [destacados, categorias, vendedores] = await Promise.all([
    obtenerDestacados(),
    obtenerCategorias(),
    obtenerVendedoresPublicos(),
  ]);

  return (
    <>
      <section className="bg-gradient-to-b from-brand-700 to-brand-900 py-16 text-white sm:py-24">
        <div className="contenedor text-center">
          <h1 className="mx-auto max-w-3xl text-3xl font-bold sm:text-5xl">
            Productos importados, vendedores locales
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-brand-100 sm:text-lg">
            Encuentra tecnología, hogar, juguetes y herramientas traídas por pequeños
            negocios importadores de Bolivia.
          </p>
          <BuscadorHero />
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categorias.slice(0, 6).map((c) => (
              <Link
                key={c}
                href={`/catalogo?categoria=${encodeURIComponent(c)}`}
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 min-h-[44px] inline-flex items-center"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="contenedor py-12" aria-labelledby="titulo-destacados">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="titulo-destacados" className="text-2xl font-bold text-slate-900">
            Productos destacados
          </h2>
          <Link href="/catalogo" className="text-sm font-semibold text-brand-600 hover:underline">
            Ver todo el catálogo →
          </Link>
        </div>
        {destacados.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Aún no hay productos publicados. Vuelve pronto.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {destacados.map((l) => (
              <TarjetaProducto key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-white py-12" aria-labelledby="titulo-vendedores">
        <div className="contenedor">
          <h2 id="titulo-vendedores" className="mb-6 text-2xl font-bold text-slate-900">
            Nuestros vendedores
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vendedores.map((v) => (
              <Link
                key={v.slug}
                href={`/catalogo?vendedor=${encodeURIComponent(v.slug)}`}
                className="tarjeta flex items-center justify-between p-5 transition-shadow hover:shadow-md"
              >
                <div>
                  <p className="font-semibold text-slate-900">{v.nombre}</p>
                  <p className="text-sm text-slate-500">{v.productos} productos publicados</p>
                </div>
                <span aria-hidden="true" className="text-brand-600">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
