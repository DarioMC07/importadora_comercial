"use client";

import { useState } from "react";
import type { Listing } from "@/lib/queries/catalogo";
import { useCarrito } from "./carrito-provider";

export function BotonAgregar({ listing }: { listing: Listing }) {
  const { agregar } = useCarrito();
  const [agregado, setAgregado] = useState(false);
  const agotado = listing.availability === "AGOTADO";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={agotado}
        className="btn-primario w-full sm:w-auto"
        onClick={() => {
          agregar({
            productId: listing.product_id ?? listing.id,
            slug: listing.slug,
            nombre: listing.name,
            precio: Number(listing.price),
            sellerId: listing.workspace_id ?? "",
            sellerNombre: listing.seller_public_name,
            disponibilidad: listing.availability,
            imagen: listing.images?.[0]?.url,
          });
          setAgregado(true);
          setTimeout(() => setAgregado(false), 2500);
        }}
      >
        {agotado ? "Producto agotado" : "Agregar al carrito"}
      </button>
      <p role="status" aria-live="polite" className="text-sm text-emerald-700">
        {agregado ? "✓ Agregado al carrito" : ""}
      </p>
    </div>
  );
}
