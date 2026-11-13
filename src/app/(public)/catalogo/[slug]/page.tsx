import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerListingPorSlug, obtenerRelacionados } from "@/lib/queries/catalogo";
import { formatoDineroDecimal } from "@/lib/format";
import { Badge, badgeDisponibilidad } from "@/components/ui/badge";
import { PlaceholderImagen } from "@/components/ui/placeholder-imagen";
import { TarjetaProducto } from "@/components/marketplace/tarjeta-producto";
import { BotonAgregar } from "@/components/marketplace/boton-agregar";

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

  return (
    <div className="contenedor py-8">
      <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link href="/" className="hover:underline">Inicio</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/catalogo" className="hover:underline">Catálogo</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-slate-800">{listing.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          {listing.images && listing.images.length > 0 ? (
            listing.images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img.url}
                alt={img.alt || listing.name}
                className="aspect-square w-full rounded-xl border border-slate-200 object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            ))
          ) : (
            <PlaceholderImagen className="aspect-square w-full rounded-xl border border-slate-200" />
          )}
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            {listing.category}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">{listing.name}</h1>
          <div className="mt-3">
            <Badge tono={disp.tono}>{disp.texto}</Badge>
          </div>
          <p className="mt-4 text-3xl font-bold text-brand-700">
            {formatoDineroDecimal(listing.price)}
          </p>

          <div className="mt-6">
            <BotonAgregar listing={listing} />
          </div>

          {listing.description && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-slate-900">Descripción</h2>
              <p className="mt-2 whitespace-pre-line text-slate-600">{listing.description}</p>
            </div>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div className="tarjeta p-3">
              <dt className="text-slate-500">Vendido por</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                <Link
                  href={`/catalogo?vendedor=${encodeURIComponent(listing.seller_slug)}`}
                  className="text-brand-700 hover:underline"
                >
                  {listing.seller_public_name}
                </Link>
              </dd>
            </div>
            {listing.origin_country && (
              <div className="tarjeta p-3">
                <dt className="text-slate-500">País de origen</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{listing.origin_country}</dd>
              </div>
            )}
            {dims && (dims.largo || dims.ancho || dims.alto) && (
              <div className="tarjeta p-3">
                <dt className="text-slate-500">Dimensiones</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {String(dims.largo ?? "?")} × {String(dims.ancho ?? "?")} × {String(dims.alto ?? "?")}{" "}
                  {String(dims.unidad ?? "cm")}
                </dd>
              </div>
            )}
            {dims?.peso_kg && (
              <div className="tarjeta p-3">
                <dt className="text-slate-500">Peso</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{String(dims.peso_kg)} kg</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-16" aria-labelledby="titulo-relacionados">
          <h2 id="titulo-relacionados" className="mb-6 text-2xl font-bold text-slate-900">
            También te puede interesar
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {relacionados.map((l) => (
              <TarjetaProducto key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
