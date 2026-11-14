"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productoSchema, type ProductoInput } from "@/lib/validators";
import type { z } from "zod";
import { guardarProducto, publicarProducto, despublicarProducto, subirImagenGaleria, guardarImagenesProducto } from "@/server/actions/productos";
import { imagenesIniciales, type FilaImagen, type ImagenGaleria, type ImagenGuardada } from "@/lib/galeria";
import { GaleriaImagenes } from "@/components/dashboard/productos/galeria-imagenes";
import { Badge } from "@/components/ui/badge";
import { formatoDineroDecimal } from "@/lib/format";
import { ETIQUETA_RUBRO, RUBROS, esRubro, normalizarAtributos, rubroMasUsado } from "@/lib/rubros";
import { CamposRubro } from "@/components/dashboard/productos/campos-rubro";

type ProductoForm = z.input<typeof productoSchema>;

export interface Producto {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  base_cost: number;
  sale_price: number;
  freight_alloc: number;
  duty_alloc: number;
  other_alloc: number;
  landed_unit_cost: number;
  dim_length: number | null;
  dim_width: number | null;
  dim_height: number | null;
  dim_unit: string;
  weight_kg: number | null;
  stock: number;
  min_stock: number;
  unit: string;
  origin_country: string | null;
  origin_public: boolean;
  published: boolean;
  active: boolean;
  notes: string | null;
  image_url?: string | null;
  sizes?: string;
  colors?: string;
  catalog_availability?: "Disponible" | "Agotado" | "Consultar disponibilidad";
  rubro?: string;
  attributes?: unknown;
  product_images?: FilaImagen[];
}

const vacio: ProductoForm = {
  sku: "",
  name: "",
  description: "",
  category: "",
  rubro: "GENERAL",
  attributes: {},
  image_url: "",
  sizes: "",
  colors: "",
  catalog_availability: "Disponible",
  base_cost: "0",
  sale_price: "0",
  freight_alloc: "0",
  duty_alloc: "0",
  other_alloc: "0",
  dim_length: "",
  dim_width: "",
  dim_height: "",
  dim_unit: "cm",
  weight_kg: "",
  min_stock: 0,
  unit: "unidad",
  origin_country: "",
  origin_public: true,
  notes: "",
  active: true,
};

