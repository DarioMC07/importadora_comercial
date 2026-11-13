import Link from "next/link";

interface TiendaProps {
  slug: string;
  nombre: string;
}

export function TiendaBienvenida({ slug, nombre }: TiendaProps) {
  if (slug === "aveli") {
    return (
      <section className="aveli-portada">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/aveli/logo.png" alt="Logotipo oficial de AVÉLI" width={160} height={160} />
        <div>
          <p className="text-xs uppercase tracking-[.3em]">Tu colección, tu esencia</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Bienvenida a AVÉLI</h1>
          <p className="mt-3">Descubre tu estilo, expresa tu esencia.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="btn-primario" href="/dashboard/productos">Ver colección</Link>
            <Link className="btn-secundario" href="/dashboard/productos?nuevo=1">+ Agregar producto</Link>
            <Link className="btn-secundario" href="#guia-tallas">Guía de tallas</Link>
          </div>
        </div>
      </section>
    );
  }

  if (slug === "smaylan") {
    return (
      <section className="tienda-portada smaylan-portada">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-rose-900 text-white shadow-sm sm:h-28 sm:w-28">
          <span className="font-serif text-3xl font-bold tracking-wider">SM</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.25em] text-rose-800">Cuidado facial y maquillaje</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-slate-900 sm:text-4xl">Catálogo Smaylan</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700">
            Cosmética especializada y maquillaje de alto rendimiento. Fórmulas diseñadas para realzar la belleza natural con ingredientes seleccionados.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="btn-primario" href="/dashboard/productos">Ver catálogo</Link>
            <Link className="btn-secundario" href="/dashboard/productos?nuevo=1">+ Agregar producto</Link>
            <Link className="btn-secundario" href="#guia-aplicacion">Guía de aplicación</Link>
          </div>
        </div>
      </section>
    );
  }

  if (slug === "chocolates-capri") {
    return (
      <section className="tienda-portada capri-portada">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-amber-950 text-amber-100 shadow-sm sm:h-28 sm:w-28">
          <span className="font-serif text-3xl font-bold tracking-wider">CP</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.25em] text-amber-900">Nestlé Capri · Origen Chile</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-slate-900 sm:text-4xl">Chocolates Capri</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700">
            Barras de chocolate rellenas en presentaciones de 30 gramos. Equilibrio perfecto de chocolate con rellenos frutales y frutos secos para cualquier momento del día.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="btn-primario" href="/dashboard/productos">Ver catálogo</Link>
            <Link className="btn-secundario" href="/dashboard/productos?nuevo=1">+ Agregar producto</Link>
            <Link className="btn-secundario" href="#guia-conservacion">Conservación y ficha</Link>
          </div>
        </div>
      </section>
    );
  }

  if (slug === "trencito") {
    return (
      <section className="tienda-portada trencito-portada">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-red-800 text-white shadow-sm sm:h-28 sm:w-28">
          <span className="font-serif text-2xl font-bold tracking-wider">TR</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.25em] text-red-800">Nestlé · Origen Chile</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-slate-900 sm:text-4xl">Trencito Express</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700">
            El clásico chocolate de leche Trencito en presentación de 24 gramos. Textura suave y sabor dulce tradicional para disfrutar como snack.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="btn-primario" href="/dashboard/productos">Ver catálogo</Link>
            <Link className="btn-secundario" href="/dashboard/productos?nuevo=1">+ Agregar producto</Link>
            <Link className="btn-secundario" href="#ficha-producto">Ficha de producto</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tienda-portada">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.25em] text-slate-500">Panel de administración</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{nombre}</h1>
        <p className="mt-2 text-sm text-slate-600">Gestión de inventario, catálogo público y ventas.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="btn-primario" href="/dashboard/productos">Ver catálogo</Link>
          <Link className="btn-secundario" href="/dashboard/productos?nuevo=1">+ Agregar producto</Link>
        </div>
      </div>
    </section>
  );
}

