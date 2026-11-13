import { describe, expect, it } from "vitest";
import {
  filtroCatalogoSchema,
  loginSchema,
  montoSchema,
  productoSchema,
  solicitudPublicaSchema,
} from "@/lib/validators";

/**
 * Espejo en TS de la función SQL availability_of (ver 0002_functions.sql).
 * El estado público jamás revela el stock exacto.
 */
function disponibilidadPublica(stock: number, minStock: number) {
  if (stock <= 0) return "AGOTADO";
  if (stock <= Math.max(minStock, 3)) return "POCAS_UNIDADES";
  return "DISPONIBLE";
}

describe("disponibilidad pública", () => {
  it("stock cero → AGOTADO", () => {
    expect(disponibilidadPublica(0, 5)).toBe("AGOTADO");
  });
  it("stock en o bajo el mínimo → POCAS_UNIDADES", () => {
    expect(disponibilidadPublica(4, 5)).toBe("POCAS_UNIDADES");
    expect(disponibilidadPublica(5, 5)).toBe("POCAS_UNIDADES");
  });
  it("stock sano → DISPONIBLE", () => {
    expect(disponibilidadPublica(25, 5)).toBe("DISPONIBLE");
  });
  it("sin mínimo definido usa umbral 3", () => {
    expect(disponibilidadPublica(2, 0)).toBe("POCAS_UNIDADES");
    expect(disponibilidadPublica(10, 0)).toBe("DISPONIBLE");
  });
});

describe("validadores", () => {
  it("login exige correo válido y contraseña mínima", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "12345678" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "no-es-correo", password: "12345678" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.com", password: "corta" }).success).toBe(false);
  });

  it("montoSchema acepta coma decimal y limita a 2 decimales", () => {
    expect(montoSchema.safeParse("45,50").success).toBe(true);
    expect(montoSchema.safeParse("45.5").success).toBe(true);
    expect(montoSchema.safeParse("45.555").success).toBe(false);
    expect(montoSchema.safeParse("-10").success).toBe(false);
  });

  it("solicitud pública exige consentimiento y rechaza campos extra", () => {
    const base = {
      customer: { name: "Ana", phone: "70011223", consent: true },
      items: [{ product_id: "33333333-0000-4000-8000-000000000001", quantity: 1 }],
    };
    expect(solicitudPublicaSchema.safeParse(base).success).toBe(true);
    expect(
      solicitudPublicaSchema.safeParse({
        ...base,
        customer: { ...base.customer, consent: false },
      }).success,
    ).toBe(false);
    // Campo inesperado (ej. workspace_id inyectado) → rechazado por .strict()
    expect(
      solicitudPublicaSchema.safeParse({ ...base, workspace_id: "inyeccion" }).success,
    ).toBe(false);
  });

  it("filtros de catálogo con valores por defecto seguros", () => {
    const f = filtroCatalogoSchema.parse({});
    expect(f.pagina).toBe(1);
    expect(f.orden).toBe("relevancia");
  });
});

describe("productoSchema", () => {
  const baseProducto = {
    sku: "P-1",
    name: "Producto",
    category: "Varios",
    base_cost: "0",
    sale_price: "10",
    freight_alloc: "0",
    duty_alloc: "0",
    other_alloc: "0",
    min_stock: 0,
  };

  it("acepta un producto base sin rubro ni attributes y asigna valores por defecto", () => {
    const res = productoSchema.safeParse(baseProducto);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.rubro).toBe("GENERAL");
      expect(res.data.attributes).toEqual({});
    }
  });

  it("rechaza rubro MODA sin talla con path ['attributes', 'talla'] y lo acepta con talla", () => {
    const sinTalla = productoSchema.safeParse({ ...baseProducto, rubro: "MODA" });
    expect(sinTalla.success).toBe(false);
    if (!sinTalla.success) {
      const issue = sinTalla.error.issues.find((i) => i.path.join(".") === "attributes.talla");
      expect(issue).toBeDefined();
      expect(issue?.message).toBe("Falta completar: Talla.");
    }

    const conTalla = productoSchema.safeParse({
      ...baseProducto,
      rubro: "MODA",
      attributes: { talla: "M" },
    });
    expect(conTalla.success).toBe(true);
  });

  it("rechaza rubro INVENTADO con 'Rubro inválido' y rechaza campos desconocidos en la raíz por .strict()", () => {
    const rubroInvalido = productoSchema.safeParse({ ...baseProducto, rubro: "INVENTADO" });
    expect(rubroInvalido.success).toBe(false);
    if (!rubroInvalido.success) {
      const issue = rubroInvalido.error.issues.find((i) => i.path.includes("rubro"));
      expect(issue?.message).toBe("Rubro inválido");
    }

    const campoDesconocido = productoSchema.safeParse({ ...baseProducto, campo_extra: "inyeccion" });
    expect(campoDesconocido.success).toBe(false);
  });

  it("devuelve mensajes en español para min_stock negativo, origin_country de 1 letra y unit vacía", () => {
    const resMinStock = productoSchema.safeParse({ ...baseProducto, min_stock: -1 });
    expect(resMinStock.success).toBe(false);
    if (!resMinStock.success) {
      const issue = resMinStock.error.issues.find((i) => i.path.includes("min_stock"));
      expect(issue?.message).toBe("No puede ser negativo");
    }

    const resPais = productoSchema.safeParse({ ...baseProducto, origin_country: "B" });
    expect(resPais.success).toBe(false);
    if (!resPais.success) {
      const issue = resPais.error.issues.find((i) => i.path.includes("origin_country"));
      expect(issue?.message).toBe("Mínimo 2 letras");
    }

    const resUnidad = productoSchema.safeParse({ ...baseProducto, unit: "" });
    expect(resUnidad.success).toBe(false);
    if (!resUnidad.success) {
      const issue = resUnidad.error.issues.find((i) => i.path.includes("unit"));
      expect(issue?.message).toBe("Unidad requerida");
    }
  });
});
