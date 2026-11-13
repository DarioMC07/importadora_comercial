import Link from "next/link";
import { BotonCarrito } from "./boton-carrito";

export function HeaderPublico() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="contenedor flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
            <path d="M3 7l9-4 9 4v2H3V7zm2 3h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9zm5 3v5h4v-5h-4z" />
          </svg>
          ImportHub
        </Link>
        <nav className="flex items-center gap-2" aria-label="Navegación principal">
          <Link href="/catalogo" className="btn-fantasma">
            Catálogo
          </Link>
          <BotonCarrito />
          <Link href="/ingresar" className="btn-primario">
            <span className="hidden sm:inline">Soy vendedor</span>
            <span className="sm:hidden" aria-label="Acceso vendedores">
              Entrar
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function FooterPublico() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-8">
      <div className="contenedor flex flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
        <p>© 2026 ImportHub — Prototipo académico de gestión para importadores.</p>
        <p>Los reportes de utilidad son estimaciones administrativas, no documentos fiscales.</p>
      </div>
    </footer>
  );
}
