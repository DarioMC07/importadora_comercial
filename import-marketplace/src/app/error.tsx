"use client";

export default function ErrorGlobal({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="contenedor flex flex-1 flex-col items-center justify-center py-24 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Algo salió mal</h1>
      <p className="mt-2 max-w-md text-slate-600">
        Ocurrió un error inesperado. Puedes intentar de nuevo; si el problema persiste,
        vuelve más tarde.
      </p>
      <button type="button" onClick={reset} className="btn-primario mt-6">
        Reintentar
      </button>
    </div>
  );
}
