"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productoSchema, type ProductoInput } from "@/lib/validators";
import type { z } from "zod";
import { guardarProducto, publicarProducto, despublicarProducto, subirImagenProducto } from "@/server/actions/productos";
import { Badge } from "@/components/ui/badge";
import { formatoDineroDecimal } from "@/lib/format";

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
}

const vacio: ProductoForm = {
  sku: "", name: "", description: "", category: "",
  base_cost: "0", sale_price: "0", freight_alloc: "0", duty_alloc: "0", other_alloc: "0",
  dim_length: "", dim_width: "", dim_height: "", dim_unit: "cm", weight_kg: "",
  min_stock: 0, unit: "unidad", origin_country: "", origin_public: false, notes: "", active: true,
};

function aNum(v: string | number | undefined): number {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function GestionProductos({ productos, esAveli = false }: { productos: Producto[]; esAveli?: boolean }) {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [subiendo, setSubiendo] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const form = useForm<ProductoForm, unknown, ProductoInput>({
    resolver: zodResolver(productoSchema),
    defaultValues: esAveli ? { ...vacio, sizes: "XS, S, M, L, XL", colors: "", image_url: "", catalog_availability: "Consultar disponibilidad" } : vacio,
  });
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("nuevo") === "1") setMostrarForm(true);
  }, []);

  const watch = form.watch();
  const landed =
    aNum(watch.base_cost ?? "0") + aNum(watch.freight_alloc ?? "0") +
    aNum(watch.duty_alloc ?? "0") + aNum(watch.other_alloc ?? "0");

  const filtrados = productos.filter((p) =>
    `${p.sku} ${p.name} ${p.category}`.toLowerCase().includes(busqueda.toLowerCase()) && (categoria === "Todos" || p.category === categoria),
  );

  function abrirNuevo() {
    setEditando(null);
    form.reset(esAveli ? { ...vacio, sizes: "XS, S, M, L, XL", colors: "", image_url: "", catalog_availability: "Consultar disponibilidad" } : vacio);
    setMostrarForm(true);
    setMensaje(null);
  }

  function abrirEdicion(p: Producto) {
    setEditando(p);
    form.reset({
      sku: p.sku, name: p.name, description: p.description ?? "", category: p.category,
      base_cost: String(p.base_cost), sale_price: String(p.sale_price),
      freight_alloc: String(p.freight_alloc), duty_alloc: String(p.duty_alloc),
      other_alloc: String(p.other_alloc),
      dim_length: p.dim_length?.toString() ?? "", dim_width: p.dim_width?.toString() ?? "",
      dim_height: p.dim_height?.toString() ?? "", dim_unit: p.dim_unit as "cm" | "m" | "in",
      weight_kg: p.weight_kg?.toString() ?? "",
      min_stock: p.min_stock, unit: p.unit,
      origin_country: p.origin_country ?? "", origin_public: p.origin_public,
      notes: p.notes ?? "", active: p.active,
      ...(esAveli && { image_url: p.image_url ?? "", sizes: p.sizes ?? "", colors: p.colors ?? "", catalog_availability: p.catalog_availability ?? "Consultar disponibilidad" }),
    });
    setMostrarForm(true);
    setMensaje(null);
  }

  function enviar(datos: ProductoInput) {
    startTransition(async () => {
      const r = await guardarProducto(datos, editando?.id);
      if (!r.ok) {
        setMensaje(r.error ?? "Error al guardar.");
        return;
      }
      setMostrarForm(false);
      setMensaje(null);
    });
  }

  function alternarPublicacion(p: Producto) {
    const texto = p.published
      ? `¿Retirar "${p.name}" del catálogo público? El producto y su stock no se eliminan.`
      : `¿Publicar "${p.name}" en el catálogo? Solo se compartirán nombre, descripción, categoría, precio, imágenes y disponibilidad general.`;
    if (!window.confirm(texto)) return;
    startTransition(async () => {
      const r = p.published ? await despublicarProducto(p.id) : await publicarProducto(p.id);
      if (!r.ok) setMensaje(r.error ?? "No se pudo cambiar la publicación.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por SKU, nombre o categoría…"
          className="campo max-w-xs"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar productos"
        />
        <button type="button" className="btn-primario" onClick={abrirNuevo}>
          + Agregar producto
        </button>
        {esAveli && <select aria-label="Filtrar categoría" className="campo max-w-xs" value={categoria} onChange={e=>setCategoria(e.target.value)}>{["Todos", ...new Set(productos.map(p=>p.category))].map(c=><option key={c}>{c}</option>)}</select>}
      </div>
      {esAveli && <p className="text-sm">{filtrados.length} prendas · Precios en bolivianos · Colores aproximados de las muestras del catálogo.</p>}

      {mensaje && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mensaje}</p>
      )}

      {mostrarForm && (
        <form
          onSubmit={form.handleSubmit(enviar)}
          className="tarjeta grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3"
          noValidate
          aria-label={editando ? "Editar producto" : "Nuevo producto"}
        >
          <h2 className="font-semibold text-slate-900 sm:col-span-2 lg:col-span-3">
            {editando ? `Editar ${editando.name}` : "Nuevo producto"}
          </h2>

          <div>
            <label htmlFor="pr-sku" className="etiqueta">SKU / código *</label>
            <input id="pr-sku" className="campo" maxLength={60} {...form.register("sku")} />
            {form.formState.errors.sku && <p className="mensaje-error">{form.formState.errors.sku.message}</p>}
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="pr-name" className="etiqueta">Nombre comercial *</label>
            <input id="pr-name" className="campo" maxLength={160} {...form.register("name")} />
            {form.formState.errors.name && <p className="mensaje-error">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="pr-cat" className="etiqueta">Categoría *</label>
            <input id="pr-cat" className="campo" maxLength={80} {...form.register("category")} />
            {form.formState.errors.category && <p className="mensaje-error">{form.formState.errors.category.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pr-desc" className="etiqueta">Descripción pública</label>
            <textarea id="pr-desc" className="campo" rows={2} maxLength={4000} {...form.register("description")} />
          </div>

          {esAveli && <>
            <div><label htmlFor="pr-img" className="etiqueta">Fotografía (hasta 2 MB)</label><input id="pr-img" type="file" accept="image/jpeg,image/png,image/webp" className="campo" disabled={subiendo || pendiente} onChange={async e=>{
              const file=e.target.files?.[0]; if(!file) return;
              setSubiendo(true); setMensaje(null);
              try { const data=new FormData(); data.set("imagen",file); const r=await subirImagenProducto(data); if(r.ok && r.url) form.setValue("image_url",r.url); else setMensaje(r.error ?? "Error al subir imagen."); }
              catch { setMensaje("No se pudo subir la imagen."); } finally { setSubiendo(false); }
            }} /><p className="mt-1 text-xs">{subiendo ? "Subiendo…" : watch.image_url ? "Imagen lista para guardar." : "JPG, PNG o WebP"}</p></div>
            <div><label htmlFor="pr-sizes" className="etiqueta">Tallas (separadas por comas)</label><input id="pr-sizes" className="campo" {...form.register("sizes")} /></div>
            <div><label htmlFor="pr-colors" className="etiqueta">Colores (nombres o códigos HEX, separados por comas)</label><input id="pr-colors" className="campo" placeholder="#541520, blanco, negro" {...form.register("colors")} /></div>
            <div><label htmlFor="pr-disponible" className="etiqueta">Disponibilidad comercial</label><select id="pr-disponible" className="campo" {...form.register("catalog_availability")}><option>Consultar disponibilidad</option><option>Disponible</option><option>Agotado</option></select><p className="mt-1 text-xs">Independiente de las cantidades del inventario.</p></div>
          </>}

          <fieldset className="contents">
            <legend className="sr-only">Costos y precio (BOB)</legend>
            <div>
              <label htmlFor="pr-base" className="etiqueta">Costo base de compra *</label>
              <input id="pr-base" inputMode="decimal" className="campo" {...form.register("base_cost")} />
              {form.formState.errors.base_cost && <p className="mensaje-error">{form.formState.errors.base_cost.message}</p>}
            </div>
            <div>
              <label htmlFor="pr-flete" className="etiqueta">Transporte asignado</label>
              <input id="pr-flete" inputMode="decimal" className="campo" {...form.register("freight_alloc")} />
            </div>
            <div>
              <label htmlFor="pr-arancel" className="etiqueta">Aranceles / impuestos</label>
              <input id="pr-arancel" inputMode="decimal" className="campo" {...form.register("duty_alloc")} />
            </div>
            <div>
              <label htmlFor="pr-otros" className="etiqueta">Otros costos</label>
              <input id="pr-otros" inputMode="decimal" className="campo" {...form.register("other_alloc")} />
            </div>
            <div>
              <label htmlFor="pr-precio" className="etiqueta">Precio de venta *</label>
              <input id="pr-precio" inputMode="decimal" className="campo" {...form.register("sale_price")} />
              {form.formState.errors.sale_price && <p className="mensaje-error">{form.formState.errors.sale_price.message}</p>}
            </div>
            <div className="rounded-lg bg-brand-50 p-3 text-sm">
              <p className="text-brand-900">Costo puesto en almacén (unitario)</p>
              <p className="text-lg font-bold text-brand-800">{formatoDineroDecimal(landed)}</p>
            </div>
          </fieldset>

          <div>
            <label htmlFor="pr-min" className="etiqueta">Stock mínimo</label>
            <input id="pr-min" type="number" min={0} className="campo" {...form.register("min_stock", { valueAsNumber: true })} />
            {form.formState.errors.min_stock && <p className="mensaje-error">{form.formState.errors.min_stock.message}</p>}
          </div>
          <div>
            <label htmlFor="pr-unit" className="etiqueta">Unidad de medida</label>
            <input id="pr-unit" className="campo" maxLength={20} {...form.register("unit")} />
          </div>
          <div>
            <label htmlFor="pr-origen" className="etiqueta">País de origen</label>
            <input id="pr-origen" className="campo" maxLength={80} {...form.register("origin_country")} />
          </div>

          <fieldset className="contents">
            <legend className="sr-only">Dimensiones (opcional)</legend>
            <div>
              <label htmlFor="pr-largo" className="etiqueta">Largo</label>
              <input id="pr-largo" inputMode="decimal" className="campo" {...form.register("dim_length")} />
            </div>
            <div>
              <label htmlFor="pr-ancho" className="etiqueta">Ancho</label>
              <input id="pr-ancho" inputMode="decimal" className="campo" {...form.register("dim_width")} />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="pr-alto" className="etiqueta">Alto</label>
                <input id="pr-alto" inputMode="decimal" className="campo" {...form.register("dim_height")} />
              </div>
              <div>
                <label htmlFor="pr-dunit" className="etiqueta">Unidad</label>
                <select id="pr-dunit" className="campo" {...form.register("dim_unit")}>
                  <option value="cm">cm</option>
                  <option value="m">m</option>
                  <option value="in">in</option>
                </select>
              </div>
            </div>
          </fieldset>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4" {...form.register("origin_public")} />
              Mostrar país de origen en el catálogo
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4" {...form.register("active")} />
              Producto activo
            </label>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="pr-notes" className="etiqueta">Notas privadas</label>
            <textarea id="pr-notes" className="campo" rows={2} maxLength={2000} {...form.register("notes")} />
          </div>

          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={pendiente || subiendo} className="btn-primario">
              {pendiente ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" className="btn-secundario" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {esAveli ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtrados.length === 0 && <p className="py-8">No hay productos para esta búsqueda.</p>}
        {filtrados.map(p=><article key={p.id} className="tarjeta overflow-hidden">
          {p.image_url ? <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image_url} alt={p.name} className="h-72 w-full bg-[#f3ebde] object-contain" />
          </> : <div className="flex h-48 items-center justify-center bg-[#f3ebde] font-serif text-2xl">AVÉLI · Sin fotografía</div>}
          <div className="space-y-3 p-5"><p className="text-xs uppercase tracking-wider">{p.category} · {p.sku}</p><h2 className="font-serif text-2xl">{p.name}</h2><p className="text-2xl font-semibold">Bs. {Number(p.sale_price).toFixed(2)}</p><p className="text-sm">{p.description}</p>
          <p className="text-sm"><strong>Tallas:</strong> {p.sizes || "Por definir"}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm"><strong>Colores:</strong>{p.colors?.split(",").filter(Boolean).map((c,i)=>/^#[0-9a-f]{6}$/i.test(c.trim()) ? <span key={i} title={`Muestra ${i+1}: ${c.trim()}`} aria-label={`Color aproximado ${c.trim()}`} className="inline-block h-6 w-6 rounded-full border border-stone-400" style={{backgroundColor:c.trim()}} /> : <span key={i}>{c.trim()}</span>)}</div>
          <p className="text-sm">{p.active ? p.catalog_availability : "Inactivo"}</p><p className="text-xs text-slate-500">Inventario registrado: {p.stock} {p.unit}</p>
          <div className="flex flex-wrap gap-2"><button type="button" className="btn-primario" onClick={()=>abrirEdicion(p)}>Editar producto</button><a className="btn-secundario" target="_blank" rel="noreferrer" href={`https://wa.me/59175672963?text=${encodeURIComponent(`Hola AVÉLI, quisiera consultar ${p.name} (${p.sku}), talla: , color: .`)}`}>Consultar</a></div>
          </div>
        </article>)}
      </div> : <div className="tarjeta overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-4 py-3">SKU</th>
              <th scope="col" className="px-4 py-3">Producto</th>
              <th scope="col" className="px-4 py-3">Precio</th>
              <th scope="col" className="px-4 py-3">Costo puesto</th>
              <th scope="col" className="px-4 py-3">Stock</th>
              <th scope="col" className="px-4 py-3">Catálogo</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  {busqueda ? "Sin resultados." : "Aún no registras productos."}
                </td>
              </tr>
            )}
            {filtrados.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.category}{!p.active && " · inactivo"}</p>
                </td>
                <td className="px-4 py-3">{formatoDineroDecimal(p.sale_price)}</td>
                <td className="px-4 py-3 text-slate-600">{formatoDineroDecimal(p.landed_unit_cost)}</td>
                <td className="px-4 py-3">
                  <Badge tono={p.stock === 0 ? "rojo" : p.stock <= p.min_stock ? "ambar" : "verde"}>
                    {p.stock} {p.unit}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tono={p.published ? "azul" : "gris"}>
                    {p.published ? "Publicado" : "Borrador"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" className="btn-fantasma" onClick={() => abrirEdicion(p)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={pendiente}
                      className={p.published ? "btn-fantasma text-amber-700" : "btn-fantasma text-brand-700"}
                      onClick={() => alternarPublicacion(p)}
                    >
                      {p.published ? "Despublicar" : "Publicar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}
