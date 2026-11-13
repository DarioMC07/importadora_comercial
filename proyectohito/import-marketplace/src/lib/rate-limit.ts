/**
 * Rate limiting sencillo en memoria (proceso único, desarrollo).
 * En producción con múltiples instancias, sustituir por un store compartido
 * (Upstash Ratelimit, Redis, etc.): basta reemplazar la implementación de
 * `consume()` manteniendo la firma. Ver README → "Rate limiting".
 */

interface Ventana {
  timestamps: number[];
}

const buckets = new Map<string, Ventana>();

// Limpieza periódica para no acumular memoria.
setInterval(() => {
  const ahora = Date.now();
  for (const [clave, ventana] of buckets) {
    ventana.timestamps = ventana.timestamps.filter((t) => ahora - t < 3_600_000);
    if (ventana.timestamps.length === 0) buckets.delete(clave);
  }
}, 300_000).unref?.();

export interface ResultadoLimite {
  permitido: boolean;
  restantes: number;
  reintentoEnSegundos: number;
}

/**
 * Consume un intento dentro de una ventana deslizante.
 * @param clave    Identificador único (ej. `login:1.2.3.4`)
 * @param maximo   Intentos permitidos en la ventana
 * @param ventanaMs Tamaño de la ventana en milisegundos
 */
export function consume(clave: string, maximo: number, ventanaMs: number): ResultadoLimite {
  const ahora = Date.now();
  let ventana = buckets.get(clave);
  if (!ventana) {
    ventana = { timestamps: [] };
    buckets.set(clave, ventana);
  }
  ventana.timestamps = ventana.timestamps.filter((t) => ahora - t < ventanaMs);

  if (ventana.timestamps.length >= maximo) {
    const masAntiguo = ventana.timestamps[0] ?? ahora;
    return {
      permitido: false,
      restantes: 0,
      reintentoEnSegundos: Math.ceil((ventanaMs - (ahora - masAntiguo)) / 1000),
    };
  }

  ventana.timestamps.push(ahora);
  return { permitido: true, restantes: maximo - ventana.timestamps.length, reintentoEnSegundos: 0 };
}

export function ipDe(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "desconocida"
  );
}
