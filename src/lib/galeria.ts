/**
 * Galería de imágenes de un producto: límites y operaciones puras sobre la
 * lista ordenada. La primera imagen de la lista es la portada.
 */

export const MAX_IMAGENES = 8;
export const MAX_BYTES_IMAGEN = 2097152;
export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"] as const;

const PREFIJO_PUBLICO = "/storage/v1/object/public/product-images/";

export interface FilaImagen {
  storage_path: string;
  public_url: string;
  position: number;
}

export interface ImagenGuardada {
  storage_path: string;
  public_url: string;
}

export interface ImagenGaleria {
  clave: string;
  vistaPrevia: string;
  nombre: string;
  storage_path?: string;
  public_url?: string;
  archivo?: File;
}

/** Ruta dentro del bucket a partir de una URL pública de product-images; null si no lo es. */
export function rutaDeStorage(url: string): string | null {
  const i = url.indexOf(PREFIJO_PUBLICO);
  if (i === -1) return null;
  const ruta = url.slice(i + PREFIJO_PUBLICO.length);
  return ruta ? ruta : null;
}

/** Lista inicial del editor: las filas guardadas en orden; si no hay, la foto única anterior. */
export function imagenesIniciales(filas: readonly FilaImagen[], imageUrl: string | null): ImagenGaleria[] {
  if (filas.length > 0) {
    return [...filas]
      .sort((a, b) => a.position - b.position)
      .map((f) => ({
        clave: f.storage_path,
        vistaPrevia: f.public_url,
        nombre: "Imagen guardada",
        storage_path: f.storage_path,
        public_url: f.public_url,
      }));
  }
  if (!imageUrl) return [];
  return [
    {
      clave: imageUrl,
      vistaPrevia: imageUrl,
      nombre: "Foto actual",
      storage_path: rutaDeStorage(imageUrl) ?? imageUrl,
      public_url: imageUrl,
    },
  ];
}

/** Mueve un elemento de una posición a otra. Índices fuera de rango devuelven una copia sin cambios. */
export function moverImagen<T>(items: readonly T[], desde: number, hacia: number): T[] {
  const copia = [...items];
  if (desde < 0 || desde >= copia.length || hacia < 0 || hacia >= copia.length || desde === hacia) return copia;
  const [item] = copia.splice(desde, 1);
  if (item === undefined) return copia;
  copia.splice(hacia, 0, item);
  return copia;
}

/** Pone un elemento como portada (primera posición). */
export function ponerPortada<T>(items: readonly T[], indice: number): T[] {
  return moverImagen(items, indice, 0);
}

/** Quita el elemento de una posición. */
export function quitarImagen<T>(items: readonly T[], indice: number): T[] {
  return items.filter((_, i) => i !== indice);
}

/** Valida tipo y tamaño de un archivo de imagen. Devuelve el mensaje de error o null. */
export function validarArchivoImagen(archivo: { type: string; size: number }): string | null {
  if (!(TIPOS_IMAGEN as readonly string[]).includes(archivo.type)) return "Solo se aceptan imágenes JPG, PNG o WebP.";
  if (archivo.size === 0) return "El archivo está vacío.";
  if (archivo.size > MAX_BYTES_IMAGEN) return "La imagen supera los 2 MB.";
  return null;
}
