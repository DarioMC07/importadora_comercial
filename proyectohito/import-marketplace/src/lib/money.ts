/**
 * Dinero sin punto flotante: todos los cálculos internos usan CENTAVOS
 * (enteros). La conversión desde/hacia decimal ocurre solo en los bordes
 * (entrada de usuario, respuesta de la base de datos).
 */

export type Centavos = number; // entero

/** Convierte un decimal (string o number de la DB) a centavos enteros. */
export function aCentavos(valor: string | number): Centavos {
  const s = String(valor).trim();
  if (!/^-?\d+(\.\d{1,6})?$/.test(s)) {
    throw new Error(`Monto inválido: ${valor}`);
  }
  const negativo = s.startsWith("-");
  const [enteros, decimales = ""] = s.replace("-", "").split(".");
  const cent = BigInt(enteros ?? "0") * 100n + BigInt((decimales + "00").slice(0, 2));
  // Redondeo del tercer decimal en adelante (half-up) para evitar truncar.
  const resto = decimales.length > 2 ? BigInt(decimales.slice(2, 3)) : 0n;
  const redondeado = resto >= 5n ? cent + 1n : cent;
  const resultado = Number(redondeado);
  return negativo ? -resultado : resultado;
}

/** De centavos a número decimal (para mostrar o enviar a la DB). */
export function aDecimal(centavos: Centavos): number {
  return centavos / 100;
}

/** Multiplica un monto por una cantidad entera. */
export function multiplicar(centavos: Centavos, cantidad: number): Centavos {
  return centavos * cantidad;
}

export function sumar(...montos: Centavos[]): Centavos {
  return montos.reduce((a, b) => a + b, 0);
}

export function restar(a: Centavos, b: Centavos): Centavos {
  return a - b;
}

/**
 * Costo unitario puesto en almacén (landed unit cost):
 * costo base + transporte asignado + aranceles + otros costos.
 */
export interface ComponentesCosto {
  base: string | number;
  transporte: string | number;
  aranceles: string | number;
  otros: string | number;
}

export function costoPuestoEnAlmacen(c: ComponentesCosto): Centavos {
  return sumar(aCentavos(c.base), aCentavos(c.transporte), aCentavos(c.aranceles), aCentavos(c.otros));
}

// ---------------------------------------------------------------------------
// Fórmulas de reportes (espejo del SQL; ver DECISIONES.md)
// ---------------------------------------------------------------------------
export interface ItemVentaSnapshot {
  cantidad: number;
  precioUnitario: string | number; // snapshot
  costoBase: string | number; // snapshot
  costoPuesto: string | number; // snapshot
}

export interface ResumenVenta {
  ingresos: Centavos;
  costoBaseVendido: Centavos;
  costoPuestoVendido: Centavos;
  gananciaBruta: Centavos;
  gananciaNetaEstimada: Centavos;
  unidades: number;
}

/**
 * ingresos = suma(precio_snapshot × cantidad) - descuentos
 * costo_base_vendido = suma(costo_base_snapshot × cantidad)
 * costo_puesto_vendido = suma(landed_unit_cost_snapshot × cantidad)
 * ganancia_bruta = ingresos - costo_base_vendido
 * ganancia_neta_estimada = ingresos - costo_puesto_vendido  (estimación administrativa)
 */
export function resumirVentas(
  ventas: { items: ItemVentaSnapshot[]; descuento: string | number }[],
): ResumenVenta {
  let bruto = 0;
  let costoBase = 0;
  let costoPuesto = 0;
  let unidades = 0;
  let descuentos = 0;

  for (const venta of ventas) {
    descuentos += aCentavos(venta.descuento);
    for (const item of venta.items) {
      bruto += multiplicar(aCentavos(item.precioUnitario), item.cantidad);
      costoBase += multiplicar(aCentavos(item.costoBase), item.cantidad);
      costoPuesto += multiplicar(aCentavos(item.costoPuesto), item.cantidad);
      unidades += item.cantidad;
    }
  }

  const ingresos = bruto - descuentos;
  return {
    ingresos,
    costoBaseVendido: costoBase,
    costoPuestoVendido: costoPuesto,
    gananciaBruta: ingresos - costoBase,
    gananciaNetaEstimada: ingresos - costoPuesto,
    unidades,
  };
}
