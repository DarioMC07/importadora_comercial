"use client";

import { useState } from "react";
import type { Listing } from "@/lib/queries/catalogo";
import { useCarrito } from "./carrito-provider";

/** Agrega una unidad al carrito desde la tarjeta, sin entrar a la ficha. */
export function BotonAgregarRapido({ listing }: { listing: Listing }) {
  const { agregar } = useCarrito();
  const [agregado, setAgregado] = useState(false);

  if (listing.availability === "AGOTADO") return null;

  return (
    <button
      type="button"
      aria-label={
        agregado
          ? `${listing.name} agregado`
          : `Agregar ${listing.name} al carrito`
      }
      className={`absolute bottom-2.5 right-2.5 flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
        agregado
          ? "bg-brand-800 text-lima"
          : "bg-white text-slate-900 hover:bg-lima"
      }`}
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
        setTimeout(() => setAgregado(false), 1800);
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d={agregado ? "M5 12.5l4.5 4.5L19 7.5" : "M12 5v14 M5 12h14"} />
      </svg>
      <span role="status" className="sr-only">
        {agregado ? "Agregado al carrito" : ""}
      </span>
    </button>
  );
}
