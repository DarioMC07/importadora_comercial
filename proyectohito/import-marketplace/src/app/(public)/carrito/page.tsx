"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCarrito } from "@/components/marketplace/carrito-provider";
import { dividirPorVendedor, itemsParaSolicitud, totalCarrito } from "@/lib/cart";
import { formatoDineroDecimal } from "@/lib/format";
import { crearSolicitudCompra } from "@/server/actions/solicitudes-publicas";
import { PlaceholderImagen } from "@/components/ui/placeholder-imagen";

const formularioSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre completo").max(160),
  phone: z.string().trim().min(5, "Ingresa un teléfono válido").max(30),
  email: z.string().email("Correo inválido").max(160).optional().or(z.literal("")),
  consent: z.literal(true, { message: "Debes aceptar el aviso de privacidad" }),
});

type Formulario = z.infer<typeof formularioSchema>;

export default function PaginaCarrito() {
  const { items, cargado, cambiarCantidad, quitar, vaciar } = useCarrito();
  const router = useRouter();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({ resolver: zodResolver(formularioSchema) });

  const grupos = dividirPorVendedor(items);
  const total = totalCarrito(items);

  async function enviar(datos: Formulario) {
    setErrorServidor(null);
    const resultado = await crearSolicitudCompra({
      customer: {
        name: datos.name,
        phone: datos.phone,
        email: datos.email || undefined,
        consent: datos.consent,
      },
      items: itemsParaSolicitud(items),
    });
    if (!resultado.ok) {
      setErrorServidor(resultado.error ?? "No se pudo enviar la solicitud.");
      return;
    }
    vaciar();
    router.push(`/solicitud/confirmacion/${(resultado.codigos ?? []).join(",")}`);
  }

  if (!cargado) {
    return (
      <div className="contenedor py-16 text-center text-slate-500" role="status">
        Cargando tu carrito…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="contenedor py-16">
        <div className="tarjeta mx-auto flex max-w-md flex-col items-center gap-4 p-10 text-center">
          <p className="text-xl font-semibold text-slate-800">Tu carrito está vacío</p>
          <p className="text-slate-500">Explora el catálogo y agrega productos de varios vendedores.</p>
          <Link href="/catalogo" className="btn-primario">
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="contenedor py-8">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Tu carrito</h1>
      <p className="mt-1 text-slate-600">
        Al enviar la solicitud se generará <strong>una solicitud independiente por vendedor</strong>.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {grupos.map((grupo) => (
            <section key={grupo.sellerId} className="tarjeta overflow-hidden" aria-label={`Productos de ${grupo.sellerNombre}`}>
              <h2 className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800">
                {grupo.sellerNombre}
              </h2>
              <ul className="divide-y divide-slate-100">
                {grupo.items.map((item) => (
                  <li key={item.productId} className="flex flex-wrap items-center gap-4 p-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                      {item.imagen ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imagen} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <PlaceholderImagen className="h-full w-full" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/catalogo/${item.slug}`} className="font-medium text-slate-900 hover:underline">
                        {item.nombre}
                      </Link>
                      <p className="text-sm text-slate-500">{formatoDineroDecimal(item.precio)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor={`cant-${item.productId}`} className="sr-only">
                        Cantidad de {item.nombre}
                      </label>
                      <input
                        id={`cant-${item.productId}`}
                        type="number"
                        min={1}
                        max={999}
                        value={item.cantidad}
                        onChange={(e) => cambiarCantidad(item.productId, Number(e.target.value))}
                        className="campo w-20"
                      />
                      <button
                        type="button"
                        className="btn-fantasma text-red-600"
                        onClick={() => quitar(item.productId)}
                        aria-label={`Quitar ${item.nombre} del carrito`}
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="border-t border-slate-100 px-4 py-2 text-right text-sm font-semibold text-slate-700">
                Subtotal {grupo.sellerNombre}: {formatoDineroDecimal(grupo.total)}
              </p>
            </section>
          ))}
        </div>

        <div className="tarjeta h-fit p-6">
          <h2 className="text-lg font-semibold text-slate-900">Datos de contacto</h2>
          <p className="mt-1 text-sm text-slate-500">
            El vendedor te contactará para coordinar pago y entrega. No hay cobro en línea.
          </p>
          <form onSubmit={handleSubmit(enviar)} className="mt-4 space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="etiqueta">Nombre completo *</label>
              <input id="name" className={`campo ${errors.name ? "campo-error" : ""}`} maxLength={160} {...register("name")} />
              {errors.name && <p className="mensaje-error">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="etiqueta">Teléfono / celular *</label>
              <input id="phone" type="tel" className={`campo ${errors.phone ? "campo-error" : ""}`} maxLength={30} {...register("phone")} />
              {errors.phone && <p className="mensaje-error">{errors.phone.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className="etiqueta">Correo electrónico (opcional)</label>
              <input id="email" type="email" className={`campo ${errors.email ? "campo-error" : ""}`} maxLength={160} {...register("email")} />
              {errors.email && <p className="mensaje-error">{errors.email.message}</p>}
            </div>
            <div>
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" className="mt-1 h-4 w-4" {...register("consent")} />
                <span>
                  Acepto que mis datos de contacto se compartan únicamente con los vendedores
                  de los productos solicitados para coordinar la compra. *
                </span>
              </label>
              {errors.consent && <p className="mensaje-error">{errors.consent.message}</p>}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="flex justify-between text-lg font-bold text-slate-900">
                <span>Total estimado</span>
                <span>{formatoDineroDecimal(total)}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Se crearán {grupos.length} {grupos.length === 1 ? "solicitud" : "solicitudes"} (una por vendedor).
              </p>
            </div>

            {errorServidor && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {errorServidor}
              </p>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primario w-full">
              {isSubmitting ? "Enviando…" : "Enviar solicitud de compra"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
