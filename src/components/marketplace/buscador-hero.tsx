"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BuscadorHero() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      role="search"
      className="mx-auto mt-8 flex max-w-xl gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/catalogo?q=${encodeURIComponent(q.trim())}` : "/catalogo");
      }}
    >
      <label htmlFor="buscar-hero" className="sr-only">
        Buscar productos
      </label>
      <input
        id="buscar-hero"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Busca auriculares, lámparas, herramientas…"
        maxLength={120}
        className="campo flex-1 border-transparent"
      />
      <button type="submit" className="btn bg-white text-brand-700 hover:bg-brand-50">
        Buscar
      </button>
    </form>
  );
}
