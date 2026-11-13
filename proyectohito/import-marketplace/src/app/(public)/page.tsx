import Link from "next/link";
import { InsigniaVendedor } from "@/components/marketplace/chip-vendedor";
import {
  obtenerDestacados,
  obtenerCategorias,
  obtenerVendedoresPublicos,
} from "@/lib/queries/catalogo";
import { TarjetaProducto } from "@/components/marketplace/tarjeta-producto";

export const revalidate = 60;

const pasos = [
  {
    titulo: "Elige productos",
    texto:
      "Agrega al carrito lo que te interese, aunque sea de vendedores distintos.",
  },
  {
    titulo: "Envía tu solicitud",
    texto: "Solo dejas tu nombre y teléfono. No pagas nada en línea.",
  },
  {
    titulo: "El vendedor te contacta",
    texto: "Cada vendedor coordina contigo el pago y la entrega.",
  },
];

export default async function PaginaInicio() {
  const [destacados, categorias, vendedores] = await Promise.all([
    obtenerDestacados(),
    obtenerCategorias(),
    obtenerVendedoresPublicos(),
  ]);

  const totalProductos = vendedores.reduce((acc, v) => acc + v.productos, 0);

  return (
    <>
      <section className="contenedor pt-4 sm:pt-6">
        <div className="grid gap-3 lg:grid-cols-[1fr_340px]">
          <div className="rounded-3xl bg-brand-800 px-6 py-10 text-white sm:px-12 sm:py-16">
            <h1 className="max-w-2xl text-4xl font-semibold leading-none sm:text-[3.4rem]">
              Productos importados, vendedores locales
            </h1>
            <p className="mt-5 max-w-xl text-brand-100 sm:text-lg">
              Encuentra tecnología, hogar, juguetes y herramientas traídas por
              pequeños negocios importadores de Bolivia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/catalogo" className="btn-lima px-7 text-base">
                Explorar el catálogo
              </Link>
              <Link
                href="#titulo-como"
                className="btn border border-white/30 text-white hover:bg-white/10"
              >
                Cómo se compra
              </Link>
            </div>
            {totalProductos > 0 && (
              <p className="mt-8 text-sm text-brand-200">
                {totalProductos} productos publicados por {vendedores.length}{" "}
                {vendedores.length === 1 ? "vendedor" : "vendedores"}
              </p>
            )}
          </div>

          <nav
            aria-labelledby="titulo-categorias"
            className="flex flex-col rounded-3xl bg-lima p-6 text-slate-900 sm:p-8"
          >
            <h2
              id="titulo-categorias"
              className="text-sm font-medium tracking-normal"
            >
              Explora por categoría
            </h2>
            {categorias.length === 0 && (
              <p className="mt-3 flex-1 text-sm">
                Las categorías aparecerán cuando haya productos publicados.
              </p>
            )}
            <ul className={categorias.length === 0 ? "hidden" : "mt-3 flex-1"}>
              {categorias.slice(0, 6).map((c) => (
                <li
                  key={c}
                  className="border-b border-slate-900/15 last:border-b-0"
                >
                  <Link
                    href={`/catalogo?categoria=${encodeURIComponent(c)}`}
                    className="group flex min-h-[48px] items-center justify-between gap-3 rounded-lg py-2 font-display text-2xl font-medium leading-tight tracking-tight"
                  >
                    <span className="group-hover:underline group-hover:underline-offset-4">
                      {c}
                    </span>
                    <Flecha />
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/catalogo" className="btn-primario mt-5 w-full">
              Ver todo el catálogo
            </Link>
          </nav>
        </div>
      </section>

      <section
        className="contenedor py-14 sm:py-16"
        aria-labelledby="titulo-destacados"
      >
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <h2 id="titulo-destacados" className="titulo-seccion">
            Productos destacados
          </h2>
          <Link
            href="/catalogo"
            className="text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-950"
          >
            Ver todo el catálogo
          </Link>
        </div>
        {destacados.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Aún no hay productos publicados. Vuelve pronto.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
            {destacados.map((l) => (
              <TarjetaProducto key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      <section
        className="bg-slate-100 py-14 sm:py-16"
        aria-labelledby="titulo-como"
      >
        <div className="contenedor">
          <h2 id="titulo-como" className="titulo-seccion scroll-mt-24">
            Cómo se compra aquí
          </h2>
          <ol className="mt-7 grid gap-3 md:grid-cols-3">
            {pasos.map((p, i) => (
              <li key={p.titulo} className="rounded-2xl bg-white p-6">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-800 font-display text-base font-semibold text-lima"
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-xl font-medium tracking-tight text-slate-900">
                  {p.titulo}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {p.texto}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {vendedores.length > 0 && (
        <section className="py-14 sm:py-16" aria-labelledby="titulo-vendedores">
          <div className="contenedor">
            <h2 id="titulo-vendedores" className="titulo-seccion mb-7">
              Nuestros vendedores
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vendedores.map((v) => (
                <Link
                  key={v.slug}
                  href={`/catalogo?vendedor=${encodeURIComponent(v.slug)}`}
                  className="tarjeta group flex items-center gap-4 p-5 transition-colors hover:border-brand-800"
                >
                  <InsigniaVendedor
                    slug={v.slug}
                    nombre={v.nombre}
                    tamano="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {v.nombre}
                    </p>
                    <p className="text-sm text-slate-500">
                      {v.productos} productos publicados
                    </p>
                  </div>
                  <span className="text-slate-400 transition-colors group-hover:text-brand-800">
                    <Flecha />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Flecha() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
    >
      <path d="M7 17 17 7 M8 7h9v9" />
    </svg>
  );
}
