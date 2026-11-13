"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/server";
import { loginSchema, recuperacionSchema } from "@/lib/validators";
import { consume, ipDe } from "@/lib/rate-limit";

const LIMITE_LOGIN = Number(process.env.RATE_LIMIT_LOGIN_PER_MINUTE ?? 5);

export interface ResultadoAuth {
  ok: boolean;
  error?: string;
}

export async function iniciarSesion(input: unknown): Promise<ResultadoAuth> {
  const cabeceras = await headers();
  const limite = consume(`login:${ipDe(cabeceras)}`, LIMITE_LOGIN, 60_000);
  if (!limite.permitido) {
    return {
      ok: false,
      error: `Demasiados intentos. Espera ${limite.reintentoEnSegundos} segundos e inténtalo de nuevo.`,
    };
  }

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa el correo y la contraseña." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Mensaje genérico: no revelar si el correo existe.
    return { ok: false, error: "Credenciales incorrectas. Verifica tus datos." };
  }

  return { ok: true };
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}

export async function recuperarContrasena(input: unknown): Promise<ResultadoAuth> {
  const cabeceras = await headers();
  const limite = consume(`recuperar:${ipDe(cabeceras)}`, 3, 3_600_000);
  if (!limite.permitido) {
    return { ok: false, error: "Demasiados intentos. Intenta más tarde." };
  }

  const parsed = recuperacionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ingresa un correo válido." };

  const supabase = await crearClienteServidor();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/ingresar`,
  });

  // Respuesta uniforme aunque el correo no exista.
  return { ok: true };
}
