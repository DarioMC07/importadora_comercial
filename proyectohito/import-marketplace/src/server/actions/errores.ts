/**
 * Traducción de errores de base de datos a mensajes seguros en español.
 * Nunca se expone SQL, nombres de constraint ni detalles internos.
 */
export function mensajeError(codigo: string | undefined, mensaje?: string): string {
  const msg = mensaje ?? "";
  const conocidos: Record<string, string> = {
    NO_AUTORIZADO: "No tienes permiso para realizar esta acción.",
    PRODUCTO_NO_ENCONTRADO: "El producto no existe o no pertenece a tu espacio.",
    PROVEEDOR_NO_ENCONTRADO: "El proveedor no existe o no pertenece a tu espacio.",
    CLIENTE_NO_ENCONTRADO: "El cliente no existe o no pertenece a tu espacio.",
    IMPORTACION_NO_ENCONTRADA: "La importación no existe.",
    IMPORTACION_CANCELADA: "La importación está cancelada.",
    IMPORTACION_SIN_ITEMS: "La importación necesita al menos un producto.",
    VENTA_NO_ENCONTRADA: "La venta no existe.",
    VENTA_SIN_ITEMS: "La venta necesita al menos un producto.",
    VENTA_ANULADA: "La venta ya está anulada.",
    SOLICITUD_NO_ENCONTRADA: "La solicitud no existe.",
    STOCK_INSUFICIENTE: "Stock insuficiente para confirmar la venta.",
    STOCK_NEGATIVO: "El ajuste dejaría el stock en negativo.",
    MOTIVO_REQUERIDO: "Debes indicar el motivo del ajuste.",
    AJUSTE_CERO: "El ajuste no puede ser cero.",
    CANTIDAD_INVALIDA: "Alguna cantidad no es válida.",
    COSTO_INVALIDO: "Algún costo no es válido.",
    PRECIO_INVALIDO: "El precio no es válido.",
    DESCUENTO_INVALIDO: "El descuento no es válido.",
    DESCUENTO_MAYOR_AL_SUBTOTAL: "El descuento no puede superar el subtotal.",
    PRODUCTO_INACTIVO: "El producto está inactivo.",
  };
  for (const [clave, texto] of Object.entries(conocidos)) {
    if (msg.includes(clave)) return texto;
  }
  if (codigo === "23505") return "Ya existe un registro con ese código o SKU en tu espacio.";
  if (codigo === "23503") return "No se puede completar: el registro está relacionado con otros datos.";
  if (codigo === "23514") return "Algún valor no cumple las restricciones permitidas.";
  return "No se pudo completar la operación. Intenta de nuevo.";
}
