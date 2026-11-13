import Link from "next/link";
import { BotonCarrito } from "./boton-carrito";

function Buscador({ id, className }: { id: string; className?: string }) {
  return (
    <form role="search" action="/catalogo" className={className}>
      <label htmlFor={id} className="sr-only">
        Buscar productos
      </label>
      <div className="flex h-11 items-center rounded-full border border-slate-300 bg-white pl-4 pr-1 transition-colors focus-within:border-brand-700 hover:border-slate-400">
        <input
          id={id}
          name="q"
          type="search"
          maxLength={120}
          placeholder="Busca auriculares, lámparas, herramientas…"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-800 text-white transition-colors hover:bg-brand-950"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
      </div>
    </form>
  );
}

export function HeaderPublico() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
      <a
        href="#contenido"
        className="btn-primario sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50"
      >
        Saltar al contenido
      </a>
      <div className="contenedor flex h-16 items-center justify-between gap-2 md:gap-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-display text-xl font-semibold tracking-tight text-brand-900"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-lima"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path
                d="M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          ImportHub
        </Link>
        <Buscador
          id="buscar-global"
          className="hidden max-w-xl flex-1 md:block"
        />
        <nav
          className="flex shrink-0 items-center gap-1 sm:gap-2"
          aria-label="Navegación principal"
        >
          <Link href="/catalogo" className="btn-fantasma px-2.5 sm:px-3.5">
            Catálogo
          </Link>
          <BotonCarrito />
          <Link href="/ingresar" className="btn-secundario px-4 sm:px-5">
            <span className="hidden sm:inline">Soy vendedor</span>
            <span className="sm:hidden" aria-label="Acceso vendedores">
              Entrar
            </span>
          </Link>
        </nav>
      </div>
      <div className="contenedor pb-3 md:hidden">
        <Buscador id="buscar-global-movil" />
      </div>
    </header>
  );
}

export function FooterPublico() {
  return (
    <footer className="mt-auto bg-brand-900 py-10 text-brand-100">
      <div className="contenedor grid gap-8 sm:grid-cols-[1fr_auto]">
        <div className="max-w-md">
          <p className="font-display text-2xl font-semibold tracking-tight text-white">
            ImportHub
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Productos importados por pequeños negocios de Bolivia. Pides en
            línea y el vendedor coordina contigo el pago y la entrega.
          </p>
        </div>
        <nav
          aria-label="Enlaces del pie"
          className="flex flex-col gap-1 text-sm"
        >
          <Link
            href="/catalogo"
            className="inline-flex min-h-[44px] items-center hover:text-lima sm:min-h-0 sm:py-1"
          >
            Catálogo
          </Link>
          <Link
            href="/carrito"
            className="inline-flex min-h-[44px] items-center hover:text-lima sm:min-h-0 sm:py-1"
          >
            Tu carrito
          </Link>
          <Link
            href="/ingresar"
            className="inline-flex min-h-[44px] items-center hover:text-lima sm:min-h-0 sm:py-1"
          >
            Acceso para vendedores
          </Link>
        </nav>
      </div>
      <div className="contenedor mt-8 flex flex-col gap-1 border-t border-brand-700 pt-6 text-xs text-brand-200 sm:flex-row sm:justify-between">
        <p>
          © 2026 ImportHub — Prototipo académico de gestión para importadores.
        </p>
        <p>
          Los reportes de utilidad son estimaciones administrativas, no
          documentos fiscales.
        </p>
      </div>
    </footer>
  );
}
