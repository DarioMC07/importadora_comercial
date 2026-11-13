"use client";

import Link from "next/link";
import { useCarrito } from "./carrito-provider";

export function BotonCarrito() {
  const { cantidadTotal, cargado } = useCarrito();
  return (
    <Link
      href="/carrito"
      className="btn-secundario relative"
      aria-label={`Carrito de compras, ${cargado ? cantidadTotal : 0} productos`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <span className="hidden sm:inline">Carrito</span>
      {cargado && cantidadTotal > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white"
        >
          {cantidadTotal}
        </span>
      )}
    </Link>
  );
}
