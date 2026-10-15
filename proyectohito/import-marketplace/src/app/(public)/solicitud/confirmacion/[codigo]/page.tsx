import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Solicitud enviada",
  robots: { index: false },
};

export default async function PaginaConfirmacion({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const codigos = decodeURIComponent(codigo)
    .split(",")
    .filter((c) => /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c));

  return (
    <div className="contenedor py-16">
      <div className="tarjeta mx-auto max-w-lg p-8 text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700"
          aria-hidden="true"
        >
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">¡Solicitud enviada!</h1>
        <p className="mt-2 text-slate-600">
          {codigos.length > 1
            ? "Tu carrito incluía productos de varios vendedores, así que generamos una solicitud para cada uno:"
            : "El vendedor recibió tu solicitud y te contactará pronto."}
        </p>
        <ul className="mt-6 space-y-2" aria-label="Códigos de solicitud">
          {codigos.map((c) => (
            <li
              key={c}
              className="rounded-lg bg-slate-100 px-4 py-3 font-mono text-lg font-bold tracking-widest text-slate-900"
            >
              {c}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-slate-500">
          Guarda {codigos.length > 1 ? "estos códigos" : "este código"} para dar seguimiento a tu compra.
        </p>
        <Link href="/catalogo" className="btn-primario mt-6">
          Seguir explorando
        </Link>
      </div>
    </div>
  );
}
