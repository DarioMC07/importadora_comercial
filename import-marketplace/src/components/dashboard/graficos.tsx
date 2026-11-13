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

const COLORES = ["#1b5df5", "#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6"];

export function GraficoVentasPorDia({ datos }: { datos: { fecha: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={datos} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={(f: string) => f.slice(5)} />
        <YAxis tick={{ fontSize: 11 }} width={60} />
        <Tooltip formatter={(v) => formatoDineroDecimal(Number(v))} />
        <Area type="monotone" dataKey="total" name="Ventas" stroke="#1b5df5" fill="#d9eaff" />
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
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={140} />
        <Tooltip />
        <Bar dataKey="cantidad" name="Unidades" fill="#1b5df5" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