export function TiendaInformacion({ slug }: { slug: string }) {
  if (slug === "aveli") {
    return (
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section id="guia-tallas" className="tarjeta scroll-mt-20 p-5">
          <h2 className="font-serif text-2xl">Guía de tallas</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="p-2">Talla</th>
                  <th>Busto</th>
                  <th>Cintura</th>
                  <th>Largo</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["XS", "78–83", "60–65"],
                  ["S", "84–88", "66–70"],
                  ["M", "89–93", "71–75"],
                  ["L", "94–100", "76–82"],
                  ["XL", "101–108", "83–90"],
                ].map(([t, b, c]) => (
                  <tr key={t} className="border-t">
                    <th className="p-2">{t}</th>
                    <td>{b} cm</td>
                    <td>{c} cm</td>
                    <td>Según el modelo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Medidas orientativas: pueden variar según modelo, corte y tela. Para mayor precisión, solicita las medidas específicas de la prenda.
          </p>
        </section>
        <section className="tarjeta p-5">
          <h2 className="font-serif text-2xl">Cómo comprar</h2>
          <ol className="mt-4 list-inside list-decimal space-y-3 text-sm">
            {[
              "Elige tu prenda",
              "Selecciona talla y color",
              "Consulta disponibilidad",
              "Realiza tu pedido",
              "Recibe o recoge tu compra",
            ].map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <p className="mt-5 font-serif text-xl">Feminidad · Elegancia · Estilo</p>
        </section>
      </div>
    );
  }

  if (slug === "smaylan") {
    return (
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section id="guia-aplicacion" className="tarjeta scroll-mt-20 p-5">
          <h2 className="font-serif text-xl font-bold text-slate-900">Guía de aplicación cosmética</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-lg bg-rose-50/60 p-3">
              <p className="font-semibold text-rose-900">1. Preparación de la piel</p>
              <p className="text-xs text-rose-800">Limpieza facial profunda con agua tibia previa a la aplicación de mascarillas o bases.</p>
            </div>
            <div className="rounded-lg bg-rose-50/60 p-3">
              <p className="font-semibold text-rose-900">2. Mascarillas de hidrogel</p>
              <p className="text-xs text-rose-800">Dejar actuar entre 15 y 20 minutos. Masajear el suero restante con movimientos ascendentes.</p>
            </div>
            <div className="rounded-lg bg-rose-50/60 p-3">
              <p className="font-semibold text-rose-900">3. Maquillaje y pestañas</p>
              <p className="text-xs text-rose-800">Aplicar máscara desde la raíz con movimiento en zigzag. Cortar tira de pestañas al ancho del párpado si es necesario.</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Productos dermatológicamente testeados. Conservar en lugar fresco y seco, lejos de la luz solar directa.
          </p>
        </section>

        <section className="tarjeta p-5">
          <h2 className="font-serif text-xl font-bold text-slate-900">Protocolo de atención al cliente</h2>
          <ol className="mt-4 list-inside list-decimal space-y-2.5 text-sm text-slate-700">
            <li>Asesoría personalizada sobre tipo de piel y tono de base.</li>
            <li>Confirmación de stock y verificación de lote.</li>
            <li>Empaque protector para evitar roturas en cosméticos líquidos.</li>
            <li>Envío coordinado y seguimiento de entrega.</li>
          </ol>
          <div className="mt-5 rounded-lg border border-rose-200 bg-white p-3 text-xs text-rose-900">
            <span className="font-semibold">Política de cambios:</span> Por higiene y seguridad sanitaria, cosméticos y maquillaje abiertos no admiten cambio salvo defecto de fábrica verificado.
          </div>
        </section>
      </div>
    );
  }

  if (slug === "chocolates-capri") {
    return (
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section id="guia-conservacion" className="tarjeta scroll-mt-20 p-5">
          <h2 className="font-serif text-xl font-bold text-slate-900">Conservación y ficha técnica</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody>
                <tr className="border-t border-slate-100">
                  <th className="py-2.5 text-slate-500">Marca</th>
                  <td className="font-medium text-slate-900">Nestlé – Capri</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <th className="py-2.5 text-slate-500">País de origen</th>
                  <td className="font-medium text-slate-900">Chile</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <th className="py-2.5 text-slate-500">Presentación</th>
                  <td className="font-medium text-slate-900">Barra individual de 30 g</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <th className="py-2.5 text-slate-500">Temperatura óptima</th>
                  <td className="font-medium text-slate-900">16 °C a 20 °C (ambiente fresco)</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <th className="py-2.5 text-slate-500">Humedad relativa</th>
                  <td className="font-medium text-slate-900">Menor a 65% para evitar afloramiento de grasa</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="tarjeta p-5">
          <h2 className="font-serif text-xl font-bold text-slate-900">Gestión de pedidos</h2>
          <ol className="mt-4 list-inside list-decimal space-y-2.5 text-sm text-slate-700">
            <li>Recepción y registro de solicitud por cliente o canal público.</li>
            <li>Validación de sabor solicitado (Frutilla o Almendra).</li>
            <li>Empaque térmico si el despacho es a zonas de alta temperatura.</li>
            <li>Entrega y registro de cobro en efectivo o QR.</li>
          </ol>
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-950">
            <span className="font-semibold">Recomendación comercial:</span> Mantener rotación de inventario con método PEPS (primeras entradas, primeras salidas) para preservar la frescura del relleno.
          </div>
        </section>
      </div>
    );
  }

  if (slug === "trencito") {
    return (
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section id="ficha-producto" className="tarjeta scroll-mt-20 p-5">
          <h2 className="font-serif text-xl font-bold text-slate-900">Ficha técnica del producto</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody>
                <tr className="border-t border-slate-100">
                  <th className="py-2.5 text-slate-500">Nombre del producto</th>
                  <td className="font-medium text-slate-900">Chocolate Trencito</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <th className="py-2.5 text-slate-500">Categoría</th>
                  <td className="font-medium text-slate-900">Snacks y chocolates</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <th className="py-2.5 text-slate-500">Peso neto</th>
                  <td className="font-medium text-slate-900">24 g</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <th className="py-2.5 text-slate-500">Precio unitario</th>
                  <td className="font-medium text-slate-900">Bs 6,00</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <th className="py-2.5 text-slate-500">País de origen</th>
                  <td className="font-medium text-slate-900">Chile</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <th className="py-2.5 text-slate-500">Tienda</th>
                  <td className="font-medium text-slate-900">TrencitoExpress</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="tarjeta p-5">
          <h2 className="font-serif text-xl font-bold text-slate-900">Descripción y consumo</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-700">
            Barra de chocolate de leche Trencito, de 24 g, con un sabor dulce y textura suave, ideal para disfrutar como snack en cualquier momento del día.
          </p>
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50/50 p-3 text-xs text-red-950">
            <span className="font-semibold">Almacenamiento:</span> Mantener en lugar fresco y seco, entre 15 °C y 20 °C, protegido de olores fuertes y luz directa.
          </div>
        </section>
      </div>
    );
  }

  return null;
}

export function TiendaPie({ slug, nombre }: TiendaProps) {
  if (slug === "aveli") {
    return (
      <footer className="aveli-pie">
        <div>
          <p className="font-serif text-3xl">AVÉLI</p>
          <p className="mt-2 text-sm">Viste tu esencia con AVÉLI.</p>
        </div>
        <div className="space-y-1.5 text-sm">
          <p><a href="https://wa.me/59175672963" target="_blank" rel="noreferrer">WhatsApp: 75672963</a></p>
          <p><a href="https://www.instagram.com/aveli.scz/" target="_blank" rel="noreferrer">Instagram: @aveli.scz</a></p>
          <p>Redes sociales: @aveli.bo</p>
          <p><a href="mailto:aveli.unifranz@gmail.com">aveli.unifranz@gmail.com</a></p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-slate-200 bg-white p-6 text-sm text-slate-600">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-serif text-lg font-bold text-slate-900">{nombre}</p>
          <p className="text-xs text-slate-500">Catálogo oficial multi-vendedor</p>
        </div>
        <div className="text-xs text-slate-500">
          <p>Sistema de gestión y catálogo comercial</p>
          <p>Moneda de operación: Bolivianos (BOB)</p>
        </div>
      </div>
    </footer>
  );
}

