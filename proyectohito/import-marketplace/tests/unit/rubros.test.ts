import { describe, expect, it } from "vitest";
import {
  CAMPOS_POR_RUBRO,
  RUBROS,
  atributosPublicos,
  limpiarAtributos,
  normalizarAtributos,
  rubroMasUsado,
  validarAtributos,
} from "@/lib/rubros";

describe("rubros y atributos", () => {
  it("CAMPOS_POR_RUBRO tiene una entrada por cada valor de RUBROS y GENERAL no tiene campos", () => {
    for (const r of RUBROS) {
      expect(CAMPOS_POR_RUBRO[r]).toBeDefined();
    }
    expect(CAMPOS_POR_RUBRO.GENERAL).toHaveLength(0);
  });

  it("rubroMasUsado devuelve el rubro más frecuente o GENERAL si no hay conocidos", () => {
    expect(rubroMasUsado(["MODA", "MODA", "ALIMENTOS"])).toBe("MODA");
    expect(rubroMasUsado([])).toBe("GENERAL");
    expect(rubroMasUsado([undefined, "x"])).toBe("GENERAL");
  });

  it("validarAtributos reporta campos obligatorios faltantes", () => {
    expect(validarAtributos("MODA", {})).toEqual([
      { clave: "talla", mensaje: "Falta completar: Talla." },
    ]);
  });

  it("validarAtributos rechaza fecha inválida, opción fuera de lista y exceso de caracteres; acepta datos válidos", () => {
    const errFecha = validarAtributos("ALIMENTOS", {
      peso_neto: "100 g",
      fecha_vencimiento: "2026-02-31",
    });
    expect(errFecha).toEqual([
      { clave: "fecha_vencimiento", mensaje: "Fecha de vencimiento: fecha inválida." },
    ]);

    const errOpcion = validarAtributos("MODA", {
      talla: "M",
      genero: "Otro",
    });
    expect(errOpcion).toEqual([
      { clave: "genero", mensaje: "Género: elige una opción de la lista." },
    ]);

    const errLargo = validarAtributos("ALIMENTOS", {
      peso_neto: "a".repeat(41),
    });
    expect(errLargo).toEqual([
      { clave: "peso_neto", mensaje: "Peso neto: máximo 40 caracteres." },
    ]);

    const validos = validarAtributos("ALIMENTOS", {
      peso_neto: "100 g",
      fecha_vencimiento: "2027-03-15",
    });
    expect(validos).toEqual([]);
  });

  it("limpiarAtributos conserva solo campos del rubro con contenido no vacío y recortado", () => {
    expect(limpiarAtributos("MODA", { talla: " M ", color: "", marca: "X" })).toEqual({
      talla: "M",
    });
  });

  it("normalizarAtributos limpia entradas no válidas y conserva solo textos", () => {
    expect(normalizarAtributos(null)).toEqual({});
    expect(normalizarAtributos(["a", "b"])).toEqual({});
    expect(normalizarAtributos("texto")).toEqual({});
    expect(normalizarAtributos({ a: "texto", b: 123, c: null })).toEqual({ a: "texto" });
  });

  it("atributosPublicos devuelve solo campos conocidos formateados y descarta rubros desconocidos", () => {
    expect(
      atributosPublicos("ALIMENTOS", {
        peso_neto: "100 g",
        fecha_vencimiento: "2027-03-15",
        base_cost: "9",
      }),
    ).toEqual([
      { clave: "peso_neto", etiqueta: "Peso neto", valor: "100 g", largo: false },
      { clave: "fecha_vencimiento", etiqueta: "Fecha de vencimiento", valor: "15/03/2027", largo: false },
    ]);

    expect(atributosPublicos("INVENTADO", { algo: "valor" })).toEqual([]);
  });
});
