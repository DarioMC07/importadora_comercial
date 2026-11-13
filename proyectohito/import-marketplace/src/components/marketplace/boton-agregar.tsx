"use client";

import Link from "next/link";
import { useState } from "react";
import type { Listing } from "@/lib/queries/catalogo";
import { SelectorCantidad } from "@/components/ui/selector-cantidad";
import { useCarrito } from "./carrito-provider";

export function BotonAgregar({ listing }: { listing: Listing }) {
  const { agregar, items } = useCarrito();
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const agotado = listing.availability === "AGOTADO";
  const productId = listing.product_id ?? listing.id;
  const enCarrito = items.find((i) => i.productId === productId)?.cantidad ?? 0;

  return (
    <div>
      {/* En móvil la acción de compra queda fija abajo, siempre a mano. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:static lg:border-0 lg:bg-transparent lg:p-0">
        {!agotado && (
          <SelectorCantidad
            id="cantidad-producto"
            etiqueta={`Cantidad de ${listing.name}`}
            valor={cantidad}
            onCambio={setCantidad}
          />
        )}
        <button
          type="button"
          disabled={agotado}
          className="btn-lima min-h-[48px] flex-1 px-6 text-base"
          onClick={() => {
            agregar(
              {
                productId,
                slug: listing.slug,
                nombre: listing.name,
                precio: Number(listing.price),
                sellerId: listing.workspace_id ?? "",
                sellerNombre: listing.seller_public_name,
                disponibilidad: listing.availability,
                imagen: listing.images?.[0]?.url,
              },
              cantidad,
            );
            setAgregado(true);
            setCantidad(1);
          }}
        >
          {agotado ? "Producto agotado" : "Agregar al carrito"}
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-3 min-h-6 text-sm text-slate-700"
      >
        {agregado ? "✓ Agregado al carrito. " : ""}
        {enCarrito > 0 && (
          <>
            {!agregado &&
              `Ya tienes ${enCarrito} ${enCarrito === 1 ? "unidad" : "unidades"} en tu carrito. `}
            <Link
              href="/carrito"
              className="font-semibold text-brand-700 underline underline-offset-4"
            >
              Ver carrito
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
