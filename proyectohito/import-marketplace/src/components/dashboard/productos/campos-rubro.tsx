"use client";

import type { Path, UseFormReturn } from "react-hook-form";
import type { ProductoFormulario, ProductoInput } from "@/lib/validators";
import { CAMPOS_POR_RUBRO, ETIQUETA_RUBRO, type Rubro } from "@/lib/rubros";

export function CamposRubro({
  form,
  rubro,
}: {
  form: UseFormReturn<ProductoFormulario, unknown, ProductoInput>;
  rubro: Rubro;
}): React.ReactElement | null {
  const campos = CAMPOS_POR_RUBRO[rubro];
  if (campos.length === 0) return null;

  const errores = form.formState.errors.attributes as Record<string, { message?: string } | undefined> | undefined;

  return (
    <fieldset className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:col-span-2 lg:col-span-3">
      <legend className="etiqueta px-1 font-semibold text-slate-800">Datos de {ETIQUETA_RUBRO[rubro]}</legend>
      <p className="text-xs text-slate-500">Estos datos se muestran en la ficha pública del producto.</p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {campos.map((campo) => {
          const id = `pr-attr-${campo.clave}`;
          const registro = form.register(`attributes.${campo.clave}` as Path<ProductoFormulario>);

          return (
            <div key={campo.clave} className={campo.tipo === "texto_largo" ? "sm:col-span-2" : undefined}>
              <label htmlFor={id} className="etiqueta">
                {campo.etiqueta}
                {campo.requerido ? " *" : ""}
              </label>
              {campo.tipo === "texto" && (
                <input id={id} className="campo" maxLength={campo.max} placeholder={campo.ejemplo} {...registro} />
              )}
              {campo.tipo === "texto_largo" && (
                <textarea id={id} className="campo" rows={3} maxLength={campo.max} {...registro} />
              )}
              {campo.tipo === "fecha" && (
                <input id={id} type="date" className="campo" {...registro} />
              )}
              {campo.tipo === "opcion" && (
                <select id={id} className="campo" {...registro}>
                  <option value="">Sin especificar</option>
                  {(campo.opciones ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
              {errores?.[campo.clave]?.message && <p className="mensaje-error">{errores[campo.clave]?.message}</p>}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
