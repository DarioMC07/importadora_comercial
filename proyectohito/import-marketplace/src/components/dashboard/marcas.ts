// Identidad de las tiendas con panel personalizado. El color de cada una
// está en globals.css, bajo la clase indicada en `clasePanel`.
export interface Marca {
  clasePanel: string;
  nombre: string;
  lema: string;
  descripcion: string;
  iniciales: string;
  logo?: string;
  guia: { href: string; etiqueta: string };
}

const marcas: Record<string, Marca> = {
  aveli: {
    clasePanel: "aveli-panel",
    nombre: "AVÉLI",
    lema: "Tu colección, tu esencia",
    descripcion: "Blusas y poleras. Descubre tu estilo, expresa tu esencia.",
    iniciales: "AV",
    logo: "/aveli/logo.png",
    guia: { href: "#guia-tallas", etiqueta: "Guía de tallas" },
  },
  smaylan: {
    clasePanel: "smaylan-panel",
    nombre: "Smaylan",
    lema: "Cuidado facial y maquillaje",
    descripcion:
      "Cosmética especializada y maquillaje de alto rendimiento, con fórmulas que realzan la belleza natural.",
    iniciales: "SM",
    guia: { href: "#guia-aplicacion", etiqueta: "Guía de aplicación" },
  },
  "chocolates-capri": {
    clasePanel: "capri-panel",
    nombre: "Chocolates Capri",
    lema: "Nestlé Capri, origen Chile",
    descripcion:
      "Barras de chocolate rellenas de 30 gramos, con rellenos frutales y de frutos secos.",
    iniciales: "CP",
    guia: { href: "#guia-conservacion", etiqueta: "Conservación y ficha" },
  },
  trencito: {
    clasePanel: "trencito-panel",
    nombre: "Trencito Express",
    lema: "Nestlé, origen Chile",
    descripcion:
      "El clásico chocolate de leche Trencito de 24 gramos, de textura suave y sabor tradicional.",
    iniciales: "TR",
    guia: { href: "#ficha-producto", etiqueta: "Ficha de producto" },
  },
};

export function obtenerMarca(slug: string): Marca | undefined {
  return marcas[slug];
}
