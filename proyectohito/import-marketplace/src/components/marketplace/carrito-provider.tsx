"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ItemCarrito } from "@/lib/cart";

const CLAVE_STORAGE = "importhub:carrito:v1";

interface CarritoContexto {
  items: ItemCarrito[];
  cargado: boolean;
  agregar: (item: Omit<ItemCarrito, "cantidad">, cantidad?: number) => void;
  quitar: (productId: string) => void;
  cambiarCantidad: (productId: string, cantidad: number) => void;
  vaciar: () => void;
  cantidadTotal: number;
}

const Contexto = createContext<CarritoContexto | null>(null);

/** Carrito persistido en localStorage (solo datos públicos del catálogo). */
export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    try {
      const crudo = localStorage.getItem(CLAVE_STORAGE);
      if (crudo) {
        const parsed = JSON.parse(crudo) as ItemCarrito[];
        if (Array.isArray(parsed)) setItems(parsed.filter((i) => i.cantidad > 0));
      }
    } catch {
      // Storage corrupto o no disponible: carrito vacío.
    }
    setCargado(true);
  }, []);

  useEffect(() => {
    if (cargado) {
      try {
        localStorage.setItem(CLAVE_STORAGE, JSON.stringify(items));
      } catch {
        // Sin espacio o modo privado: el carrito vive solo en memoria.
      }
    }
  }, [items, cargado]);

  const agregar = useCallback((item: Omit<ItemCarrito, "cantidad">, cantidad = 1) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.productId === item.productId);
      if (existente) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, cantidad: Math.min(999, i.cantidad + cantidad) }
            : i,
        );
      }
      return [...prev, { ...item, cantidad }];
    });
  }, []);

  const quitar = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const cambiarCantidad = useCallback((productId: string, cantidad: number) => {
    setItems((prev) =>
      cantidad <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) =>
            i.productId === productId ? { ...i, cantidad: Math.min(999, cantidad) } : i,
          ),
    );
  }, []);

  const vaciar = useCallback(() => setItems([]), []);

  const valor = useMemo<CarritoContexto>(
    () => ({
      items,
      cargado,
      agregar,
      quitar,
      cambiarCantidad,
      vaciar,
      cantidadTotal: items.reduce((acc, i) => acc + i.cantidad, 0),
    }),
    [items, cargado, agregar, quitar, cambiarCantidad, vaciar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCarrito(): CarritoContexto {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  return ctx;
}
