"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, recuperacionSchema, type LoginInput } from "@/lib/validators";
import type { z } from "zod";
import { iniciarSesion, recuperarContrasena } from "@/server/actions/auth";

type Recuperacion = z.infer<typeof recuperacionSchema>;

export function FormularioIngreso() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siguiente = searchParams.get("siguiente") ?? "/dashboard";
  const [modo, setModo] = useState<"login" | "recuperar">("login");
  const [mensaje, setMensaje] = useState<{ tipo: "error" | "ok"; texto: string } | null>(null);

  const loginForm = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const recuperarForm = useForm<Recuperacion>({ resolver: zodResolver(recuperacionSchema) });

  async function enviarLogin(datos: LoginInput) {
    setMensaje(null);
    const resultado = await iniciarSesion(datos);
    if (!resultado.ok) {
      setMensaje({ tipo: "error", texto: resultado.error ?? "No se pudo iniciar sesión." });
      return;
    }
    router.push(siguiente.startsWith("/dashboard") ? siguiente : "/dashboard");
    router.refresh();
  }

  async function enviarRecuperacion(datos: Recuperacion) {
    setMensaje(null);
    const resultado = await recuperarContrasena(datos);
    if (!resultado.ok) {
      setMensaje({ tipo: "error", texto: resultado.error ?? "No se pudo procesar." });
      return;
    }
    setMensaje({
      tipo: "ok",
      texto: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
    });
  }

  if (modo === "recuperar") {
    return (
      <form onSubmit={recuperarForm.handleSubmit(enviarRecuperacion)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email-rec" className="etiqueta">Correo electrónico</label>
          <input
            id="email-rec"
            type="email"
            autoComplete="email"
            className={`campo ${recuperarForm.formState.errors.email ? "campo-error" : ""}`}
            {...recuperarForm.register("email")}
          />
          {recuperarForm.formState.errors.email && (
            <p className="mensaje-error">{recuperarForm.formState.errors.email.message}</p>
          )}
        </div>
        {mensaje && (
          <p role="alert" className={`rounded-lg p-3 text-sm ${mensaje.tipo === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {mensaje.texto}
          </p>
        )}
        <button type="submit" disabled={recuperarForm.formState.isSubmitting} className="btn-primario w-full">
          {recuperarForm.formState.isSubmitting ? "Enviando…" : "Enviar enlace de recuperación"}
        </button>
        <button type="button" className="btn-fantasma w-full" onClick={() => { setModo("login"); setMensaje(null); }}>
          Volver al inicio de sesión
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={loginForm.handleSubmit(enviarLogin)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="etiqueta">Correo electrónico</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={`campo ${loginForm.formState.errors.email ? "campo-error" : ""}`}
          {...loginForm.register("email")}
        />
        {loginForm.formState.errors.email && (
          <p className="mensaje-error">{loginForm.formState.errors.email.message}</p>
        )}
      </div>
      <div>
        <label htmlFor="password" className="etiqueta">Contraseña</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={`campo ${loginForm.formState.errors.password ? "campo-error" : ""}`}
          {...loginForm.register("password")}
        />
        {loginForm.formState.errors.password && (
          <p className="mensaje-error">{loginForm.formState.errors.password.message}</p>
        )}
      </div>
      {mensaje && (
        <p role="alert" className={`rounded-lg p-3 text-sm ${mensaje.tipo === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {mensaje.texto}
        </p>
      )}
      <button type="submit" disabled={loginForm.formState.isSubmitting} className="btn-primario w-full">
        {loginForm.formState.isSubmitting ? "Ingresando…" : "Ingresar"}
      </button>
      <button type="button" className="btn-fantasma w-full" onClick={() => { setModo("recuperar"); setMensaje(null); }}>
        ¿Olvidaste tu contraseña?
      </button>
    </form>
  );
}
