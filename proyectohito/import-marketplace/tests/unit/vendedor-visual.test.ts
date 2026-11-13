import { describe, expect, it } from "vitest";
import { colorVendedor, inicialesVendedor } from "@/lib/vendedor-visual";

describe("colorVendedor", () => {
  it("devuelve siempre el mismo color para el mismo vendedor", () => {
    expect(colorVendedor("andes-import")).toBe(colorVendedor("andes-import"));
  });

  it("usa el color de marca cuando la tienda tiene uno", () => {
    expect(colorVendedor("aveli")).toBe("#541520");
  });

  it("devuelve un color hexadecimal para cualquier slug, incluso vacío", () => {
    for (const slug of [
      "",
      "x",
      "pacena-home",
      "chaco-tools",
      "altiplano-kids",
    ]) {
      expect(colorVendedor(slug)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("inicialesVendedor", () => {
  it("toma la inicial de las dos primeras palabras", () => {
    expect(inicialesVendedor("Andes Import")).toBe("AI");
  });

  it("toma dos letras cuando el nombre tiene una sola palabra", () => {
    expect(inicialesVendedor("smaylan")).toBe("SM");
  });

  it("no falla con un nombre vacío", () => {
    expect(inicialesVendedor("  ")).toBe("");
  });
});
