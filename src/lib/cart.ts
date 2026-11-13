/**
 * División del carrito por vendedor: cada vendedor recibe una solicitud
 * independiente y solo ve su parte.
 */
export interface ItemCarrito {
  productId: string;
  slug: string;
  nombre: string;
  precio: number; // decimal BOB (precio público)
  cantidad: number;
  sellerId: string;
  sellerNombre: string;
  disponibilidad: "DISPONIBLE" | "POCAS_UNIDADES" | "AGOTADO";
  imagen?: string;
}

export interface GrupoVendedor {
  sellerId: string;
  sellerNombre: string;
  items: ItemCarrito[];
  total: number;
}

export function dividirPorVendedor(items: ItemCarrito[]): GrupoVendedor[] {
  const grupos = new Map<string, GrupoVendedor>();
  for (const item of items) {
    let grupo = grupos.get(item.sellerId);
    if (!grupo) {
      grupo = { sellerId: item.sellerId, sellerNombre: item.sellerNombre, items: [], total: 0 };
      grupos.set(item.sellerId, grupo);
    }
    grupo.items.push(item);
    // Enteros en centavos para el total del grupo (sin floats).
    grupo.total = Math.round((grupo.total + item.precio * item.cantidad) * 100) / 100;
  }
  return [...grupos.values()].sort((a, b) => a.sellerNombre.localeCompare(b.sellerNombre, "es"));
}

export function totalCarrito(items: ItemCarrito[]): number {
  const centavos = items.reduce((acc, i) => acc + Math.round(i.precio * 100) * i.cantidad, 0);
  return centavos / 100;
}

export function cantidadTotal(items: ItemCarrito[]): number {
  return items.reduce((acc, i) => acc + i.cantidad, 0);
}

/** Serializa el carrito para la función RPC (solo IDs y cantidades). */
export function itemsParaSolicitud(items: ItemCarrito[]): { product_id: string; quantity: number }[] {
  return items.map((i) => ({ product_id: i.productId, quantity: i.cantidad }));
}
