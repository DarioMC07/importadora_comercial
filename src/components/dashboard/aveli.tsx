import Link from "next/link";

export function AveliBienvenida() {
  return <section className="aveli-portada">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/aveli/logo.png" alt="Logotipo oficial de AVÉLI" width={160} height={160} />
    <div><p className="text-xs uppercase tracking-[.3em]">Tu colección, tu esencia</p>
      <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Bienvenida a AVÉLI</h1>
      <p className="mt-3">Descubre tu estilo, expresa tu esencia.</p>
      <div className="mt-5 flex flex-wrap gap-3"><Link className="btn-primario" href="/dashboard/productos">Ver colección</Link><Link className="btn-secundario" href="/dashboard/productos?nuevo=1">+ Agregar producto</Link><Link className="btn-secundario" href="#guia-tallas">Guía de tallas</Link></div>
    </div>
  </section>;
}

export function AveliInformacion() {
  return <div className="mt-8 grid gap-6 xl:grid-cols-2">
    <section id="guia-tallas" className="tarjeta scroll-mt-20 p-5">
      <h2 className="font-serif text-2xl">Guía de tallas</h2>
      <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Talla</th><th>Busto</th><th>Cintura</th><th>Largo</th></tr></thead><tbody>
        {[["XS","78–83","60–65"],["S","84–88","66–70"],["M","89–93","71–75"],["L","94–100","76–82"],["XL","101–108","83–90"]].map(([t,b,c])=><tr key={t} className="border-t"><th className="p-2">{t}</th><td>{b} cm</td><td>{c} cm</td><td>Según el modelo</td></tr>)}
      </tbody></table></div>
      <p className="mt-4 text-sm">Medidas orientativas: pueden variar según modelo, corte y tela. Para mayor precisión, solicita las medidas específicas de la prenda.</p>
    </section>
    <section className="tarjeta p-5"><h2 className="font-serif text-2xl">Cómo comprar</h2>
      <ol className="mt-4 list-inside list-decimal space-y-3">{["Elige tu prenda","Selecciona talla y color","Consulta disponibilidad","Realiza tu pedido","Recibe o recoge tu compra"].map(t=><li key={t}>{t}</li>)}</ol>
      <p className="mt-5 font-serif text-xl">Feminidad · Elegancia · Estilo</p>
    </section>
  </div>;
}

export function AveliPie() {
  return <footer className="aveli-pie">
    <div><p className="font-serif text-3xl">AVÉLI</p><p className="mt-2">Viste tu esencia con AVÉLI.</p></div>
    <div className="space-y-2 text-sm"><p><a href="https://wa.me/59175672963" target="_blank" rel="noreferrer">WhatsApp: 75672963</a></p><p><a href="https://www.instagram.com/aveli.scz/" target="_blank" rel="noreferrer">Instagram: @aveli.scz</a></p><p>Redes sociales: @aveli.bo</p><p><a href="mailto:aveli.unifranz@gmail.com">aveli.unifranz@gmail.com</a></p></div>
  </footer>;
}
