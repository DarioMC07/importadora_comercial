import { describe, expect, it } from "vitest";
import {
  filtroCatalogoSchema,
  loginSchema,
  montoSchema,
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
