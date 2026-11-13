"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatoDineroDecimal } from "@/lib/format";

// Leen la paleta de la tienda activa (variables CSS de globals.css).
const MARCA = "rgb(var(--brand-800))";
const COLORES = [MARCA, "rgb(var(--brand-400))", "#c2bead", "rgb(var(--brand-600))", "rgb(var(--brand-200))"];

export function GraficoVentasPorDia({ datos }: { datos: { fecha: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={datos} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3e1d8" />
        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={(f: string) => f.slice(5)} />
        <YAxis tick={{ fontSize: 11 }} width={60} />
        <Tooltip formatter={(v) => formatoDineroDecimal(Number(v))} />
        <Area type="monotone" dataKey="total" name="Ventas" stroke={MARCA} strokeWidth={2} fill="rgb(var(--brand-100))" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GraficoFormaPago({ datos }: { datos: { metodo: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={datos} dataKey="total" nameKey="metodo" innerRadius={50} outerRadius={90} label>
          {datos.map((_, i) => (
            <Cell key={i} fill={COLORES[i % COLORES.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatoDineroDecimal(Number(v))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function GraficoTopProductos({
  datos,
}: {
  datos: { nombre: string; cantidad: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={datos} layout="vertical" margin={{ top: 8, right: 12, bottom: 0, left: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3e1d8" />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={140} />
        <Tooltip />
        <Bar dataKey="cantidad" name="Unidades" fill={MARCA} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
