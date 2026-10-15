"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FiltroFechas({ desde, hasta }: { desde: string; hasta: string }) {
  const router = useRouter();
  const [d, setD] = useState(desde);
  const [h, setH] = useState(hasta);

  return (
    <form
      className="tarjeta flex flex-wrap items-end gap-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/dashboard/reportes?desde=${d}&hasta=${h}`);
      }}
    >
      <div>
        <label htmlFor="f-desde" className="etiqueta">Desde</label>
        <input id="f-desde" type="date" className="campo" value={d} onChange={(e) => setD(e.target.value)} />
      </div>
      <div>
        <label htmlFor="f-hasta" className="etiqueta">Hasta</label>
        <input id="f-hasta" type="date" className="campo" value={h} onChange={(e) => setH(e.target.value)} />
      </div>
      <button type="submit" className="btn-primario">Aplicar</button>
    </form>
  );
}
