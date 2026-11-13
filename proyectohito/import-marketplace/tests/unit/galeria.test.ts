import { describe, expect, it } from "vitest";
import {
  MAX_IMAGENES,
  imagenesIniciales,
  moverImagen,
  ponerPortada,
  quitarImagen,
  rutaDeStorage,
  validarArchivoImagen,
  type FilaImagen,
} from "@/lib/galeria";

describe("galería de imágenes", () => {
  it("MAX_IMAGENES es 8", () => {
    expect(MAX_IMAGENES).toBe(8);
  });

  it("validarArchivoImagen valida formato, tamaño y archivos vacíos", () => {
    expect(validarArchivoImagen({ type: "image/png", size: 1000 })).toBeNull();
    expect(validarArchivoImagen({ type: "image/gif", size: 1000 })).toBe(
      "Solo se aceptan imágenes JPG, PNG o WebP.",
    );
    expect(validarArchivoImagen({ type: "image/jpeg", size: 0 })).toBe(
      "El archivo está vacío.",
    );
    expect(validarArchivoImagen({ type: "image/jpeg", size: 2097153 })).toBe(
      "La imagen supera los 2 MB.",
    );
    expect(validarArchivoImagen({ type: "image/webp", size: 2097152 })).toBeNull();
  });

  it("moverImagen reordena elementos sin mutar el arreglo original e ignora índices fuera de rango", () => {
    const original = ["a", "b", "c"];
    const reordenado = moverImagen(original, 2, 0);
    expect(reordenado).toEqual(["c", "a", "b"]);
    expect(original).toEqual(["a", "b", "c"]);

    expect(moverImagen(original, -1, 1)).toEqual(["a", "b", "c"]);
    expect(moverImagen(original, 1, 5)).toEqual(["a", "b", "c"]);
    expect(moverImagen(original, 1, 1)).toEqual(["a", "b", "c"]);
  });

  it("ponerPortada mueve el elemento indicado al primer lugar", () => {
    expect(ponerPortada(["a", "b", "c"], 1)).toEqual(["b", "a", "c"]);
  });

  it("quitarImagen elimina el elemento en el índice indicado", () => {
    expect(quitarImagen(["a", "b", "c"], 1)).toEqual(["a", "c"]);
  });

  it("imagenesIniciales ordena las filas por position y asigna los campos esperados", () => {
    const filas: FilaImagen[] = [
      {
        storage_path: "ws/p2.png",
        public_url: "http://127.0.0.1:54321/storage/v1/object/public/product-images/ws/p2.png",
        position: 1,
      },
      {
        storage_path: "ws/p1.png",
        public_url: "http://127.0.0.1:54321/storage/v1/object/public/product-images/ws/p1.png",
        position: 0,
      },
    ];

    const resultado = imagenesIniciales(filas, null);
    expect(resultado).toHaveLength(2);
    expect(resultado[0]).toEqual({
      clave: "ws/p1.png",
      vistaPrevia: "http://127.0.0.1:54321/storage/v1/object/public/product-images/ws/p1.png",
      nombre: "Imagen guardada",
      storage_path: "ws/p1.png",
      public_url: "http://127.0.0.1:54321/storage/v1/object/public/product-images/ws/p1.png",
    });
    expect(resultado[1]).toEqual({
      clave: "ws/p2.png",
      vistaPrevia: "http://127.0.0.1:54321/storage/v1/object/public/product-images/ws/p2.png",
      nombre: "Imagen guardada",
      storage_path: "ws/p2.png",
      public_url: "http://127.0.0.1:54321/storage/v1/object/public/product-images/ws/p2.png",
    });
  });

  it("imagenesIniciales maneja fotos heredadas y URLs de storage", () => {
    const heredada = imagenesIniciales([], "/aveli/AV-BL001.png");
    expect(heredada).toEqual([
      {
        clave: "/aveli/AV-BL001.png",
        vistaPrevia: "/aveli/AV-BL001.png",
        nombre: "Foto actual",
        storage_path: "/aveli/AV-BL001.png",
        public_url: "/aveli/AV-BL001.png",
      },
    ]);

    const storage = imagenesIniciales(
      [],
      "http://127.0.0.1:54321/storage/v1/object/public/product-images/ws/a.jpg",
    );
    expect(storage).toEqual([
      {
        clave: "http://127.0.0.1:54321/storage/v1/object/public/product-images/ws/a.jpg",
        vistaPrevia: "http://127.0.0.1:54321/storage/v1/object/public/product-images/ws/a.jpg",
        nombre: "Foto actual",
        storage_path: "ws/a.jpg",
        public_url: "http://127.0.0.1:54321/storage/v1/object/public/product-images/ws/a.jpg",
      },
    ]);

    expect(imagenesIniciales([], null)).toEqual([]);
  });

  it("rutaDeStorage devuelve null para rutas que no pertenecen al bucket product-images", () => {
    expect(rutaDeStorage("/aveli/x.png")).toBeNull();
    expect(rutaDeStorage("https://example.com/x.png")).toBeNull();
  });
});
