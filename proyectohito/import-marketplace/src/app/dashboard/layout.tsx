import { requerirVendedor } from "@/lib/auth";
import { BarraLateral } from "@/components/dashboard/barra-lateral";
import { cerrarSesion } from "@/server/actions/auth";
import { contarSolicitudesPendientes } from "@/lib/queries/dashboard";
import { TiendaPie } from "@/components/dashboard/tienda";
import { obtenerMarca } from "@/components/dashboard/marcas";

export default async function LayoutDashboard({ children }: { children: React.ReactNode }) {
  const sesion = await requerirVendedor();
  const solicitudesPendientes = await contarSolicitudesPendientes();
  const panelClass = obtenerMarca(sesion.workspaceSlug)?.clasePanel ?? "";

  return (
    <div className={`flex min-h-screen flex-1 bg-slate-50 ${panelClass}`}>
      <BarraLateral
        nombreEspacio={sesion.workspaceNombre}
        nombreUsuario={sesion.nombreCompleto}
        workspaceSlug={sesion.workspaceSlug}
        solicitudesPendientes={solicitudesPendientes}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/90 pl-16 pr-4 backdrop-blur sm:pr-6 lg:pl-8">
          <p className="min-w-0 truncate font-display text-lg font-semibold tracking-tight text-slate-900">
            {sesion.workspaceNombre}
          </p>
          <form action={cerrarSesion}>
            <button type="submit" className="btn-secundario">
              Cerrar sesión
            </button>
          </form>
        </header>
        <main id="contenido" className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <TiendaPie slug={sesion.workspaceSlug} nombre={sesion.workspaceNombre} />
      </div>
    </div>
  );
}
