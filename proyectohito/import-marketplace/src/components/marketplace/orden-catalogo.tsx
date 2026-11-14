"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function OrdenCatalogo({ id, valor }: { id: string; valor: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendiente, startTransition] = useTransition();

  return (
    <div className="flex min-w-0 items-center gap-2">
      <label
        htmlFor={id}
        className="hidden whitespace-nowrap text-sm text-slate-600 sm:block"
      >
        Ordenar por
      </label>
      <select
        id={id}
        aria-label="Ordenar por"
        aria-busy={pendiente}
        className="campo w-auto min-w-0 rounded-full pr-8"
        value={valor}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          if (e.target.value === "relevancia") params.delete("orden");
          else params.set("orden", e.target.value);
          params.delete("pagina");
          startTransition(() => router.push(`/catalogo?${params.toString()}`));
        }}
      >
        <option value="relevancia">Relevancia</option>
        <option value="novedades">Novedades</option>
        <option value="precio_asc">Precio: menor a mayor</option>
        <option value="precio_desc">Precio: mayor a menor</option>
      </select>
    </div>
  );
}
