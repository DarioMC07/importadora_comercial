import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="contenedor flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl font-bold text-brand-200" aria-hidden="true">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="mt-2 max-w-md text-slate-600">
        La dirección que buscas no existe o el producto fue retirado del catálogo.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-primario">Ir al inicio</Link>
        <Link href="/catalogo" className="btn-secundario">Ver catálogo</Link>
      </div>
    </div>
  );
}
