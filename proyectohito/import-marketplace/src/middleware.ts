import { type NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  matcher: [
    // Todo excepto estáticos e imágenes públicas.
    "/((?!_next/static|_next/image|favicon.ico|placeholder.svg|sitemap.xml|robots.txt).*)",
  ],
};
