import type { Metadata } from "next";
import { InsigniaVendedor } from "@/components/marketplace/chip-vendedor";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerListingPorSlug, obtenerRelacionados } from "@/lib/queries/catalogo";
import { formatoDineroDecimal } from "@/lib/format";
import { Badge, badgeDisponibilidad } from "@/components/ui/badge";
import { GaleriaProducto } from "@/components/marketplace/galeria-producto";
import { TarjetaProducto } from "@/components/marketplace/tarjeta-producto";
import { BotonAgregar } from "@/components/marketplace/boton-agregar";
import { atributosPublicos } from "@/lib/rubros";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await obtenerListingPorSlug(slug);
  if (!listing) return { title: "Producto no encontrado" };
  return {
    title: listing.name,
    description: listing.description?.slice(0, 160) ?? `${listing.name} en ImportHub`,
    openGraph: {
      title: listing.name,
      description: listing.description?.slice(0, 160) ?? undefined,
      images: listing.images?.[0]?.url ? [listing.images[0].url] : undefined,
    },
  };
}

export default async function PaginaProducto({ params }: Props) {
  const { slug } = await params;
  const listing = await obtenerListingPorSlug(slug);
  if (!listing) notFound();

  const disp = badgeDisponibilidad(listing.availability);
  const relacionados = await obtenerRelacionados(listing.category, listing.slug);
  const dims = listing.dims_public as Record<string, string | number> | null;
  const atributos = atributosPublicos(listing.rubro, listing.attributes);

  return (
    <div className="contenedor py-6 pb-28 sm:py-8 lg:pb-8">
      <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:underline">Inicio</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/catalogo" className="hover:underline">Catálogo</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-slate-800">{listing.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <GaleriaProducto key={listing.slug} imagenes={listing.images ?? []} nombre={listing.name} />
        </div>

        <div>
          <p className="text-sm text-slate-500">
            <Link
              href={`/catalogo?categoria=${encodeURIComponent(listing.category)}`}
              className="underline-offset-4 hover:underline"
            >
              {listing.category}
            </Link>
          </p>
          <h1 className="titulo-pagina mt-2 leading-[1.05]">{listing.name}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="font-display text-3xl font-semibold tabular-nums text-slate-900">
              {formatoDineroDecimal(listing.price)}
            </p>
            <Badge tono={disp.tono}>{disp.texto}</Badge>
          </div>

          <div className="mt-6">
            <BotonAgregar listing={listing} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            No pagas en línea: envías tu solicitud y el vendedor te contacta para coordinar pago y
            entrega.
          </p>

          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-slate-100 p-4">
            <InsigniaVendedor
              slug={listing.seller_slug}
              nombre={listing.seller_public_name}
              tamano="md"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500">Vendido por</p>
              <p className="truncate font-semibold text-slate-900">{listing.seller_public_name}</p>
            </div>
            <Link
              href={`/catalogo?vendedor=${encodeURIComponent(listing.seller_slug)}`}
              className="btn-secundario shrink-0"
            >
              Ver su tienda
            </Link>
          </div>

          {listing.description && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold tracking-normal text-slate-900">Descripción</h2>
              <p className="mt-2 max-w-prose whitespace-pre-line leading-relaxed text-slate-600">{listing.description}</p>
            </div>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-x-6 border-t border-slate-200 text-sm">
            {listing.origin_country && (
              <div className="border-b border-slate-200 py-3">
                <dt className="text-slate-500">País de origen</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{listing.origin_country}</dd>
              </div>
            )}
            {dims && (dims.largo || dims.ancho || dims.alto) && (
              <div className="border-b border-slate-200 py-3">
                <dt className="text-slate-500">Dimensiones</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {String(dims.largo ?? "?")} × {String(dims.ancho ?? "?")} × {String(dims.alto ?? "?")}{" "}
                  {String(dims.unidad ?? "cm")}
                </dd>
              </div>
            )}
            {dims?.peso_kg && (
              <div className="border-b border-slate-200 py-3">
                <dt className="text-slate-500">Peso</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{String(dims.peso_kg)} kg</dd>
              </div>
            )}
            {atributos.map((a) => (
              <div key={a.clave} className={a.largo ? "col-span-2 border-b border-slate-200 py-3" : "border-b border-slate-200 py-3"}>
                <dt className="text-slate-500">{a.etiqueta}</dt>
                <dd className="mt-0.5 whitespace-pre-line font-semibold text-slate-900">{a.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-16 border-t border-slate-200 pt-12" aria-labelledby="titulo-relacionados">
          <h2 id="titulo-relacionados" className="titulo-seccion mb-7">
            También te puede interesar
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
            {relacionados.map((l) => (
              <TarjetaProducto key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
