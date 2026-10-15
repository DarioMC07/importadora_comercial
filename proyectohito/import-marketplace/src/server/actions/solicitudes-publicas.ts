"use server";

import { headers } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/server";
import { solicitudPublicaSchema } from "@/lib/validators";
import { consume, ipDe } from "@/lib/rate-limit";

const LIMITE_POR_HORA = Number(process.env.RATE_LIMIT_REQUESTS_PER_HOUR ?? 10);

export interface ResultadoSolicitud {
  ok: boolean;
  codigos?: string[];
  error?: string;
}

/**
 * Crea solicitudes de compra desde el marketplace público.
 * - Validación Zod en servidor (la del cliente es solo UX).
 * - Rate limiting por IP.
 * - La división por vendedor ocurre en la función RPC transaccional
 *   create_purchase_requests: el cliente jamás envía workspace_id.
 */
export async function crearSolicitudCompra(input: unknown): Promise<ResultadoSolicitud> {
  const cabeceras = await headers();
  const limite = consume(`solicitud:${ipDe(cabeceras)}`, LIMITE_POR_HORA, 3_600_000);
  if (!limite.permitido) {
    return {
      ok: false,
      error: `Demasiadas solicitudes. Intenta de nuevo en ${limite.reintentoEnSegundos} segundos.`,
    };
  }

  const parsed = solicitudPublicaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("create_purchase_requests", {
    p_payload: {
      customer: {
        name: parsed.data.customer.name,
        phone: parsed.data.customer.phone,
        email: parsed.data.customer.email || null,
        consent: true,
      },
      items: parsed.data.items,
    },
  });

  if (error) {
    // Mensajes genéricos: nunca exponer SQL ni detalles internos.
    const conocidos: Record<string, string> = {
      PRODUCTO_AGOTADO: "Uno de los productos se agotó. Actualiza tu carrito.",
      PRODUCTO_NO_DISPONIBLE: "Uno de los productos ya no está disponible.",
      CONSENTIMIENTO_REQUERIDO: "Debes aceptar el aviso de privacidad.",
      CANTIDAD_INVALIDA: "Alguna cantidad no es válida.",
    };
    return {
      ok: false,
      error: conocidos[error.message] ?? "No pudimos registrar tu solicitud. Intenta más tarde.",
    };
  }

  return { ok: true, codigos: (data as string[]) ?? [] };
}
