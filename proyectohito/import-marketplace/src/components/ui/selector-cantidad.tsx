"use client";

/** Selector − n + con área táctil de 44 px. */
export function SelectorCantidad({
  id,
  etiqueta,
  valor,
  onCambio,
  min = 1,
  max = 999,
}: {
  id: string;
  etiqueta: string;
  valor: number;
  onCambio: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const fijar = (n: number) =>
    onCambio(Math.min(max, Math.max(min, Number.isFinite(n) ? n : min)));
  const boton =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-30";

  return (
    <div className="inline-flex items-center rounded-full border border-slate-300 bg-white">
      <button
        type="button"
        className={boton}
        aria-label="Quitar una unidad"
        disabled={valor <= min}
        onClick={() => fijar(valor - 1)}
      >
        −
      </button>
      <label htmlFor={id} className="sr-only">
        {etiqueta}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={valor}
        onChange={(e) => fijar(Math.trunc(Number(e.target.value)))}
        className="h-11 w-10 bg-transparent text-center text-sm font-semibold tabular-nums text-slate-900 [appearance:textfield] focus-visible:ring-offset-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        className={boton}
        aria-label="Agregar una unidad"
        disabled={valor >= max}
        onClick={() => fijar(valor + 1)}
      >
        +
      </button>
    </div>
  );
}
