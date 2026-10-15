import { describe, expect, it } from "vitest";
import { dividirPorVendedor, itemsParaSolicitud, totalCarrito, type ItemCarrito } from "@/lib/cart";

const items: ItemCarrito[] = [
  { productId: "p1", slug: "auriculares", nombre: "Auriculares", precio: 89.9, cantidad: 2, sellerId: "v1", sellerNombre: "Andes Import", disponibilidad: "DISPONIBLE" },
  { productId: "p2", slug: "lampara", nombre: "Lámpara", precio: 79, cantidad: 1, sellerId: "v2", sellerNombre: "Paceña Home", disponibilidad: "DISPONIBLE" },
  { productId: "p3", slug: "powerbank", nombre: "Power Bank", precio: 120, cantidad: 1, sellerId: "v1", sellerNombre: "Andes Import", disponibilidad: "POCAS_UNIDADES" },
];

describe("división del carrito por vendedor", () => {
  it("genera un grupo independiente por vendedor", () => {
    const grupos = dividirPorVendedor(items);
    expect(grupos).toHaveLength(2);
    const andes = grupos.find((g) => g.sellerId === "v1");
    const pacena = grupos.find((g) => g.sellerId === "v2");
    expect(andes?.items).toHaveLength(2);
    expect(pacena?.items).toHaveLength(1);
    // Ningún grupo contiene items del otro vendedor.
    expect(andes?.items.every((i) => i.sellerId === "v1")).toBe(true);
    expect(pacena?.items.every((i) => i.sellerId === "v2")).toBe(true);
  });

  it("calcula totales por grupo sin errores de float", () => {
    const grupos = dividirPorVendedor(items);
    const andes = grupos.find((g) => g.sellerId === "v1");
    expect(andes?.total).toBeCloseTo(2 * 89.9 + 120, 2);
  });

  it("el total del carrito es exacto en centavos", () => {
    expect(totalCarrito(items)).toBeCloseTo(2 * 89.9 + 79 + 120, 2);
  });

  it("serializa solo IDs y cantidades para el RPC (sin datos sensibles)", () => {
    const payload = itemsParaSolicitud(items);
    expect(payload[0]).toEqual({ product_id: "p1", quantity: 2 });
    expect(payload.every((p) => Object.keys(p).sort().join(",") === "product_id,quantity")).toBe(true);
  });
});
