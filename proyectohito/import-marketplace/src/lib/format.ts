/**
 * Formato regional centralizado: es-BO, America/La_Paz, moneda configurable.
 * Toda la UI usa estas utilidades (nunca formatear a mano).
 */
import { aDecimal, type Centavos } from "./money";

export const APP_CURRENCY = process.env.NEXT_PUBLIC_APP_CURRENCY ?? "BOB";
export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "America/La_Paz";
export const APP_LOCALE = process.env.NEXT_PUBLIC_APP_LOCALE ?? "es-BO";

const formatoMoneda = new Intl.NumberFormat(APP_LOCALE, {
  style: "currency",
  currency: APP_CURRENCY,
  minimumFractionDigits: 2,
});

const formatoFecha = new Intl.DateTimeFormat(APP_LOCALE, {
  dateStyle: "medium",
  timeZone: APP_TIMEZONE,
});

const formatoFechaHora = new Intl.DateTimeFormat(APP_LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: APP_TIMEZONE,
});

const formatoNumero = new Intl.NumberFormat(APP_LOCALE);

/** Formatea centavos enteros como moneda. */
export function formatoDinero(centavos: Centavos): string {
  return formatoMoneda.format(aDecimal(centavos));
}

/** Formatea un decimal (DB) como moneda. */
export function formatoDineroDecimal(valor: string | number): string {
  return formatoMoneda.format(Number(valor));
}

/** Normaliza: las fechas tipo `date` (YYYY-MM-DD) se tratan como mediodía
 *  local para evitar que el desfase UTC las mueva al día anterior. */
function aFecha(fecha: string | Date): Date {
  if (fecha instanceof Date) return fecha;
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return new Date(`${fecha}T12:00:00`);
  return new Date(fecha);
}

/** Fecha local (YYYY-MM-DD) en la zona horaria de la app. */
export function fechaLocal(fecha: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(aFecha(fecha));
}

export function formatoFechaCorta(fecha: string | Date): string {
  return formatoFecha.format(aFecha(fecha));
}

export function formatoFechaLarga(fecha: string | Date): string {
  return formatoFechaHora.format(aFecha(fecha));
}

export function formatoEntero(n: number): string {
  return formatoNumero.format(n);
}

/** Hoy en la zona horaria de la app (YYYY-MM-DD), útil para reportes. */
export function hoyLocal(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
