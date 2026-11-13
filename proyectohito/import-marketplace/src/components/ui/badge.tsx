import { cn } from "@/lib/utils";

const tonos: Record<string, string> = {
  verde: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ambar: "bg-amber-100 text-amber-800 border-amber-200",
  rojo: "bg-red-100 text-red-800 border-red-200",
  gris: "bg-slate-100 text-slate-700 border-slate-200",
  azul: "bg-brand-100 text-brand-800 border-brand-200",
};

const iconos: Record<string, string> = {
  verde: "●",
  ambar: "▲",
  rojo: "■",
  gris: "○",
  azul: "◆",
};

/**
 * Insignia de estado. Nunca comunica solo con color: incluye un marcador
 * textual/gráfico distinto por tono (accesibilidad).
 */
export function Badge({
  tono = "gris",
  children,
  className,
}: {
  tono?: keyof typeof tonos;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tonos[tono],
        className,
      )}
    >
      <span aria-hidden="true" className="text-[0.6rem] leading-none">
        {iconos[tono]}
      </span>
      {children}
    </span>
  );
}

export function badgeDisponibilidad(disponibilidad: string) {
  switch (disponibilidad) {
    case "DISPONIBLE":
      return { tono: "verde" as const, texto: "Disponible" };
    case "POCAS_UNIDADES":
      return { tono: "ambar" as const, texto: "Pocas unidades" };
    default:
      return { tono: "rojo" as const, texto: "Agotado" };
  }
}
