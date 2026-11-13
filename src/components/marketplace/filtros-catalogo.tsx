"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { FiltroCatalogo } from "@/lib/validators";

interface Props {
  categorias: string[];
  vendedores: { slug: string; nombre: string; productos: number }[];
  valores: FiltroCatalogo;
}

export function FiltrosCatalogo({ categorias, vendedores, valores }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendiente, startTransition] = useTransition();
  const [q, setQ] = useState(valores.q ?? "");
  const [min, setMin] = useState(valores.min?.toString() ?? "");
  const [max, setMax] = useState(valores.max?.toString() ?? "");

  function actualizar(cambios: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("pagina"); // cambiar filtros reinicia la página
    startTransition(() => router.push(`/catalogo?${params.toString()}`));
  }

  return (
    <aside aria-label="Filtros del catálogo" aria-busy={pendiente} className="space-y-6">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          actualizar({ q: q.trim() });
        }}
      >
        <label htmlFor="filtro-q" className="etiqueta">
          Buscar
        </label>
        <div className="flex gap-2">
          <input
            id="filtro-q"
            type="search"
            className="campo"
            value={q}
            maxLength={120}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre o descripción"
          />
          <button type="submit" className="btn-secundario" aria-label="Aplicar búsqueda">
            Ir
          </button>
        </div>
      </form>

      <div>
        <label htmlFor="filtro-categoria" className="etiqueta">
          Categoría
        </label>
        <select
          id="filtro-categoria"
          className="campo"
          value={valores.categoria ?? ""}
          onChange={(e) => actualizar({ categoria: e.target.value })}
        >
          <option value="">Todas</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filtro-vendedor" className="etiqueta">
          Vendedor
        </label>
        <select
          id="filtro-vendedor"
          className="campo"
          value={valores.vendedor ?? ""}
          onChange={(e) => actualizar({ vendedor: e.target.value })}
        >
          <option value="">Todos</option>
          {vendedores.map((v) => (
            <option key={v.slug} value={v.slug}>
              {v.nombre} ({v.productos})
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          actualizar({ min, max });
        }}
      >
        <span className="etiqueta" id="etiqueta-precio">
          Rango de precio (BOB)
        </span>
        <div className="flex items-center gap-2" role="group" aria-labelledby="etiqueta-precio">
          <input
            type="number"
            min={0}
            className="campo"
            placeholder="Mín"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            aria-label="Precio mínimo"
          />
          <span aria-hidden="true">–</span>
          <input
            type="number"
            min={0}
            className="campo"
            placeholder="Máx"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            aria-label="Precio máximo"
          />
          <button type="submit" className="btn-secundario">
            Ir
          </button>
        </div>
      </form>

      <div>
        <label htmlFor="filtro-disp" className="etiqueta">
          Disponibilidad
        </label>
        <select
          id="filtro-disp"
          className="campo"
          value={valores.disponibilidad ?? ""}
          onChange={(e) => actualizar({ disponibilidad: e.target.value })}
        >
          <option value="">Cualquiera</option>
          <option value="DISPONIBLE">Disponible</option>
          <option value="POCAS_UNIDADES">Pocas unidades</option>
          <option value="AGOTADO">Agotado</option>
        </select>
      </div>

      <div>
        <label htmlFor="filtro-orden" className="etiqueta">
          Ordenar por
        </label>
        <select
          id="filtro-orden"
          className="campo"
          value={valores.orden}
          onChange={(e) => actualizar({ orden: e.target.value })}
        >
          <option value="relevancia">Relevancia</option>
          <option value="novedades">Novedades</option>
          <option value="precio_asc">Precio: menor a mayor</option>
          <option value="precio_desc">Precio: mayor a menor</option>
        </select>
      </div>
    </aside>
  );
}
