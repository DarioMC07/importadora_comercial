"use client";

import { useState } from "react";
import {
  MAX_IMAGENES,
  moverImagen,
  ponerPortada,
  quitarImagen,
  validarArchivoImagen,
  type ImagenGaleria,
} from "@/lib/galeria";

export function GaleriaImagenes({
  items,
  onChange,
  deshabilitado,
}: {
  items: ImagenGaleria[];
  onChange: (items: ImagenGaleria[]) => void;
  deshabilitado: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  function agregar(archivos: FileList | null) {
    if (!archivos) return;
    setError(null);
    const nuevos: ImagenGaleria[] = [];
    for (const archivo of Array.from(archivos)) {
      if (items.length + nuevos.length >= MAX_IMAGENES) {
        setError(`Máximo ${MAX_IMAGENES} imágenes por producto.`);
        break;
      }
      const problema = validarArchivoImagen(archivo);
      if (problema) {
        setError(`${archivo.name}: ${problema}`);
        continue;
      }
      nuevos.push({
        clave: crypto.randomUUID(),
        vistaPrevia: URL.createObjectURL(archivo),
        nombre: archivo.name,
        archivo,
      });
    }
    if (nuevos.length > 0) onChange([...items, ...nuevos]);
  }

  function quitar(indice: number) {
    const item = items[indice];
    if (item?.archivo) URL.revokeObjectURL(item.vistaPrevia);
    onChange(quitarImagen(items, indice));
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:col-span-2 lg:col-span-3">
      <label htmlFor="pr-imgs" className="etiqueta font-semibold text-slate-800">
        Imágenes del producto
      </label>
      <p className="text-xs text-slate-500">
        Hasta {MAX_IMAGENES} imágenes JPG, PNG o WebP de 2 MB como máximo. La primera es la portada. Se guardan al
        pulsar «Guardar producto».
      </p>
      <input
        id="pr-imgs"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="campo mt-2 max-w-sm"
        disabled={deshabilitado || items.length >= MAX_IMAGENES}
        onChange={(e) => {
          agregar(e.target.files);
          e.target.value = "";
        }}
      />
      {error && <p className="mensaje-error">{error}</p>}
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">Este producto todavía no tiene imágenes.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item, i) => (
            <li key={item.clave} className="rounded border border-slate-300 bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.vistaPrevia} alt={`Imagen ${i + 1}`} className="h-28 w-full object-contain" />
              <p className="mt-1 text-xs font-semibold text-slate-700">{i === 0 ? "Portada" : `Imagen ${i + 1}`}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                {i > 0 && (
                  <button
                    type="button"
                    className="underline"
                    disabled={deshabilitado}
                    onClick={() => onChange(ponerPortada(items, i))}
                  >
                    Usar como portada
                  </button>
                )}
                {i > 0 && (
                  <button
                    type="button"
                    className="underline"
                    disabled={deshabilitado}
                    aria-label={`Mover imagen ${i + 1} antes`}
                    onClick={() => onChange(moverImagen(items, i, i - 1))}
                  >
                    ← Antes
                  </button>
                )}
                {i < items.length - 1 && (
                  <button
                    type="button"
                    className="underline"
                    disabled={deshabilitado}
                    aria-label={`Mover imagen ${i + 1} después`}
                    onClick={() => onChange(moverImagen(items, i, i + 1))}
                  >
                    Después →
                  </button>
                )}
                <button
                  type="button"
                  className="text-red-600 underline hover:text-red-800"
                  disabled={deshabilitado}
                  aria-label={`Quitar imagen ${i + 1}`}
                  onClick={() => quitar(i)}
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
