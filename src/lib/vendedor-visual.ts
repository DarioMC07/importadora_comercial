// Identidad visual de un vendedor en la tienda pública: color e iniciales.
// Se calcula a partir del slug, así el mismo vendedor se ve igual en todas las páginas.

// Tiendas con marca propia: el color coincide con el tema de su panel.
const COLORES_MARCA: Record<string, string> = {
  aveli: "#541520",
  smaylan: "#b82f5b",
  "chocolates-capri": "#835630",
  trencito: "#c22e25",
};

// Tonos con contraste suficiente para texto blanco.
const PALETA = [
  "#3f6b6b",
  "#3b5b8c",
  "#5f6432",
  "#6b4c8a",
  "#a33c6a",
  "#555a66",
  "#9a5a1c",
  "#2f6f4f",
] as const;

export function colorVendedor(slug: string): string {
  const deMarca = COLORES_MARCA[slug];
  if (deMarca) return deMarca;
  let suma = 0;
  for (const letra of slug) suma = (suma * 31 + letra.charCodeAt(0)) % 65521;
  return PALETA[suma % PALETA.length] ?? PALETA[0];
}

export function inicialesVendedor(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  const [primera = "", segunda = ""] = palabras;
  const letras = segunda
    ? primera.charAt(0) + segunda.charAt(0)
    : primera.slice(0, 2);
  return letras.toUpperCase();
}
