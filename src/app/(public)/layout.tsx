import { HeaderPublico, FooterPublico } from "@/components/marketplace/header";
import { CarritoProvider } from "@/components/marketplace/carrito-provider";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <CarritoProvider>
      <HeaderPublico />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <FooterPublico />
    </CarritoProvider>
  );
}
