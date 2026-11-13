import { describe, expect, it } from "vitest";
import {
  aCentavos,
  aDecimal,
  costoPuestoEnAlmacen,
  resumirVentas,
} from "@/lib/money";

describe("conversión de dinero sin floats", () => {
  it("convierte decimales a centavos enteros", () => {
    expect(aCentavos("89.90")).toBe(8990);
    expect(aCentavos("0.01")).toBe(1);
    expect(aCentavos(120)).toBe(12000);
    expect(aCentavos("1234.56")).toBe(123456);
  });

  it("redondea el tercer decimal (half-up) sin perder precisión", () => {
    expect(aCentavos("10.005")).toBe(1001);
    expect(aCentavos("10.004")).toBe(1000);
  });

  it("evita los errores clásicos de punto flotante", () => {
    // 0.1 + 0.2 en floats = 0.30000000000000004; aquí es exacto.
    expect(aCentavos("0.1") + aCentavos("0.2")).toBe(30);
    expect(aDecimal(aCentavos("0.1") + aCentavos("0.2"))).toBe(0.3);
  });

  it("rechaza montos inválidos", () => {
    expect(() => aCentavos("abc")).toThrow();
    expect(() => aCentavos("10.5.1")).toThrow();
    expect(() => aCentavos("")).toThrow();
  });
});

describe("costo puesto en almacén (landed unit cost)", () => {
  it("suma base + transporte + aranceles + otros", () => {
    const landed = costoPuestoEnAlmacen({
      base: "45.00",
      transporte: "6.00",
      aranceles: "4.50",
      otros: "1.00",
    });
    expect(aDecimal(landed)).toBe(56.5);
  });

  it("maneja componentes en cero", () => {
    expect(aDecimal(costoPuestoEnAlmacen({ base: 100, transporte: 0, aranceles: 0, otros: 0 }))).toBe(100);
  });
});

describe("resumen de ventas (fórmulas de reportes)", () => {
  const ventas = [
    {
      descuento: "20.00",
      items: [
        { cantidad: 2, precioUnitario: "89.90", costoBase: "45.00", costoPuesto: "56.50" },
        { cantidad: 1, precioUnitario: "120.00", costoBase: "55.00", costoPuesto: "68.00" },
      ],
    },
    {
      descuento: "0",
      items: [
        { cantidad: 3, precioUnitario: "49.00", costoBase: "20.00", costoPuesto: "25.00" },
      ],
    },
  ];

  it("ingresos = suma(precio × cantidad) − descuentos", () => {
    const r = resumirVentas(ventas);
    // (2×89.90 + 120 + 3×49) − 20 = 426.80
    expect(aDecimal(r.ingresos)).toBeCloseTo(426.8, 2);
  });

  it("costo base vendido usa snapshots, no el costo actual", () => {
    const r = resumirVentas(ventas);
    // 2×45 + 55 + 3×20 = 205
    expect(aDecimal(r.costoBaseVendido)).toBe(205);
  });

  it("costo puesto vendido usa landed snapshot", () => {
    const r = resumirVentas(ventas);
    // 2×56.50 + 68 + 3×25 = 256
    expect(aDecimal(r.costoPuestoVendido)).toBe(256);
  });

  it("ganancias derivadas de las fórmulas oficiales", () => {
    const r = resumirVentas(ventas);
    expect(aDecimal(r.gananciaBruta)).toBeCloseTo(426.8 - 205, 2);
    expect(aDecimal(r.gananciaNetaEstimada)).toBeCloseTo(426.8 - 256, 2);
    expect(r.unidades).toBe(6);
  });

  it("cambiar el costo actual del producto no altera ventas históricas", () => {
    const antes = resumirVentas(ventas);
    // El producto sube de costo DESPUÉS de la venta: los snapshots no cambian.
    const despues = resumirVentas(ventas);
    expect(despues.gananciaNetaEstimada).toBe(antes.gananciaNetaEstimada);
  });
});
