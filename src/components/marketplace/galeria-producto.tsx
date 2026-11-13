"use client";

import { useState } from "react";
import type { ImagenListing } from "@/lib/queries/catalogo";
import { PlaceholderImagen } from "@/components/ui/placeholder-imagen";

/** Imagen principal con miniaturas: el comprador ve todo sin desplazarse. */
export function GaleriaProducto({
  imagenes,
  nombre,
}: {
  imagenes: ImagenListing[];
  nombre: string;
}) {
  const [indice, setIndice] = useState(0);
  const actual = imagenes[indice] ?? imagenes[0];

  if (!actual) {
    return <PlaceholderImagen className="aspect-square w-full rounded-3xl" />;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row-reverse">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={actual.url}
        alt={actual.alt || nombre}
        className="aspect-square w-full min-w-0 flex-1 rounded-3xl bg-white object-contain"
      />
      {imagenes.length > 1 && (
        <ul
          aria-label="Fotos del producto"
          className="flex gap-2 overflow-x-auto p-0.5 sm:w-20 sm:shrink-0 sm:flex-col sm:overflow-y-auto"
        >
          {imagenes.map((img, i) => (
            <li key={img.url} className="shrink-0">
              <button
                type="button"
                aria-label={`Ver foto ${i + 1} de ${imagenes.length}`}
                aria-current={i === indice ? "true" : undefined}
                onClick={() => setIndice(i)}
                className={`block h-16 w-16 overflow-hidden rounded-xl border-2 bg-white transition-colors sm:h-[4.75rem] sm:w-[4.75rem] ${
                  i === indice
                    ? "border-brand-800"
                    : "border-transparent hover:border-slate-300"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
