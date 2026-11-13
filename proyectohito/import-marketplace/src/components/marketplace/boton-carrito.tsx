"use client";

import Link from "next/link";
import { useCarrito } from "./carrito-provider";

export function BotonCarrito() {
  const { cantidadTotal, cargado } = useCarrito();
  return (
    <Link
      href="/carrito"
      className="btn-fantasma relative px-2.5 sm:px-3.5"
      aria-label={`Carrito de compras, ${cargado ? cantidadTotal : 0} productos`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <span className="hidden sm:inline">Carrito</span>
      {cargado && cantidadTotal > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-lima px-1 text-xs font-bold text-slate-900 ring-2 ring-slate-50"
        >
          {cantidadTotal}
        </span>
      )}
    </Link>
  );
}
