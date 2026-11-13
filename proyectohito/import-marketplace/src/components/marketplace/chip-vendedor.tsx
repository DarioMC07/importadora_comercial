import { colorVendedor, inicialesVendedor } from "@/lib/vendedor-visual";

const tamanos = {
  sm: "h-5 w-5 rounded-md text-[0.625rem]",
  md: "h-11 w-11 rounded-xl text-base",
  lg: "h-12 w-12 rounded-xl text-lg",
} as const;

/** Cuadro con las iniciales del vendedor sobre su color. Decorativo: el nombre va aparte. */
export function InsigniaVendedor({
  slug,
  nombre,
  tamano = "sm",
}: {
  slug: string;
  nombre: string;
  tamano?: keyof typeof tamanos;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: colorVendedor(slug) }}
      className={`flex shrink-0 items-center justify-center font-display font-semibold leading-none text-white ${tamanos[tamano]}`}
    >
      {inicialesVendedor(nombre)}
    </span>
  );
}

export function ChipVendedor({
  slug,
  nombre,
}: {
  slug: string;
  nombre: string;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pl-0.5 pr-2.5 text-xs font-medium text-slate-700">
      <InsigniaVendedor slug={slug} nombre={nombre} />
      <span className="truncate">{nombre}</span>
    </span>
  );
}
