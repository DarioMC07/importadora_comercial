import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const fuenteTexto = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const fuenteTitulos = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ImportHub — Marketplace de importadores",
    template: "%s | ImportHub",
  },
  description:
    "Marketplace donde pequeños negocios importadores publican su catálogo: tecnología, hogar, juguetes, herramientas y más.",
  openGraph: {
    type: "website",
    locale: "es_BO",
    siteName: "ImportHub",
    title: "ImportHub — Marketplace de importadores",
    description: "Productos importados de vendedores locales verificados.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#393c23",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-BO" className={`${fuenteTexto.variable} ${fuenteTitulos.variable}`}>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
