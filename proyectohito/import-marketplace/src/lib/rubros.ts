/**
 * Rubros de producto y sus campos propios.
 * Fuente única para el formulario, la validación y la ficha pública.
 * Todo atributo de rubro es público: nunca agregar aquí costos, stock ni proveedor.
 */

export const RUBROS = ["GENERAL", "MODA", "ALIMENTOS", "COSMETICOS", "TECNOLOGIA"] as const;
export type Rubro = (typeof RUBROS)[number];

export const ETIQUETA_RUBRO: Record<Rubro, string> = {
  GENERAL: "General",
  MODA: "Moda",
  ALIMENTOS: "Alimentos y chocolates",
  COSMETICOS: "Cosméticos",
  TECNOLOGIA: "Tecnología",
};

export type TipoCampoRubro = "texto" | "texto_largo" | "fecha" | "opcion";

export interface CampoRubro {
  clave: string;
  etiqueta: string;
  tipo: TipoCampoRubro;
  requerido: boolean;
  max: number;
  opciones?: readonly string[];
  ejemplo?: string;
}

export const CAMPOS_POR_RUBRO: Record<Rubro, readonly CampoRubro[]> = {
  GENERAL: [],
  MODA: [
    { clave: "talla", etiqueta: "Talla", tipo: "texto", requerido: true, max: 200, ejemplo: "S, M, L" },
    { clave: "color", etiqueta: "Color", tipo: "texto", requerido: false, max: 120, ejemplo: "Negro, blanco" },
    { clave: "material", etiqueta: "Material", tipo: "texto", requerido: false, max: 120, ejemplo: "Algodón 100 %" },
    {
      clave: "genero",
      etiqueta: "Género",
      tipo: "opcion",
      requerido: false,
      max: 20,
      opciones: ["Mujer", "Hombre", "Unisex", "Niña", "Niño"],
    },
  ],
  ALIMENTOS: [
    { clave: "peso_neto", etiqueta: "Peso neto", tipo: "texto", requerido: true, max: 40, ejemplo: "100 g" },
    { clave: "sabor", etiqueta: "Sabor", tipo: "texto", requerido: false, max: 80, ejemplo: "Chocolate con leche" },
    { clave: "ingredientes", etiqueta: "Ingredientes", tipo: "texto_largo", requerido: false, max: 1000 },
    { clave: "fecha_vencimiento", etiqueta: "Fecha de vencimiento", tipo: "fecha", requerido: false, max: 10 },
  ],
  COSMETICOS: [
    { clave: "marca", etiqueta: "Marca", tipo: "texto", requerido: true, max: 80 },
    { clave: "tipo_piel", etiqueta: "Tipo de piel", tipo: "texto", requerido: false, max: 80, ejemplo: "Todo tipo de piel" },
    { clave: "contenido_neto", etiqueta: "Contenido neto", tipo: "texto", requerido: false, max: 40, ejemplo: "50 ml" },
    { clave: "fecha_vencimiento", etiqueta: "Fecha de vencimiento", tipo: "fecha", requerido: false, max: 10 },
  ],
  TECNOLOGIA: [
    { clave: "marca", etiqueta: "Marca", tipo: "texto", requerido: true, max: 80 },
    { clave: "modelo", etiqueta: "Modelo", tipo: "texto", requerido: true, max: 80 },
    { clave: "garantia", etiqueta: "Garantía", tipo: "texto", requerido: false, max: 80, ejemplo: "12 meses" },
    { clave: "especificaciones", etiqueta: "Especificaciones", tipo: "texto_largo", requerido: false, max: 1000 },
  ],
};

export interface ErrorAtributo {
  clave: string;
  mensaje: string;
}

export interface AtributoPublico {
  clave: string;
  etiqueta: string;
  valor: string;
  largo: boolean;
}

/** Indica si un valor cualquiera es un rubro conocido. */
export function esRubro(valor: unknown): valor is Rubro {
  return typeof valor === "string" && (RUBROS as readonly string[]).includes(valor);
}

/** Convierte el jsonb leído de la base en un mapa de textos; descarta lo demás. */
export function normalizarAtributos(valor: unknown): Record<string, string> {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) return {};
  const salida: Record<string, string> = {};
  for (const [clave, v] of Object.entries(valor)) {
    if (typeof v === "string") salida[clave] = v;
  }
  return salida;
}

/** Deja solo los campos del rubro, sin espacios sobrantes y sin vacíos. */
export function limpiarAtributos(rubro: Rubro, valores: Record<string, string>): Record<string, string> {
  const salida: Record<string, string> = {};
  for (const campo of CAMPOS_POR_RUBRO[rubro]) {
    const v = (valores[campo.clave] ?? "").trim();
    if (v) salida[campo.clave] = v;
  }
  return salida;
}

function esFechaIso(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Valida los campos del rubro. Devuelve un error por campo, en español. */
export function validarAtributos(rubro: Rubro, valores: Record<string, string>): ErrorAtributo[] {
  const errores: ErrorAtributo[] = [];
  for (const campo of CAMPOS_POR_RUBRO[rubro]) {
    const v = (valores[campo.clave] ?? "").trim();
    if (!v) {
      if (campo.requerido) errores.push({ clave: campo.clave, mensaje: `Falta completar: ${campo.etiqueta}.` });
      continue;
    }
    if (v.length > campo.max) {
      errores.push({ clave: campo.clave, mensaje: `${campo.etiqueta}: máximo ${campo.max} caracteres.` });
    } else if (campo.tipo === "fecha" && !esFechaIso(v)) {
      errores.push({ clave: campo.clave, mensaje: `${campo.etiqueta}: fecha inválida.` });
    } else if (campo.tipo === "opcion" && !(campo.opciones ?? []).includes(v)) {
      errores.push({ clave: campo.clave, mensaje: `${campo.etiqueta}: elige una opción de la lista.` });
    }
  }
  return errores;
}

/** Atributos listos para la ficha pública: solo campos conocidos del rubro, con su etiqueta. */
export function atributosPublicos(rubro: unknown, valores: unknown): AtributoPublico[] {
  if (!esRubro(rubro)) return [];
  const limpios = limpiarAtributos(rubro, normalizarAtributos(valores));
  const salida: AtributoPublico[] = [];
  for (const campo of CAMPOS_POR_RUBRO[rubro]) {
    const v = limpios[campo.clave];
    if (!v) continue;
    const valor = campo.tipo === "fecha" && esFechaIso(v) ? v.split("-").reverse().join("/") : v;
    salida.push({ clave: campo.clave, etiqueta: campo.etiqueta, valor, largo: campo.tipo === "texto_largo" });
  }
  return salida;
}

/** Rubro más frecuente de una lista; GENERAL si la lista no tiene rubros conocidos. */
export function rubroMasUsado(rubros: readonly unknown[]): Rubro {
  const conteo = new Map<Rubro, number>();
  for (const r of rubros) {
    if (esRubro(r)) conteo.set(r, (conteo.get(r) ?? 0) + 1);
  }
  let mejor: Rubro = "GENERAL";
  let max = 0;
  for (const [r, n] of conteo) {
    if (n > max) {
      mejor = r;
      max = n;
    }
  }
  return mejor;
}
