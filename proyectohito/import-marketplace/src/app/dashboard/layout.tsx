import { requerirVendedor } from "@/lib/auth";
import { BarraLateral } from "@/components/dashboard/barra-lateral";
import { cerrarSesion } from "@/server/actions/auth";
import { AveliPie } from "@/components/dashboard/aveli";

export default async function LayoutDashboard({ children }: { children: React.ReactNode }) {
  const sesion = await requerirVendedor();
  const esAveli = sesion.workspaceSlug === "aveli";

  return (
    <div className={`flex min-h-screen flex-1 bg-slate-100 ${esAveli ? "aveli-panel" : ""}`}>
      <BarraLateral nombreEspacio={sesion.workspaceNombre} nombreUsuario={sesion.nombreCompleto} esAveli={esAveli} />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-500">Espacio de trabajo</p>
            <p className="truncate font-semibold text-slate-900">{sesion.workspaceNombre}</p>
          </div>
          <form action={cerrarSesion}>
            <button type="submit" className="btn-secundario">
              Cerrar sesión
            </button>
          </form>
        </header>
        <main id="contenido" className="flex-1 p-4 sm:p-6">
          {children}
        </main>
        {esAveli && <AveliPie />}
      </div>
    </div>
  );
}