function aNum(v: string | number | undefined): number {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function GestionProductos({
  productos,
  esAveli = false,
  workspaceNombre = "Catálogo",
}: {
  productos: Producto[];
  esAveli?: boolean;
  workspaceNombre?: string;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [vista, setVista] = useState<"cuadricula" | "tabla">("cuadricula");
  const [galeria, setGaleria] = useState<ImagenGaleria[]>([]);
  const [galeriaCambiada, setGaleriaCambiada] = useState(false);
  const [idGuardado, setIdGuardado] = useState<string | null>(null);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const rubroInicial = rubroMasUsado(productos.map((p) => p.rubro));

  const form = useForm<ProductoForm, unknown, ProductoInput>({
    resolver: zodResolver(productoSchema),
    defaultValues: esAveli ? { ...vacio, rubro: rubroInicial, sizes: "XS, S, M, L, XL" } : { ...vacio, rubro: rubroInicial },
  });

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("nuevo") === "1") setMostrarForm(true);
  }, []);

  const watch = form.watch();
  const landed =
    aNum(watch.base_cost ?? "0") +
    aNum(watch.freight_alloc ?? "0") +
    aNum(watch.duty_alloc ?? "0") +
    aNum(watch.other_alloc ?? "0");

  const categorias = ["Todos", ...Array.from(new Set(productos.map((p) => p.category).filter(Boolean)))];

  const filtrados = productos.filter(
    (p) =>
      `${p.sku} ${p.name} ${p.category} ${p.description ?? ""}`.toLowerCase().includes(busqueda.toLowerCase()) &&
      (categoria === "Todos" || p.category === categoria),
  );

  function abrirNuevo() {
    setEditando(null);
    form.reset(esAveli ? { ...vacio, rubro: rubroInicial, sizes: "XS, S, M, L, XL" } : { ...vacio, rubro: rubroInicial });
    setGaleria([]);
    setGaleriaCambiada(false);
    setIdGuardado(null);
    setMostrarForm(true);
    setMensaje(null);
  }

  function abrirEdicion(p: Producto) {
    setEditando(p);
    form.reset({
      sku: p.sku,
      name: p.name,
      description: p.description ?? "",
      category: p.category,
      base_cost: String(p.base_cost),
      sale_price: String(p.sale_price),
      freight_alloc: String(p.freight_alloc),
      duty_alloc: String(p.duty_alloc),
      other_alloc: String(p.other_alloc),
      dim_length: p.dim_length?.toString() ?? "",
      dim_width: p.dim_width?.toString() ?? "",
      dim_height: p.dim_height?.toString() ?? "",
      dim_unit: (p.dim_unit as "cm" | "m" | "in") || "cm",
      weight_kg: p.weight_kg?.toString() ?? "",
      min_stock: p.min_stock,
      unit: p.unit,
      origin_country: p.origin_country ?? "",
      origin_public: p.origin_public,
      notes: p.notes ?? "",
      active: p.active,
      image_url: p.image_url ?? "",
      sizes: p.sizes ?? "",
      colors: p.colors ?? "",
      catalog_availability: p.catalog_availability ?? "Disponible",
      rubro: esRubro(p.rubro) ? p.rubro : "GENERAL",
      attributes: normalizarAtributos(p.attributes),
    });
    setGaleria(imagenesIniciales(p.product_images ?? [], p.image_url ?? null));
    setGaleriaCambiada(false);
    setIdGuardado(null);
    setMostrarForm(true);
    setMensaje(null);
  }

  function enviar(datos: ProductoInput) {
    startTransition(async () => {
      const r = await guardarProducto(datos, editando?.id ?? idGuardado ?? undefined);
      if (!r.ok) {
        for (const [ruta, texto] of Object.entries(r.errores ?? {})) {
          form.setError(ruta as FieldPath<ProductoForm>, { message: texto });
        }
        setMensaje(r.error ?? "Error al guardar el producto.");
        return;
      }
      if (galeriaCambiada && r.id) {
        setIdGuardado(r.id);
        const finales: ImagenGuardada[] = [];
        for (const item of galeria) {
          if (item.archivo) {
            const data = new FormData();
            data.set("imagen", item.archivo);
            data.set("productId", r.id);
            const s = await subirImagenGaleria(data);
            if (!s.ok || !s.storage_path || !s.public_url) {
              setMensaje(`El producto se guardó, pero no se pudo subir «${item.nombre}». ${s.error ?? ""}`.trim());
              return;
            }
            finales.push({ storage_path: s.storage_path, public_url: s.public_url });
          } else if (item.storage_path && item.public_url) {
            finales.push({ storage_path: item.storage_path, public_url: item.public_url });
          }
        }
        const g = await guardarImagenesProducto(r.id, finales);
        if (!g.ok) {
          setMensaje(`El producto se guardó, pero no se pudieron guardar las imágenes. ${g.error ?? ""}`.trim());
          return;
        }
      }
      setIdGuardado(null);
      setMostrarForm(false);
      setMensaje(null);
    });
  }

  function alternarPublicacion(p: Producto) {
    const texto = p.published
      ? `¿Retirar "${p.name}" del catálogo público?`
      : `¿Publicar "${p.name}" en el catálogo público?`;
    if (!window.confirm(texto)) return;
    startTransition(async () => {
      const r = p.published ? await despublicarProducto(p.id) : await publicarProducto(p.id);
      if (!r.ok) setMensaje(r.error ?? "No se pudo cambiar el estado de publicación.");
    });
  }

  return (
    <div className="space-y-6">
      {/* Barra de control y filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Buscar por código, nombre o descripción…"
            className="campo max-w-xs"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {categorias.length > 2 && (
            <select
              className="campo max-w-[200px]"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              aria-label="Filtrar por categoría"
            >
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de vista */}
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 text-xs">
            <button
              type="button"
              onClick={() => setVista("cuadricula")}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                vista === "cuadricula" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cuadrícula
            </button>
            <button
              type="button"
              onClick={() => setVista("tabla")}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                vista === "tabla" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tabla
            </button>
          </div>

          <button type="button" className="btn-primario" onClick={abrirNuevo}>
            + Agregar producto
          </button>
        </div>
      </div>

      {mensaje && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {mensaje}
        </div>
      )}

      {/* Formulario de Alta y Edición para TODOS los administradores */}
      {mostrarForm && (
        <form
          onSubmit={form.handleSubmit(enviar)}
          className="tarjeta grid grid-cols-1 gap-4 border border-slate-200 p-6 sm:grid-cols-2 lg:grid-cols-3"
          noValidate
          aria-label={editando ? "Editar producto" : "Nuevo producto"}
        >
          <div className="border-b border-slate-200 pb-3 sm:col-span-2 lg:col-span-3">
            <h2 className="text-xl font-bold text-slate-900">
              {editando ? `Editar: ${editando.name}` : "Registrar nuevo producto en catálogo"}
            </h2>
            <p className="text-xs text-slate-500">
              Los cambios se reflejarán tanto en tu panel privado como en el catálogo público si el producto está publicado.
            </p>
          </div>

          <div>
            <label htmlFor="pr-sku" className="etiqueta">
              SKU / Código identificador *
            </label>
            <input id="pr-sku" className="campo" maxLength={60} {...form.register("sku")} />
            {form.formState.errors.sku && <p className="mensaje-error">{form.formState.errors.sku.message}</p>}
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="pr-name" className="etiqueta">
              Nombre comercial del producto *
            </label>
            <input id="pr-name" className="campo" maxLength={160} {...form.register("name")} />
            {form.formState.errors.name && <p className="mensaje-error">{form.formState.errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="pr-cat" className="etiqueta">
              Categoría *
            </label>
            <input id="pr-cat" className="campo" maxLength={80} {...form.register("category")} />
            {form.formState.errors.category && <p className="mensaje-error">{form.formState.errors.category.message}</p>}
          </div>

          <div>
            <label htmlFor="pr-rubro" className="etiqueta">
              Rubro *
            </label>
            <select id="pr-rubro" className="campo" {...form.register("rubro")}>
              {RUBROS.map((r) => (
                <option key={r} value={r}>
                  {ETIQUETA_RUBRO[r]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">El rubro define los datos propios del producto.</p>
            {form.formState.errors.rubro && <p className="mensaje-error">{form.formState.errors.rubro.message}</p>}
          </div>

          <div>
            <label htmlFor="pr-precio" className="etiqueta">
              Precio de venta al público (BOB) *
            </label>
            <input id="pr-precio" inputMode="decimal" className="campo" {...form.register("sale_price")} />
            {form.formState.errors.sale_price && <p className="mensaje-error">{form.formState.errors.sale_price.message}</p>}
          </div>

          <div>
            <label htmlFor="pr-disponible" className="etiqueta">
              Disponibilidad comercial
            </label>
            <select id="pr-disponible" className="campo" {...form.register("catalog_availability")}>
              <option value="Disponible">Disponible</option>
              <option value="Consultar disponibilidad">Consultar disponibilidad</option>
              <option value="Agotado">Agotado</option>
            </select>
            {form.formState.errors.catalog_availability && <p className="mensaje-error">{form.formState.errors.catalog_availability.message}</p>}
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="pr-desc" className="etiqueta">
              Descripción detallada
            </label>
            <textarea
              id="pr-desc"
              className="campo"
              rows={3}
              maxLength={4000}
              placeholder="Presentación, características, fórmula o ingredientes..."
              {...form.register("description")}
            />
            {form.formState.errors.description && <p className="mensaje-error">{form.formState.errors.description.message}</p>}
          </div>

          <CamposRubro form={form} rubro={esRubro(watch.rubro) ? watch.rubro : "GENERAL"} />

          {/* Fotografía del producto */}
          <GaleriaImagenes
            items={galeria}
            onChange={(nuevas) => {
              setGaleria(nuevas);
              setGaleriaCambiada(true);
            }}
            deshabilitado={pendiente}
          />

          <div>
            <label htmlFor="pr-origen" className="etiqueta">
              País de origen
            </label>
            <input id="pr-origen" className="campo" maxLength={80} {...form.register("origin_country")} />
            {form.formState.errors.origin_country && <p className="mensaje-error">{form.formState.errors.origin_country.message}</p>}
          </div>

          <div>
            <label htmlFor="pr-unit" className="etiqueta">
              Unidad de medida
            </label>
            <input id="pr-unit" className="campo" maxLength={20} {...form.register("unit")} />
            {form.formState.errors.unit && <p className="mensaje-error">{form.formState.errors.unit.message}</p>}
          </div>

          <div>
            <label htmlFor="pr-min" className="etiqueta">
              Alerta de stock mínimo
            </label>
            <input
              id="pr-min"
              type="number"
              min={0}
              className="campo"
              {...form.register("min_stock", { valueAsNumber: true })}
            />
            {form.formState.errors.min_stock && <p className="mensaje-error">{form.formState.errors.min_stock.message}</p>}
          </div>

          <div className="flex gap-2 sm:col-span-2 lg:col-span-3 border-t border-slate-200 pt-4">
            <button type="submit" disabled={pendiente} className="btn-primario">
              {pendiente ? "Guardando cambios…" : "Guardar producto"}
            </button>
            <button type="button" className="btn-secundario" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Vista de Catálogo en Cuadrícula Didáctica y Visual (Estilo AVÉLI) */}
      {vista === "cuadricula" ? (
        <div>
          {filtrados.length === 0 ? (
            <div className="tarjeta py-12 text-center text-slate-500">
              <p className="text-base font-medium">No se encontraron productos para esta búsqueda.</p>
              <p className="mt-1 text-sm text-slate-400">Intenta con otro término o limpia los filtros.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtrados.map((p) => (
                <article
                  key={p.id}
                  className="tarjeta flex flex-col overflow-hidden border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Imagen del producto */}
                  <div className="relative flex h-64 w-full items-center justify-center border-b border-slate-100 bg-slate-50/50 p-4">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <span className="font-serif text-3xl font-bold tracking-wider text-slate-300">
                          {p.sku.slice(0, 3)}
                        </span>
                        <span className="mt-2 text-xs">Sin fotografía registrada</span>
                      </div>
                    )}
                    <div className="absolute right-3 top-3">
                      <Badge tono={p.published ? "azul" : "gris"}>
                        {p.published ? "Catálogo público" : "Borrador privado"}
                      </Badge>
                    </div>
                  </div>

                  {/* Datos del producto */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <span>{p.category}</span>
                        <span className="font-mono text-slate-400">{p.sku}</span>
                      </div>

                      <h3 className="font-serif text-xl font-bold leading-snug text-slate-900">{p.name}</h3>

                      <p className="text-2xl font-bold tracking-tight text-slate-900">
                        Bs. {Number(p.sale_price).toFixed(2)}
                      </p>

                      {p.description && (
                        <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">{p.description}</p>
                      )}

                      <div className="pt-2 text-xs text-slate-500">
                        <p>
                          <span className="font-semibold text-slate-700">Disponibilidad:</span>{" "}
                          {p.catalog_availability || (p.stock > 0 ? "Disponible" : "Agotado")}
                        </p>
                        {p.origin_country && (
                          <p>
                            <span className="font-semibold text-slate-700">Origen:</span> {p.origin_country}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        className="btn-primario flex-1 text-xs"
                        onClick={() => abrirEdicion(p)}
                      >
                        Editar producto
                      </button>
                      <button
                        type="button"
                        disabled={pendiente}
                        className={`btn-secundario text-xs ${p.published ? "text-amber-800" : "text-slate-700"}`}
                        onClick={() => alternarPublicacion(p)}
                      >
                        {p.published ? "Despublicar" : "Publicar"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Vista de Tabla Administrativa */
        <div className="tarjeta overflow-x-auto border border-slate-200">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-4 py-3">
                  SKU
                </th>
                <th scope="col" className="px-4 py-3">
                  Producto
                </th>
                <th scope="col" className="px-4 py-3">
                  Precio
                </th>
                <th scope="col" className="px-4 py-3">
                  Disponibilidad
                </th>
                <th scope="col" className="px-4 py-3">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    {busqueda ? "Sin resultados para la búsqueda." : "No hay productos registrados."}
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{p.sku}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.category}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatoDineroDecimal(p.sale_price)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {p.catalog_availability || (p.stock > 0 ? "Disponible" : "Agotado")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tono={p.published ? "azul" : "gris"}>
                        {p.published ? "Publicado" : "Borrador"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" className="btn-fantasma text-xs" onClick={() => abrirEdicion(p)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={pendiente}
                          className={p.published ? "btn-fantasma text-xs text-amber-700" : "btn-fantasma text-xs text-brand-700"}
                          onClick={() => alternarPublicacion(p)}
                        >
                          {p.published ? "Despublicar" : "Publicar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
