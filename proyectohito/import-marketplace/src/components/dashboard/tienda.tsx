import Link from "next/link";
import { obtenerMarca } from "./marcas";

interface TiendaProps {
  slug: string;
  nombre: string;
}

function Acciones() {
  return (
    <>
      <Link className="btn-primario" href="/dashboard/ventas">
        Registrar venta
      </Link>
      <Link className="btn-secundario" href="/dashboard/productos?nuevo=1">
        + Agregar producto
      </Link>
      <Link className="btn-secundario" href="/dashboard/importaciones">
        Registrar importación
      </Link>
    </>
  );
}

export function TiendaBienvenida({ slug, nombre }: TiendaProps) {
  const marca = obtenerMarca(slug);

  if (marca) {
    return (
      <section className="flex flex-col gap-5 rounded-2xl border border-brand-200 bg-brand-50 p-5 sm:flex-row sm:items-center sm:p-6">
        {marca.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={marca.logo}
            alt=""
            width={96}
            height={96}
            className="h-20 w-20 shrink-0 rounded-full object-contain sm:h-24 sm:w-24"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-800 font-display text-3xl font-semibold text-lima sm:h-24 sm:w-24"
          >
            {marca.iniciales}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-brand-700">{marca.lema}</p>
          <h1 className="titulo-pagina mt-1 text-brand-900">{marca.nombre}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700">
            {marca.descripcion}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Acciones />
            <Link
              className="px-2 text-sm font-semibold text-brand-700 underline underline-offset-4"
              href={marca.guia.href}
            >
              {marca.guia.etiqueta}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="titulo-pagina">{nombre}</h1>
        <p className="mt-2 text-sm text-slate-600">Lo pendiente de hoy y cómo van tus ventas.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Acciones />
      </div>
    </section>
  );
}

export function TiendaInformacion({ slug }: { slug: string }) {
  if (slug === "aveli") {
    return (
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section id="guia-tallas" className="tarjeta scroll-mt-20 p-5">
          <h2 className="font-display text-xl font-semibold text-slate-900">Guía de tallas</h2>
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
          <h2 className="font-display text-xl font-semibold text-slate-900">Cómo comprar</h2>
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
          <p className="mt-5 font-display text-xl text-brand-800">Feminidad, elegancia y estilo</p>
        </section>
      </div>
    );
  }

  if (slug === "smaylan") {
    return (
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section id="guia-aplicacion" className="tarjeta scroll-mt-20 p-5">
          <h2 className="font-display text-xl font-semibold text-slate-900">Guía de aplicación cosmética</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-xl bg-brand-50 p-3">
              <p className="font-semibold text-brand-900">1. Preparación de la piel</p>
              <p className="text-xs text-brand-800">Limpieza facial profunda con agua tibia previa a la aplicación de mascarillas o bases.</p>
            </div>
            <div className="rounded-xl bg-brand-50 p-3">
              <p className="font-semibold text-brand-900">2. Mascarillas de hidrogel</p>
              <p className="text-xs text-brand-800">Dejar actuar entre 15 y 20 minutos. Masajear el suero restante con movimientos ascendentes.</p>
            </div>
            <div className="rounded-xl bg-brand-50 p-3">
              <p className="font-semibold text-brand-900">3. Maquillaje y pestañas</p>
              <p className="text-xs text-brand-800">Aplicar máscara desde la raíz con movimiento en zigzag. Cortar tira de pestañas al ancho del párpado si es necesario.</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Productos dermatológicamente testeados. Conservar en lugar fresco y seco, lejos de la luz solar directa.
          </p>
        </section>

        <section className="tarjeta p-5">
          <h2 className="font-display text-xl font-semibold text-slate-900">Protocolo de atención al cliente</h2>
          <ol className="mt-4 list-inside list-decimal space-y-2.5 text-sm text-slate-700">
            <li>Asesoría personalizada sobre tipo de piel y tono de base.</li>
            <li>Confirmación de stock y verificación de lote.</li>
            <li>Empaque protector para evitar roturas en cosméticos líquidos.</li>
            <li>Envío coordinado y seguimiento de entrega.</li>
          </ol>
          <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs text-brand-900">
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
          <h2 className="font-display text-xl font-semibold text-slate-900">Conservación y ficha técnica</h2>
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
          <h2 className="font-display text-xl font-semibold text-slate-900">Gestión de pedidos</h2>
          <ol className="mt-4 list-inside list-decimal space-y-2.5 text-sm text-slate-700">
            <li>Recepción y registro de solicitud por cliente o canal público.</li>
            <li>Validación de sabor solicitado (Frutilla o Almendra).</li>
            <li>Empaque térmico si el despacho es a zonas de alta temperatura.</li>
            <li>Entrega y registro de cobro en efectivo o QR.</li>
          </ol>
          <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs text-brand-900">
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
          <h2 className="font-display text-xl font-semibold text-slate-900">Ficha técnica del producto</h2>
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
          <h2 className="font-display text-xl font-semibold text-slate-900">Descripción y consumo</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-700">
            Barra de chocolate de leche Trencito, de 24 g, con un sabor dulce y textura suave, ideal para disfrutar como snack en cualquier momento del día.
          </p>
          <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs text-brand-900">
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
      <footer className="flex flex-wrap justify-between gap-8 bg-brand-900 p-8 text-brand-100 [&_a:hover]:underline">
        <div>
          <p className="font-display text-3xl text-white">AVÉLI</p>
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
    <footer className="border-t border-slate-200 p-6 text-sm text-slate-600 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-slate-900">{nombre}</p>
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

