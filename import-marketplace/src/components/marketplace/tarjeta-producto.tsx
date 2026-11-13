import Link from "next/link";
import type { Listing } from "@/lib/queries/catalogo";
import { formatoDineroDecimal } from "@/lib/format";
import { Badge, badgeDisponibilidad } from "@/components/ui/badge";
import { PlaceholderImagen } from "@/components/ui/placeholder-imagen";

export function TarjetaProducto({ listing }: { listing: Listing }) {
  const disp = badgeDisponibilidad(listing.availability);
  const imagen = listing.images?.[0];

  return (
    <article className="tarjeta group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/catalogo/${listing.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden">
          {imagen?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagen.url}
              alt={imagen.alt || listing.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <PlaceholderImagen className="h-full w-full" />
          )}
          <div className="absolute left-2 top-2">
            <Badge tono={disp.tono}>{disp.texto}</Badge>
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {listing.category}
          </p>
          <h3 className="mt-1 line-clamp-2 font-semibold text-slate-900 group-hover:text-brand-700">
            {listing.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{listing.seller_public_name}</p>
          <p className="mt-2 text-lg font-bold text-brand-700">
            {formatoDineroDecimal(listing.price)}
          </p>
        </div>
      </Link>
    </article>
  );
}
