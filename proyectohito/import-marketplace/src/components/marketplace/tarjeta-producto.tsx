import Link from "next/link";
import type { Listing } from "@/lib/queries/catalogo";
import { formatoDineroDecimal } from "@/lib/format";
import { Badge, badgeDisponibilidad } from "@/components/ui/badge";
import { PlaceholderImagen } from "@/components/ui/placeholder-imagen";
import { BotonAgregarRapido } from "./boton-agregar-rapido";
import { ChipVendedor } from "./chip-vendedor";

export function TarjetaProducto({ listing }: { listing: Listing }) {
  const disp = badgeDisponibilidad(listing.availability);
  const imagen = listing.images?.[0];
  const agotado = listing.availability === "AGOTADO";

  return (
    <article className="group relative">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
        {imagen?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagen.url}
            alt={imagen.alt || listing.name}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${agotado ? "opacity-60 grayscale" : ""}`}
            loading="lazy"
          />
        ) : (
          <PlaceholderImagen className="h-full w-full" />
        )}
        {listing.availability !== "DISPONIBLE" && (
          <div className="absolute left-2.5 top-2.5">
            <Badge tono={disp.tono}>{disp.texto}</Badge>
          </div>
        )}
      </div>
      <div className="px-1 pt-3">
        <ChipVendedor
          slug={listing.seller_slug}
          nombre={listing.seller_public_name}
        />
        <h3 className="mt-1.5 line-clamp-2 text-[0.95rem] font-medium leading-snug text-slate-900">
          {/* El enlace cubre toda la tarjeta; el botón rápido queda por encima. */}
          <Link
            href={`/catalogo/${listing.slug}`}
            className="after:absolute after:inset-0 after:rounded-2xl group-hover:underline group-hover:underline-offset-4"
          >
            {listing.name}
          </Link>
        </h3>
        <p className="mt-1.5 text-lg font-semibold tabular-nums text-slate-900">
          {formatoDineroDecimal(listing.price)}
        </p>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-square [&>button]:pointer-events-auto">
        <BotonAgregarRapido listing={listing} />
      </div>
    </article>
  );
}
