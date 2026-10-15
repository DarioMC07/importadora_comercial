"use client";

import Link from "next/link";

export function Paginacion({
  pagina,
  totalPaginas,
  params,
}: {
  pagina: number;
  totalPaginas: number;
  params: Record<string, string>;
}) {
  if (totalPaginas <= 1) return null;

  function url(p: number) {
    const sp = new URLSearchParams(params);
    sp.set("pagina", String(p));
    return `/catalogo?${sp.toString()}`;
  }

  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 2,
  );

  return (
    <nav aria-label="Paginación del catálogo" className="mt-8 flex justify-center gap-1">
      {pagina > 1 && (
        <Link href={url(pagina - 1)} className="btn-secundario" aria-label="Página anterior">
          ←
        </Link>
      )}
      {paginas.map((p, i) => (
        <span key={p} className="flex items-center gap-1">
          {i > 0 && paginas[i - 1] !== undefined && p - (paginas[i - 1] as number) > 1 && (
            <span aria-hidden="true" className="px-1 text-slate-400">…</span>
          )}
          <Link
            href={url(p)}
            aria-current={p === pagina ? "page" : undefined}
            className={
              p === pagina
                ? "btn-primario min-w-[44px]"
                : "btn-secundario min-w-[44px]"
            }
          >
            {p}
          </Link>
        </span>
      ))}
      {pagina < totalPaginas && (
        <Link href={url(pagina + 1)} className="btn-secundario" aria-label="Página siguiente">
          →
        </Link>
      )}
    </nav>
  );
}
